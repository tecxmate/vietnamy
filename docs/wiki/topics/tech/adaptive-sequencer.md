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
**Layers 1–4 are built and on `main`; nothing is destructive — the new data is
additive and the sequencer only powers a "Recommended for you" row (with a Review
card), the linear roadmap is unchanged.** See also [curriculum-paths](curriculum-paths.md) (the 3
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

**Item-based remediation (done — replaced skill matching).** Content-derived skills
can never discriminate here (134/140 lessons are word-heavy), so remediation is
ITEM-based: build-canonical derives `adaptive.usesVocab` (vocab a lesson's sentences
REUSE but other lessons own; longest-match tokenization, 139/140 lessons, avg 6.8).
`reviewValue`/`remediationValue` match due/weak item ids against
`wordIds ∪ usesVocab`. Demo-proven: weak on tôi/muốn/mua → "Order Something" tops.

**Sequencer-primary Continue (done, measured).** Learner-state derivation lives in
`src/lib/recommendations.js` (`getRecommendations`) — shared by `RecommendedNext`
and `RoadmapTab`. The Continue button follows the sequencer's top pick **when the
next linear node is a lesson**; non-lesson nodes (foundations practice, grammar
units, tests) keep their hard order. Verified: a new learner's Continue still opens
Foundations.

**Layer 5 capture (done — capture-only).** `src/lib/engagement.js` (localStorage
`vnme_engagement` ring buffer, 1000 events, never throws). `LessonGame` logs
`exercise` (type/correct/responseMs), `lesson_quit` (atIndex/total/elapsedMs),
`lesson_complete`. NOTHING reads these for sequencing — per the design: instrument
now, act only once the data shows what the signals mean.

**Admin tuning + analytics (done).** `/admin/adaptive` (`AdaptiveEditor`):
per-lesson purpose-weight table persisted as id-keyed overrides
(`vnme_cms_purpose_weights`, overlaid in `recommendations.js`), plus a Layer-5
engagement panel (counts, avg response by exercise type, most-quit, JSON export).
The roadmap also badges the sequencer's current top-3 lesson nodes with a
"Recommended" sparkle — per-purpose pathing visible inside the linear map,
unlock semantics untouched.

## Open questions / next steps (for whoever continues)
- **Act on engagement** — only after `vnme_engagement` data accumulates and is
  analyzed (export now exists in /admin/adaptive).
- **Graph-based unlock** — the roadmap's *visible path* is still linear-unlock;
  rendering a per-purpose path from the sequencer is the remaining big UX change.
- **Foundations** (alphabet/vowels) are practice *nodes*, not lessons, so they're
  absent from the sequencer (lessons-only) — they stay in the roadmap.

## History
- 2026-06-11 — Layers 1–3 built + wired (additive). Data in `content/curriculum.json`,
  engine `src/lib/sequencer.js`, UI `src/components/RecommendedNext.jsx`.
- 2026-06-11 — Layer 4 (partial): `adaptive.skills`, review/remediation scorer hooks,
  and mastery-driven performance-adaptive difficulty in `RecommendedNext`.
- 2026-06-11 — Layer 4 SRS review surface: "Review · N due" card on Study →
  Library SRS review via `location.state.vocabDeck`.
- 2026-06-11 — Item-based remediation (`usesVocab`), sequencer-primary Continue
  (lesson nodes only), Layer 5 engagement capture (`vnme_engagement`).
- 2026-06-11 — /admin/adaptive weight editor + engagement analytics/export;
  roadmap "Recommended" badges on the sequencer's top picks.
