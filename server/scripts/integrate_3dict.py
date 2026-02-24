"""
Parse 3-dict-combination JSON from definitions_raw into structured meanings + examples.
Source: Vietnamese-Vietnamese monolingual dictionary with POS subcategories and examples.
"""
import sqlite3
import json

DB_PATH = "/Users/niko/antigravity/vnme-app/server/databases/vn_en_dictionary.db"
SOURCE_ID = 6  # 3-dict-combination

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    # Check how many meanings already exist for this source
    existing = conn.execute(
        "SELECT COUNT(*) FROM meanings WHERE source_id = ?", (SOURCE_ID,)
    ).fetchone()[0]

    if existing > 0:
        print(f"WARNING: {existing} meanings already exist for source_id={SOURCE_ID}. Skipping to avoid duplicates.")
        print("Delete existing meanings first if you want to re-run:")
        print(f"  DELETE FROM examples WHERE meaning_id IN (SELECT id FROM meanings WHERE source_id = {SOURCE_ID});")
        print(f"  DELETE FROM meanings WHERE source_id = {SOURCE_ID};")
        conn.close()
        return

    # Fetch all definitions_raw for 3-dict-combination
    rows = conn.execute("""
        SELECT dr.word_id, dr.raw_content
        FROM definitions_raw dr
        WHERE dr.source_id = ?
    """, (SOURCE_ID,)).fetchall()

    print(f"Processing {len(rows)} definitions_raw entries...")

    meanings_inserted = 0
    examples_inserted = 0
    parse_errors = 0

    for word_id, raw_content in rows:
        try:
            entries = json.loads(raw_content)
        except (json.JSONDecodeError, TypeError):
            parse_errors += 1
            continue

        if not isinstance(entries, list):
            entries = [entries]

        for entry in entries:
            definition = entry.get("definition", "").strip()
            if not definition:
                continue

            # Build POS label from pos + sub_pos
            pos = entry.get("pos", "")
            sub_pos = entry.get("sub_pos", "")
            pos_label = sub_pos if sub_pos and sub_pos != pos else pos
            # Map common Vietnamese POS abbreviations
            pos_label = pos_label if pos_label else None

            # Insert meaning
            cur = conn.execute(
                "INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)",
                (word_id, SOURCE_ID, pos_label, definition)
            )
            meaning_id = cur.lastrowid
            meanings_inserted += 1

            # Insert examples (split on ~ delimiter used in this dataset)
            example_text = entry.get("example", "").strip()
            if example_text:
                # Split on ~ which separates multiple examples
                parts = [e.strip() for e in example_text.split("~") if e.strip()]
                for part in parts:
                    # Strip surrounding quotes if present
                    if part.startswith('"') and part.endswith('"'):
                        part = part[1:-1].strip()
                    if part:
                        conn.execute(
                            "INSERT INTO examples (meaning_id, vietnamese_text, english_text) VALUES (?, ?, ?)",
                            (meaning_id, part, None)  # No English translation for Vi-Vi dict
                        )
                        examples_inserted += 1

    conn.commit()

    # Verify
    final_count = conn.execute(
        "SELECT COUNT(*) FROM meanings WHERE source_id = ?", (SOURCE_ID,)
    ).fetchone()[0]

    print(f"\nDone!")
    print(f"  Meanings inserted: {meanings_inserted}")
    print(f"  Examples inserted: {examples_inserted}")
    print(f"  Parse errors: {parse_errors}")
    print(f"  Total meanings for source {SOURCE_ID}: {final_count}")

    # Count how many words now have meanings that didn't before
    new_coverage = conn.execute("""
        SELECT COUNT(DISTINCT m.word_id) FROM meanings m
        WHERE m.source_id = ?
        AND NOT EXISTS (
            SELECT 1 FROM meanings m2 WHERE m2.word_id = m.word_id AND m2.source_id != ?
        )
    """, (SOURCE_ID, SOURCE_ID)).fetchone()[0]
    print(f"  Words now with definitions that had none before: {new_coverage}")

    conn.close()

if __name__ == "__main__":
    main()
