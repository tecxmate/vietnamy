#!/usr/bin/env node
/**
 * validate-sense-rank.mjs — contract tests for server/senseRank.js.
 *
 * Two parts:
 *   1. Fixtures — always run, no data files needed. This is what CI gates on,
 *      since the dictionary DBs are 100MB+ and deliberately not in the repo.
 *   2. Corpus    — runs only when server/databases/ is populated, i.e. locally.
 *      Checks the invariants against real merged-source data, where the messy
 *      cases actually live.
 *
 *   node scripts/validate-sense-rank.mjs
 */
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    normalizePos, classifyGloss, isMetadataSense, rankSenses,
} from '../server/senseRank.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
let failures = 0;

const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++; };
const eq = (actual, expected, label) => {
    if (actual !== expected) fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

// ─── 1. Part of speech ─────────────────────────────────────────────
// One canonical label out of five source conventions.
for (const [raw, want] of [
    ['noun', 'noun'], ['n.', 'noun'], ['danh từ', 'noun'], ['Nt', 'noun'], ['Na', 'noun'],
    ['verb', 'verb'], ['v.', 'verb'], ['động từ', 'verb'], ['Vt', 'verb'], ['Vu', 'verb'],
    ['adj', 'adjective'], ['tính từ', 'adjective'], ['Ap', 'adjective'],
    ['adv', 'adverb'], ['phó từ', 'adverb'], ['R', 'adverb'],
    // Typos present in the VE source — mapped, not discarded.
    ['tính tứ', 'adjective'], ['danh tù', 'noun'], ['thành ngử', 'idiom'],
    // Compound tags take the first (primary) reading.
    ['noun & verb', 'noun'], ['adj, adv', 'adjective'], ['động từ /danh từ', 'verb'],
    // Not tags at all.
    [null, null], ['', null], ['   ', null],
    ['Giỗ tổ Hùng Vương là ngày giỗ quan trọng nhất của người Việt Nam.', null],
    // Treebank "unknown" classes must not be invented into a real POS.
    ['X', null], ['Z', null], ['O', null],
]) eq(normalizePos(raw), want, `normalizePos(${JSON.stringify(raw)})`);

// ─── 2. Gloss language ─────────────────────────────────────────────
for (const [text, want] of [
    ['to go; to walk; to depart', 'en'],
    ['a pigment found in plants', 'en'],
    ['house; home; abode; domicile', 'en'],
    ['[người] di chuyển đến nơi khác, không kể bằng cách gì', 'vi'],
    ['có cảm giác ghê sợ, buồn nôn và muốn tránh xa vì quá bẩn thỉu', 'vi'],
    ['chết [lối nói kiêng tránh]', 'vi'],
    ['去；走', 'zh'],
    ['', 'en'], [null, 'en'],
]) eq(classifyGloss(text), want, `classifyGloss(${JSON.stringify(String(text).slice(0, 40))})`);

// ─── 3. Metadata rows ──────────────────────────────────────────────
// Every StarDict-derived source ships its license as an ordinary `meanings`
// row. These must never rank as definitions.
if (!isMetadataSense('00-database-info', 'This is the Vietnamese-English dictionary database of the Free Vietnamese Dictionary Project.'))
    fail('license header on pseudo-headword not flagged as metadata');
if (!isMetadataSense(null, 'Copyright (C) 1997-2003 ... GNU General Public License'))
    fail('GPL notice not flagged as metadata');
if (isMetadataSense('đi', 'to go; to walk; to depart'))
    fail('real definition wrongly flagged as metadata');

// ─── 4. Ranking invariants ─────────────────────────────────────────
const SENSES = [
    { source_name: '3-dict-combination', part_of_speech: 'Vt', meaning_text: '[người] di chuyển đến nơi khác bằng những bước chân', examples: [{ vietnamese_text: 'đi bộ' }] },
    { source_name: '3-dict-combination', part_of_speech: 'Vi', meaning_text: 'chết [lối nói kiêng tránh]', examples: [] },
    { source_name: 'VE', part_of_speech: 'verb', meaning_text: 'to go; to walk; to depart', examples: [] },
    { source_name: 'VE', part_of_speech: null, meaning_text: 'This is the dictionary database of the Free Vietnamese Dictionary Project', examples: [] },
];
const ranked = rankSenses(SENSES, { lang: 'en', word: 'đi' });

eq(ranked.length, SENSES.length, 'ranking preserves every sense');
eq(ranked[0].meaning_text, 'to go; to walk; to depart', 'readable English gloss ranks first');
eq(ranked[ranked.length - 1].is_metadata, true, 'metadata row sorts last');
eq(ranked[0].tier, 'primary', 'top sense is primary');
eq(ranked[0].part_of_speech_canonical, 'verb', 'canonical POS attached');

// Primaries must form a prefix, or display order and `tier` disagree and the
// UI shows collapsed senses above expanded ones.
const firstSecondary = ranked.findIndex(s => s.tier === 'secondary');
if (firstSecondary !== -1 && ranked.slice(firstSecondary).some(s => s.tier === 'primary'))
    fail('primary senses are not contiguous');

// Metadata is never promoted.
if (ranked.some(s => s.is_metadata && s.tier === 'primary'))
    fail('a metadata row was promoted to primary');

// A word with only Vietnamese glosses must still surface something.
const viOnly = rankSenses([
    { source_name: '3-dict-combination', part_of_speech: 'Nt', meaning_text: 'vùng đất rộng có nước bao quanh', examples: [] },
], { lang: 'en', word: 'đảo' });
eq(viOnly[0].tier, 'primary', 'falls back to promoting the best available when nothing is readable');

// Input must not be mutated.
if ('tier' in SENSES[0]) fail('rankSenses mutated its input');
eq(rankSenses([], { lang: 'en' }).length, 0, 'empty input returns empty');

console.log(failures === 0
    ? '✓ sense ranking contract OK — POS normalization, gloss language, metadata filtering, ordering'
    : `\n✗ ${failures} contract failure(s)`);

// ─── 5. Corpus checks (local only) ─────────────────────────────────
const DB = join(ROOT, 'server', 'databases', 'vn_en_dictionary_high.db');
if (!existsSync(DB)) {
    console.log('  (corpus checks skipped — server/databases not present, as in CI)');
    process.exit(failures === 0 ? 0 : 1);
}

// node:sqlite is stable on Node 24+ but needs --experimental-sqlite on 22.
// Skip rather than fail when it isn't reachable — the fixtures above are the
// part that gates CI.
let DatabaseSync;
try {
    ({ DatabaseSync } = await import('node:sqlite'));
} catch {
    console.log('  (corpus checks skipped — node:sqlite unavailable; try --experimental-sqlite)');
    process.exit(failures === 0 ? 0 : 1);
}
const db = new DatabaseSync(DB, { readOnly: true });
const q = (sql, ...a) => db.prepare(sql).all(...a);

const words = q(`SELECT w.word FROM words w JOIN word_metrics wm ON wm.word_id = w.id
                 ORDER BY wm.subt_freq DESC LIMIT 500`).map(r => r.word);
let checked = 0, noPrimary = 0, lost = 0, nonContiguous = 0, totalPrimary = 0;

for (const word of words) {
    const rows = q(`SELECT s.name source_name, m.part_of_speech, m.meaning_text
                    FROM meanings m
                    JOIN words wo ON wo.id = m.word_id
                    JOIN sources s ON s.id = m.source_id
                    WHERE wo.word = ?`, word);
    if (!rows.length) continue;
    checked++;
    const r = rankSenses(rows, { lang: 'en', word });
    if (r.length !== rows.length) lost++;
    const primaries = r.filter(s => s.tier === 'primary').length;
    totalPrimary += primaries;
    if (primaries === 0) noPrimary++;
    const fs = r.findIndex(s => s.tier === 'secondary');
    if (fs !== -1 && r.slice(fs).some(s => s.tier === 'primary')) nonContiguous++;
}

if (lost) fail(`${lost} words lost senses during ranking`);
if (noPrimary) fail(`${noPrimary} words ended up with no primary sense`);
if (nonContiguous) fail(`${nonContiguous} words have non-contiguous primary senses`);

console.log(`✓ corpus OK — ${checked} of the most frequent words ranked, ` +
    `${(totalPrimary / checked).toFixed(2)} primary senses each on average, no senses lost`);

process.exit(failures === 0 ? 0 : 1);
