---
title: Two-Tier TTS Cache (source + derived)
type: decision
slug: 2026-05-23-two-tier-tts-cache
date: 2026-05-23
attributed_to: [claude-opus, niko]
belongs_to: [tts-pipeline]
source: chat
status: active
tags: [tts, cache, supabase, azure]
related: [tts-pipeline, bucket-storage]
---

## Context
The single-tier TTS cache stored only the post-processed WAV. Every time Niko tweaked clarity or loudness, the cache became stale and the entire ~17K-string set had to be regenerated from Azure — burning real money and crossing the F0 free tier in a single iteration. The pre-existing `TTS_CACHE_VERSION` prefix invalidated cached files but didn't help with the actual cost of regeneration.

## Decision
Split the cache into two tiers in a single bucket:
- `source/<voice>/<sha1>.pcm` — raw trimmed Azure PCM, unversioned, never invalidated.
- `<TTS_CACHE_VERSION>/<voice>/<sha1>.wav` — post-processed WAV, served to users, invalidated by bumping the version env var.

`/api/tts` checks derived → source → Azure in order. A source hit downloads the PCM, re-runs post-processing locally, uploads the new derived WAV, and serves inline — zero Azure calls.

## Rationale
- Post-processing is **deterministic CPU work**: clarity boost, loudness normalization, WAV wrap. It can run on the Zeabur server in ~100 ms per file.
- Raw Azure PCM is the irreplaceable input. Storing it once means we never pay Azure again for the same string.
- Iteration on voice quality becomes a free CPU operation instead of a paid Azure regeneration. Niko expects multiple iterations during launch tuning.
- Total storage roughly doubles (source + derived) but stays under 2 GB at current scope — small price for the savings.

## Consequences
- New code in `server/server.js`: `synthesizeWithAzureSourcePcm`, `deriveAzureWav`, `synthesizeWithAzure(opts.saveSource)`, `ttsSourceKey`, `ttsCacheGetBuffer`.
- A new response header `X-TTS-Cache: hit-source` reveals when the source-tier re-derive path runs.
- A one-time backfill (`scripts/backfill-tts-source.mjs`) populated `source/` for every string that existed before this change. Cost: ~$3 on Azure S0.
- Future `TTS_CACHE_VERSION` bumps cost $0 in Azure — only Zeabur CPU.

## Provenance
- Discussed and approved by [niko] on 2026-05-23 after the Azure F0 quota was exhausted by an iteration regen.
- Shipped in commit `91608cf`.
- Backfill ran the same day as task `bkudz8h1q` — 22,384 strings × 2 voices = 22,384 requests, 0 failures, ~67 min, ~$3.
