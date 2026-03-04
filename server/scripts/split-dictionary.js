/**
 * Split vn_en_dictionary.db into two databases:
 *   - vn_en_dictionary_high.db  (top 40K most important words)
 *   - vn_en_dictionary_low.db   (remaining ~407K words)
 *
 * Priority ranking:
 *   1. Words with subt_freq data, ordered by frequency (highest first)
 *   2. Words without freq data, ordered by number of distinct sources (most first)
 *
 * Usage: node server/scripts/split-dictionary.js
 */

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { unlinkSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', 'databases');

const SRC_PATH = join(DB_DIR, 'vn_en_dictionary.db');
const HIGH_PATH = join(DB_DIR, 'vn_en_dictionary_high.db');
const LOW_PATH = join(DB_DIR, 'vn_en_dictionary_low.db');

const TOP_N = 40_000;

// ---------------------------------------------------------------------------
// 1. Open source DB and determine the top-N word IDs
// ---------------------------------------------------------------------------
const src = new Database(SRC_PATH, { readonly: true });

console.log('Ranking words...');

// Tier 1: words with frequency data, ordered by subt_freq DESC
const freqWords = src.prepare(`
    SELECT wm.word_id
    FROM word_metrics wm
    WHERE wm.subt_freq IS NOT NULL
    ORDER BY wm.subt_freq DESC
`).all().map(r => r.word_id);

console.log(`  Words with frequency data: ${freqWords.length}`);

// Tier 2: words WITHOUT frequency data, ordered by source count DESC
const noFreqWords = src.prepare(`
    SELECT w.id as word_id, COUNT(DISTINCT m.source_id) as src_count
    FROM words w
    JOIN meanings m ON w.id = m.word_id
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE wm.subt_freq IS NULL
    GROUP BY w.id
    ORDER BY src_count DESC, w.word ASC
`).all().map(r => r.word_id);

console.log(`  Words without frequency data: ${noFreqWords.length}`);

// Combine: take top N
const allRanked = [...freqWords, ...noFreqWords];
const highSet = new Set(allRanked.slice(0, TOP_N));
const lowSet = new Set(allRanked.slice(TOP_N));

// Words with no meanings at all (shouldn't exist but just in case)
const allWordIds = src.prepare('SELECT id FROM words').all().map(r => r.id);
for (const id of allWordIds) {
    if (!highSet.has(id) && !lowSet.has(id)) {
        lowSet.add(id);
    }
}

console.log(`  High-priority: ${highSet.size} words`);
console.log(`  Low-priority:  ${lowSet.size} words`);

// ---------------------------------------------------------------------------
// 2. Read schema from source DB
// ---------------------------------------------------------------------------
const schema = src.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type IN ('table', 'index') AND sql IS NOT NULL
    ORDER BY type DESC, name
`).all().map(r => r.sql);

// ---------------------------------------------------------------------------
// 3. Create target DBs and populate
// ---------------------------------------------------------------------------
function createAndPopulate(destPath, wordIdSet, label) {
    if (existsSync(destPath)) unlinkSync(destPath);
    const db = new Database(destPath);

    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = OFF');

    // Create schema
    for (const sql of schema) {
        try { db.exec(sql); } catch (_) { /* index may reference missing table */ }
    }

    // Copy sources table (all sources needed for foreign keys)
    const sources = src.prepare('SELECT * FROM sources').all();
    const insertSource = db.prepare('INSERT OR IGNORE INTO sources VALUES (' + '?,'.repeat(sources.length > 0 ? Object.keys(sources[0]).length : 0).slice(0, -1) + ')');
    if (sources.length > 0) {
        const cols = Object.keys(sources[0]);
        const placeholders = cols.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT OR IGNORE INTO sources (${cols.join(',')}) VALUES (${placeholders})`);
        const tx = db.transaction(() => {
            for (const row of sources) stmt.run(...cols.map(c => row[c]));
        });
        tx();
    }

    // Copy words
    console.log(`  [${label}] Copying words...`);
    const allWords = src.prepare('SELECT * FROM words').all();
    if (allWords.length > 0) {
        const cols = Object.keys(allWords[0]);
        const placeholders = cols.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT INTO words (${cols.join(',')}) VALUES (${placeholders})`);
        const tx = db.transaction(() => {
            let count = 0;
            for (const row of allWords) {
                if (wordIdSet.has(row.id)) {
                    stmt.run(...cols.map(c => row[c]));
                    count++;
                }
            }
            console.log(`    Inserted ${count} words`);
        });
        tx();
    }

    // Copy meanings
    console.log(`  [${label}] Copying meanings...`);
    const allMeanings = src.prepare('SELECT * FROM meanings').all();
    if (allMeanings.length > 0) {
        const cols = Object.keys(allMeanings[0]);
        const placeholders = cols.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT INTO meanings (${cols.join(',')}) VALUES (${placeholders})`);
        const meaningIds = new Set();
        const tx = db.transaction(() => {
            let count = 0;
            for (const row of allMeanings) {
                if (wordIdSet.has(row.word_id)) {
                    stmt.run(...cols.map(c => row[c]));
                    meaningIds.add(row.id);
                    count++;
                }
            }
            console.log(`    Inserted ${count} meanings`);
        });
        tx();
        return { db, meaningIds };
    }
    return { db, meaningIds: new Set() };
}

