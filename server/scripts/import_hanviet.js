/**
 * Import Hán Việt data from hanviet_unihan.csv into the ZH dictionary.
 * Flips the mapping: Chinese character → Vietnamese reading becomes
 * Vietnamese headword → Chinese character(s) with English glosses.
 *
 * Usage: node server/scripts/import_hanviet.js
 */
import fs from 'fs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'databases', 'vn_zh_dictionary.db');
const CSV_PATH = join(__dirname, '..', '..', '..', 'vnme-data', 'raw', 'vi-zh-data', 'csv_dict', 'hanviet_unihan.csv');

function parseCSV(filepath) {
    const raw = fs.readFileSync(filepath, 'utf8');
    const entries = [];

    // CSV may have quoted fields with commas inside, so parse carefully
    for (const line of raw.split('\n')) {
        if (!line.trim()) continue;

        // Format: id,character|hanviet,html_content
        // First field is the numeric id, second is char|reading, rest is HTML
        const firstComma = line.indexOf(',');
        if (firstComma === -1) continue;

        const afterId = line.slice(firstComma + 1);
        const secondComma = afterId.indexOf(',');
        if (secondComma === -1) continue;

        const charField = afterId.slice(0, secondComma); // e.g. "遣|khiến"
        const htmlContent = afterId.slice(secondComma + 1);

        const pipeIdx = charField.indexOf('|');
        if (pipeIdx === -1) continue;

        const character = charField.slice(0, pipeIdx).trim();
        const hanviet = charField.slice(pipeIdx + 1).trim();

        if (!character || !hanviet) continue;

        // Extract English definition from HTML — text after ① markers, strip tags
        let definition = '';
        const defMatch = htmlContent.match(/①\s*(.+)/);
        if (defMatch) {
            definition = defMatch[1]
                .replace(/<[^>]+>/g, '')  // strip HTML tags
                .replace(/^["'\s]+|["'\s]+$/g, '')  // trim quotes/whitespace
                .trim();
        }

        entries.push({ character, hanviet, definition });
    }

    return entries;
}

function main() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV not found: ${CSV_PATH}`);
        process.exit(1);
    }

    const entries = parseCSV(CSV_PATH);
    console.log(`Parsed ${entries.length} entries from CSV`);

    // Group by Vietnamese headword
    const byWord = new Map();
    for (const e of entries) {
        if (!byWord.has(e.hanviet)) byWord.set(e.hanviet, []);
        byWord.get(e.hanviet).push(e);
    }
    console.log(`${byWord.size} unique Vietnamese headwords`);

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    // Create source
    db.prepare("INSERT OR IGNORE INTO sources (name) VALUES (?)").run('HanViet');
    const sourceId = db.prepare("SELECT id FROM sources WHERE name = 'HanViet'").get().id;

    // Clear old HanViet data (idempotent re-runs)
    const oldExamples = db.prepare(`
        DELETE FROM examples WHERE meaning_id IN (
            SELECT id FROM meanings WHERE source_id = ?
        )
    `).run(sourceId);
    const oldMeanings = db.prepare("DELETE FROM meanings WHERE source_id = ?").run(sourceId);
    console.log(`Cleared ${oldMeanings.changes} old HanViet meanings`);

    const insertWord = db.prepare("INSERT OR IGNORE INTO words (word) VALUES (?)");
    const getWordId = db.prepare("SELECT id FROM words WHERE word = ?");
    const insertMeaning = db.prepare("INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)");

    const transaction = db.transaction(() => {
        let words = 0, meanings = 0;

        for (const [hanviet, chars] of byWord) {
            insertWord.run(hanviet);
            const wordRow = getWordId.get(hanviet);
            if (!wordRow) continue;
            words++;

            for (const entry of chars) {
                const meaningText = entry.definition
                    ? `${entry.character} — ${entry.definition}`
                    : entry.character;
                insertMeaning.run(wordRow.id, sourceId, null, meaningText);
                meanings++;
            }
        }

        return { words, meanings };
    });

    const stats = transaction();
    console.log(`Imported: ${stats.words} words, ${stats.meanings} meanings`);
    console.log(`Source: HanViet (id: ${sourceId})`);

    db.close();
}

main();
