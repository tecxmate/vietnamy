#!/usr/bin/env node
/**
 * validate-pos.mjs — part-of-speech sanity for the curriculum corpus.
 *
 * `pos` is not decoration. The backend maps it onto
 * `study_lesson_items.category`, and the distractor generator returns [] the
 * moment a category is null or nonsensical — so a wrong `pos` silently costs an
 * exercise its wrong answers. Three specific ways it was wrong:
 *
 *   - it_w_0161 "ba" = father (Southern) was tagged `number`, inherited from
 *     it_w_0022 "ba" = three, which shares the surface string. A kinship term
 *     drawing number distractors is the visible symptom.
 *   - it_w_0024 "năm" = five was tagged `noun` — presumably from the homograph
 *     "năm" = year, which is a different sense and stays a noun elsewhere.
 *   - the kinship terms bố / mẹ / má were tagged `word`, which is not a part of
 *     speech at all.
 *
 * Two corpora carry the same rows and both are shipped: `content/curriculum.json`
 * is what the app imports, and `src/data/unified_db.json` is what
 * scripts/build-canonical.mjs reads to regenerate it. Fixing one and not the
 * other means the next `npm run curriculum:build` quietly reverts the fix, so
 * the last check here is that the two agree.
 *
 *   node scripts/validate-pos.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];

const read = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

// The two shapes of the same corpus: canonical (camelCase, `words`) and the
// normalized build input (snake_case, `vocabulary`).
const CORPORA = [
    { path: 'content/curriculum.json', rows: (db) => db.words, vi: (w) => w.vi },
    { path: 'src/data/unified_db.json', rows: (db) => db.vocabulary, vi: (w) => w.vi_text },
];

// What each of the six ids in play must be tagged. `number` — not `numeral` —
// is what the other digits một/hai/ba/bốn/sáu…mười already use; matching them
// is the point, since distractors are drawn from the same category.
const EXPECTED = {
    it_w_0022: 'number',  // ba   = three
    it_w_0024: 'number',  // năm  = five
    it_w_0160: 'noun',    // bố   = father (Northern)
    it_w_0161: 'noun',    // ba   = father (Southern)
    it_w_0162: 'noun',    // mẹ   = mother (Northern)
    it_w_0163: 'noun',    // má   = mother (Southern)
};

const byCorpus = new Map();

for (const corpus of CORPORA) {
    const rows = corpus.rows(read(corpus.path));
    if (!Array.isArray(rows)) {
        errors.push(`${corpus.path}: expected an array of vocabulary rows`);
        continue;
    }

    const posById = new Map(rows.map((w) => [w.id, w.pos]));
    byCorpus.set(corpus.path, posById);

    for (const [id, expected] of Object.entries(EXPECTED)) {
        const actual = posById.get(id);
        if (actual === undefined) {
            errors.push(`${corpus.path}: ${id} is missing`);
        } else if (actual !== expected) {
            errors.push(`${corpus.path}: ${id} has pos "${actual}", expected "${expected}"`);
        }
    }

    // `word` is not a part of speech. The three kinship terms above are fixed;
    // the rest are pre-existing debt, held at its current size so it can only
    // shrink.
    const stillWord = rows.filter((w) => w.pos === 'word');
    const WORD_POS_BUDGET = 48;
    if (stillWord.length > WORD_POS_BUDGET) {
        errors.push(
            `${corpus.path}: ${stillWord.length} rows still carry pos "word" (budget ${WORD_POS_BUDGET}). ` +
            `New ones must not be added; lower the budget when you clear some.`,
        );
    }

    // The surface string "ba" is two different words. They must not share a pos.
    const bas = rows.filter((w) => corpus.vi(w) === 'ba');
    if (bas.length > 1 && new Set(bas.map((w) => w.pos)).size === 1) {
        errors.push(`${corpus.path}: every "ba" row shares pos "${bas[0].pos}" — the numeral and the kinship term are distinct`);
    }
}

// Drift guard: the build input and the shipped bundle must agree.
const [canonical, source] = CORPORA.map((c) => byCorpus.get(c.path));
if (canonical && source) {
    let drift = 0;
    for (const [id, pos] of canonical) {
        if (source.has(id) && source.get(id) !== pos) {
            if (drift < 10) {
                errors.push(`pos drift on ${id}: content/curriculum.json="${pos}" vs src/data/unified_db.json="${source.get(id)}"`);
            }
            drift++;
        }
    }
    if (drift > 10) errors.push(`…and ${drift - 10} more pos drifts between the two corpora`);
}

if (errors.length) {
    console.error('✗ part-of-speech validation failed:');
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
}

const remaining = byCorpus.get('content/curriculum.json');
const wordCount = [...remaining.values()].filter((p) => p === 'word').length;
console.log(`✓ part-of-speech checks passed (${wordCount} rows still carry pos "word" — pre-existing debt)`);
