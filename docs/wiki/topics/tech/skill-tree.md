---
title: Skill Tree (Roadmap)
type: topic
slug: skill-tree
date: 2026-05-23
updated: 2026-05-24
belongs_to: [niko]
source: synthesis
status: active
tags: [roadmap, gamification, ux]
related: [curriculum-paths, vietnamy-app]
---

## Summary
The Study tab renders a Duolingo-style skill tree (`src/components/Tabs/RoadmapTab.jsx`). Each node represents one lesson, has an `unlock_rule` referencing prerequisites, and groups together its lesson, optional unit test, grammar drills, and SRS reviews. The tree is what makes Vietnamy feel like a learning app rather than a flashcard catalog.

## Why a tree (not a flat list)
1. **Visible progress.** Linear lists are a wall of text; nodes with stars/locks let users see "where am I, what's next, how far have I come." Strongest motivation lever in language apps.
2. **Pedagogical gating.** Each node's `unlock_rule` is checked against `completed_nodes` in `DongContext`. Prevents a beginner from jumping into B1 grammar before A1 basics. The exercise generator assumes prerequisite vocabulary, so without gating, exercises break.
3. **Content bundling.** One node = one lesson + its test + its grammar + its SRS reviews. Without the tree the user would navigate four lists for one unit of work.

## Cost
The trade-off is content velocity. Every new lesson needs:
- A node entry in `unified_db.json` (the merged runtime roadmap)
- An `unlock_rule` referencing other nodes
- A node index defining placement in the visual tree

Currently `src/data/unified_db.json` is the runtime source of truth — built by merging the per-chapter curriculum JSONs through the pipeline in `scripts/build-unified-db.js`. Adding a new curriculum file (e.g. `heritage_a2_b1.json`) provides the lesson content but does NOT automatically populate the roadmap until the merge runs.

This is the friction the [vietnamy-app] open question "wire the roadmap for Professional/Heritage paths" refers to.

## State management
- `DongContext` — `completed_nodes`, `unlocked_stages`, coins (`₫`), hearts (5 max regen 1/30min), daily streak.
- `ProgressContext` (`src/context/ProgressContext.jsx`) — per-mode progress, `getNodeSessionCount(nodeId, mode)`.
- Storage: `localStorage` under `vnme_*` keys, optionally synced to Supabase Postgres `user_progress` table for cross-device.

## Files
- `src/components/Tabs/RoadmapTab.jsx` — the tree UI.
- `src/context/DongContext.jsx` — gamification state.
- `src/context/ProgressContext.jsx` — per-mode progress.
- `src/data/unified_db.json` — runtime merged roadmap (build artifact).
- `scripts/build-unified-db.js` — merges curricula into the runtime DB.

## Open questions
- The Professional and Heritage paths have lesson JSON but their nodes aren't in `unified_db.json` yet — running the curriculum merger pipeline against them is a pending task.
- Should the visual tree differ per path, or render the same shape with different content? Currently same shape.
