/**
 * Import generated definitions from JSONL files into SQLite databases.
 *
 * Usage: node server/scripts/import_generated.js [--en] [--zh] [--both]
 */
import fs from 'fs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH_EN = join(__dirname, '..', 'databases', 'vn_en_dictionary.db');
const DB_PATH_ZH = join(__dirname, '..', 'databases', 'vn_zh_dictionary.db');
const EN_JSONL = '/tmp/generated_en_definitions.jsonl';
const ZH_JSONL = '/tmp/generated_zh_definitions.jsonl';

function loadJsonl(filepath) {
    if (!fs.existsSync(filepath)) return [];
    return fs.readFileSync(filepath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => {
            try { return JSON.parse(line); }
            catch { return null; }
        })
        .filter(Boolean);
}

function importEN() {
    const data = loadJsonl(EN_JSONL);
    if (data.length === 0) {
        console.log('No EN data to import.');
        return;
    }

    console.log(`Importing ${data.length} EN entries...`);
    const db = new Database(DB_PATH_EN);
    db.pragma('journal_mode = WAL');

    // Ensure source exists
    db.prepare("INSERT OR IGNORE INTO sources (name) VALUES (?)").run('AI_Generated_EN');
    const sourceId = db.prepare("SELECT id FROM sources WHERE name = 'AI_Generated_EN'").get().id;

    const insertWord = db.prepare("INSERT OR IGNORE INTO words (word) VALUES (?)");
    const getWordId = db.prepare("SELECT id FROM words WHERE word = ?");
    const insertMeaning = db.prepare("INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)");
    const insertExample = db.prepare("INSERT INTO examples (meaning_id, vietnamese_text, english_text) VALUES (?, ?, ?)");

    const transaction = db.transaction((entries) => {
        let words = 0, meanings = 0, examples = 0;

        for (const entry of entries) {
            if (!entry.word || !entry.entries || entry.entries.length === 0) continue;

            insertWord.run(entry.word);
            const wordRow = getWordId.get(entry.word);
            if (!wordRow) continue;
            const wordId = wordRow.id;
            words++;

            for (const e of entry.entries) {
                if (!e.meaning) continue;
                const result = insertMeaning.run(wordId, sourceId, e.pos || null, e.meaning);
                meanings++;

                if (e.example_vi && e.example_en) {
                    insertExample.run(result.lastInsertRowid, e.example_vi, e.example_en);
                    examples++;
                }
            }
        }

        return { words, meanings, examples };
    });

    const stats = transaction(data);
    console.log(`  EN imported: ${stats.words} words, ${stats.meanings} meanings, ${stats.examples} examples`);
    console.log(`  Source: AI_Generated_EN (id: ${sourceId})`);

    db.close();
}

function importZH() {
    const data = loadJsonl(ZH_JSONL);
    if (data.length === 0) {
        console.log('No ZH data to import.');
        return;
    }

    console.log(`Importing ${data.length} ZH entries...`);
    const db = new Database(DB_PATH_ZH);
    db.pragma('journal_mode = WAL');

    // Ensure source exists
    db.prepare("INSERT OR IGNORE INTO sources (name) VALUES (?)").run('AI_Generated_ZH');
    const sourceId = db.prepare("SELECT id FROM sources WHERE name = 'AI_Generated_ZH'").get().id;

    const insertWord = db.prepare("INSERT OR IGNORE INTO words (word) VALUES (?)");
    const getWordId = db.prepare("SELECT id FROM words WHERE word = ?");
    const insertMeaning = db.prepare("INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)");
    const insertExample = db.prepare("INSERT INTO examples (meaning_id, vietnamese_text, english_text) VALUES (?, ?, ?)");

    const transaction = db.transaction((entries) => {
        let words = 0, meanings = 0, examples = 0;

        for (const entry of entries) {
            if (!entry.word || !entry.entries || entry.entries.length === 0) continue;

            insertWord.run(entry.word);
            const wordRow = getWordId.get(entry.word);
            if (!wordRow) continue;
            const wordId = wordRow.id;
            words++;

            for (const e of entry.entries) {
                const meaningText = e.meaning_zh || e.meaning;
                if (!meaningText) continue;

                const result = insertMeaning.run(wordId, sourceId, e.pos || null, meaningText);
                meanings++;

                if (e.example_vi && e.example_zh) {
                    insertExample.run(result.lastInsertRowid, e.example_vi, e.example_zh);
                    examples++;
                }
            }
        }

        return { words, meanings, examples };
    });

    const stats = transaction(data);
    console.log(`  ZH imported: ${stats.words} words, ${stats.meanings} meanings, ${stats.examples} examples`);
    console.log(`  Source: AI_Generated_ZH (id: ${sourceId})`);

    db.close();
}

