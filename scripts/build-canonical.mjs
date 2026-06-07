#!/usr/bin/env node
/**
 * Build the canonical content bundle.
 *
 * Reads the existing data files (which stay untouched) and GENERATES a clean,
 * contract-conformant dataset under /content that the mobile team owns. The web
 * app keeps reading its current files, so nothing breaks; this is purely an
 * additive export. Validate the result with:
 *
 *   node scripts/build-canonical.mjs
 *   node scripts/validate-content.mjs content/curriculum.json content/drills/*.json
 *
 * Implemented so far: curriculum (from unified_db.json) + drills.
 * Remaining types (dictionary, articles, grammar, tones, kinship) are added
 * incrementally in later passes.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src', 'data');
const OUT = join(ROOT, 'content');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (relPath, data) => {
    const full = join(OUT, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, JSON.stringify(data, null, 2) + '\n');
    return full;
};

// ── helpers ──────────────────────────────────────────────────────────────────

// translations:[{lang,text,is_primary}] → flat { en, zh } (primary per lang).
function flattenTranslations(translations) {
    const out = {};
    for (const t of translations || []) {
        if (!t || !t.lang || !t.text) continue;
        if (out[t.lang] === undefined || t.is_primary) out[t.lang] = t.text;
    }
    return out; // e.g. { en: "hello" }
}

// dialect is a region enum; the runtime polluted it with usage notes.
// Returns { dialect?, note? }.
const DIALECT_ENUM = new Set(['north', 'south', 'central', 'neutral']);
function cleanDialect(value) {
    if (!value) return {};
    if (DIALECT_ENUM.has(value)) return { dialect: value };
    if (value === 'both') return { dialect: 'neutral' };
    return { note: value }; // free-text usage note rescued into its own field
}

// drop keys whose value is undefined so optional fields are omitted, not null.
function clean(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v) && v.length === 0) continue;
        out[k] = v;
    }
    return out;
}

// ── curriculum (from unified_db.json) ────────────────────────────────────────

function buildCurriculum() {
    const db = readJson(join(SRC, 'unified_db.json'));

    // grammar tag ids GT001 → gtag_001 (lowercase contract). Build a remap so
    // sentence references stay valid.
    const tagIdMap = new Map();
    const grammarTags = (db.grammar_tags || []).map((t) => {
        const newId = 'gtag_' + String(t.id).replace(/^GT/i, '').padStart(3, '0');
        tagIdMap.set(t.id, newId);
        return clean({
            id: newId,
            name: t.name,
            category: t.category,
            description: t.description,
        });
    });

    const units = (db.units || []).map((u) =>
        clean({
            id: u.id,
            orderIndex: u.order_index,
            title: u.title,
            description: u.description,
            cefrLevel: u.cefr_level,
            icon: u.icon,
        }),
    );

    const words = (db.vocabulary || []).map((v) => {
        const tr = flattenTranslations(v.translations);
        const { dialect, note } = cleanDialect(v.dialect);
        return clean({
            id: v.id,
            lessonId: v.lesson_id,
            vi: v.vi_text,
            en: tr.en,
            zh: tr.zh,
            pos: v.pos,
            emoji: v.emoji,
            cefrLevel: v.cefr_level,
            difficulty: v.difficulty,
            frequencyRank: v.frequency_rank,
            dialect,
            hasImage: v.has_image,
            imageUrl: v.image_url,
            audioKey: v.audio_key,
            note,
        });
    });

    const sentences = (db.sentences || []).map((s) => {
        // A sentence can have several accepted English answers: en = primary,
        // accepted[] = the alternates (preserves them — they were being dropped).
        const enTr = (s.translations || []).filter((t) => t.lang === 'en' && t.text);
        const enPrimary = enTr.find((t) => t.is_primary) || enTr[0];
        const enAlts = enTr.filter((t) => t !== enPrimary).map((t) => t.text);
        const zhTr = (s.translations || []).filter((t) => t.lang === 'zh' && t.text);
        const zhPrimary = zhTr.find((t) => t.is_primary) || zhTr[0];
        return clean({
            id: s.id,
            lessonId: s.lesson_id,
            vi: s.vi_text,
            en: enPrimary ? enPrimary.text : undefined,
            zh: zhPrimary ? zhPrimary.text : undefined,
            accepted: enAlts,
            note: s.grammar_note,
            tokenCount: s.token_count,
            difficulty: s.difficulty,
            grammarTagIds: (s.grammar_tags || []).map((t) => tagIdMap.get(t) || t),
            ipa: s.ipa,
            audioKey: s.audio_key,
        });
    });

    // conversation ids CV001 → conv_001 (lowercase contract). Not referenced
    // elsewhere, so safe to remap freely.
    const conversations = (db.conversations || []).map((c) => ({
        id: 'conv_' + String(c.id).replace(/^CV/i, '').padStart(3, '0'),
        lessonId: c.lesson_id,
        title: c.title,
        context: c.context,
        lines: (c.lines || []).map((l) => clean({
            speaker: l.speaker, vi: l.vi, en: l.en, zh: l.zh, audioKey: l.audio_key,
        })),
    }));

    // group child items by lesson to populate the lesson's *Ids[] reference lists
    const byLesson = (rows, field) => {
        const m = new Map();
        for (const r of rows) {
            if (!r[field]) continue;
            if (!m.has(r[field])) m.set(r[field], []);
            m.get(r[field]).push(r.id);
        }
        return m;
    };
    const wordIdsByLesson = byLesson(words, 'lessonId');
    const sentenceIdsByLesson = byLesson(sentences, 'lessonId');
    const convIdsByLesson = byLesson(conversations, 'lessonId');

    const lessons = (db.lessons || []).map((l) =>
        clean({
            id: l.id,
            unitId: l.unit_id,
            orderIndex: l.order_index,
            nodeId: l.node_id,
            quizId: l.quiz_id,
            quizLabel: l.quiz_label,
            title: l.title,
            topic: l.topic,
            focus: l.focus,
            targets: l.targets,
            cefrLevel: l.cefr_level,
            difficulty: l.difficulty,
            exerciseProfileId: l.exercise_profile_id,
            xpReward: l.xp_reward,
            wordIds: wordIdsByLesson.get(l.id),
            sentenceIds: sentenceIdsByLesson.get(l.id),
            conversationIds: convIdsByLesson.get(l.id),
        }),
    );

    const bundle = {
        meta: {
            mode: 'all',
            version: db.version || '1.0.0',
            generated: db.generated,
            source: 'unified_db.json',
        },
        units,
        lessons,
        words,
        sentences,
        conversations,
        grammarTags,
    };
    const path = writeJson('curriculum.json', bundle);
    return { path, counts: { units: units.length, lessons: lessons.length, words: words.length, sentences: sentences.length, conversations: conversations.length, grammarTags: grammarTags.length } };
}

// ── drills (already conform; formalize the id to drill_<name>) ────────────────

function buildDrills() {
    const dir = join(SRC, 'drills');
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    let total = 0;
    for (const f of files) {
        const d = readJson(join(dir, f));
        const out = clean({
            // Keep the slug id (e.g. "connectors"): DrillPractice matches admin
            // CMS overrides in localStorage by this id, so it must stay stable.
            id: d.id,
            title: d.title,
            description: d.description,
            color: d.color,
            intro: d.intro,
            questions: (d.questions || []).map((q) => clean({
                type: q.type,
                prompt: q.prompt,
                correct: q.correct,
                options: q.options,
                explanation: q.explanation,
                audioKey: q.audio,
            })),
        });
        writeJson(join('drills', f), out);
        total += out.questions.length;
    }
    return { count: files.length, questions: total };
}

// ── dictionary (from dictionary.json) ────────────────────────────────────────

// The imported dictionary tags Vietnamese POS with single-letter codes.
const POS_CODE = {
    N: 'noun', V: 'verb', A: 'adjective', R: 'adverb', P: 'pronoun',
    I: 'interjection', E: 'preposition', C: 'conjunction', M: 'numeral',
    // D (determiner), O, X (unknown) have no contract equivalent → omitted
};
// cn → zh inside a {en, cn} definitions/examples object.
function cnToZh(obj) {
    if (!obj || typeof obj !== 'object') return undefined;
    const out = {};
    if (obj.vi !== undefined) out.vi = obj.vi;
    if (obj.en !== undefined && obj.en !== '') out.en = obj.en;
    if (obj.cn !== undefined && obj.cn !== '') out.zh = obj.cn;
    if (obj.zh !== undefined && obj.zh !== '') out.zh = obj.zh;
    return out;
}

function buildDictionary() {
    const rows = readJson(join(SRC, 'dictionary.json'));
    const seen = new Set();
    const out = rows.map((r, i) => {
        const pos = [...new Set((r.tags || []).map((t) => POS_CODE[t]).filter(Boolean))];
        const definitions = cnToZh(r.definitions) || {};
        // dictionary definitions has no vi; the headword is vi. Drop the empty
        // localizedText requirement by ensuring vi is present via the headword.
        const examples = (r.examples || []).map(cnToZh).filter((e) => e && e.vi);
        const id = 'dict_' + String(i + 1).padStart(5, '0');
        seen.add(id);
        return clean({
            id,
            vi: r.word,
            pos,
            definitions: clean({ vi: r.word, en: definitions.en, zh: definitions.zh }),
            examples,
            hanViet: r.han_viet ? clean({ char: r.han_viet.char, definition: r.han_viet.definition }) : undefined,
            audioKey: r.audio || undefined,
            source: r.source,
        });
    });
    writeJson('dictionary.json', out);
    return { count: out.length };
}

// ── articles (from articleData.js) ───────────────────────────────────────────

// reading "level" → a representative CEFR band (author can refine later).
const LEVEL_TO_CEFR = { beginner: 'A1', intermediate: 'B1', advanced: 'C1' };

async function buildArticles() {
    const mod = await import(pathToFileURL(join(SRC, 'articleData.js')).href);
    const out = (mod.default || []).map((a) =>
        clean({
            id: a.id,
            title: clean({ vi: a.title_vi, en: a.title_en, zh: a.title_zh }),
            category: a.category,
            cefrLevel: LEVEL_TO_CEFR[a.level] || undefined,
            imageUrl: a.image,
            readingTimeMins: a.readingTimeMins,
            sentences: (a.sentences || []).map((s) => clean({ vi: s.vi, en: s.en, zh: s.zh })),
        }),
    );
    // partnerCta + createdAt are app/marketing metadata, intentionally not in the
    // content contract — dropped here.
    writeJson('articles.json', out);
    return { count: out.length };
}

// ── grammar modules (from grammar_modules.json) ──────────────────────────────

function buildGrammar() {
    const g = readJson(join(SRC, 'grammar_modules.json'));
    const levels = (g.levels || []).map((lv) =>
        clean({
            id: lv.id,
            label: lv.label,
            description: lv.description,
            modules: (lv.modules || []).map((m) =>
                clean({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    mainPattern: m.main_pattern,
                    faqs: m.faqs,
                    extractedPatterns: m.extracted_patterns,
                    units: (m.units || []).map((u) =>
                        clean({
                            id: u.id,
                            title: u.title,
                            pattern: u.pattern,
                            explanation: u.explanation,
                            note: u.note,
                            difficulty: u.difficulty,
                            tags: u.tags,
                            prerequisites: u.prerequisites,
                            examples: u.examples,
                        }),
                    ),
                }),
            ),
        }),
    );
    const out = clean({ version: g.version, levels });
    writeJson('grammar.json', out);
    const modules = levels.reduce((s, lv) => s + lv.modules.length, 0);
    return { levels: levels.length, modules };
}

// tones (content/tones.json) is now AUTHORITATIVE — hand-maintained, no longer
// generated. src/data/toneContours.js is a thin adapter over it.

// ── kinship (from kinshipData.js) ────────────────────────────────────────────

async function buildKinship() {
    const mod = await import(pathToFileURL(join(SRC, 'kinshipData.js')).href);
    const terms = mod.PRONOUN_MAP || {};
    const out = (mod.FAMILY_MEMBERS || []).map((m) =>
        clean({
            id: 'kin_' + m.id,
            label: clean({ en: m.label, vi: terms[m.relationType] }),
            relationType: m.relationType,
            gender: m.gender,
            generation: m.generation,
            ageOffset: m.ageOffset,
        }),
    );
    writeJson('kinship.json', out);
    return { count: out.length };
}

// ── run ──────────────────────────────────────────────────────────────────────

console.log('Building canonical content bundle → content/');
const curr = buildCurriculum();
console.log('  curriculum.json', JSON.stringify(curr.counts));
const drills = buildDrills();
console.log(`  drills/ (${drills.count} files, ${drills.questions} questions)`);
const dict = buildDictionary();
console.log(`  dictionary.json (${dict.count} entries)`);
const articles = await buildArticles();
console.log(`  articles.json (${articles.count} articles)`);
const grammar = buildGrammar();
console.log(`  grammar.json (${grammar.levels} levels, ${grammar.modules} modules)`);
const kinship = await buildKinship();
console.log(`  kinship.json (${kinship.count} members)`);

const manifest = {
    version: '1.0.0',
    contract: 'docs/CONTENT_SCHEMA.md',
    files: {
        curriculum: { path: 'curriculum.json', ...curr.counts },
        drills: { path: 'drills/', files: drills.count, questions: drills.questions },
        dictionary: { path: 'dictionary.json', entries: dict.count },
        articles: { path: 'articles.json', articles: articles.count },
        grammar: { path: 'grammar.json', levels: grammar.levels, modules: grammar.modules },
        tones: { path: 'tones.json', authoritative: true },
        kinship: { path: 'kinship.json', members: kinship.count },
        exerciseProfiles: { path: 'exercise-profiles.json', authoritative: true },
    },
};
writeJson('index.json', manifest);
console.log('  index.json (manifest)');
console.log('Done. Validate with: npm run validate:content -- content/*.json content/drills/*.json');
