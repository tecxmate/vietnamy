---
title: Bucket Storage (Supabase → R2)
type: topic
slug: bucket-storage
date: 2026-05-23
updated: 2026-06-11
belongs_to: [niko]
source: synthesis
status: active
tags: [storage, supabase, cloudflare-r2, infrastructure]
related: [tts-pipeline, backups-recovery, 2026-05-24-cloudflare-r2-migration-pending, 2026-06-11-r2-public-url-custom-domain]
---

## Summary
All cached audio lives in a public Supabase Storage bucket named `tts-cache`. Cloudflare fronts the bucket for CDN delivery. As of 2026-05-24 the bucket is ~1.4 GB — already over Supabase's 1 GB free tier and squeezing the 5 GB/month egress allowance. Migration to Cloudflare R2 is tracked in [issue #17](https://github.com/tecxmate/vietnamy/issues/17) with a one-month deadline.

## Current bucket state (2026-05-24)

| Folder | Files | Size | Role |
| --- | --- | --- | --- |
| `source/azure-north/` | 11,173 | ~350 MB | Master Nam Minh PCM (permanent) |
| `source/azure-south/` | 11,188 | ~350 MB | Master Hoài Mỹ PCM (permanent) |
| `v9-processed/azure-north/` | 8,842 | ~280 MB | Live Nam Minh WAVs |
| `v9-processed/azure-south/` | 8,839 | ~280 MB | Live Hoài Mỹ WAVs |
| **Total** | **40,042** | **~1.4 GB** | |

Cleaned up 2026-05-24:
- `azure-north/` and `azure-south/` (legacy unversioned, ~1 file) — deleted.
- `v9-nam-minh-lower/` — renamed to `v9-processed` via Supabase move API.
- `v3-trim/` and `v4-trim-loudness/` — ~21K orphaned files from old voice iterations, deleted.
- `migrate-source/` — throwaway derived from the source-tier backfill, deleted.

## Why this is tight on Supabase
- **Storage**: 1 GB free → 100 GB Pro at $25/mo. Already over 1 GB.
- **Egress**: 5 GB/month free → 250 GB on Pro. At ~25 KB per audio playback × ~50 plays per active session, the free egress supports ~4,000 sessions/month. Tight with growth.

## Why Cloudflare R2 is the answer
- **10 GB storage free** (room to grow comfortably).
- **Zero egress fees**. The big one — audio playback is read-heavy by nature.
- **S3-compatible API**. The current server upload/download helpers map cleanly to R2 with credentials swapped.
- **Already fronted by Cloudflare CDN** in the current Supabase setup → consistency.

See [issue #17](https://github.com/tecxmate/vietnamy/issues/17) for the migration plan.

## Server access
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars in Zeabur.
- Server uses `fetch()` directly against `${SUPABASE_URL}/storage/v1/object/...` — no SDK.
- Helpers in `server/server.js`: `ttsCacheHas`, `ttsCacheGetBuffer`, `ttsCachePut`, `ttsPublicUrl`.

## Maintenance scripts
- `scripts/cleanup-legacy-tts.mjs` — deletes obsolete folders by prefix.
- `scripts/rename-tts-version.mjs` — bulk-renames a version folder via the move API.
- `scripts/mirror-bucket.mjs` — full-bucket mirror, used by [backups-recovery].
- `scripts/backup-tts.mjs` — curriculum-string-only mirror.

All scripts read `SUPABASE_SERVICE_ROLE_KEY` from env. Niko pastes the key from Zeabur into a local `.env` (gitignored) before running.

## R2 is now primary (2026-06-11)
Prod runs `TTS_STORAGE_PROVIDER=r2` with R2 creds in Zeabur; new cache writes go to R2, and `ttsCacheHit` checks R2 first then falls through to the still-populated Supabase bucket. `R2_PUBLIC_BASE_URL` is `https://tts.tecxmate.com`, which is bound to the R2 bucket as a public custom domain. Production verification on 2026-06-11:
- `https://vietnamy.tecxmate.com/api/tts?text=Xin%20ch%C3%A0o&lang=vi&voice=azure-north` returns `302` with `x-tts-cache-provider: r2`.
- The redirected `https://tts.tecxmate.com/...wav` URL returns `HTTP 200` with `content-type: audio/wav`.

The one-shot migration processed all `42,071` Supabase Storage objects. Final retry pass copied 2 remaining objects, skipped 42,069 already-present objects, and ended with `failed=0`.

## Open questions
- Should the migration be a one-shot cutover or a dual-write period with R2 as primary and Supabase as backup? Issue #17 suggests dual-write for 2 weeks, then delete Supabase.
- ~~r2.dev URLs or a custom domain?~~ **Resolved** → custom domain `tts.tecxmate.com` ([decision](../../decisions/2026-06-11-r2-public-url-custom-domain.md)).
