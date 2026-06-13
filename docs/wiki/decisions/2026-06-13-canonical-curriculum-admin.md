---
title: Canonical curriculum admin editing
type: decision
slug: 2026-06-13-canonical-curriculum-admin
date: 2026-06-13
attributed_to: [niko, codex]
belongs_to: [curriculum-paths]
source: chat
status: active
tags: [curriculum, admin, content, import-export]
related: [curriculum-paths, skill-tree, vietnamy-app]
---

## Context
Niko asked whether the Study screen lesson modules had a unified data structure that an admin could edit and import/export cleanly. The audit found that the learner runtime was already mostly standardized around `content/curriculum.json`, but the Admin Lesson Builder still edited the older derived mock DB shape (`lessons`, `items`, `translations`, `lesson_blueprints`) and exported that derived runtime store.

## Decision
Use the canonical curriculum contract as the admin-facing lesson structure. Admin lesson edits now create a local canonical draft (`vnme_canonical_curriculum_v1`) shaped like `content/curriculum.json`, validate it before save/import, and then regenerate the existing study runtime tables from that canonical draft. Existing study screens can keep consuming the runtime adapter while admin import/export works against the normalized curriculum JSON.

## Rationale
This preserves the current lesson game and roadmap behavior while moving authoring to one clean contract: `units`, `lessons`, `words`, `sentences`, `conversations`, and `grammarTags` with stable IDs and camelCase references. It avoids treating the generated runtime tables as source data and gives future admin tooling a direct path to JSON/CSV/XLSX import-export.

## Consequences
- `src/lib/content/canonicalCurriculumStore.js` owns local canonical draft loading, saving, validation, import, and export.
- `src/lib/content/curriculumDraftContract.js` defines the backend-neutral draft envelope used by both import/export and the future cloud API.
- `src/lib/content/curriculumDraftApi.js` provides a dormant API adapter for a proprietary backend; it has no Supabase imports and can target a Zeabur-hosted API through environment configuration.
- `src/lib/content/initialData.js` exports `buildRuntimeFromCanonical()` so admin saves can regenerate `items`, `translations`, `lesson_blueprints`, `lessons`, and lesson/test roadmap nodes.
- `src/pages/Admin/LessonBuilder.jsx` edits canonical lesson metadata and content references, then syncs the derived runtime tables.
- `src/pages/Admin/AdminLayout.jsx` exports/imports canonical curriculum JSON by default, but still accepts legacy `vnme_curriculum_edits` backups.
- Cloud persistence for admin drafts should be implemented behind the backend-neutral API contract in `docs/architecture/CURRICULUM_DRAFT_API.md`, not by wiring the web client directly to a Supabase-only admin table.
- Remaining boundary: grammar, pronunciation drills, scenes, articles, and other specialized modules still have their own editors/data contracts. The lesson/vocabulary path is now canonical-first; the broader "all module types share one base module schema" pass is still future work.

## Provenance
- Discussed and implemented on 2026-06-13 between [niko] (owner) and [codex] (agent).
- Implementing files: `src/lib/content/canonicalCurriculumStore.js`, `src/lib/content/curriculumDraftContract.js`, `src/lib/content/curriculumDraftApi.js`, `src/lib/content/initialData.js`, `src/lib/storage/mockDbStore.js`, `src/lib/db.js`, `src/pages/Admin/AdminLayout.jsx`, `src/pages/Admin/LessonBuilder.jsx`.
