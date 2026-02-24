"""
Strip proprietary sources from the EN dictionary database.
Keeps only: VE (GPL), 3-dict-combination (GPL + CC BY-SA)
Removes: mtBab-VE, Prodic_Business, Prodic_Technical, Prodict_4in1_all,
         Hán Việt, JaViDic_VJ, mtBab_VF
Also removes orphaned words (words with no remaining meanings).
"""
import sqlite3
import shutil

SRC = "/Users/niko/antigravity/vnme-app/server/databases/archive/vn_en_dictionary_full.db"
DST = "/Users/niko/antigravity/vnme-app/server/databases/vn_en_dictionary.db"

KEEP_SOURCES = {"VE", "3-dict-combination"}

def main():
    # Copy full DB as starting point
    shutil.copy2(SRC, DST)
    conn = sqlite3.connect(DST)
    conn.execute("PRAGMA journal_mode=WAL")

    # Find sources to remove
    sources = conn.execute("SELECT id, name FROM sources").fetchall()
    print("All sources:")
    for sid, name in sources:
        keep = "KEEP" if name in KEEP_SOURCES else "REMOVE"
        count = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (sid,)).fetchone()[0]
        print(f"  {sid}: {name} ({count} meanings) -> {keep}")

    remove_ids = [sid for sid, name in sources if name not in KEEP_SOURCES]

    if not remove_ids:
        print("Nothing to remove!")
        conn.close()
        return

    placeholders = ','.join('?' * len(remove_ids))

    # Delete examples for meanings being removed
    print("\nDeleting examples...")
    conn.execute(f"""
        DELETE FROM examples WHERE meaning_id IN (
            SELECT id FROM meanings WHERE source_id IN ({placeholders})
        )
    """, remove_ids)
    print(f"  Examples deleted: {conn.total_changes}")

    # Delete meanings
    print("Deleting meanings...")
    conn.execute(f"DELETE FROM meanings WHERE source_id IN ({placeholders})", remove_ids)
    print(f"  Total changes: {conn.total_changes}")

    # Delete sources
    conn.execute(f"DELETE FROM sources WHERE id IN ({placeholders})", remove_ids)

    # Delete orphaned words (no meanings left)
    print("Deleting orphaned words...")
    orphans = conn.execute("""
        SELECT COUNT(*) FROM words w
        WHERE NOT EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    """).fetchone()[0]
    conn.execute("""
        DELETE FROM words WHERE id NOT IN (SELECT DISTINCT word_id FROM meanings)
    """)
    print(f"  Orphaned words removed: {orphans}")

    # Delete orphaned word_metrics
    conn.execute("""
        DELETE FROM word_metrics WHERE word_id NOT IN (SELECT id FROM words)
    """)

    # Delete orphaned pronunciations
    conn.execute("""
        DELETE FROM pronunciations WHERE word_id NOT IN (SELECT id FROM words)
    """)

    conn.commit()

    # VACUUM to reclaim space
    print("\nVACUUMing...")
    conn.execute("VACUUM")

    # Final stats
    print("\nFinal stats:")
    for table in ['sources', 'words', 'meanings', 'examples', 'word_metrics', 'pronunciations']:
        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count}")

    remaining = conn.execute("SELECT id, name FROM sources").fetchall()
    print("\nRemaining sources:")
    for sid, name in remaining:
        count = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (sid,)).fetchone()[0]
        print(f"  {sid}: {name} ({count} meanings)")

    conn.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
