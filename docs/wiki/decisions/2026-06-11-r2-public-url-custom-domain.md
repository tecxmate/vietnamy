---
title: R2 Public URL via tts.tecxmate.com Custom Domain
type: decision
slug: 2026-06-11-r2-public-url-custom-domain
date: 2026-06-11
attributed_to: [niko]
belongs_to: [bucket-storage, tts-pipeline]
source: chat
status: active
tags: [tts, r2, cloudflare, infrastructure, cdn]
related: [bucket-storage, tts-pipeline, 2026-05-24-cloudflare-r2-migration-pending]
---

## Context
The TTS bucket has been migrated to Cloudflare R2 (`TTS_STORAGE_PROVIDER=r2`, R2 creds set in Zeabur). While diagnosing TTS latency we found a production misconfiguration: **`R2_PUBLIC_BASE_URL` was set to the private S3 API endpoint** (`<account>.r2.cloudflarestorage.com/tts-cache`), which requires signed auth. So every cache-hit that resolves to R2 returns `302 → R2 → HTTP 400` (verified with curl). Real traffic mostly survived because older audio still lives in the Supabase bucket (public, working) and `ttsCacheHit` falls through to it — but anything newly written to R2 breaks on the second distinct play. This also blocked the deploy-time pre-warm: warming thousands of phrases into R2 would have populated a broken-redirect path.

This resolves the open question that was sitting in [bucket-storage](../topics/tech/bucket-storage.md): *"r2.dev URLs or a custom domain?"*

## Decision
Bind **`tts.tecxmate.com`** as an R2 **Custom Domain** on the `tts-cache` bucket, and set `R2_PUBLIC_BASE_URL=https://tts.tecxmate.com` in Zeabur (no trailing slash, no `/tts-cache` — the custom domain maps to the bucket root). Add a bucket **CORS policy** allowing `https://vietnamy.tecxmate.com` (GET/HEAD) so the client preload path (`warmClip`'s cross-origin `fetch().blob()`) works, matching Supabase's permissive CORS today.

## Rationale
- `tecxmate.com` is **already on Cloudflare in the same account as the R2 bucket** (account `5bccf7f33e94ebd21850088b89f48c58`), so a custom domain works with zero DNS migration — Cloudflare auto-creates the proxied CNAME + SSL. (The Porkbun "DNS Powered by Cloudflare" panel is misleading: that's Porkbun's own infra, not Niko's account; nameservers already point to Niko's Cloudflare zone.) [niko]
- Custom domain beats `r2.dev`: no Cloudflare rate-limit caveat, and audio gets Cloudflare CDN edge caching on top of R2.
- Rejected alternatives: **r2.dev** (rate-limited, "non-production"); **revert to `TTS_STORAGE_PROVIDER=supabase`** (works immediately but loses R2's zero-egress benefit). Kept as fallbacks if the custom domain stalls.

## Consequences
- Restores the fast `302 → CDN → 200` path for all R2-cached audio; fixes intermittent broken audio on second-play of newly cached strings.
- Unblocks the deploy-time pre-warm (`scripts/prebuild-tts.mjs`).
- **Implementation is Niko's to apply** in the Cloudflare R2 dashboard + Zeabur env (the code needs no change). Until then, prod still serves via the slower hit-source/inline and legacy-Supabase paths.

## Provenance
- Discussed 2026-06-11 between [niko] (owner) and [claude-opus] (agent), during the TTS cold-latency investigation.
- Related code commit (latency mitigations + warm-script cache-key fix): `b04452e`.
