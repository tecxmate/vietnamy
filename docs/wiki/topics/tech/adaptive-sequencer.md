---
title: Adaptive Curriculum Sequencer
type: topic
slug: adaptive-sequencer
date: 2026-06-11
updated: 2026-06-11
belongs_to: [niko]
source: synthesis
status: active
tags: [curriculum, adaptivity, sequencer, content]
related: [curriculum-paths, skill-tree, vietnamy-app]
---

## Summary
A layered system that turns the single shared lesson pool into a path that
**adapts to the learner's purpose, performance, and (later) engagement** — "a
playlist with rules" (a recommender constrained by a prerequisite graph, not free
mixing). Design doc: `docs/ADAPTIVE_CURRICULUM_SEQUENCER.md` (6-layer model).
**Layers 1–3 are built and on `main`; nothing is destructive — the new data is
additive and the sequencer only powers a "Recommended for you" row, the linear
roadmap is unchanged.** See also [curriculum-paths](curriculum-paths.md) (the 3
modes) and [skill-tree](skill-tree.md) (the linear roadmap).

## Current state (what's built)

**Layers 1–2 — generated tag + prerequisite data** (`scripts/build-canonical.mjs`).
Each lesson in `content/curriculum.json` now carries an `adaptive` block, generated
(NOT hand-authored), schema in `schema/curriculum.schema.json` (`lesson.adaptive`):
- `purposes`: `[{id, weight}]` — derived from the `learnerModes.js` topic→mode map
  (explore_vietnam / professional / heritage). **Coarse binary weights (v1)** —
  explore covers 135/140 lessons because the pool is travel/`basics`-heavy. Refine
  via a future per-lesson admin editor.
- `spine`: bool — the shared on-ramp (universal topic AND A1) = 9 lessons.
- `introducesGrammar` / `requiresGrammar`: the **grammar prerequisite graph**,
  derived by walking lessons in order over their sentence `grammarTagIds` (Pass 5
  took tagging to 100%). 137/140 lessons get `requiresGrammar`; self-consistent by
  construction (a lesson only requires grammar introduced earlier).

**Layer 3 — the sequencer engine** (`src/lib/sequencer.js`). Pure + explainable.
`getNextBestLessons(state, lessons)`:
- candidate set = not-done lessons whose grammar prereqs are satisfied;
- score = `purpose` + `difficulty` + `variety` (weights in `SEQUENCER_WEIGHTS`;
  `review`/`remediation` are hooked at weight 0 pending Layer 4);
- spine discipline = remaining spine lessons stay ordered and precede the pool.
- `difficulty` is on the curriculum's **1–10** scale (not 1–5).
- Demo/proof: `scripts/demo-sequencer.mjs` (new learner → spine first; after A1 the
  path diverges by purpose; 0 prerequisite violations).

**Layer 3 wiring — live UI** (`src/components/RecommendedNext.jsx`, rendered atop
`RoadmapTab`). A "RECOMMENDED FOR YOU" row showing the top-3 sequencer picks for the
learner's mode, tap → `/lesson/:id`. **Additive**: the linear roadmap is unchanged
below it ("dynamic selection within a visible path"). It maps completed nodes→lessons
via `lesson.nodeId`, derives `estimatedLevel` from completed difficulty and
`recentTopics` by order.

## Open questions / next steps (for whoever continues)
- **Layer 4 (performance-adaptive)** — derive `requires_vocab` (needs sentence→word
  tokenization) + `skills` (from exercise types / `wordGrades.js` dimension map),
  then wire `reviewValue`/`remediationValue` into the scorer. The data feeding this
  is **already live, not dormant**: `getWeakItems` (`wordGrades.js`) already orders
  lesson exercises and `getDueItems` (`srs.js`) already powers the Library review.
- **Make the sequencer primary** — currently a recommendation row; could drive the
  Continue button / path with a force-insert spine+review cadence. (Note: the roadmap
  is strictly *linear-unlock* today; graph-based unlock is the bigger change.)
- **Refine purpose weights** — coarse binary v1; a per-lesson admin editor.
- **Layer 5 (engagement)** — instrument response time / hesitation / quits now, act
  later. Touches the sensitive `LessonGame` engine — get sign-off.
- **Foundations** (alphabet/vowels) are practice *nodes*, not lessons, so they're
  absent from the sequencer (lessons-only) — they stay in the roadmap.

## History
- 2026-06-11 — Layers 1–3 built + wired (additive). Data in `content/curriculum.json`,
  engine `src/lib/sequencer.js`, UI `src/components/RecommendedNext.jsx`.
