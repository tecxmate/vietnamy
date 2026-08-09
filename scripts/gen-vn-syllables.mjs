// Build the attested-syllable lexicon for the Spelling Playground.
//
//   node scripts/gen-vn-syllables.mjs
//
// Reads the Vietnamese side of the local dictionary (example sentences = clean
// running VN text for tone-less syllables; diacritic-bearing headwords = the
// toned forms), collects every attested syllable, then keeps only the ones the
// builder can actually compose. Output: content/vn_syllables.json.
//
// Requires the sqlite3 CLI and server/databases/vn_en_dictionary.db.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { INITIALS, GLIDES, NUCLEI, FINALS, findBlock } from '../src/data/spellingBlocks.js';
import { TONE_IDS, applyTone, splitTone } from '../src/data/vnTones.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DB = join(ROOT, 'server/databases/vn_en_dictionary.db');
const OUT = join(ROOT, 'content/vn_syllables.json');

// compose(), duplicated minimally so this script needs no runtime imports.
const toneNucleus = (nucleusId, toneId) => {
    const at = findBlock('nucleus', nucleusId)?.tone_at ?? 0;
    const chars = [...nucleusId];
    if (at < chars.length) chars[at] = applyTone(chars[at], toneId);
    return chars.join('');
};
const compose = ({ initial, glide, nucleus, final, tone }) =>
    `${initial || ''}${glide || ''}${toneNucleus(nucleus, tone || 'ngang')}${final || ''}`;

const VN = 'a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
const SPLIT = new RegExp(`[^${VN}]+`, 'i');

const sql = (q) => execFileSync('sqlite3', [DB, q], { encoding: 'utf8', maxBuffer: 1 << 28 });

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
for (const i of initials) for (const g of glides) for (const n of nuclei) for (const f of finals) {
    combos++;
    const base = compose({ initial: i, glide: g, nucleus: n, final: f, tone: 'ngang' });
    if (!attestedBases.has(base)) continue;
    tupleKeys.add(`${i || ''}|${g || ''}|${n}|${f || ''}`);
    for (const t of TONE_IDS) {
        // The builder's own spelling of this tone; "real" iff (base, tone) is attested.
        if (attestedBaseTone.has(`${base}_${t}`)) {
            validSyllables.add(compose({ initial: i, glide: g, nucleus: n, final: f, tone: t }));
        }
    }
}

console.log(`  enumerated ${combos} combos → ${tupleKeys.size} real tuples, ${validSyllables.size} real syllables`);

const out = {
    note: 'Attested Vietnamese syllables + builder tuples, generated from the local dictionary. Regenerate with scripts/gen-vn-syllables.mjs.',
    tuples: [...tupleKeys].sort(),
    syllables: [...validSyllables].sort(),
};
writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${OUT}`);
