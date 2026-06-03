#!/usr/bin/env node
/**
 * Content contract validator / drift report.
 *
 * Scans every content data file and reports, in plain English, where it does
 * NOT yet match the canonical contract in docs/CONTENT_SCHEMA.md.
 *
 * It is a *drift report*, not a pass/fail gate: today's files are still in the
 * old formats, so violations are expected. The point is to show exactly what
 * has to be renamed/restructured to reach the contract.
 *
 *   node scripts/validate-content.mjs            # full report
 *   node scripts/validate-content.mjs --summary  # just the per-file table
 *
 * No dependencies (ajv in this repo is v6 / draft-07; the contract schemas are
 * draft 2020-12). Canonical field names are read from /schema/*.schema.json so
 * those files stay the single source of truth.
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, relative } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCHEMA_DIR = join(ROOT, 'schema');
const onlySummary = process.argv.includes('--summary');
// Explicit file path args (non-flags) override the default source scan — used to
// validate the generated content/ bundle.
const explicitTargets = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// ── 1. Canonical field names, read from the JSON Schemas ─────────────────────
// We collect every "properties" key across all schema files so the validator
// knows what the contract calls things, without hard-coding it twice.
function collectSchemaKeys(node, into) {
    if (!node || typeof node !== 'object') return;
    if (node.properties && typeof node.properties === 'object') {
        for (const k of Object.keys(node.properties)) into.add(k);
    }
    for (const v of Object.values(node)) {
        if (v && typeof v === 'object') collectSchemaKeys(v, into);
    }
}
const CANONICAL_KEYS = new Set();
const ENUMS = {}; // fieldName -> Set(allowed values), for spot checks
function collectEnums(node, parentKey) {
    if (!node || typeof node !== 'object') return;
    if (node.properties) {
        for (const [k, v] of Object.entries(node.properties)) {
            if (v && Array.isArray(v.enum)) {
                ENUMS[k] = ENUMS[k] || new Set();
                v.enum.forEach((e) => ENUMS[k].add(e));
            }
            // follow $ref to _common enums by name convention
            collectEnums(v, k);
        }
    }
    for (const [key, v] of Object.entries(node)) {
        if (key === 'properties') continue;
        if (v && typeof v === 'object') collectEnums(v, parentKey);
    }
}
for (const f of readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.schema.json'))) {
    const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, f), 'utf8'));
    collectSchemaKeys(schema, CANONICAL_KEYS);
    collectEnums(schema);
}
// dialect/cefrLevel/pos enums live in _common via $ref; seed them explicitly so
// the spot-check works even though $ref isn't resolved.
ENUMS.dialect = new Set(['north', 'south', 'central', 'neutral']);
ENUMS.cefrLevel = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// ── 2. Legacy → canonical rename map (from CONTENT_SCHEMA.md §9) ──────────────
// Each entry: a field name found in the wild -> what the contract calls it.
const RENAMES = {
    // Vietnamese text
    vietnamese: 'vi',
    vi_text: 'vi',
    vietnamese_text: 'vi',
    title_vi: 'title.vi',
    // English text
    meaning: 'en',
    english: 'en',
    english_text: 'en',
    en_text: 'en',
    title_en: 'title.en',
    // Chinese text
    cn: 'zh',
    title_zh: 'title.zh',
    // numbers / structure
    order: 'orderIndex',
    order_index: 'orderIndex',
    nodeIndex: 'orderIndex',
    cefr: 'cefrLevel',
    cefr_level: 'cefrLevel',
    xp: 'xpReward',
    xp_reward: 'xpReward',
    frequency: 'frequencyRank',
    frequency_rank: 'frequencyRank',
    tokens: 'tokenCount',
    token_count: 'tokenCount',
    has_image: 'hasImage',
    image: 'imageUrl',
    image_url: 'imageUrl',
    grammarTags: 'grammarTagIds',
    grammar_tags: 'grammarTagIds',
    // ids / refs
    node_id: 'nodeId',
    quiz_id: 'quizId',
    unit_id: 'unitId',
    lesson_id: 'lessonId',
    // grammar modules
    main_pattern: 'mainPattern',
    extracted_patterns: 'extractedPatterns',
    source_item_index: 'sourceItemIndex',
    source_level: 'sourceLevel',
    module_count: 'moduleCount',
    unit_count: 'unitCount',
    // dictionary
    part_of_speech: 'pos',
    han_viet: 'hanViet',
};
// "word" is canonical-ish (headword) only in dictionary/tones; elsewhere it is vi.
// "translations" is the normalized storage form; contract wants flat vi/en/zh.
const STRUCTURAL_NOTES = {
    translations: 'normalized array — flatten to vi/en/zh for the contract',
    word: 'rename to "vi" (the headword)',
    meaning: 'in lessons.json this is sometimes an object {en,cn} — split into en/zh',
};

// ── 3. Files to scan ─────────────────────────────────────────────────────────
function listJson(dir) {
    return readdirSync(join(ROOT, dir))
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(dir, f));
}
const JSON_TARGETS = [
    'src/data/lessons.json',
    'src/data/unified_db.json',
    'src/data/dictionary.json',
    'src/data/grammar_modules.json',
    'src/data/vn_grammar_bank_v2.json',
    ...listJson('src/data/curricula'),
    ...listJson('src/data/drills'),
];
// JS modules (ESM) — imported dynamically and scanned the same way.
const JS_TARGETS = [
    'src/data/vocabWords.js',
    'src/data/articleData.js',
    'src/data/kinshipData.js',
    'src/data/toneContours.js',
];

// ── 4. Deep scan: tally keys, legacy names, snake_case, enum + cn/zh issues ───
function scan(value, acc, keyOfValue) {
    if (Array.isArray(value)) {
        for (const v of value) scan(v, acc, keyOfValue);
        return;
    }
    if (value && typeof value === 'object') {
        acc.objects++;
        for (const [k, v] of Object.entries(value)) {
            acc.keys.set(k, (acc.keys.get(k) || 0) + 1);
            // A key that is part of the contract is never drift, even if a
            // same-named legacy field exists elsewhere (e.g. the canonical
            // container `grammarTags` vs the sentence ref field).
            if (CANONICAL_KEYS.has(k)) { /* conforms */ }
            else if (RENAMES[k]) bump(acc.legacy, k);
            else if (/[a-z0-9]_[a-z]/.test(k)) bump(acc.snake, k);
            // enum spot-checks on leaf string values
            if (k === 'dialect' && typeof v === 'string' && !ENUMS.dialect.has(v)) {
                bump(acc.badDialect, JSON.stringify(v));
            }
            scan(v, acc, k);
        }
        return;
    }
}
function bump(map, k) {
    map.set(k, (map.get(k) || 0) + 1);
}
function newAcc() {
    return {
        objects: 0,
        keys: new Map(),
        legacy: new Map(),
        snake: new Map(),
        badDialect: new Map(),
    };
}

