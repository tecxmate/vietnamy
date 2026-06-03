# Vietnamy Canonical Content Bundle

**This is the dataset the mobile app references.** Every file here conforms 100% to
the contract in [`../docs/CONTENT_SCHEMA.md`](../docs/CONTENT_SCHEMA.md) (flat
`vi`/`en`/`zh`, camelCase, stable IDs, controlled enums).

It is **generated** from the source data in `src/data/` — do not hand-edit. Rebuild:

```bash
npm run content:build      # regenerate this bundle
npm run validate:content content/curriculum.json content/drills/*.json   # prove it conforms
```

## Files

| File | Contract | Conforms |
|---|---|---|
| `curriculum.json` | `schema/curriculum.schema.json` — 39 units, 140 lessons, 1001 words, 479 sentences, 132 conversations, 139 grammar tags | ✅ |
| `drills/*.json` | `schema/drill.schema.json` — 15 practice drills | ✅ |
| `index.json` | manifest (version, counts) | — |

Coming in later passes: `dictionary.json`, `articles.json`, `grammar.json`,
`tones.json`, `kinship.json`.

## Shape (quick reference)

`curriculum.json` is **normalized**: words/sentences/conversations live in top-level
arrays and link to a lesson by `lessonId`; each lesson lists its `wordIds` /
`sentenceIds` / `conversationIds`. This dedupes shared content and maps cleanly to the
on-device SQLite (`docs/database_schema.md`). To render a lesson, join its `*Ids` to the
top-level arrays.

```jsonc
{ "meta": { "mode": "all", "version": "...", "source": "unified_db.json" },
  "units":         [ { "id": "phase_1_first_words", "orderIndex": 1, "title": "First Words" } ],
  "lessons":       [ { "id": "lesson_001a", "unitId": "...", "wordIds": ["it_w_0001"], "cefrLevel": "A1", "xpReward": 8 } ],
  "words":         [ { "id": "it_w_0001", "lessonId": "lesson_001a", "vi": "xin chào", "en": "hello (polite)", "pos": "phrase" } ],
  "sentences":     [ { "id": "it_s_0013", "vi": "...", "en": "...", "grammarTagIds": ["gtag_031"] } ],
  "conversations": [ { "id": "conv_001", "title": "Meeting someone", "lines": [ { "speaker": "A", "vi": "...", "en": "..." } ] } ],
  "grammarTags":   [ { "id": "gtag_001", "category": "structure", "description": "..." } ] }
```

## Known data-quality note (inherited from source, not the contract)

`word.dialect` in the source `unified_db.json` had been degraded — the original
north/south values were overwritten with `"both"` (now mapped to `neutral`) or with
usage notes (now rescued into the `note` field). Richer north/south dialect data still
exists in `src/data/curricula/*.json`; if the mobile team needs per-dialect tagging,
that source should be re-merged in a future pass. Flagged, not silently dropped.
