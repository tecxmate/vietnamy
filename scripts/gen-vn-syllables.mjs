// Build the attested-syllable lexicon for the Spelling Playground.
//
//   node scripts/gen-vn-syllables.mjs
//
// Reads the Vietnamese side of the local dictionary (example sentences = clean
// running VN text for tone-less syllables; diacritic-bearing headwords = the
// toned forms), collects every attested syllable, then keeps only the ones the
// builder can actually compose — a tuple the playground's own rules would
// refuse never reaches the lexicon, so the two can't drift apart.
//
// Requires server/databases/vn_en_dictionary.db, read through the sqlite3 CLI
// or (when that isn't installed) node:sqlite.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { INITIALS, GLIDES, NUCLEI, FINALS } from '../src/data/spellingBlocks.js';
import { TONE_IDS, splitTone } from '../src/data/vnTones.js';
import { compose, isNormalForm, validate } from '../src/lib/spellingSyntax.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DB = join(ROOT, 'server/databases/vn_en_dictionary.db');
const OUT = join(ROOT, 'content/vn_syllables.json');

const VN = 'a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
const SPLIT = new RegExp(`[^${VN}]+`, 'i');

// sqlite3 CLI when it's on PATH, node:sqlite otherwise (Node 22 needs
// --experimental-sqlite; 24+ has it stable). Both return one value per line.
const hasSqliteCli = () => {
    try { execFileSync('sqlite3', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
};

let sql;
if (hasSqliteCli()) {
    sql = (q) => execFileSync('sqlite3', [DB, q], { encoding: 'utf8', maxBuffer: 1 << 28 });
} else {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(DB, { readOnly: true });
    sql = (q) => db.prepare(q).all().map((row) => Object.values(row)[0] ?? '').join('\n');
}

// VN-specific letters — a token containing any of these is unambiguously
// Vietnamese (English never does), so it's safe to harvest from the mixed
// VN/EN headword list. Plain a–z/vowel tokens are taken ONLY from example
// sentences, which are clean Vietnamese.
const DIACRITICS = new Set([...'ăâêôơưđàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ']);
const hasDiacritic = (tok) => [...tok].some((c) => DIACRITICS.has(c));

console.log('Reading example sentences (clean VN)…');
const exampleText = sql('SELECT vietnamese_text FROM examples;');
console.log('Reading all headwords (keeping diacritic-bearing = VN only)…');
const allWords = sql('SELECT word FROM words;');

const rawSyllables = new Set();
const addTokens = (text, diacriticOnly) => {
    for (const line of text.split('\n')) {
        for (const tok of line.toLowerCase().split(SPLIT)) {
            if (tok && (!diacriticOnly || hasDiacritic(tok))) rawSyllables.add(tok);
        }
    }
};
addTokens(exampleText, false);   // clean VN → all tokens
addTokens(allWords, true);       // mixed VN/EN → VN-diacritic tokens only
console.log(`  raw attested tokens: ${rawSyllables.size}`);

// Attested tone-less bases, and attested (base, tone) pairs. Keying by base+tone
// makes matching independent of where the DB placed the tone mark (khỏe vs khoẻ,
// hòa vs hoà — same base, same tone, different glyph position).
const attestedBases = new Set();
const attestedBaseTone = new Set();
for (const s of rawSyllables) {
    const { base, toneId } = splitTone(s);
    attestedBases.add(base);
    attestedBaseTone.add(`${base}_${toneId}`);
}
console.log(`  attested bases: ${attestedBases.size}`);

// Enumerate the builder's tuple space; keep tuples whose base is attested.
const initials = [null, ...INITIALS.map((b) => b.id)];
const glides = [null, ...GLIDES.map((b) => b.id)];
const nuclei = NUCLEI.map((b) => b.id);
const finals = [null, ...FINALS.map((b) => b.id)];

const tupleKeys = new Set();
const validSyllables = new Set();
let combos = 0;
let illegal = 0;
for (const i of initials) for (const g of glides) for (const n of nuclei) for (const f of finals) {
    combos++;
    const state = { initial: i, glide: g, nucleus: n, final: f, tone: 'ngang' };
    const base = compose(state);
    if (!attestedBases.has(base)) continue;
    // An attested spelling can still be a bogus SPLIT of that spelling — "buôc"
    // reads as b+u+ô+c, but the u there is part of the uô nucleus, not a glide;
    // "gen" reads as g+e+n, but g before e is always written gh. Keeping those
    // would let the playground offer blocks it then refuses or silently rewrites.
    if (validate(state).length || !isNormalForm(state)) { illegal++; continue; }
    tupleKeys.add(`${i || ''}|${g || ''}|${n}|${f || ''}`);
    for (const t of TONE_IDS) {
        // The builder's own spelling of this tone; "real" iff (base, tone) is attested.
        if (attestedBaseTone.has(`${base}_${t}`) && validate({ ...state, tone: t }).length === 0) {
            validSyllables.add(compose({ ...state, tone: t }));
        }
    }
}

console.log(`  enumerated ${combos} combos → ${tupleKeys.size} real tuples, ${validSyllables.size} real syllables`);
console.log(`  dropped ${illegal} attested-looking tuples the spelling rules reject`);

const out = {
    note: 'Attested Vietnamese syllables + builder tuples, generated from the local dictionary. Regenerate with scripts/gen-vn-syllables.mjs.',
    tuples: [...tupleKeys].sort(),
    syllables: [...validSyllables].sort(),
};
writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${OUT}`);
