# Vietnamy Content Schema (JSON Schema, draft 2020-12)

Machine-readable validation files for the Vietnamy content contract.
The human-readable spec is [`docs/CONTENT_SCHEMA.md`](../docs/CONTENT_SCHEMA.md).

| File | Validates | Current source file(s) it will replace/normalize |
|---|---|---|
| `_common.schema.json` | Shared `$defs` (id, localizedText, enums) | — |
| `curriculum.schema.json` | A learner-mode container (units, lessons, words, sentences, conversations, grammarTags) | `curricula/*.json`, `lessons.json`, `unified_db.json` |
| `drill.schema.json` | One practice drill | `drills/*.json` |
| `grammar.schema.json` | Grammar modules (levels → modules → units) | `grammar_modules.json` (+ deprecates `vn_grammar_bank_v2.json`) |
| `article.schema.json` | One reading article | `articleData.js` (ARTICLES) |
| `dictionary.schema.json` | One dictionary entry | `dictionary.json`, server SQLite (client projection) |
| `tones.schema.json` | Tone contours + practice words | `toneContours.js` |
| `kinship.schema.json` | One kinship member | `kinshipData.js` |

## Conventions (enforced)

- `camelCase` field names; flat `vi` / `en` / `zh` text.
- IDs are stable strings, never the content text.
- Controlled enums: `cefrLevel`, `dialect`, `pos`, `difficulty` (1–5).
- Optional fields are omitted, not null. Most objects are `additionalProperties: false`
  so unknown/legacy keys fail validation — this is intentional, to catch drift.

## Validating

```bash
npm run validate:content              # full plain-English drift report
npm run validate:content -- --summary # just the per-file table
```

`scripts/validate-content.mjs` reads the canonical field names from these schema
files and scans every data file, reporting in plain English which legacy field
names exist and what the contract calls them. It is a **drift report**, not a
pass/fail gate: the current data files do **not** yet conform (see §9–§10 of the
spec), so most show drift today. Each "legacy field" line is one rename a
converter will perform. Writing those converters is the next step.

> Why not ajv? The repo's ajv is v6 (draft-07); these schemas are draft 2020-12,
> and ajv's raw errors ("must NOT have additional properties") aren't readable for
> non-experts. The custom validator gives friendlier output while keeping these
> schema files as the single source of truth for field names and enums.