console.log('\nCreating high-priority DB...');
const { db: highDb, meaningIds: highMeaningIds } = createAndPopulate(HIGH_PATH, highSet, 'HIGH');

console.log('\nCreating low-priority DB...');
const { db: lowDb, meaningIds: lowMeaningIds } = createAndPopulate(LOW_PATH, lowSet, 'LOW');

// ---------------------------------------------------------------------------
// 4. Copy examples (linked to meanings)
// ---------------------------------------------------------------------------
function copyExamples(db, meaningIds, label) {
    console.log(`  [${label}] Copying examples...`);
    let hasExamples = false;
    try {
        src.prepare('SELECT 1 FROM examples LIMIT 1').get();
        hasExamples = true;
    } catch (_) {}

    if (!hasExamples) {
        console.log(`    No examples table in source`);
        return;
    }

    const allExamples = src.prepare('SELECT * FROM examples').all();
    if (allExamples.length > 0) {
        const cols = Object.keys(allExamples[0]);
        const placeholders = cols.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT INTO examples (${cols.join(',')}) VALUES (${placeholders})`);
        const tx = db.transaction(() => {
            let count = 0;
            for (const row of allExamples) {
                if (meaningIds.has(row.meaning_id)) {
                    stmt.run(...cols.map(c => row[c]));
                    count++;
                }
            }
            console.log(`    Inserted ${count} examples`);
        });
        tx();
    }
}

copyExamples(highDb, highMeaningIds, 'HIGH');
copyExamples(lowDb, lowMeaningIds, 'LOW');

// ---------------------------------------------------------------------------
// 5. Copy word_metrics and pronunciations
// ---------------------------------------------------------------------------
function copyMetricsAndPronunciations(db, wordIdSet, label) {
    // word_metrics
    console.log(`  [${label}] Copying word_metrics...`);
    let hasMetrics = false;
    try { src.prepare('SELECT 1 FROM word_metrics LIMIT 1').get(); hasMetrics = true; } catch (_) {}
    if (hasMetrics) {
        const all = src.prepare('SELECT * FROM word_metrics').all();
        if (all.length > 0) {
            const cols = Object.keys(all[0]);
            const placeholders = cols.map(() => '?').join(',');
            const stmt = db.prepare(`INSERT INTO word_metrics (${cols.join(',')}) VALUES (${placeholders})`);
            const tx = db.transaction(() => {
                let count = 0;
                for (const row of all) {
                    if (wordIdSet.has(row.word_id)) {
                        stmt.run(...cols.map(c => row[c]));
                        count++;
                    }
                }
                console.log(`    Inserted ${count} word_metrics`);
            });
            tx();
        }
    }

    // pronunciations
    console.log(`  [${label}] Copying pronunciations...`);
    let hasPron = false;
    try { src.prepare('SELECT 1 FROM pronunciations LIMIT 1').get(); hasPron = true; } catch (_) {}
    if (hasPron) {
        const all = src.prepare('SELECT * FROM pronunciations').all();
        if (all.length > 0) {
            const cols = Object.keys(all[0]);
            const placeholders = cols.map(() => '?').join(',');
            const stmt = db.prepare(`INSERT INTO pronunciations (${cols.join(',')}) VALUES (${placeholders})`);
            const tx = db.transaction(() => {
                let count = 0;
                for (const row of all) {
                    if (wordIdSet.has(row.word_id)) {
                        stmt.run(...cols.map(c => row[c]));
                        count++;
                    }
                }
                console.log(`    Inserted ${count} pronunciations`);
            });
            tx();
        }
    }
}

copyMetricsAndPronunciations(highDb, highSet, 'HIGH');
copyMetricsAndPronunciations(lowDb, lowSet, 'LOW');

// ---------------------------------------------------------------------------
// 6. Finalize
// ---------------------------------------------------------------------------
highDb.pragma('journal_mode = DELETE');
lowDb.pragma('journal_mode = DELETE');

// VACUUM to reclaim space
console.log('\nVacuuming...');
highDb.exec('VACUUM');
lowDb.exec('VACUUM');

highDb.close();
lowDb.close();
src.close();

// Report file sizes
import { statSync } from 'fs';
const highSize = (statSync(HIGH_PATH).size / 1024 / 1024).toFixed(1);
const lowSize = (statSync(LOW_PATH).size / 1024 / 1024).toFixed(1);
const srcSize = (statSync(SRC_PATH).size / 1024 / 1024).toFixed(1);

console.log(`\nDone!`);
console.log(`  Source:        ${srcSize} MB`);
console.log(`  High-priority: ${highSize} MB (${highSet.size} words)`);
console.log(`  Low-priority:  ${lowSize} MB (${lowSet.size} words)`);
