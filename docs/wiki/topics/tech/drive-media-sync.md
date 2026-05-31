---
title: Drive Media Sync
type: topic
slug: drive-media-sync
date: 2026-05-13
updated: 2026-05-13
attributed_to: [tecxmate]
belongs_to: [tecxmate]
source: chat
status: active
tags: [template, media, google-drive]
related: [2026-05-13-root-drive-folder]
---

## Summary
Future Tecxmate web projects should include a root `drive/` folder connected to the corresponding Google Drive project folder for heavy media and reference files.

## Current state
The template includes `drive/README.md`, `drive/.gitkeep`, and `scripts/link-drive.sh`. `.gitignore` excludes synced Drive contents while preserving those two placeholder files.

## Operating rules
- Treat `drive/` contents as external media/reference files, not source code.
- Keep synced files out of Git.
- Use `scripts/link-drive.sh` to create an ignored shortcut such as `drive/sync` to a project folder inside a central Google Drive sync location.
- Copy or export only intentional production assets into source-controlled app folders when needed at runtime.
- Avoid broad agent operations over `drive/` unless the user explicitly asks.

## History
- 2026-05-13: Added the root `drive/` placeholder and documented the sync convention.
- 2026-05-13: Standardized the folder name to lowercase `drive/`.
- 2026-05-13: Added `scripts/link-drive.sh` for central Google Drive sync shortcuts.