const ENRICHED_ZH_JSONL = '/tmp/enriched_zh_definitions.jsonl';

function importEnrichedZH() {
    const data = loadJsonl(ENRICHED_ZH_JSONL);
    if (data.length === 0) {
        console.log('No enriched ZH data to import.');
        return;
    }

    // Only import words that actually have more entries than what's in the DB
    console.log(`Loading ${data.length} enriched ZH entries...`);
    const db = new Database(DB_PATH_ZH);
    db.pragma('journal_mode = WAL');

    const sourceId = db.prepare("SELECT id FROM sources WHERE name = 'AI_Generated_ZH'").get().id;

    const getWordId = db.prepare("SELECT id FROM words WHERE word = ?");
    const countMeanings = db.prepare("SELECT COUNT(*) as cnt FROM meanings WHERE word_id = ?");
    const deleteMeanings = db.prepare("DELETE FROM meanings WHERE word_id = ? AND source_id = ?");
    const deleteExamplesForWord = db.prepare(`
        DELETE FROM examples WHERE meaning_id IN (
            SELECT m.id FROM meanings m WHERE m.word_id = ? AND m.source_id = ?
        )
    `);
    const insertMeaning = db.prepare("INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)");
    const insertExample = db.prepare("INSERT INTO examples (meaning_id, vietnamese_text, english_text) VALUES (?, ?, ?)");

    const transaction = db.transaction((entries) => {
        let replaced = 0, skipped = 0, meanings = 0, examples = 0;

        for (const entry of entries) {
            if (!entry.word || !entry.entries || entry.entries.length === 0) continue;

            const wordRow = getWordId.get(entry.word);
            if (!wordRow) continue;
            const wordId = wordRow.id;

            const existing = countMeanings.get(wordId).cnt;

            // Only replace if enriched data has MORE entries
            if (entry.entries.length <= existing) {
                skipped++;
                continue;
            }

            // Delete old meanings + examples for this word, then insert new ones
            deleteExamplesForWord.run(wordId, sourceId);
            deleteMeanings.run(wordId, sourceId);
            replaced++;

            for (const e of entry.entries) {
                const meaningText = e.meaning_zh || e.meaning;
                if (!meaningText) continue;

                const result = insertMeaning.run(wordId, sourceId, e.pos || null, meaningText);
                meanings++;

                if (e.example_vi && e.example_zh) {
                    insertExample.run(result.lastInsertRowid, e.example_vi, e.example_zh);
                    examples++;
                }
            }
        }

        return { replaced, skipped, meanings, examples };
    });

    const stats = transaction(data);
    console.log(`  Enriched ZH: ${stats.replaced} words replaced, ${stats.skipped} skipped (enriched had fewer/equal entries)`);
    console.log(`  New meanings: ${stats.meanings}, examples: ${stats.examples}`);

    db.close();
}

// Parse args
const args = process.argv.slice(2);
const doEN = args.includes('--en') || args.includes('--both') || args.length === 0;
const doZH = args.includes('--zh') || args.includes('--both') || args.length === 0;
const doEnrich = args.includes('--enrich-zh');

if (doEN) importEN();
if (doZH) importZH();
if (doEnrich) importEnrichedZH();

console.log('\nDone!');
