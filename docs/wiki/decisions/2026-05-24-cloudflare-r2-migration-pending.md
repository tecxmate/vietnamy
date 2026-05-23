---
title: Migrate TTS Bucket to Cloudflare R2 Within One Month
type: decision
slug: 2026-05-24-cloudflare-r2-migration-pending
date: 2026-05-24
attributed_to: [niko]
belongs_to: [bucket-storage]
source: chat
status: proposed
tags: [storage, cloudflare-r2, supabase, infrastructure]
related: [bucket-storage, tts-pipeline]
---

## Context
After the two-tier TTS cache and source-tier backfill, the Supabase Storage `tts-cache` bucket is at ~1.4 GB — already over Supabase's 1 GB free tier. Monthly egress is capped at 5 GB on free, which supports roughly 4,000 active sessions/month at ~50 audio plays each. Both ceilings are uncomfortable for a launch trajectory.

## Decision
Migrate the `tts-cache` bucket to **Cloudflare R2** within one month (target: 2026-06-24). Tracked as [issue #17](https://github.com/tecxmate/vietnamy/issues/17).

## Rationale
- **R2 free tier**: 10 GB storage (7× current usage), **zero egress fees**. Audio playback is read-heavy by nature; egress is the bigger long-term concern.
- **S3-compatible API**. The current server upload/download helpers (`ttsCacheHas`, `ttsCacheGetBuffer`, `ttsCachePut`, `ttsPublicUrl`) map cleanly to R2 with auth swapped (AWS Signature v4 instead of Supabase Bearer).
- Cloudflare CDN already fronts Supabase Storage URLs — R2 is the native Cloudflare object store, so CDN behavior gets *more* predictable, not less.
- The alternative is Supabase Pro at $25/mo for 100 GB storage + 250 GB egress. Plenty of headroom but a recurring cost where R2 stays free for years at our trajectory.

## Consequences
- A migration script syncs the entire `tts-cache` bucket from Supabase to R2 (one-time, ~1.4 GB, minutes over a fast connection).
- `ttsPublicUrl` in `server/server.js` swaps Supabase URL for R2 endpoint.
- Upload helpers switch from `Authorization: Bearer <service-role-key>` to AWS-style signing — likely via the `@aws-sdk/client-s3` package or `aws4fetch` for a minimal dependency.
- A dual-write period (2 weeks) keeps Supabase populated as backup before final cutover.
- Supabase project remains as cold-storage backup until decommission.

## Open work (for the migration sprint)
1. Create R2 bucket with public access.
2. Sync Supabase `tts-cache` → R2 (one-shot).
3. Update server bucket helpers for R2.
4. Verify a fresh string round-trips through R2.
5. Keep dual-write for ~2 weeks of soak.
6. Decommission Supabase Storage bucket.

## Provenance
- Requested by [niko] 2026-05-24 after the storage discussion.
- Recorded as [GitHub issue #17](https://github.com/tecxmate/vietnamy/issues/17) with deadline 2026-06-24.
- Status: **proposed**. Moves to **active** when the migration script lands.
