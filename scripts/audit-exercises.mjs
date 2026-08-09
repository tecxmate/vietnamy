#!/usr/bin/env node
/**
 * Exercise generator audit.
 *
 * Runs the real generator over every lesson × session × a few seeds and reports
 * exercises a learner could not fairly answer: choices that read as the same
 * answer, distractors already visible in the prompt, two-correct-answer questions,
 * blanks whose answer is still on screen.
 *
 * Non-zero exit if any defect is found, so this can gate content changes:
 *
 *   node scripts/audit-exercises.mjs
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateExercises } from '../src/lib/exerciseGenerator.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cur = JSON.parse(readFileSync(join(ROOT, 'content/curriculum.json'), 'utf8'));

const SESSIONS = 4;
const SEEDS = 3;

// Normalize the way a learner reads a choice: case, punctuation and parenthetical
// glosses do not distinguish two options on screen.
// English glosses: safe to reduce to bare ascii letters.
const norm = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
// Vietnamese: NEVER strip by ascii character class — that collapses lời/lỗi and
// chào/cho into false collisions. Only case and punctuation are invisible to a reader.
const normVi = (s) => String(s || '').toLowerCase().replace(/[.!?,]/g, '').trim();
const normViChoice = (s) => String(s || '')
    .toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[.!?,;:"']/g, ' ').replace(/\s+/g, ' ').trim();

const groupBy = (rows, key) => {
    const m = new Map();
    for (const r of rows) {
        if (!m.has(r[key])) m.set(r[key], []);
        m.get(r[key]).push(r);
    }
    return m;
};

const wordsByLesson = groupBy(cur.words, 'lessonId');
const sentsByLesson = groupBy(cur.sentences, 'lessonId');

// vi → the English glosses it can carry, for spotting two-correct-answer questions
const glossByVi = new Map();
for (const w of cur.words) {
    const k = normVi(w.vi);
    if (!glossByVi.has(k)) glossByVi.set(k, new Set());
    glossByVi.get(k).add(norm(w.en));
}

// Mirror what lessonExerciseService feeds the generator: pos + grammar tags + emoji.
const gtagToGT = (t) => 'GT' + String(t).replace(/^gtag_/, '');
const vocabSrc = readFileSync(join(ROOT, 'src/data/vocabWords.js'), 'utf8');
const illustrated = new Set([...vocabSrc.matchAll(/vietnamese:\s*'([^']+)'/g)].map((m) => m[1].toLowerCase()));

const toItem = (r) => ({
    id: r.id,
    vi_text: r.vi,
    en_text: r.en,
    item_type: r.id.startsWith('it_s_') ? 'sentence' : 'word',
    pos: r.pos,
    emoji: r.emoji,
    tags: (r.grammarTagIds || []).map(gtagToGT),
});

const unitOrder = new Map(cur.units.map((u) => [u.id, u.orderIndex ?? 999]));
const lessons = [...cur.lessons].sort(
    (a, b) => (unitOrder.get(a.unitId) - unitOrder.get(b.unitId)) || (a.orderIndex - b.orderIndex),
);

const defects = {};
const bump = (kind, sample) => {
    if (!defects[kind]) defects[kind] = { count: 0, samples: [] };
    defects[kind].count++;
    if (defects[kind].samples.length < 4) defects[kind].samples.push(sample);
};

let totalEx = 0;
const typeCount = {};
const seenPool = [];

for (const lesson of lessons) {
    const items = [...(wordsByLesson.get(lesson.id) || []), ...(sentsByLesson.get(lesson.id) || [])].map(toItem);
    const pool = seenPool.slice(-60);
    const imageMap = {};
    for (const it of items) {
        if (illustrated.has(it.vi_text.toLowerCase())) imageMap[it.vi_text.toLowerCase()] = { image: 'x', emoji: it.emoji };
        else if (it.emoji) imageMap[it.vi_text.toLowerCase()] = { image: null, emoji: it.emoji };
    }

    for (let session = 0; session < SESSIONS; session++) {
        for (let seed = 0; seed < SEEDS; seed++) {
            for (const ex of generateExercises(lesson.id, items, pool, imageMap, session, {})) {
                totalEx++;
                typeCount[ex.exercise_type] = (typeCount[ex.exercise_type] || 0) + 1;
                const p = ex.prompt;
                const at = `${lesson.id}`;

                if (ex.exercise_type === 'mcq_translate_to_vi') {
                    const want = norm(p.source_text_en);
                    const valid = p.choices_vi.filter((c) => [...(glossByVi.get(normVi(c)) || [])].some((g) => g === want));
                    if (valid.length > 1) bump('mcq_to_vi: more than one correct choice', `${at} "${p.source_text_en}" -> ${valid.join(' / ')}`);
                }

                if (ex.exercise_type === 'mcq_translate_to_en') {
                    const glosses = p.choices_en.map(norm);
                    if (new Set(glosses).size < glosses.length) bump('mcq_to_en: choices read as the same answer', `${at} ${p.source_text_vi} -> ${p.choices_en.join(' / ')}`);
                }

                if (ex.exercise_type === 'fill_blank') {
                    const ans = p.answer_vi.toLowerCase().replace(/[.!?,]/g, '');
                    const full = p.template_vi.replace('____', p.answer_vi);
                    const hits = full.toLowerCase().split(/\s+/).filter((t) => t.replace(/[.!?,]/g, '') === ans).length;
                    if (hits > 1) bump('fill_blank: answer word still visible elsewhere', `${at} ${p.template_vi} = ${p.answer_vi}`);

                    const visible = new Set(p.template_vi.toLowerCase().split(/\s+/).map((w) => w.replace(/[.!?,]/g, '')));
                    if (p.choices_vi.some((c) => c !== p.answer_vi && visible.has(c.toLowerCase().replace(/[.!?,]/g, '')))) {
                        bump('fill_blank: distractor already visible in the sentence', `${at} ${p.template_vi} choices ${p.choices_vi.join('/')}`);
                    }
                    if (new Set(p.choices_vi.map(normViChoice)).size < p.choices_vi.length) {
                        bump('fill_blank: duplicate choices', `${at} ${p.template_vi} ${p.choices_vi.join('/')}`);
                    }
                    if (p.choices_vi.length < 3) bump('fill_blank: fewer than 3 choices', `${at} ${p.template_vi} ${p.choices_vi.join('/')}`);
                }

                if (ex.exercise_type === 'translation_word_bank') {
                    const ansSet = new Set(p.answer_tokens.map((t) => t.toLowerCase()));
                    if (p.tokens.filter((t) => !ansSet.has(t.toLowerCase())).length === 0) {
                        bump('word_bank: no distractor tokens', `${at} ${p.answer_vi}`);
                    }
                }

                if (ex.exercise_type === 'reorder_words' && p.tokens.length !== p.answer_tokens.length) {
                    bump('reorder: token count mismatch', `${at} ${p.target_vi}`);
                }

                if (['listen_type', 'listen_choose'].includes(ex.exercise_type) && !p.audio_text && !p.audio_item_id) {
                    bump('listen: no audio source', `${at}`);
                }
            }
        }
    }
    seenPool.push(...items);
}

console.log(`Generated ${totalEx} exercises across ${lessons.length} lessons × ${SESSIONS} sessions × ${SEEDS} seeds.\n`);
console.log('type distribution:');
for (const [k, v] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(6)}  ${k}`);

const totalDefects = Object.values(defects).reduce((n, d) => n + d.count, 0);
console.log(`\n=== ${totalDefects} unfair exercises (${((100 * totalDefects) / totalEx).toFixed(2)}%) ===`);
for (const [k, v] of Object.entries(defects).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`\n${v.count}  ${k}`);
    v.samples.forEach((s) => console.log('     · ' + s));
}
if (totalDefects === 0) console.log('\nNone. ✅');

process.exit(totalDefects > 0 ? 1 : 0);
