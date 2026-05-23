---
title: Rename TTS Cache Version v9-nam-minh-lower → v9-processed
type: decision
slug: 2026-05-24-v9-processed-rename
date: 2026-05-24
attributed_to: [niko]
belongs_to: [tts-pipeline]
source: chat
status: active
tags: [tts, naming, supabase]
related: [tts-pipeline, bucket-storage]
---

## Context
The `TTS_CACHE_VERSION` value `v9-nam-minh-lower` was the previous version label — it bundled voice identity ("nam-minh", the Nam Minh / Hoài Mỹ voice pair) with the iteration intent ("lower" was a loudness reduction step). Niko found the name confusing in the bucket UI: it suggested the folder was voice-specific, when in fact it holds **derived** WAVs for **both** voices and the name properly describes the *processing state*, not the voice.

## Decision
Rename the active version folder from `v9-nam-minh-lower` to `v9-processed` in three places, in this order:
1. Server code default: `server/server.js` constant `TTS_CACHE_VERSION = 'v9-processed'`.
2. Zeabur env var (if explicitly set there): update or delete to fall back to the new default.
3. Supabase Storage folder: bulk-move all files via the Storage move API (no re-upload).

## Rationale
- Folder names should describe content, not implementation history.
- `v9-processed/` accurately reads as "version 9 of post-processing pipeline" — symmetric with `source/` (raw input).
- The move-via-API approach (`scripts/rename-tts-version.mjs`) preserves all 14,007 file paths without re-uploading bytes — free, fast, no Azure or CDN reset.

## Consequences
- New script `scripts/rename-tts-version.mjs` uses the Supabase Storage `/object/move` endpoint to bulk-rename version folders in place. Reusable for future renames.
- 14,007 files moved successfully in ~5 min. 18 transient API errors retried successfully. 1 destination collision (a file already at the target path) cleaned up.
- `docs/tts-cache.md` updated — all five references to `v9-nam-minh-lower` replaced with `v9-processed`.
- Production verified post-rename: `curl -I "/api/tts?text=xin%20ch%C3%A0o&voice=azure-north&lang=vi"` returns 302 pointing at `v9-processed/azure-north/...`.

## Provenance
- Requested by [niko] 2026-05-24.
- Shipped in commit `26c6c3c`.
- Rename task `bkxt70h4d` completed same day.
