#!/usr/bin/env node
/**
 * Curriculum Builder — study_import schema
 *
 * Reads the 27 xlsx files in /Users/niko/antigravity/vnme-curr (5 bases × ~5 tracks)
 * and emits a 2-layer artifact set:
 *
 *   src/data/curricula/study_import/
 *     canonical/<level>_<track>.json     ← Vietnamese-only, structural metadata, deterministic IDs
 *                                          (one file per content set, identical across all 5 bases)
 *     translations/<base>/<level>_<track>.json
 *                                        ← { lesson_id: { word_id|sentence_id|match_id: "translation" } }
 *     manifest.json                      ← what's available, per-base coverage
 *
 * Why split:
 *   - Vietnamese text is byte-identical across bases (per HANDOFF.md). One source of truth.
 *   - Per-base files contain only translations → ~70% smaller per language.
 *   - Adding a 6th base means one new translations directory, no canonical rebuild.
 *
 * Runtime composition happens in src/data/curricula/index.js.
 *
 * Usage:
 *   node scripts/build-curriculum.js --src /Users/niko/antigravity/vnme-curr [--verify]
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const arg = (n, d = null) => {
    const i = process.argv.indexOf(`--${n}`);
    return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const flag = (n) => process.argv.includes(`--${n}`);

const SRC = arg('src') || '/Users/niko/antigravity/vnme-curr';
const VERIFY = flag('verify');
const OUT = join(ROOT, 'src/data/curricula/study_import');

// ─── File registry ─────────────────────────────────────────────────────────
// Maps xlsx filename → { base, level, track }. Heritage skipped for ja/ko/zh_cn.
const FILES = [
    // English (5)
    { f: 'vn_a1_core.xlsx',           base: 'en',    level: 'a1', track: 'core' },
    { f: 'vn_a2_core.xlsx',           base: 'en',    level: 'a2', track: 'core' },
    { f: 'vn_b1_manager_en.xlsx',     base: 'en',    level: 'b1', track: 'manager' },
    { f: 'vn_b1_tourist_en.xlsx',     base: 'en',    level: 'b1', track: 'tourist' },
    { f: 'vn_b1_heritage_en.xlsx',    base: 'en',    level: 'b1', track: 'heritage' },
    { f: 'vn_placement_test_en.xlsx', base: 'en',    level: 'placement', track: 'placement' },
    // Traditional Chinese / Taiwan (5)
    { f: 'vn_a1_core_zh.xlsx',        base: 'zh',    level: 'a1', track: 'core' },
    { f: 'vn_a2_core_zh.xlsx',        base: 'zh',    level: 'a2', track: 'core' },
    { f: 'vn_b1_manager_zh.xlsx',     base: 'zh',    level: 'b1', track: 'manager' },
    { f: 'vn_b1_tourist_zh.xlsx',     base: 'zh',    level: 'b1', track: 'tourist' },
    { f: 'vn_b1_heritage_tw_zh.xlsx', base: 'zh',    level: 'b1', track: 'heritage' },
    { f: 'vn_placement_test_zh.xlsx', base: 'zh',    level: 'placement', track: 'placement' },
    // Simplified Chinese / Mainland (4 — no heritage)
    { f: 'vn_a1_core_zh_cn.xlsx',     base: 'zh_cn', level: 'a1', track: 'core' },
    { f: 'vn_a2_core_zh_cn.xlsx',     base: 'zh_cn', level: 'a2', track: 'core' },
    { f: 'vn_b1_manager_zh_cn.xlsx',  base: 'zh_cn', level: 'b1', track: 'manager' },
    { f: 'vn_b1_tourist_zh_cn.xlsx',  base: 'zh_cn', level: 'b1', track: 'tourist' },
    { f: 'vn_placement_test_zh_cn.xlsx', base: 'zh_cn', level: 'placement', track: 'placement' },
    // Japanese (4 — no heritage)
    { f: 'vn_a1_core_ja.xlsx',        base: 'ja',    level: 'a1', track: 'core' },
    { f: 'vn_a2_core_ja.xlsx',        base: 'ja',    level: 'a2', track: 'core' },
    { f: 'vn_b1_manager_ja.xlsx',     base: 'ja',    level: 'b1', track: 'manager' },
    { f: 'vn_b1_tourist_ja.xlsx',     base: 'ja',    level: 'b1', track: 'tourist' },
    { f: 'vn_placement_test_ja.xlsx', base: 'ja',    level: 'placement', track: 'placement' },
    // Korean (4 — no heritage)
    { f: 'vn_a1_core_kr.xlsx',        base: 'ko',    level: 'a1', track: 'core' },
    { f: 'vn_a2_core_kr.xlsx',        base: 'ko',    level: 'a2', track: 'core' },
    { f: 'vn_b1_manager_kr.xlsx',     base: 'ko',    level: 'b1', track: 'manager' },
    { f: 'vn_b1_tourist_ko.xlsx',     base: 'ko',    level: 'b1', track: 'tourist' },
    { f: 'vn_placement_test_ko.xlsx', base: 'ko',    level: 'placement', track: 'placement' },
];

// ─── Stable IDs ────────────────────────────────────────────────────────────
// Lesson identity = (level, track, lesson_type, vi-content-fingerprint).
// Title-based hashing fails because lesson_title is translated in each base file.
// Vietnamese content (word_text, sentence_text, match_text) IS byte-identical across bases
// per HANDOFF.md, so hashing the sorted set of vi anchors gives base-neutral lesson IDs.
// Item IDs hash on lesson_id + kind + position + anchor — stable as long as that lesson's
// vi content order doesn't shuffle.
const sha = (s) => createHash('sha1').update(s).digest('hex');
const fingerprintLesson = (words, sentences, matches) => {
    const anchors = [
        ...words.map(w => 'w:' + w.vi),
        ...sentences.map(s => 's:' + s.vi),
        ...matches.map(m => 'm:' + m.text),
    ].sort();
    return sha(anchors.join('␞')).slice(0, 12);
};
const lessonId = (level, track, type, fp) => 'L_' + sha([level, track, type, fp].join('␟')).slice(0, 10);
const itemId = (lid, kind, idx, anchor) => kind[0].toUpperCase() + '_' + sha([lid, kind, idx, anchor].join('␟')).slice(0, 8);

// ─── Grammar tag auto-linker (44 GT*** tags) ──────────────────────────────
const GP = [
    ['GT002', s => /\blà\b/i.test(s)],
    ['GT004', s => /\bkhông\b/i.test(s) && !/không\s*[?]/.test(s)],
    ['GT005', s => /không\s*[?]/.test(s) || /\bkhông\s*$/.test(s.replace(/[?.!。]+$/, '').trim())],
    ['GT006', s => /\bgì\b/i.test(s)],
    ['GT007', s => /ở\s*đâu/i.test(s)],
    ['GT008', s => /khi\s*nào/i.test(s)],
    ['GT009', s => /như\s*thế\s*nào/i.test(s)],
    ['GT010', s => /bao\s*nhiêu/i.test(s) && !/tuổi/i.test(s)],
    ['GT011', s => /mấy\s*giờ/i.test(s)],
    ['GT012', s => /thứ\s*mấy/i.test(s)],
    ['GT013', s => /bao\s*nhiêu\s*tuổi/i.test(s)],
    ['GT014', s => /màu\s*gì/i.test(s)],
    ['GT015', s => /\bđã\b/i.test(s)],
    ['GT016', s => /\bđang\b/i.test(s)],
    ['GT017', s => /\bsẽ\b/i.test(s)],
    ['GT018', s => /\brồi\b/i.test(s)],
    ['GT019', s => /\bchưa\b/i.test(s)],
    ['GT020', s => /cho\s*xin/i.test(s)],
    ['GT021', s => /cho\s*tôi/i.test(s)],
    ['GT022', s => /\bmuốn\b/i.test(s)],
    ['GT025', s => /\bhơn\b/i.test(s)],
    ['GT026', s => /\bnhất\b/i.test(s)],
    ['GT027', s => /\bbằng\b/i.test(s)],
    ['GT028', s => /có\s*thể/i.test(s)],
    ['GT029', s => /\bphải\b/i.test(s)],
    ['GT030', s => /\bnếu\b.*\bthì\b/i.test(s)],
    ['GT031', s => /\brất\b/i.test(s)],
    ['GT032', s => /\bquá\b/i.test(s)],
    ['GT033', s => /\blắm\b/i.test(s)],
    ['GT034', s => /\blúc\b/i.test(s)],
    ['GT035', s => /buổi\s*(sáng|trưa|chiều|tối)/i.test(s)],
    ['GT036', s => /ngày\s*\d+\s*tháng/i.test(s)],
    ['GT037', s => /\bbị\b/i.test(s)],
    ['GT038', s => /\bở\b/i.test(s) && !/ở\s*đâu/i.test(s)],
    ['GT039', s => /\bbên\s+(trái|phải|cạnh)/i.test(s)],
    ['GT040', s => /đi\s*bằng/i.test(s)],
    ['GT041', s => /\b(thường|luôn|không\s*bao\s*giờ|đôi\s*khi)\b/i.test(s)],
    ['GT042', s => /\b(này|kia)\b/i.test(s)],
    ['GT043', s => /(đây|đó)\s*là/i.test(s)],
    ['GT044', s => /\bvà\b/i.test(s)],
];
const detectGrammar = (vi) => {
    if (!vi) return [];
    const hits = new Set();
    for (const [gt, t] of GP) if (t(vi)) hits.add(gt);
    return [...hits];
};
const CATEGORY_TO_GT = { classifier: 'GT023', measure: 'GT023' };

const XP_BY_TYPE = { Phonetics: 8, Vocabulary: 10, Grammar: 12, Scene: 14, Quiz: 20, Placement: 0 };

// ─── Per-file parser ───────────────────────────────────────────────────────
function parseFile({ f, base, level, track }) {
    const path = join(SRC, f);
    if (!existsSync(path)) return { missing: true, f, base, level, track };

    const wb = XLSX.readFile(path);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

    // Two-pass: first group rows by (unit_title, lesson_type, lesson_title) using TITLE
    // (which is base-language) to identify rows belonging to the same lesson within THIS file.
    // Then compute the Vietnamese-content fingerprint per lesson to derive a base-neutral ID.
    const lessons = new Map();
    const unitOrder = [];
    const unitSeen = new Set();

    rows.forEach((r, rowIdx) => {
        if (!unitSeen.has(r.unit_title)) {
            unitSeen.add(r.unit_title);
            unitOrder.push(r.unit_title);
        }
        const key = `${r.unit_title}␟${r.lesson_type}␟${r.lesson_title}`;
        if (!lessons.has(key)) {
            lessons.set(key, {
                unit_title: r.unit_title,
                lesson_type: r.lesson_type,
                lesson_title: r.lesson_title, // base-language; kept for display
                content_types: (r.content_types || '').split(',').map(s => s.trim()).filter(Boolean),
                words: [], sentences: [], matches: [],
                _firstRow: rowIdx,
            });
        }
        const lesson = lessons.get(key);

        if (r.word_text) {
            lesson.words.push({ vi: r.word_text, ipa: r.ipa || '', category: r.category || '', _tr: r.word_translation || '' });
        }
        if (r.sentence_text) {
            lesson.sentences.push({ vi: r.sentence_text, _tr: r.sentence_translation || '' });
        }
        if (r.match_text) {
            lesson.matches.push({ text: r.match_text, _tr: r.match_target || '' });
        }
    });

    // Second pass: assign base-neutral IDs from vi-content fingerprint, then item IDs.
    const lessonList = [...lessons.values()]
        .sort((a, b) => a._firstRow - b._firstRow)
        .map(l => {
            const fp = fingerprintLesson(l.words, l.sentences, l.matches);
            const id = lessonId(level, track, l.lesson_type, fp);
            return {
                id,
                fp,
                unit_title: l.unit_title,
                lesson_type: l.lesson_type,
                lesson_title: l.lesson_title,
                content_types: l.content_types,
                _firstRow: l._firstRow,
                words: l.words.map((w, i) => ({ id: itemId(id, 'word', i, w.vi), ...w })),
                sentences: l.sentences.map((s, i) => ({ id: itemId(id, 'sentence', i, s.vi), ...s })),
                matches: l.matches.map((m, i) => ({ id: itemId(id, 'match', i, m.text), ...m })),
            };
        });
    return { lessons: lessonList, units: unitOrder, base, level, track, source: f };
}

// ─── Build canonical (vi + structure, no translations) ────────────────────
function buildCanonical(parsed) {
    const unitIndex = Object.fromEntries(parsed.units.map((u, i) => [u, i + 1]));

    // Smart unlock rules: lesson N requires lesson N-1; quiz requires all non-quiz lessons in its unit.
    const byUnit = {};
    parsed.lessons.forEach(l => {
        const u = unitIndex[l.unit_title];
        (byUnit[u] = byUnit[u] || []).push(l);
    });

    let nodeCounter = 0;
    let prevNonQuizId = null;
    const lessonsOut = parsed.lessons.map((l, i) => {
        const u = unitIndex[l.unit_title];
        const isQuiz = l.lesson_type === 'Quiz';
        nodeCounter++;
        const node_id = `${parsed.track}_u${u}_${isQuiz ? 'Q' : 'L'}${String(nodeCounter).padStart(3, '0')}`;
        const quiz_id = isQuiz ? node_id : null;
        const xp_reward = XP_BY_TYPE[l.lesson_type] ?? 10;

        let unlock_rule;
        if (i === 0) {
            unlock_rule = { type: 'start' };
        } else if (isQuiz) {
            // Quiz unlocks when all non-quiz lessons in this unit are completed.
            const requires = byUnit[u].filter(x => x.lesson_type !== 'Quiz').map(x => x.id);
            unlock_rule = { type: 'unit_complete', requires };
        } else {
            unlock_rule = { type: 'sequential', requires: [parsed.lessons[i - 1].id] };
        }

        // Grammar tags: from sentences + from category mapping.
        const gtags = new Set();
        l.sentences.forEach(s => detectGrammar(s.vi).forEach(g => gtags.add(g)));
        l.words.forEach(w => {
            if (CATEGORY_TO_GT[w.category]) gtags.add(CATEGORY_TO_GT[w.category]);
        });

        if (!isQuiz) prevNonQuizId = l.id;

        return {
            id: l.id,
            node_id,
            quiz_id,
            unit_index: u,
            unit_title: l.unit_title,
            lesson_type: l.lesson_type,
            lesson_title: l.lesson_title,
            content_types: l.content_types,
            xp_reward,
            unlock_rule,
            grammar_tags: [...gtags].sort(),
            words: l.words.map(w => ({ id: w.id, vi: w.vi, ipa: w.ipa, category: w.category })),
            sentences: l.sentences.map(s => ({ id: s.id, vi: s.vi })),
            matches: l.matches.map(m => ({ id: m.id, text: m.text })),
        };
    });

    return {
        meta: {
            level: parsed.level,
            track: parsed.track,
            source: parsed.source,
            generated: new Date().toISOString(),
            stats: {
                units: parsed.units.length,
                lessons: lessonsOut.length,
                words: lessonsOut.reduce((s, l) => s + l.words.length, 0),
                sentences: lessonsOut.reduce((s, l) => s + l.sentences.length, 0),
                matches: lessonsOut.reduce((s, l) => s + l.matches.length, 0),
            },
        },
        units: parsed.units.map((title, i) => ({ index: i + 1, title })),
        lessons: lessonsOut,
    };
}

// ─── Build per-base translation table ─────────────────────────────────────
function buildTranslations(parsed) {
    const out = {};
    parsed.lessons.forEach(l => {
        const t = {};
        l.words.forEach(w => { if (w._tr) t[w.id] = w._tr; });
        l.sentences.forEach(s => { if (s._tr) t[s.id] = s._tr; });
        l.matches.forEach(m => { if (m._tr) t[m.id] = m._tr; });
        if (Object.keys(t).length) out[l.id] = t;
    });
    return {
        meta: { base: parsed.base, level: parsed.level, track: parsed.track, source: parsed.source, generated: new Date().toISOString() },
        translations: out,
    };
}

// ─── Coverage report across bases ─────────────────────────────────────────
// EN is authoritative (most complete). Report what fraction of EN's lessons each other base covers.
function buildCoverageReport(canonicalByBLT) {
    const groups = {};
    for (const [k, can] of Object.entries(canonicalByBLT)) {
        const [base, level, track] = k.split('|');
        const lt = `${level}_${track}`;
        (groups[lt] = groups[lt] || {})[base] = can;
    }
    // Normalize "placement_placement" → "placement"
    const normalized = {};
    for (const [k, v] of Object.entries(groups)) {
        const [level, track] = k.split('_');
        normalized[ltKey(level, track)] = v;
    }
    const report = {};
    for (const [lt, byBase] of Object.entries(normalized)) {
        const ref = byBase.en || Object.values(byBase)[0];
        const refIds = new Set(ref.lessons.map(l => l.id));
        report[lt] = { authoritative: byBase.en ? 'en' : Object.keys(byBase)[0], total: refIds.size, by_base: {} };
        for (const [base, can] of Object.entries(byBase)) {
            const ids = new Set(can.lessons.map(l => l.id));
            const matched = [...ids].filter(id => refIds.has(id)).length;
            report[lt].by_base[base] = { lessons: ids.size, matched_authoritative: matched };
        }
    }
    return report;
}

// Normalize level_track key: "placement_placement" → "placement"
const ltKey = (level, track) => (level === track ? level : `${level}_${track}`);

// ─── Main ─────────────────────────────────────────────────────────────────
console.log(`Source: ${SRC}`);
console.log(`Output: ${OUT}\n`);

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'canonical'), { recursive: true });
mkdirSync(join(OUT, 'translations'), { recursive: true });

// EN is authoritative — its canonical drives ID space. Other bases only contribute translations
// for matching lesson IDs; lessons that exist in EN but not in another base will fall back to EN at runtime.
const canonicalByLT = {};
const canonicalByBLT = {};
const manifest = { bases: {}, levels_tracks: [], generated: new Date().toISOString() };
const parsedByEntry = [];

// Pass 1: parse all files
for (const entry of FILES) {
    const parsed = parseFile(entry);
    if (parsed.missing) {
        console.log(`  [SKIP] ${entry.f} (not found)`);
        manifest.bases[entry.base] = manifest.bases[entry.base] || { level_tracks: [], missing: [] };
        manifest.bases[entry.base].missing.push(ltKey(entry.level, entry.track));
        continue;
    }
    parsedByEntry.push(parsed);
}

// Pass 2: build canonical from EN files (authoritative).
for (const parsed of parsedByEntry) {
    if (parsed.base !== 'en') continue;
    const canonical = buildCanonical(parsed);
    const key = ltKey(parsed.level, parsed.track);
    canonicalByLT[key] = canonical;
    canonicalByBLT[`en|${parsed.level}|${parsed.track}`] = canonical;
    writeFileSync(join(OUT, 'canonical', `${key}.json`), JSON.stringify(canonical, null, 2));
    if (!manifest.levels_tracks.includes(key)) manifest.levels_tracks.push(key);
}

// Pass 3: for non-EN bases, also build canonical (for coverage report) and write translations.
for (const parsed of parsedByEntry) {
    const key = ltKey(parsed.level, parsed.track);
    const translations = buildTranslations(parsed);

    if (parsed.base !== 'en') {
        // Build canonical for coverage analysis only (don't write to disk).
        canonicalByBLT[`${parsed.base}|${parsed.level}|${parsed.track}`] = buildCanonical(parsed);

        // If EN canonical doesn't exist for this content set, the non-EN file becomes the authoritative source.
        if (!canonicalByLT[key]) {
            const can = canonicalByBLT[`${parsed.base}|${parsed.level}|${parsed.track}`];
            canonicalByLT[key] = can;
            writeFileSync(join(OUT, 'canonical', `${key}.json`), JSON.stringify(can, null, 2));
            if (!manifest.levels_tracks.includes(key)) manifest.levels_tracks.push(key);
        }
    }

    const trDir = join(OUT, 'translations', parsed.base);
    if (!existsSync(trDir)) mkdirSync(trDir, { recursive: true });
    writeFileSync(join(trDir, `${key}.json`), JSON.stringify(translations, null, 2));

    manifest.bases[parsed.base] = manifest.bases[parsed.base] || { level_tracks: [], missing: [] };
    manifest.bases[parsed.base].level_tracks.push(key);

    const can = canonicalByBLT[`${parsed.base}|${parsed.level}|${parsed.track}`];
    const s = can.meta.stats;
    console.log(`  ${parsed.base.padEnd(5)} ${key.padEnd(14)} ${s.lessons} lessons / ${s.words}w / ${s.sentences}s / ${s.matches}m`);
}

if (VERIFY) {
    console.log('\nCoverage (lessons matched against authoritative canonical):');
    const report = buildCoverageReport(canonicalByBLT);
    for (const [lt, info] of Object.entries(report)) {
        console.log(`  ${lt.padEnd(14)} authoritative=${info.authoritative} (${info.total} lessons)`);
        for (const [base, s] of Object.entries(info.by_base)) {
            const pct = info.total > 0 ? ((s.matched_authoritative / info.total) * 100).toFixed(0) : '—';
            console.log(`    ${base.padEnd(5)} has ${String(s.lessons).padStart(3)} lessons, ${String(s.matched_authoritative).padStart(3)}/${info.total} match canonical (${pct}%)`);
        }
    }
    manifest.coverage = report;
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

const totalLessons = Object.values(canonicalByLT).reduce((s, c) => s + c.meta.stats.lessons, 0);
const totalWords = Object.values(canonicalByLT).reduce((s, c) => s + c.meta.stats.words, 0);
const totalSent = Object.values(canonicalByLT).reduce((s, c) => s + c.meta.stats.sentences, 0);

console.log(`\nDone:`);
console.log(`  ${Object.keys(canonicalByLT).length} canonical content sets`);
console.log(`  ${Object.keys(manifest.bases).length} bases × translations`);
console.log(`  ${totalLessons} unique lessons / ${totalWords} words / ${totalSent} sentences`);
console.log(`\nWritten to ${OUT.replace(ROOT + '/', '')}/`);
