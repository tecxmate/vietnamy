---
title: Root drive/ Folder for Google Drive Media Sync
type: decision
slug: 2026-05-13-root-drive-folder
date: 2026-05-13
attributed_to: [tecxmate]
belongs_to: [drive-media-sync]
source: chat
status: active
tags: [template, media, google-drive]
related: [drive-media-sync]
---

## Context
Tecxmate uses this repository as a template for future software web projects. Those projects need a standard place for heavy media files synchronized from each project's Google Drive folder.

## Decision
Add a root-level `drive/` folder to the template and reserve it for Google Drive synchronized media/reference files. Keep the folder itself documented and visible in Git, but ignore synced contents.

## Rationale
The convention gives every copied project the same predictable media sync location without treating heavy cloud-managed files as source code.

## Consequences
Agents and developers should avoid committing or broadly processing files inside `drive/`. Production assets derived from Drive files must be copied or exported into normal source-controlled app asset paths before use.

## Provenance
- Discussed on 2026-05-13 between [tecxmate] (owner) and [codex] (agent).
