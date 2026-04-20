#!/usr/bin/env node
/**
 * Curriculum Converter
 *
 * Converts Excel curriculum workbook → JSON format for vnme-app
 *
 * Usage:
 *   node scripts/convert-curriculum.js --input path/to/curriculum.xlsx --mode explore_vietnam
 *
 * Output: src/data/curricula/{mode}.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// We'll use xlsx library for reading Excel
// Install: npm install xlsx
import XLSX from 'xlsx';

// Parse CLI args
const args = process.argv.slice(2);
const inputIdx = args.indexOf('--input');
const modeIdx = args.indexOf('--mode');

if (inputIdx === -1 || !args[inputIdx + 1]) {
    console.error('Usage: node convert-curriculum.js --input <xlsx-path> [--mode <mode-id>]');
    process.exit(1);
}

const inputPath = args[inputIdx + 1];
const modeId = modeIdx !== -1 && args[modeIdx + 1] ? args[modeIdx + 1] : 'explore_vietnam';

console.log(`Converting: ${inputPath}`);
console.log(`Mode: ${modeId}`);

// Read workbook
const workbook = XLSX.readFile(inputPath);

function sheetToJson(sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        console.warn(`Sheet "${sheetName}" not found`);
        return [];
    }
    return XLSX.utils.sheet_to_json(sheet);
}

// Load all sheets
const courses = sheetToJson('Courses');
const units = sheetToJson('Units');
const lessons = sheetToJson('Lessons');
const grammarTags = sheetToJson('GrammarTags');
const vocabulary = sheetToJson('Vocabulary');
const sentences = sheetToJson('Sentences');
const acceptedTranslations = sheetToJson('AcceptedTranslations');
const conversations = sheetToJson('Conversations');
const conversationLines = sheetToJson('ConversationLines');
const lessonTargets = sheetToJson('LessonTargets');

console.log(`Loaded: ${units.length} units, ${lessons.length} lessons, ${vocabulary.length} vocab, ${sentences.length} sentences`);

// Build lookup maps
const unitMap = new Map(units.map(u => [u.unit_id, u]));
const lessonMap = new Map(lessons.map(l => [l.lesson_id, l]));
const grammarTagMap = new Map(grammarTags.map(g => [g.tag_id, g]));

// Group vocab by lesson
const vocabByLesson = new Map();
vocabulary.forEach(v => {
    if (!vocabByLesson.has(v.lesson_id)) vocabByLesson.set(v.lesson_id, []);
    vocabByLesson.get(v.lesson_id).push(v);
});

// Group sentences by lesson
const sentencesByLesson = new Map();
sentences.forEach(s => {
    if (!sentencesByLesson.has(s.lesson_id)) sentencesByLesson.set(s.lesson_id, []);
    sentencesByLesson.get(s.lesson_id).push(s);
});

// Group accepted translations by sentence
const translationsBySentence = new Map();
acceptedTranslations.forEach(t => {
    if (!translationsBySentence.has(t.sentence_id)) translationsBySentence.set(t.sentence_id, []);
    translationsBySentence.get(t.sentence_id).push(t);
});

// Group conversations by lesson
const convByLesson = new Map();
conversations.forEach(c => {
    if (!convByLesson.has(c.lesson_id)) convByLesson.set(c.lesson_id, []);
    convByLesson.get(c.lesson_id).push(c);
});

// Group conversation lines by conversation
const linesByConv = new Map();
conversationLines.forEach(l => {
    if (!linesByConv.has(l.conversation_id)) linesByConv.set(l.conversation_id, []);
    linesByConv.get(l.conversation_id).push(l);
});

// Emoji map for common words (fallback when needs_image but no actual image)
const EMOJI_MAP = {
    // Greetings
    'chào': '👋', 'xin chào': '👋', 'tạm biệt': '👋',
    'cảm ơn': '🙏', 'xin lỗi': '🙇',
    // Numbers
    'một': '1️⃣', 'hai': '2️⃣', 'ba': '3️⃣', 'bốn': '4️⃣', 'năm': '5️⃣',
    'sáu': '6️⃣', 'bảy': '7️⃣', 'tám': '8️⃣', 'chín': '9️⃣', 'mười': '🔟',
    'không': '0️⃣', 'trăm': '💯', 'nghìn': '🔢', 'ngàn': '🔢', 'triệu': '💎',
    // Food & Drinks
    'phở': '🍜', 'cơm': '🍚', 'bánh mì': '🥖', 'nước': '💧', 'cà phê': '☕',
    'trà': '🍵', 'bia': '🍺', 'rượu': '🍷', 'thịt': '🥩', 'cá': '🐟',
    'gà': '🍗', 'heo': '🐷', 'bò': '🐄', 'tôm': '🦐', 'cua': '🦀',
    // Fruits
    'trái cây': '🍎', 'cam': '🍊', 'xoài': '🥭', 'dừa': '🥥', 'dưa hấu': '🍉',
    'chuối': '🍌', 'nho': '🍇', 'táo': '🍎', 'dâu': '🍓',
    // Vegetables
    'rau': '🥬', 'cà chua': '🍅', 'khoai': '🥔',
    // Colors
    'màu': '🎨', 'đỏ': '🔴', 'xanh': '🟢', 'trắng': '⚪', 'đen': '⚫',
    'vàng': '🟡', 'hồng': '🩷', 'tím': '🟣', 'cam': '🟠',
    // Transport
    'xe': '🚗', 'xe máy': '🏍️', 'xe ôm': '🏍️', 'taxi': '🚕', 'xe buýt': '🚌',
    'máy bay': '✈️', 'tàu': '🚢', 'xe đạp': '🚲',
    // Places
    'nhà': '🏠', 'khách sạn': '🏨', 'nhà hàng': '🍽️', 'chợ': '🏪',
    'bệnh viện': '🏥', 'trường': '🏫', 'ngân hàng': '🏦', 'sân bay': '✈️',
    // Family
    'gia đình': '👨‍👩‍👧‍👦', 'bố': '👨', 'mẹ': '👩', 'con': '👶',
    'anh': '👦', 'chị': '👧', 'em': '🧒', 'ông': '👴', 'bà': '👵',
    // Body
    'đầu': '🗣️', 'mắt': '👁️', 'mũi': '👃', 'miệng': '👄', 'tai': '👂', 'tay': '✋', 'chân': '🦶',
    // Time
    'giờ': '🕐', 'phút': '⏱️', 'ngày': '📅', 'tuần': '📆', 'tháng': '🗓️', 'năm': '📅',
    // Weather
    'trời': '🌤️', 'mưa': '🌧️', 'nắng': '☀️', 'gió': '💨', 'lạnh': '🥶', 'nóng': '🥵',
    // Actions
    'ăn': '🍽️', 'uống': '🥤', 'ngủ': '😴', 'đi': '🚶', 'chạy': '🏃',
    'nói': '💬', 'nghe': '👂', 'xem': '👀', 'đọc': '📖', 'viết': '✍️',
    'mua': '🛒', 'bán': '🏪', 'giúp': '🆘', 'gọi': '📞',
    // Misc
    'tiền': '💵', 'điện thoại': '📱', 'wifi': '📶', 'chìa khóa': '🔑',
    'phòng': '🚪', 'giường': '🛏️', 'nhà vệ sinh': '🚽',
    'vâng': '✅', 'dạ': '✅', 'không': '❌', 'có': '✅',
};

function getEmoji(viWord) {
    const lower = viWord.toLowerCase().trim();
    return EMOJI_MAP[lower] || null;
}

// Map topic tags to learner mode topics
const TOPIC_TAG_MAP = {
    'VT001': 'greetings',      // Greetings
    'VT002': 'basics',         // Basic phrases
    'VT003': 'basics',         // Numbers
    'VT004': 'basics',         // Pronouns
    'VT005': 'restaurant',     // Food
    'VT006': 'restaurant',     // Drinks
    'VT007': 'shopping',       // Shopping
    'VT008': 'money',          // Money
    'VT009': 'transport',      // Transport
    'VT010': 'directions',     // Directions
    'VT011': 'hotel',          // Accommodation
    'VT012': 'basics',         // Time
    'VT013': 'basics',         // Weather
    'VT014': 'basics',         // Family (heritage mode would override)
    'VT015': 'basics',         // Body parts
    'VT016': 'emergency',      // Emergency
};

function mapTopicTag(topicTags) {
    if (!topicTags) return 'basics';
    const tag = topicTags.split(',')[0].trim();
    return TOPIC_TAG_MAP[tag] || 'basics';
}

// Convert CEFR string to difficulty number
function cefrToDifficulty(lesson) {
    const order = lesson.lesson_order || 1;
    if (order <= 4) return 1;
    if (order <= 8) return 2;
    if (order <= 16) return 3;
    if (order <= 24) return 4;
    return 5;
}

// Generate node IDs using Excel lesson_id for uniqueness
function generateNodeId(lesson, unit) {
    const unitOrder = unit.unit_order || 1;
    const lessonNum = lesson.lesson_id.replace('L', '');
    return `u${unitOrder}_L${lessonNum.padStart(3, '0')}`;
}

function generateQuizId(lesson, unit) {
    const unitOrder = unit.unit_order || 1;
    const lessonNum = lesson.lesson_id.replace('L', '');
    return `u${unitOrder}_Q${lessonNum.padStart(3, '0')}`;
}

// Map curriculum units to legacy unit IDs for compatibility with existing roadmap
const LEGACY_UNIT_MAP = {
    'U001': 'phase_1_first_words',    // Introduce Yourself → First Words
    'U002': 'phase_2_polite',          // Numbers & Well-being → Polite Survival
    'U003': 'phase_3_cafe',            // Restaurant → Ordering & Café
    'U004': 'phase_4_food',            // Family & People → Food & Prices
    'U005': 'phase_5_market',          // Time & Dates → Market Life
    'U006': 'phase_6_numbers',         // Shopping → Numbers Advanced
    'U007': 'phase_7_transport',       // Transportation → Getting Around
    'U008': 'phase_8_daily',           // Hotel → Daily Life
    'U009': 'phase_9_social',          // Weather & Daily Life → Social Life
};

// Build LESSON_DEFS array
const LESSON_DEFS = [];
let globalWordIndex = 1;
let globalSentenceIndex = 1;

for (const lesson of lessons) {
    const unit = unitMap.get(lesson.unit_id);
    if (!unit) {
        console.warn(`Unit ${lesson.unit_id} not found for lesson ${lesson.lesson_id}`);
        continue;
    }

    const lessonVocab = vocabByLesson.get(lesson.lesson_id) || [];
    const lessonSentences = sentencesByLesson.get(lesson.lesson_id) || [];
    const lessonConvs = convByLesson.get(lesson.lesson_id) || [];

    // Build words array
    const words = lessonVocab.map(v => {
        const word = {
            id: `it_w_${String(globalWordIndex++).padStart(4, '0')}`,
            vi: v.vi_word,
            en: v.en_translations,
        };

        // Add emoji if available
        const emoji = getEmoji(v.vi_word);
        if (emoji) word.emoji = emoji;

        // Add metadata
        if (v.part_of_speech) word.pos = v.part_of_speech;
        if (v.difficulty) word.difficulty = v.difficulty;
        if (v.frequency_rank) word.frequency = v.frequency_rank;
        if (v.regional_variant) word.dialect = v.regional_variant.toLowerCase().includes('south') ? 'south' : 'north';
        if (v.needs_image) word.hasImage = true;

        return word;
    });

    // Build sentences array with accepted translations
    const sentencesArr = lessonSentences.map(s => {
        const translations = translationsBySentence.get(s.sentence_id) || [];
        const primary = translations.find(t => t.is_primary) || translations[0];
        const accepted = translations.map(t => t.en_translation);

        const sentence = {
            id: `it_s_${String(globalSentenceIndex++).padStart(4, '0')}`,
            vi: s.vi_sentence,
            en: primary ? primary.en_translation : '',
        };

        // Multiple accepted translations
        if (accepted.length > 1) {
            sentence.accepted = accepted;
        }

        // Grammar metadata
        if (s.grammar_tags) {
            sentence.tags = s.grammar_tags.split(',').map(t => t.trim());
        }
        if (s.grammar_note) sentence.note = s.grammar_note;
        if (s.token_count) sentence.tokens = s.token_count;
        if (s.difficulty) sentence.difficulty = s.difficulty;

        return sentence;
    });

    // Build conversations array
    const conversationsArr = lessonConvs.map(c => {
        const lines = (linesByConv.get(c.conversation_id) || [])
            .sort((a, b) => a.line_order - b.line_order);

        return {
            id: c.conversation_id,
            title: c.title || '',
            context: c.context_note || '',
            lines: lines.map(l => ({
                speaker: l.speaker,
                vi: l.vi_line,
                en: l.en_translation || '',
            })),
        };
    });

    // Determine topic from vocab
    const topicTag = lessonVocab[0]?.topic_tags;
    const topic = mapTopicTag(topicTag);

    // Use legacy unit ID for compatibility with existing roadmap nodes
    const legacyUnitId = LEGACY_UNIT_MAP[lesson.unit_id] || `unit_${unit.unit_order}_${unit.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    // Use Excel lesson_id (L001 -> lesson_001) for globally unique IDs
    const lessonNum = lesson.lesson_id.replace('L', '');

    // Build lesson definition
    const lessonDef = {
        id: `lesson_${lessonNum.padStart(3, '0')}`,
        unit: legacyUnitId,
        title: lesson.title,
        nodeId: generateNodeId(lesson, unit),
        quizId: generateQuizId(lesson, unit),
        quizLabel: `${lesson.title} Quiz`,
        nodeIndex: ((lesson.lesson_order - 1) % 4) * 3 + 1, // 1, 4, 7, 10 pattern
        difficulty: cefrToDifficulty(lesson),
        cefr: 'A1', // Could be extracted if in source
        xp: 8 + Math.floor(cefrToDifficulty(lesson) * 2),
        topic,
        focus: [topic],
        words,
        sentences: sentencesArr,
    };

    // Add conversations if present
    if (conversationsArr.length > 0) {
        lessonDef.conversations = conversationsArr;
    }

    // Add lesson target summary if available
    const targets = lessonTargets.filter(t => t.lesson_id === lesson.lesson_id);
    if (targets.length > 0) {
        lessonDef.targets = targets.map(t => t.target_text);
    }

    LESSON_DEFS.push(lessonDef);
}

// Build units array
const UNITS = units.map(u => ({
    id: `unit_${u.unit_order}_${u.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    order: u.unit_order,
    title: u.title,
    description: u.description || '',
}));

// Build grammar tag reference
const GRAMMAR_TAGS = grammarTags.map(g => ({
    id: g.tag_id,
    name: g.tag_name,
    category: g.category,
    description: g.description || '',
    examples: g.example_sentences || '',
}));

// Output structure
const output = {
    meta: {
        mode: modeId,
        version: '1.0.0',
        generated: new Date().toISOString(),
        source: inputPath.split('/').pop(),
        stats: {
            units: UNITS.length,
            lessons: LESSON_DEFS.length,
            vocabulary: vocabulary.length,
            sentences: sentences.length,
            conversations: conversations.length,
            grammarTags: grammarTags.length,
        },
    },
    units: UNITS,
    lessons: LESSON_DEFS,
    grammarTags: GRAMMAR_TAGS,
};

// Write output
const outputDir = join(PROJECT_ROOT, 'src', 'data', 'curricula');
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

const outputPath = join(outputDir, `${modeId}.json`);
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Output written to: ${outputPath}`);
console.log(`   ${LESSON_DEFS.length} lessons, ${vocabulary.length} vocab, ${sentences.length} sentences`);

// Also output a summary
console.log('\n📊 Summary by unit:');
const byUnit = new Map();
LESSON_DEFS.forEach(l => {
    if (!byUnit.has(l.unit)) byUnit.set(l.unit, { lessons: 0, words: 0, sentences: 0 });
    const u = byUnit.get(l.unit);
    u.lessons++;
    u.words += l.words.length;
    u.sentences += l.sentences.length;
});
byUnit.forEach((stats, unit) => {
    console.log(`   ${unit}: ${stats.lessons} lessons, ${stats.words} words, ${stats.sentences} sentences`);
});
