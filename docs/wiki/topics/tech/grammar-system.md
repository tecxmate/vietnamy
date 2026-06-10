---
title: Grammar System (single-source)
type: topic
slug: grammar-system
date: 2026-06-11
updated: 2026-06-11
belongs_to: [niko]
source: synthesis
status: active
tags: [grammar, content, curriculum]
related: [curriculum-paths, adaptive-sequencer, vietnamy-app]
---

## Summary
Grammar is now **single-source**: authored in `src/data/grammar_modules.json` →
generated to `content/grammar.json` (`scripts/build-canonical.mjs:buildGrammar`) →
read everywhere via the `grammarModulesDB.js` adapter. Coverage is **A1–C2**
(was A1–B1). The old divergent grammar dataset and its readers were fully removed.

## Current state
- **Levels A1–C2**: A1 28 modules, A2 34, B1 18, **B2 8 / C1 8 / C2 6** (105 new
  upper-level units authored via an author→native-review agent pass). FAQs
  normalized to `{question, answer}` across all levels.
- **Readers (all canonical):**
  - `grammarModulesDB.js` — lazy adapter over `content/grammar.json`
    (`getLevels`/`getLevel`/`getUnit`/…).
  - `/grammar` → **Grammar Guide** (`src/pages/Grammar/GrammarGuide.jsx` + `.css`) —
    the restored old 5-tab `GrammarTab`: level tabs A1–C2 → module accordion → unit
    accordion (inline explanation + TTS examples) + FAQs + an "Extras" practice
    section. Reached from the **Library → Grammar** type-bar tab. Level colors are a
    harmonized cool→fuchsia ramp (A1 emerald → C2 fuchsia), tuned for dark-mode
    readability. It's a reference browser (read inline), it does not launch lessons.
  - `/grammar-unit/:unitId` → `GrammarUnitLesson` (the interactive grammar lesson),
    reached from roadmap `grammar_unit` nodes; admin edits via `/admin/grammar-unit`
    (`GrammarUnitEditor`, id-keyed overrides).
  - The roadmap "Guidebook" button derives points from sentence grammar tags
    (`grammarGuide.js`).

## What was removed (legacy retirement, 2026-06-11)
The second grammar dataset **`vn_grammar_bank_v2.json` (12.7K lines) and all its
consumers were deleted** — they fed no user-facing feature once the above went
canonical: `grammarDB.js`, `GrammarLesson` (`/grammar-lesson` — 0 `grammar_lesson`
nodes ever existed), `GrammarDetail`, admin `GrammarEditor`, the dead `grammar_lesson`
node-type branches (RoadmapTab/db.js/moduleKinds), and the vite `manualChunks` +
`validate-content` entries. Also removed the interim level-card browser
(`GrammarIndex`/`GrammarList`) when the Grammar Guide replaced it.

## Open questions
- `purposes`/prereq adaptive data is generated onto curriculum lessons — see
  [adaptive-sequencer](adaptive-sequencer.md).
- Purpose-weighting of grammar for the sequencer is not yet modeled (grammar is
  reference + roadmap nodes, not in the lesson pool the sequencer ranks).

## History
- 2026-06-11 — Authored B2/C1/C2; migrated all readers to canonical; retired
  `vn_grammar_bank_v2.json`; restored the Grammar Guide at `/grammar`.