async function load(target) {
    if (target.endsWith('.json')) {
        return JSON.parse(readFileSync(join(ROOT, target), 'utf8'));
    }
    const mod = await import(pathToFileURL(join(ROOT, target)).href);
    // scan every named + default export
    return mod.default !== undefined ? { ...mod, default: mod.default } : { ...mod };
}

// ── 5. Report ────────────────────────────────────────────────────────────────
const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const rows = [];

// A real schema field repeats across many sibling records; a data-keyed lookup
// map (e.g. PRONOUN_MAP keyed by "paternal_grandfather") has keys seen only once
// or twice. Require ≥3 occurrences before calling a snake_case key a field.
const SNAKE_MIN = 3;

function reportFile(target, acc) {
    const legacy = [...acc.legacy.entries()].sort((a, b) => b[1] - a[1]);
    const snake = [...acc.snake.entries()].filter(([, n]) => n >= SNAKE_MIN).sort((a, b) => b[1] - a[1]);
    const badDialect = [...acc.badDialect.entries()];
    const issues = legacy.length + snake.length + badDialect.length;
    rows.push({
        file: target,
        objects: acc.objects,
        legacy: acc.legacy.size,
        snake: snake.length,
        clean: issues === 0,
    });
    if (onlySummary) return;

    const verdict = issues === 0
        ? `${C.green}✓ conforms${C.reset}`
        : `${C.yellow}${issues} field issue${issues === 1 ? '' : 's'}${C.reset}`;
    console.log(`\n${C.bold}${target}${C.reset}  ${C.dim}(${acc.objects} objects)${C.reset}  ${verdict}`);

    if (legacy.length) {
        console.log(`  ${C.red}legacy field names → rename to canonical:${C.reset}`);
        for (const [k, n] of legacy) {
            const note = STRUCTURAL_NOTES[k] ? `  ${C.dim}(${STRUCTURAL_NOTES[k]})${C.reset}` : '';
            console.log(`    ${k.padEnd(20)} → ${C.green}${RENAMES[k]}${C.reset}  ${C.dim}×${n}${C.reset}${note}`);
        }
    }
    if (snake.length) {
        console.log(`  ${C.yellow}snake_case keys → use camelCase:${C.reset}`);
        for (const [k, n] of snake) {
            console.log(`    ${k.padEnd(20)} ${C.dim}×${n}${C.reset}`);
        }
    }
    if (badDialect.length) {
        console.log(`  ${C.red}'dialect' holds non-enum values (should be north/south/central/neutral):${C.reset}`);
        for (const [v, n] of badDialect) console.log(`    ${v} ${C.dim}×${n}${C.reset}`);
    }
}

