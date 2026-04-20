#!/usr/bin/env node
/**
 * SQLite Export Script
 *
 * Converts unified_db.json to SQLite database for mobile app integration.
 * Requires: npm install better-sqlite3
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const DB_JSON_PATH = join(PROJECT_ROOT, 'src/data/unified_db.json');
const SQLITE_PATH = join(PROJECT_ROOT, 'dist/vietnamy.sqlite');

// Check for better-sqlite3
let Database;
try {
    const sqlite = await import('better-sqlite3');
    Database = sqlite.default;
} catch {
    console.log('📦 SQLite export requires better-sqlite3');
    console.log('   Run: npm install better-sqlite3');
    console.log('\n📄 For now, here\'s the SQL schema your dev team can use:\n');

    // Output SQL schema
    const schema = `
-- Vietnamy Database Schema
-- Generated: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    focus TEXT,  -- JSON array
    difficulty INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 10,
    cefr_level TEXT,
    node_id TEXT,
    quiz_id TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS vocabulary (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    vi_text TEXT NOT NULL,
    pos TEXT,
    emoji TEXT,
    difficulty INTEGER DEFAULT 1,
    frequency_rank INTEGER,
    dialect TEXT DEFAULT 'both',
    has_image INTEGER DEFAULT 0,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,  -- 'vocab' or 'sentence'
    lang TEXT NOT NULL,
    text TEXT NOT NULL,
    is_primary INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sentences (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    vi_text TEXT NOT NULL,
    token_count INTEGER,
    difficulty INTEGER DEFAULT 1,
    grammar_note TEXT,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

CREATE TABLE IF NOT EXISTS grammar_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS sentence_grammar_tags (
    sentence_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (sentence_id, tag_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    lesson_id TEXT,
    title TEXT,
    context TEXT
);

CREATE TABLE IF NOT EXISTS conversation_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    speaker TEXT,
    vi_text TEXT NOT NULL,
    en_text TEXT
);

-- Indexes for common queries
CREATE INDEX idx_vocab_lesson ON vocabulary(lesson_id);
CREATE INDEX idx_sentences_lesson ON sentences(lesson_id);
CREATE INDEX idx_translations_item ON translations(item_id, item_type);
CREATE INDEX idx_lessons_unit ON lessons(unit_id);
`;

    console.log(schema);

    // Also save schema to file
    const schemaPath = join(PROJECT_ROOT, 'dist/schema.sql');
    const { mkdirSync, writeFileSync } = await import('fs');
    mkdirSync(join(PROJECT_ROOT, 'dist'), { recursive: true });
    writeFileSync(schemaPath, schema);
    console.log(`\n✅ Schema saved to: ${schemaPath}`);

    // Output sample INSERT statements
    if (existsSync(DB_JSON_PATH)) {
        const db = JSON.parse(readFileSync(DB_JSON_PATH, 'utf8'));
        const insertsPath = join(PROJECT_ROOT, 'dist/data.sql');

        let inserts = `-- Data inserts for Vietnamy\n-- Generated: ${new Date().toISOString()}\n\n`;

        // Units
        inserts += '-- Units\n';
        db.units.forEach(u => {
            inserts += `INSERT INTO units (id, order_index, title) VALUES ('${u.id}', ${u.order_index}, '${u.title.replace(/'/g, "''")}');\n`;
        });

        // Lessons
        inserts += '\n-- Lessons\n';
        db.lessons.forEach(l => {
            inserts += `INSERT INTO lessons (id, unit_id, order_index, title, topic, difficulty, xp_reward) VALUES ('${l.id}', '${l.unit_id}', ${l.order_index}, '${l.title.replace(/'/g, "''")}', '${l.topic || ''}', ${l.difficulty}, ${l.xp_reward});\n`;
        });

        // Sample vocab (first 10)
        inserts += '\n-- Vocabulary (sample)\n';
        db.vocabulary.slice(0, 10).forEach(v => {
            inserts += `INSERT INTO vocabulary (id, lesson_id, vi_text, pos, emoji, difficulty) VALUES ('${v.id}', '${v.lesson_id}', '${v.vi_text.replace(/'/g, "''")}', '${v.pos || ''}', '${v.emoji || ''}', ${v.difficulty});\n`;
        });

        writeFileSync(insertsPath, inserts);
        console.log(`✅ Sample data saved to: ${insertsPath}`);
    }

    process.exit(0);
}

// If better-sqlite3 is available, create actual SQLite database
console.log('🗄️  Creating SQLite database...');

const db = new Database(SQLITE_PATH);
const data = JSON.parse(readFileSync(DB_JSON_PATH, 'utf8'));

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        order_index INTEGER NOT NULL,
        title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        unit_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        title TEXT NOT NULL,
        topic TEXT,
        focus TEXT,
        difficulty INTEGER DEFAULT 1,
        xp_reward INTEGER DEFAULT 10,
        cefr_level TEXT,
        node_id TEXT,
        quiz_id TEXT
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        vi_text TEXT NOT NULL,
        pos TEXT,
        emoji TEXT,
        difficulty INTEGER DEFAULT 1,
        frequency_rank INTEGER,
        dialect TEXT DEFAULT 'both',
        has_image INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        lang TEXT NOT NULL,
        text TEXT NOT NULL,
        is_primary INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sentences (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        vi_text TEXT NOT NULL,
        token_count INTEGER,
        difficulty INTEGER DEFAULT 1,
        grammar_note TEXT
    );

    CREATE TABLE IF NOT EXISTS grammar_tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS sentence_grammar_tags (
        sentence_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (sentence_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        lesson_id TEXT,
        title TEXT,
        context TEXT
    );

    CREATE TABLE IF NOT EXISTS conversation_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        speaker TEXT,
        vi_text TEXT NOT NULL,
        en_text TEXT
    );
`);

// Insert data
const insertUnit = db.prepare('INSERT OR REPLACE INTO units (id, order_index, title) VALUES (?, ?, ?)');
const insertLesson = db.prepare('INSERT OR REPLACE INTO lessons (id, unit_id, order_index, title, topic, focus, difficulty, xp_reward, cefr_level, node_id, quiz_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertVocab = db.prepare('INSERT OR REPLACE INTO vocabulary (id, lesson_id, vi_text, pos, emoji, difficulty, frequency_rank, dialect, has_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertTrans = db.prepare('INSERT INTO translations (item_id, item_type, lang, text, is_primary) VALUES (?, ?, ?, ?, ?)');
const insertSentence = db.prepare('INSERT OR REPLACE INTO sentences (id, lesson_id, vi_text, token_count, difficulty, grammar_note) VALUES (?, ?, ?, ?, ?, ?)');
const insertTag = db.prepare('INSERT OR REPLACE INTO grammar_tags (id, name, category, description) VALUES (?, ?, ?, ?)');
const insertSentenceTag = db.prepare('INSERT OR REPLACE INTO sentence_grammar_tags (sentence_id, tag_id) VALUES (?, ?)');
const insertConv = db.prepare('INSERT OR REPLACE INTO conversations (id, lesson_id, title, context) VALUES (?, ?, ?, ?)');
const insertLine = db.prepare('INSERT INTO conversation_lines (conversation_id, order_index, speaker, vi_text, en_text) VALUES (?, ?, ?, ?, ?)');

db.transaction(() => {
    data.units.forEach(u => insertUnit.run(u.id, u.order_index, u.title));
    data.lessons.forEach(l => insertLesson.run(l.id, l.unit_id, l.order_index, l.title, l.topic, JSON.stringify(l.focus), l.difficulty, l.xp_reward, l.cefr_level, l.node_id, l.quiz_id));
    data.vocabulary.forEach(v => {
        insertVocab.run(v.id, v.lesson_id, v.vi_text, v.pos, v.emoji, v.difficulty, v.frequency_rank, v.dialect, v.has_image ? 1 : 0);
        v.translations.forEach(t => insertTrans.run(v.id, 'vocab', t.lang, t.text, t.is_primary ? 1 : 0));
    });
    data.sentences.forEach(s => {
        insertSentence.run(s.id, s.lesson_id, s.vi_text, s.token_count, s.difficulty, s.grammar_note);
        s.translations.forEach(t => insertTrans.run(s.id, 'sentence', t.lang, t.text, t.is_primary ? 1 : 0));
        (s.grammar_tags || []).forEach(tag => insertSentenceTag.run(s.id, tag));
    });
    data.grammar_tags.forEach(g => insertTag.run(g.id, g.name, g.category, g.description));
    data.conversations.forEach(c => {
        insertConv.run(c.id, c.lessonId, c.title, c.context);
        (c.lines || []).forEach((l, i) => insertLine.run(c.id, i + 1, l.speaker, l.vi, l.en));
    });
})();

db.close();

const { statSync } = await import('fs');
console.log(`✅ SQLite database created: ${SQLITE_PATH}`);
console.log(`   Size: ${(statSync(SQLITE_PATH).size / 1024).toFixed(1)} KB`);
