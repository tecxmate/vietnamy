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

**Layer 4 — performance-adaptive (partial).** Generated `adaptive.skills` per lesson
(content heuristic). Scorer now has `reviewValue` (lesson vocab ∩ SRS-due) +
`remediationValue` (skills ∩ weak skills) wired with modest weights. The OBSERVABLE
win: `RecommendedNext` derives `estimatedLevel` from **live mastery**
(`isItemMastered` over seen vocab) → ±1 nudge, so strong learners get harder recs
(skip-ahead), strugglers easier. **Honest caveat:** `skills` is uniform across the
pool (every lesson has words+sentences) and new-lesson vocab isn't SRS-due, so the
review/remediation *scorer terms are near-inert today* — they're correct hooks that
activate when per-lesson skill granularity + vocab-reuse data improve. The mastery
difficulty-nudge is the part that actually moves recommendations now.

**Layer 4 — SRS review surface (done).** `RecommendedNext` leads with a green
"Review · N words due" card when vocab is due (`getDueItemIds`), deep-linking to the
Library SRS review (`__srs__` deck → `VocabReviewView`) via a new
`location.state.vocabDeck` handler in `StudentApp` (reuses the `pendingVocabDeck`
path). Verified e2e.

## Open questions / next steps (for whoever continues)
- **Better Layer 4 data** — per-lesson skill granularity (which exercise types a
  lesson really runs, gated by profile/CEFR) so `remediationValue` discriminates.
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
- 2026-06-11 — Layer 4 (partial): `adaptive.skills`, review/remediation scorer hooks,
  and mastery-driven performance-adaptive difficulty in `RecommendedNext`.
- 2026-06-11 — Layer 4 SRS review surface: "Review · N due" card on Study →
  Library SRS review via `location.state.vocabDeck`.
