#!/usr/bin/env node
/**
 * Unified Database Builder
 *
 * Combines legacy LESSON_DEFS + curriculum Excel data into a single
 * normalized database that can be:
 * 1. Used by the web app (JSON import)
 * 2. Exported to SQLite for mobile
 * 3. Extended by Claude-generated content
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// ═══ CONFIGURATION ═══
const LEGACY_DB_PATH = join(PROJECT_ROOT, 'src/lib/db.js');
const CURRICULUM_PATH = process.argv[2] || join(PROJECT_ROOT, '../vnme-data-v1.0/vietnamese_curriculum_source.xlsx');
const OUTPUT_PATH = join(PROJECT_ROOT, 'src/data/unified_db.json');

console.log('🔨 Building Unified Database\n');

// ═══ LOAD CURRICULUM FROM EXCEL ═══
let curriculumData = { vocab: new Map(), sentences: new Map(), grammarTags: [], conversations: [] };

if (existsSync(CURRICULUM_PATH)) {
    console.log(`📊 Loading curriculum: ${CURRICULUM_PATH}`);
    const workbook = XLSX.readFile(CURRICULUM_PATH);

    const sheetToJson = (name) => {
        const sheet = workbook.Sheets[name];
        return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
    };

    const vocab = sheetToJson('Vocabulary');
    const sentences = sheetToJson('Sentences');
    const acceptedTrans = sheetToJson('AcceptedTranslations');
    const grammarTags = sheetToJson('GrammarTags');
    const conversations = sheetToJson('Conversations');
    const convLines = sheetToJson('ConversationLines');

    // Build accepted translations lookup
    const transBySentence = new Map();
    acceptedTrans.forEach(t => {
        if (!transBySentence.has(t.sentence_id)) transBySentence.set(t.sentence_id, []);
        transBySentence.get(t.sentence_id).push(t);
    });

    // Build conversation lines lookup
    const linesByConv = new Map();
    convLines.forEach(l => {
        if (!linesByConv.has(l.conversation_id)) linesByConv.set(l.conversation_id, []);
        linesByConv.get(l.conversation_id).push(l);
    });

    // Index vocab by Vietnamese text
    vocab.forEach(v => {
        curriculumData.vocab.set(v.vi_word.toLowerCase().trim(), {
            pos: v.part_of_speech,
            difficulty: v.difficulty,
            frequency: v.frequency_rank,
            dialect: v.regional_variant,
            hasImage: v.needs_image,
            topicTags: v.topic_tags,
        });
    });

    // Index sentences by Vietnamese text
    sentences.forEach(s => {
        const trans = transBySentence.get(s.sentence_id) || [];
        curriculumData.sentences.set(s.vi_sentence.toLowerCase().trim(), {
            grammarTags: s.grammar_tags ? s.grammar_tags.split(',').map(t => t.trim()) : [],
            grammarNote: s.grammar_note,
            tokenCount: s.token_count,
            difficulty: s.difficulty,
            accepted: trans.map(t => t.en_translation),
        });
    });

    // Grammar tags
    curriculumData.grammarTags = grammarTags.map(g => ({
        id: g.tag_id,
        name: g.tag_code || g.tag_id,  // Use tag_code as name
        category: g.category,
        description: g.description,
    }));

    // Conversations
    conversations.forEach(c => {
        const lines = (linesByConv.get(c.conversation_id) || [])
            .sort((a, b) => a.line_order - b.line_order);
        curriculumData.conversations.push({
            id: c.conversation_id,
            lessonId: c.lesson_id,
            title: c.title,
            context: c.context_note,
            lines: lines.map(l => ({
                speaker: l.speaker,
                vi: l.vi_line,
                en: l.en_translation,
            })),
        });
    });

    console.log(`   ${curriculumData.vocab.size} vocab, ${curriculumData.sentences.size} sentences, ${curriculumData.grammarTags.length} grammar tags`);
} else {
    console.log('⚠️  No curriculum Excel found, using metadata.json fallback');
    const metadataPath = join(PROJECT_ROOT, 'src/data/curricula/metadata.json');
    if (existsSync(metadataPath)) {
        const meta = JSON.parse(readFileSync(metadataPath, 'utf8'));
        Object.entries(meta.vocab).forEach(([k, v]) => curriculumData.vocab.set(k, v));
        Object.entries(meta.sentences).forEach(([k, v]) => curriculumData.sentences.set(k, v));
    }
}

// ═══ PARSE LEGACY LESSON_DEFS ═══
console.log(`\n📚 Parsing legacy LESSON_DEFS from db.js`);

const dbContent = readFileSync(LEGACY_DB_PATH, 'utf8');

// Extract LESSON_DEFS using regex (safer than eval)
const lessonDefsMatch = dbContent.match(/const LESSON_DEFS = \[([\s\S]*?)\n\];/);
if (!lessonDefsMatch) {
    console.error('Could not find LESSON_DEFS in db.js');
    process.exit(1);
}

// Parse individual lesson objects
const lessonRegex = /\{\s*id:\s*"([^"]+)"[\s\S]*?(?=\n    \{|\n\];)/g;
const lessons = [];
let match;

// Simplified parsing - extract key fields
const extractField = (text, field) => {
    const regex = new RegExp(`${field}:\\s*(?:"([^"]*)"|(\\d+)|\\[([^\\]]+)\\])`);
    const m = text.match(regex);
    if (m) return m[1] || m[2] || m[3];
    return null;
};

const extractArray = (text, field) => {
    const regex = new RegExp(`${field}:\\s*\\[([^\\]]+)\\]`);
    const m = text.match(regex);
    if (m) {
        return m[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
    }
    return [];
};

const extractObjects = (text, field) => {
    const regex = new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\n        \\]`, 'm');
    const m = text.match(regex);
    if (!m) return [];

    const objects = [];
    const objRegex = /\{\s*id:\s*"([^"]+)",\s*vi:\s*"([^"]+)",\s*en:\s*"([^"]+)"(?:,\s*emoji:\s*"([^"]*)")?/g;
    let objMatch;
    while ((objMatch = objRegex.exec(m[1])) !== null) {
        objects.push({
            id: objMatch[1],
            vi: objMatch[2],
            en: objMatch[3],
            emoji: objMatch[4] || null,
        });
    }
    return objects;
};

// Split into individual lesson blocks
const lessonBlocks = lessonDefsMatch[1].split(/\n    \{/).slice(1).map(b => '    {' + b);

lessonBlocks.forEach(block => {
    const id = extractField(block, 'id');
    if (!id) return;

    lessons.push({
        id,
        unit: extractField(block, 'unit'),
        title: extractField(block, 'title'),
        nodeId: extractField(block, 'nodeId'),
        quizId: extractField(block, 'quizId'),
        quizLabel: extractField(block, 'quizLabel'),
        nodeIndex: parseInt(extractField(block, 'nodeIndex')) || 1,
        difficulty: parseInt(extractField(block, 'difficulty')) || 1,
        cefr: extractField(block, 'cefr'),
        xp: parseInt(extractField(block, 'xp')) || 10,
        topic: extractField(block, 'topic'),
        focus: extractArray(block, 'focus'),
        words: extractObjects(block, 'words'),
        phrases: extractObjects(block, 'phrases'),
        sentences: extractObjects(block, 'sentences'),
    });
});

console.log(`   ${lessons.length} lessons parsed`);

// ═══ EXTRACT UNITS ═══
const unitsMatch = dbContent.match(/const LEGACY_UNITS = \[([\s\S]*?)\n\];/);
const units = [];
if (unitsMatch) {
    const unitRegex = /\{\s*id:\s*"([^"]+)"[^}]*title:\s*"([^"]+)"/g;
    let unitMatch;
    let order = 1;
    while ((unitMatch = unitRegex.exec(unitsMatch[1])) !== null) {
        units.push({
            id: unitMatch[1],
            order: order++,
            title: unitMatch[2].replace(/^Unit \d+ — /, ''),
        });
    }
}
console.log(`   ${units.length} units extracted`);

// ═══ BUILD UNIFIED DATABASE ═══
console.log('\n🔗 Building unified database...');

const unifiedDB = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    stats: {},
    units: [],
    lessons: [],
    vocabulary: [],
    sentences: [],
    grammar_tags: curriculumData.grammarTags,
    conversations: curriculumData.conversations,
};

// Add units
unifiedDB.units = units.map(u => ({
    id: u.id,
    order_index: u.order,
    title: u.title,
}));

// Process lessons and extract vocab/sentences
let vocabIndex = 1;
let sentIndex = 1;

lessons.forEach(lesson => {
    // Add lesson
    unifiedDB.lessons.push({
        id: lesson.id,
        unit_id: lesson.unit,
        order_index: lesson.nodeIndex,
        title: lesson.title,
        topic: lesson.topic,
        focus: lesson.focus,
        difficulty: lesson.difficulty,
        xp_reward: lesson.xp,
        cefr_level: lesson.cefr,
        node_id: lesson.nodeId,
        quiz_id: lesson.quizId,
    });

    // Add vocabulary (words + phrases)
    const allWords = [...(lesson.words || []), ...(lesson.phrases || [])];
    allWords.forEach(word => {
        const meta = curriculumData.vocab.get(word.vi.toLowerCase().trim()) || {};

        unifiedDB.vocabulary.push({
            id: word.id || `vocab_${String(vocabIndex++).padStart(4, '0')}`,
            lesson_id: lesson.id,
            vi_text: word.vi,
            pos: meta.pos || (word.vi.includes(' ') ? 'phrase' : 'word'),
            emoji: word.emoji,
            difficulty: meta.difficulty || lesson.difficulty,
            frequency_rank: meta.frequency,
            dialect: meta.dialect || 'both',
            has_image: meta.hasImage || false,
            translations: [
                { lang: 'en', text: word.en, is_primary: true }
            ],
        });
    });

    // Add sentences
    (lesson.sentences || []).forEach(sent => {
        const meta = curriculumData.sentences.get(sent.vi.toLowerCase().trim()) || {};
        const accepted = meta.accepted || [sent.en];

        unifiedDB.sentences.push({
            id: sent.id || `sent_${String(sentIndex++).padStart(4, '0')}`,
            lesson_id: lesson.id,
            vi_text: sent.vi,
            token_count: meta.tokenCount || sent.vi.split(/\s+/).length,
            difficulty: meta.difficulty || lesson.difficulty,
            grammar_note: meta.grammarNote,
            grammar_tags: meta.grammarTags || [],
            translations: accepted.map((t, i) => ({
                lang: 'en',
                text: t,
                is_primary: i === 0,
            })),
        });
    });
});

// Calculate stats
unifiedDB.stats = {
    units: unifiedDB.units.length,
    lessons: unifiedDB.lessons.length,
    vocabulary: unifiedDB.vocabulary.length,
    sentences: unifiedDB.sentences.length,
    grammar_tags: unifiedDB.grammar_tags.length,
    conversations: unifiedDB.conversations.length,
};

// ═══ WRITE OUTPUT ═══
writeFileSync(OUTPUT_PATH, JSON.stringify(unifiedDB, null, 2));

console.log(`\n✅ Unified database created: ${OUTPUT_PATH}`);
console.log(`\n📊 Stats:`);
console.log(`   Units: ${unifiedDB.stats.units}`);
console.log(`   Lessons: ${unifiedDB.stats.lessons}`);
console.log(`   Vocabulary: ${unifiedDB.stats.vocabulary}`);
console.log(`   Sentences: ${unifiedDB.stats.sentences}`);
console.log(`   Grammar Tags: ${unifiedDB.stats.grammar_tags}`);
console.log(`   Conversations: ${unifiedDB.stats.conversations}`);

console.log(`\n📝 Next steps:`);
console.log(`   1. Import in web app: import db from './data/unified_db.json'`);
console.log(`   2. Export to SQLite: node scripts/export-sqlite.js`);
console.log(`   3. Generate more with Claude: provide schema + ask for JSON output`);
