// Guard the Spelling Playground's two halves against drift.
//
//   node scripts/validate-spell-lexicon.mjs
//
// The playground only works if the rules and the lexicon agree: the rules say
// what's spellable, the lexicon says what exists. When they disagree the app
// either offers a block it then refuses to place, or promises a word no tap
// sequence can reach. Both are invisible in a build and obvious to a learner.
//
// Checks, against the real engine (not a copy of it):
//   1. every tuple in the lexicon is rule-legal and in normal form
//   2. every attested syllable can actually be assembled through the UI
//
// Runs off content/vn_syllables.json — no dictionary DB needed. Regenerate that
// file with scripts/gen-vn-syllables.mjs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { applyPick, compose, isNormalForm, isSpeakable, placementBlock, validate } from '../src/lib/spellingRules.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEXICON = join(HERE, '..', 'content/vn_syllables.json');
const data = JSON.parse(readFileSync(LEXICON, 'utf8'));

const EMPTY = { initial: null, glide: null, nucleus: null, final: null, tone: 'ngang' };
const TONES = ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang'];
const parse = (key) => {
    const [initial, glide, nucleus, final] = key.split('|');
    return { initial: initial || null, glide: glide || null, nucleus, final: final || null };
};

const failures = [];
const fail = (msg) => failures.push(msg);

// ── 1. the lexicon only contains splits the rules accept ────────────────────
for (const key of data.tuples) {
    const tuple = parse(key);
    const violations = validate({ ...tuple, tone: 'ngang' });
    if (violations.length) fail(`tuple "${key}" breaks a spelling rule: ${violations[0].reason}`);
    else if (!isNormalForm(tuple)) fail(`tuple "${key}" isn't the spelling the auto-corrections produce`);
}

// ── 2. every attested syllable is assemblable by SOME tap order ─────────────
// The UI leads with initial → vowel → final, but the glide and tone are free,
// so a syllable counts as reachable if any order of its pieces gets there.
const permutations = (items) => (items.length <= 1 ? [items] : items.flatMap(
    (item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
));

const assemble = (steps) => {
    let state = EMPTY;
    for (const [role, id] of steps) {
        if (placementBlock(state, role, id)) return null;
        state = applyPick(state, role, id).state;
    }
    return isSpeakable(state) ? compose(state) : null;
};

const reached = new Set();
for (const key of data.tuples) {
    const tuple = parse(key);
    const pieces = [['initial', tuple.initial], ['glide', tuple.glide], ['nucleus', tuple.nucleus], ['final', tuple.final]]
        .filter(([, id]) => id);
    const orders = permutations(pieces);
    for (const tone of TONES) {
        const want = compose({ ...tuple, tone });
        if (reached.has(want) || !data.syllables.includes(want)) continue;
        const steps = tone === 'ngang' ? orders : orders.map((o) => [...o, ['tone', tone]]);
        if (steps.some((s) => assemble(s) === want)) reached.add(want);
    }
}

const unreachable = data.syllables.filter((s) => !reached.has(s));
for (const word of unreachable.slice(0, 20)) fail(`"${word}" is in the lexicon but can't be built in the playground`);
if (unreachable.length > 20) fail(`…and ${unreachable.length - 20} more unreachable syllables`);

// ── report ──────────────────────────────────────────────────────────────────
if (failures.length) {
    console.error(`✗ spelling lexicon is out of sync with the rules (${failures.length} problems)\n`);
    for (const f of failures.slice(0, 30)) console.error(`  · ${f}`);
    console.error('\nRegenerate with: node scripts/gen-vn-syllables.mjs');
    process.exit(1);
}
console.log(`✓ spelling lexicon OK — ${data.tuples.length} tuples all rule-legal, all ${data.syllables.length} syllables reachable`);
