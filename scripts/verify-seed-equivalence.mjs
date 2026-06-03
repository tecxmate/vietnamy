#!/usr/bin/env node
/**
 * Proves that seeding the runtime store from content/curriculum.json produces
 * the SAME store as today's unified_db.json path — before we switch initialData
 * over. Compares items, translations, lessons, blueprints and path_nodes.
 *
 * `dialect` is excluded from the item comparison on purpose: it is unused by the
 * app (only userProfile.dialect is read) and content/ intentionally normalizes
 * the corrupted source values. Everything else must match exactly.
 *
 *   node scripts/verify-seed-equivalence.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const stripDiacritics = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/ơ/g, 'o').replace(/Ơ/g, 'O')
    .replace(/ư/g, 'u').replace(/Ư/g, 'U');
const audioKeyOf = (vi) => 'a_' + vi.replace(/[^a-zA-ZàáạảãăắằặẳẵâấầậẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ ]/g, '').replace(/ +/g, '_').toLowerCase();

// ── current path: build from unified_db.json (faithful copy of buildFromUnifiedDB) ──
function buildFromUnified(db) {
    const items = [], translations = [], lessons = [], blueprints = [], pathNodes = [];
    (db.vocabulary || []).forEach((v) => {
        items.push({ id: v.id, item_type: v.pos === 'phrase' ? 'phrase' : 'word', vi_text: v.vi_text, vi_text_no_diacritics: stripDiacritics(v.vi_text), audio_key: audioKeyOf(v.vi_text), emoji: v.emoji, pos: v.pos, frequency: v.frequency_rank, hasImage: v.has_image });
        (v.translations || []).forEach((t) => translations.push({ item_id: v.id, lang: t.lang, text: t.text, is_alternate: !t.is_primary }));
    });
    (db.sentences || []).forEach((s) => {
        items.push({ id: s.id, item_type: 'sentence', vi_text: s.vi_text, vi_text_no_diacritics: stripDiacritics(s.vi_text), audio_key: audioKeyOf(s.vi_text), token_count: s.token_count, tags: s.grammar_tags, note: s.grammar_note, accepted: (s.translations || []).map((t) => t.text) });
        (s.translations || []).forEach((t) => translations.push({ item_id: s.id, lang: t.lang, text: t.text, is_alternate: !t.is_primary }));
    });
    (db.lessons || []).forEach((lesson) => {
        const ids = [...(db.vocabulary || []).filter((v) => v.lesson_id === lesson.id).map((v) => v.id), ...(db.sentences || []).filter((s) => s.lesson_id === lesson.id).map((s) => s.id)];
        lessons.push({ id: lesson.id, lesson_index: lesson.order_index, title: lesson.title, target_xp: lesson.xp_reward || 10 });
        blueprints.push({ lesson_id: lesson.id, focus: lesson.focus || [], introduced_items: ids });
        if (lesson.node_id) {
            pathNodes.push({ id: lesson.node_id, unit_id: lesson.unit_id, node_index: lesson.order_index, node_type: 'lesson', lesson_id: lesson.id, difficulty: lesson.difficulty || 1, cefr_level: lesson.cefr_level || 'A1.1', vocab_introduces: ids });
            if (lesson.quiz_id) pathNodes.push({ id: lesson.quiz_id, unit_id: lesson.unit_id, node_index: lesson.order_index + 1, node_type: 'test', source_node_id: lesson.node_id, difficulty: lesson.difficulty || 1, cefr_level: lesson.cefr_level || 'A1.1' });
        }
    });
    return { items, translations, lessons, blueprints, pathNodes };
}

// ── new path: build from content/curriculum.json ──
const gtagToGT = (id) => id.replace(/^gtag_/, 'GT'); // restore the id format exerciseGenerator depends on
function buildFromCanonical(db) {
    const items = [], translations = [], lessons = [], blueprints = [], pathNodes = [];
    (db.words || []).forEach((v) => {
        items.push({ id: v.id, item_type: v.pos === 'phrase' ? 'phrase' : 'word', vi_text: v.vi, vi_text_no_diacritics: stripDiacritics(v.vi), audio_key: audioKeyOf(v.vi), emoji: v.emoji, pos: v.pos, frequency: v.frequencyRank, hasImage: v.hasImage });
        ['en', 'zh'].forEach((lang) => { if (v[lang]) translations.push({ item_id: v.id, lang, text: v[lang], is_alternate: false }); });
    });
    (db.sentences || []).forEach((s) => {
        const accepted = [s.en, ...(s.accepted || [])].filter(Boolean);
        items.push({ id: s.id, item_type: 'sentence', vi_text: s.vi, vi_text_no_diacritics: stripDiacritics(s.vi), audio_key: audioKeyOf(s.vi), token_count: s.tokenCount, tags: (s.grammarTagIds || []).map(gtagToGT), note: s.note, accepted });
        if (s.en) translations.push({ item_id: s.id, lang: 'en', text: s.en, is_alternate: false });
        (s.accepted || []).forEach((alt) => translations.push({ item_id: s.id, lang: 'en', text: alt, is_alternate: true }));
        if (s.zh) translations.push({ item_id: s.id, lang: 'zh', text: s.zh, is_alternate: false });
    });
    (db.lessons || []).forEach((lesson) => {
        const ids = [...(db.words || []).filter((v) => v.lessonId === lesson.id).map((v) => v.id), ...(db.sentences || []).filter((s) => s.lessonId === lesson.id).map((s) => s.id)];
        lessons.push({ id: lesson.id, lesson_index: lesson.orderIndex, title: lesson.title, target_xp: lesson.xpReward || 10 });
        blueprints.push({ lesson_id: lesson.id, focus: lesson.focus || [], introduced_items: ids });
        if (lesson.nodeId) {
            pathNodes.push({ id: lesson.nodeId, unit_id: lesson.unitId, node_index: lesson.orderIndex, node_type: 'lesson', lesson_id: lesson.id, difficulty: lesson.difficulty || 1, cefr_level: lesson.cefrLevel || 'A1.1', vocab_introduces: ids });
            if (lesson.quizId) pathNodes.push({ id: lesson.quizId, unit_id: lesson.unitId, node_index: lesson.orderIndex + 1, node_type: 'test', source_node_id: lesson.nodeId, difficulty: lesson.difficulty || 1, cefr_level: lesson.cefrLevel || 'A1.1' });
        }
    });
    return { items, translations, lessons, blueprints, pathNodes };
}

// ── compare ──
// stable key order; drop empty/undefined/null so "" ≡ absent (cosmetic-only diffs ignored)
const norm = (o) => {
    const clean = {};
    for (const k of Object.keys(o).sort()) {
        const v = o[k];
        if (v === undefined || v === null || v === '') continue;
        clean[k] = v;
    }
    return JSON.stringify(clean);
};
function diffById(a, b, key, label, mismatches) {
    const ma = new Map(a.map((x) => [x[key], x]));
    const mb = new Map(b.map((x) => [x[key], x]));
    if (ma.size !== mb.size) mismatches.push(`${label}: count ${ma.size} vs ${mb.size}`);
    for (const [id, ax] of ma) {
        const bx = mb.get(id);
        if (!bx) { mismatches.push(`${label}: ${id} missing in new`); continue; }
        if (norm(ax) !== norm(bx)) mismatches.push(`${label}: ${id}\n   old=${norm(ax)}\n   new=${norm(bx)}`);
    }
    for (const id of mb.keys()) if (!ma.has(id)) mismatches.push(`${label}: ${id} extra in new`);
}

const oldB = buildFromUnified(readJson('src/data/unified_db.json'));
const newB = buildFromCanonical(readJson('content/curriculum.json'));

const mismatches = [];
diffById(oldB.items, newB.items, 'id', 'items', mismatches);
diffById(oldB.lessons, newB.lessons, 'id', 'lessons', mismatches);
diffById(oldB.blueprints, newB.blueprints, 'lesson_id', 'blueprints', mismatches);
diffById(oldB.pathNodes, newB.pathNodes, 'id', 'pathNodes', mismatches);
// translations: compare as multisets of normalized rows
const trKey = (t) => `${t.item_id}|${t.lang}|${t.text}|${t.is_alternate}`;
const oldTr = new Set(oldB.translations.map(trKey));
const newTr = new Set(newB.translations.map(trKey));
if (oldTr.size !== newTr.size) mismatches.push(`translations: count ${oldTr.size} vs ${newTr.size}`);
for (const k of oldTr) if (!newTr.has(k)) mismatches.push(`translations: missing ${k}`);
for (const k of newTr) if (!oldTr.has(k)) mismatches.push(`translations: extra ${k}`);

console.log(`items     old=${oldB.items.length} new=${newB.items.length}`);
console.log(`translations old=${oldB.translations.length} new=${newB.translations.length}`);
console.log(`lessons   old=${oldB.lessons.length} new=${newB.lessons.length}`);
console.log(`blueprints old=${oldB.blueprints.length} new=${newB.blueprints.length}`);
console.log(`pathNodes old=${oldB.pathNodes.length} new=${newB.pathNodes.length}`);
if (mismatches.length === 0) {
    console.log('\n✓ EQUIVALENT — content/curriculum.json seeds the same store (dialect excluded by design).');
    process.exit(0);
} else {
    console.log(`\n✗ ${mismatches.length} mismatch(es):`);
    mismatches.slice(0, 30).forEach((m) => console.log('  - ' + m));
    process.exit(1);
}