console.log(`${C.bold}${C.cyan}Vietnamy content contract — drift report${C.reset}`);
console.log(`${C.dim}Target: docs/CONTENT_SCHEMA.md · canonical keys loaded from schema/ (${CANONICAL_KEYS.size} fields)${C.reset}`);

const targets = explicitTargets.length
    ? explicitTargets.map((t) => relative(ROOT, t.startsWith('/') ? t : join(process.cwd(), t)))
    : [...JSON_TARGETS, ...JS_TARGETS];

for (const target of targets) {
    let data;
    try {
        data = await load(target);
    } catch (e) {
        console.log(`\n${C.red}! could not load ${target}: ${e.message}${C.reset}`);
        continue;
    }
    const acc = newAcc();
    scan(data, acc, null);
    reportFile(target, acc);
}

// ── 6. Summary table ─────────────────────────────────────────────────────────
console.log(`\n${C.bold}Summary${C.reset}`);
const nameW = Math.max(...rows.map((r) => r.file.length), 4);
console.log(
    `${C.dim}${'file'.padEnd(nameW)}  ${'objs'.padStart(6)}  ${'legacy'.padStart(6)}  ${'snake'.padStart(6)}  status${C.reset}`,
);
let dirty = 0;
for (const r of rows) {
    if (!r.clean) dirty++;
    const status = r.clean ? `${C.green}✓${C.reset}` : `${C.yellow}drift${C.reset}`;
    console.log(
        `${r.file.padEnd(nameW)}  ${String(r.objects).padStart(6)}  ` +
        `${String(r.legacy).padStart(6)}  ${String(r.snake).padStart(6)}  ${status}`,
    );
}
console.log(
    `\n${dirty === 0 ? C.green : C.yellow}${rows.length - dirty}/${rows.length} files conform · ${dirty} need migration${C.reset}`,
);
if (dirty > 0 && !onlySummary) {
    console.log(
        `${C.dim}This is expected for a spec-only milestone. Each "legacy field" line above\n` +
        `is one rename a converter will perform to reach the contract.${C.reset}`,
    );
}
