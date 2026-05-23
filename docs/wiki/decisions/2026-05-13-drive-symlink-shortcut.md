---
title: drive/ Symlink Shortcut for Central Google Drive Sync
type: decision
slug: 2026-05-13-drive-symlink-shortcut
date: 2026-05-13
attributed_to: [tecxmate]
belongs_to: [drive-media-sync]
source: chat
status: active
tags: [template, media, google-drive, symlink]
related: [drive-media-sync]
---

## Context
Tecxmate does not want to manually configure Google Drive synchronization for every copied project. Google Drive can synchronize a selected folder, so project templates need a low-friction way to point `drive/` at a subfolder inside a central synced location.

## Decision
Add `scripts/link-drive.sh`, which creates an ignored symlink inside `drive/` such as `drive/sync -> /path/to/Google Drive/project-folder`.

## Rationale
A symlink gives each project a stable local shortcut while keeping Google Drive responsible for syncing one central folder. Creating the symlink inside the tracked `drive/` placeholder keeps the repository clean because `drive/*` remains ignored except for the placeholder files.

## Consequences
Future projects can run the script once after cloning/copying the template. Agents should use the symlink for media access only when the task explicitly concerns Drive contents, and synced files remain outside Git.

## Provenance
- Discussed on 2026-05-13 between [tecxmate] (owner) and [codex] (agent).
