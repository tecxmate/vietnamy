import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, '..', 'databases');

function normalizeVi(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
}

const dbFiles = readdirSync(dbDir).filter(f => f.endsWith('.db'));

for (const file of dbFiles) {
    const dbPath = join(dbDir, file);
    console.log(`Processing ${file}...`);

    const db = new Database(dbPath);

    // Check if column already exists
    const cols = db.prepare("PRAGMA table_info(words)").all();
    const hasNormalized = cols.some(c => c.name === 'word_normalized');

    if (hasNormalized) {
        console.log(`  ✓ word_normalized column already exists`);
        db.close();
        continue;
    }

    // Add column
    db.exec('ALTER TABLE words ADD COLUMN word_normalized TEXT');

    // Update in batches
    const words = db.prepare('SELECT id, word FROM words').all();
    const update = db.prepare('UPDATE words SET word_normalized = ? WHERE id = ?');

    const batchSize = 5000;
    db.exec('BEGIN');
    for (let i = 0; i < words.length; i++) {
        update.run(normalizeVi(words[i].word), words[i].id);
        if ((i + 1) % batchSize === 0) {
            db.exec('COMMIT');
            db.exec('BEGIN');
            console.log(`  Updated ${i + 1}/${words.length}`);
        }
    }
    db.exec('COMMIT');

    // Create index
    console.log(`  Creating index...`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_word_normalized ON words(word_normalized)');

    console.log(`  ✓ Done (${words.length} words)`);
    db.close();
}

console.log('\nAll databases migrated.');
