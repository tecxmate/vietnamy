---
title: Curriculum & Learner Paths
type: topic
slug: curriculum-paths
date: 2026-05-23
updated: 2026-06-13
belongs_to: [niko]
source: synthesis
status: active
tags: [curriculum, content, learner-modes, cefr]
related: [skill-tree, vietnamy-app, 2026-05-23-three-learner-paths, 2026-06-13-canonical-curriculum-admin]
---

## Summary
Vietnamy has three learner paths, each with its own curriculum tree spanning CEFR levels A1 → C2. A user picks one path at onboarding (defaults to Explore Vietnam) and everything in the Study tab is scoped to it. The "All" mode shows the union of every topic but ties progress to the Explore Vietnam track for SRS continuity.

## Path overview

| Path | Audience | Topic focus | Lessons | Status |
| --- | --- | --- | --- | --- |
| Explore Vietnam | Tourists, travelers, business visitors | Greetings, restaurant, hotel, transport, money, directions, sightseeing, emergency | ~150 across A1–C2 | Enabled by default |
| Professional | Business and work in Vietnam | Office, meetings, email, presentations, networking, negotiation, travel, dining | 30 across A1, A2/B1, B2/C1 | Enabled |
| Heritage | Vietnamese diaspora reconnecting | Family, kinship, traditions, holidays, ancestors, home, cooking, stories | 30 across A1, A2/B1, B2/C1 | Enabled |

Definitions live in `src/data/learnerModes.js` (`LEARNER_MODES`, `DEFAULT_LEARNER_MODE`, `getProgressMode`).

## Curriculum file layout
`src/data/curricula/`:

```
explore_vietnam.json           # A1 base
explore_vietnam_a1_extra.json  # A1 depth top-ups
explore_vietnam_a2_b1.json     # A2 / B1
explore_vietnam_b1_plus.json   # B1+
explore_vietnam_b2.json        # B2
explore_vietnam_c1.json        # C1
explore_vietnam_c2.json        # C2
professional_a1.json           # A1
professional_a2_b1.json        # A2 / B1
professional_b2_c1.json        # B2 / C1
heritage_a1.json
heritage_a2_b1.json
heritage_b2_c1.json
index.js                       # merges all chapters per mode, exports getCurriculum(modeId)
grammar_tags.json
metadata.json
```

`index.js` exposes:
- `getCurriculum(modeId)` → merged chapters for a mode
- `getLessonsForMode(modeId, unitId?)`
- `getUnitsForMode(modeId)`
- `getLessonById(modeId, lessonId)`
- `getCurriculumStats(modeId)`
- `getAllLessonDefs(modeId)` → adapted to the runtime `db.js` format

## Lesson schema
Each lesson in a curriculum JSON has:
- Metadata: `id`, `unit`, `title`, `nodeId`, `quizId`, `quizLabel`, `nodeIndex`, `difficulty`, `cefr`, `xp`, `topic`, `focus`.
- `words[]`: 8 vocab items with `id`, `vi`, `en`, `pos`, `difficulty`, `frequency`, optional `emoji`.
- `sentences[]`: 4 example sentences with `vi`, `en`, `accepted[]`, `tokens`, `difficulty`.
- `conversations[]`: 1 short dialogue with `lines[]` of `{ speaker, vi, en }`.

Reference schema: `docs/curr/CANONICAL_CURRICULUM_SCHEMA.md`. Lesson data details: `docs/curr/LESSON_DATA_SPEC.md`.

## Canonical admin editing
As of 2026-06-13, lesson authoring in the web admin is canonical-first. `content/curriculum.json` remains the baked bundle, and admin edits create a local draft under `vnme_canonical_curriculum_v1` using the same normalized shape: top-level `units`, `lessons`, `words`, `sentences`, `conversations`, and `grammarTags`. The Lesson Builder validates that draft, then regenerates the current study runtime tables (`items`, `translations`, `lesson_blueprints`, `lessons`, and lesson/test roadmap nodes) through `buildRuntimeFromCanonical()`.

Admin import/export now uses canonical curriculum JSON by default, while still accepting older derived mock-DB backups. This means lesson/vocabulary content should be treated as canonical curriculum data, not as hand-authored runtime DB rows. Broader module types such as grammar units, pronunciation drills, scenes, and articles still use their specialized editors and are a separate unification pass.

## Current state (2026-05-24)
- **Professional**: 30 lessons, 240 words, 120 sentences, 30 conversations. Authored by [claude-opus] in three commits (A1: `38a7b94`, A2/B1: `60d60ce`, B2/C1: `84bf3c3`).
- **Heritage**: 30 lessons, 240 words, 120 sentences, 30 conversations. Same three commits.
- **Explore Vietnam**: ~150 lessons across A1–C2 (pre-existing).
- No duplicate lesson or word IDs across all chapters.

## Tone Trainer data
`src/data/toneTrainerData.js` exports `TONE_TRAINER_PAIRS` — 111 minimal-pair clusters covering 468 unique real-word targets. Lives under `src/data/` so the TTS prebuild script automatically warms its audio. See [tone-trainer].

## Reading Library
`src/data/articleData.js` exports `ARTICLES` and category metadata. 18 articles surface in `src/components/Tabs/ReadingLibraryTab.jsx`. Article titles and sentences are warmed in the TTS cache.

## Open questions
- A2+ depth for Professional and Heritage paths matches Explore Vietnam (which has ~150 lessons). They have 30 — adequate to launch but thin for mastery learners.
- Curriculum versioning if structure changes — currently the JSONs are the source of truth, no schema versioning beyond `meta.version`.
