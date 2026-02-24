"""
Build a new ZH dictionary database from CVDICT (CC BY-SA 4.0).
CVDICT format (CC-CEDICT style):
  Traditional Simplified [pinyin] /definition1/definition2/.../

Creates a SQLite database with the same schema as the existing ZH db,
but with Chinese headwords (both simplified and traditional) mapped to
Vietnamese definitions.
"""
import sqlite3
import re
import os

CVDICT_PATH = "/tmp/CVDICT/CVDICT.u8"
DB_PATH = "/Users/niko/antigravity/vnme-app/server/databases/vn_zh_dictionary.db"

# CC-CEDICT line pattern: Traditional Simplified [pinyin] /def1/def2/
LINE_PATTERN = re.compile(
    r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$'
)


def main():
    # Remove old DB
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    # Create schema
    conn.executescript("""
        CREATE TABLE sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );
        CREATE TABLE words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            UNIQUE(word)
        );
        CREATE TABLE meanings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id INTEGER,
            source_id INTEGER,
            part_of_speech TEXT,
            meaning_text TEXT NOT NULL,
            FOREIGN KEY(word_id) REFERENCES words(id),
            FOREIGN KEY(source_id) REFERENCES sources(id)
        );
        CREATE TABLE examples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meaning_id INTEGER,
            vietnamese_text TEXT,
            english_text TEXT,
            FOREIGN KEY(meaning_id) REFERENCES meanings(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_word ON words(word);
        CREATE INDEX idx_meaning_word ON meanings(word_id);
        CREATE INDEX idx_example_meaning ON examples(meaning_id);
    """)

    # Create sources — one for simplified, one for traditional
    conn.execute("INSERT INTO sources (name) VALUES (?)", ("CVDICT_Simplified",))
    conn.execute("INSERT INTO sources (name) VALUES (?)", ("CVDICT_Traditional",))
    conn.commit()

    simp_source_id = conn.execute("SELECT id FROM sources WHERE name = 'CVDICT_Simplified'").fetchone()[0]
    trad_source_id = conn.execute("SELECT id FROM sources WHERE name = 'CVDICT_Traditional'").fetchone()[0]

    # Parse CVDICT
    print("Parsing CVDICT...")
    word_lookup = {}  # word -> word_id
    entries_parsed = 0
    meanings_inserted = 0

    with open(CVDICT_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            m = LINE_PATTERN.match(line)
            if not m:
                continue

            traditional, simplified, pinyin, defs_str = m.groups()
            definitions = [d.strip() for d in defs_str.split('/') if d.strip()]

            if not definitions:
                continue

            entries_parsed += 1

            # POS tag: pinyin
            pos_tag = pinyin

            # Insert for both simplified and traditional
            for word, source_id in [(simplified, simp_source_id), (traditional, trad_source_id)]:
                if word == simplified and traditional == simplified:
                    # Same character — only insert once under simplified
                    if source_id == trad_source_id:
                        continue

                word_key = word.lower()
                if word_key not in word_lookup:
                    cur = conn.execute("INSERT OR IGNORE INTO words (word) VALUES (?)", (word,))
                    if cur.lastrowid:
                        word_lookup[word_key] = cur.lastrowid
                    else:
                        row = conn.execute("SELECT id FROM words WHERE word = ?", (word,)).fetchone()
                        word_lookup[word_key] = row[0]

                word_id = word_lookup[word_key]

                # Combine all definitions into one meaning with pinyin as POS
                meaning_text = '; '.join(definitions)
                conn.execute(
                    "INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)",
                    (word_id, source_id, pos_tag, meaning_text)
                )
                meanings_inserted += 1

            if entries_parsed % 20000 == 0:
                conn.commit()
                print(f"  {entries_parsed} entries parsed, {meanings_inserted} meanings...")

    conn.commit()

    # VACUUM
    print("VACUUMing...")
    conn.execute("VACUUM")

    # Stats
    total_words = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    total_meanings = conn.execute("SELECT COUNT(*) FROM meanings").fetchone()[0]
    simp_meanings = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (simp_source_id,)).fetchone()[0]
    trad_meanings = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (trad_source_id,)).fetchone()[0]

    print(f"\nDone!")
    print(f"  Entries parsed: {entries_parsed}")
    print(f"  Total words: {total_words}")
    print(f"  Total meanings: {total_meanings}")
    print(f"  Simplified meanings: {simp_meanings}")
    print(f"  Traditional meanings: {trad_meanings}")

    conn.close()

if __name__ == "__main__":
    main()
