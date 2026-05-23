---
title: Three Learner Paths (Explore Vietnam, Professional, Heritage)
type: decision
slug: 2026-05-23-three-learner-paths
date: 2026-05-23
attributed_to: [niko]
belongs_to: [curriculum-paths]
source: chat
status: active
tags: [curriculum, learner-modes, content]
related: [curriculum-paths]
---

## Context
`src/data/learnerModes.js` defined three paths — Explore Vietnam, Professional, Heritage — but only Explore Vietnam had content. Professional and Heritage were flagged `enabled: false` and hidden from the path chooser. Niko wanted to expand content to give the path chooser actual breadth and to address the diaspora reconnection use case.

## Decision
Author full curricula for **Professional** and **Heritage** paths across A1, A2/B1, and B2/C1 levels. Flip `enabled: true` for both paths. Each path gets 30 lessons (10 per level) with 8 words + 4 sentences + 1 conversation per lesson — matching the depth pattern of the existing Explore Vietnam chapters.

## Rationale
- **Professional** targets the substantial population of foreign workers in Vietnam — concrete business contexts (office, meetings, email, presentations, networking, negotiation, travel, dining).
- **Heritage** is the differentiator. No major language app addresses Vietnamese-diaspora learners well. Content emphasizes kinship pronouns (`bà`, `chú`, `cô`, `dì`, `cậu`, etc.), family rituals, traditions, ancestral worship, regional dialects, war/migration memory, and identity. B2/C1 includes Buddhist and Catholic spiritual vocabulary, proverbs (`Công cha như núi Thái Sơn`), and intergenerational themes.
- Stand-alone curricula keep the engagement loop fresh — users who finish Explore Vietnam have a reason to pick a second path rather than churn.
- All 60 new lessons are designed by [claude-opus] but reviewed and culturally grounded by [niko] (native Vietnamese speaker).

## Consequences
- New files:
  - `src/data/curricula/professional_a1.json`
  - `src/data/curricula/professional_a2_b1.json`
  - `src/data/curricula/professional_b2_c1.json`
  - `src/data/curricula/heritage_a1.json`
  - `src/data/curricula/heritage_a2_b1.json`
  - `src/data/curricula/heritage_b2_c1.json`
- `src/data/curricula/index.js` updated to merge new chapters into the registry.
- `src/data/learnerModes.js` flipped `enabled: false` → `true` for both paths.
- Roughly 1,073 new Vietnamese strings landed across the new curricula — warmed in the TTS bucket via subsequent prebuild runs.
- Open: nodes for the new paths aren't in `unified_db.json` yet, so the visual skill tree doesn't surface them. Lessons are playable via direct route, but the Roadmap UI needs the merge pipeline to run before they appear there.

## Provenance
- Generated 2026-05-23 in commits `38a7b94` (A1), `60d60ce` (A2/B1), `84bf3c3` (B2/C1).
- Tone Trainer content (separate, in commit `122d9fe`) lives in `src/data/toneTrainerData.js` and supports all three paths.
