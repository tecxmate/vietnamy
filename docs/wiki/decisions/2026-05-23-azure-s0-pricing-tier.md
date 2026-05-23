---
title: Azure Speech F0 → S0 Pricing Tier
type: decision
slug: 2026-05-23-azure-s0-pricing-tier
date: 2026-05-23
attributed_to: [niko]
belongs_to: [tts-pipeline]
source: chat
status: active
tags: [azure, pricing, infrastructure]
related: [tts-pipeline]
---

## Context
The Vietnamy Azure Speech resource (`VNME-Asia`, East Asia region) was on the F0 (Free) tier which caps neural TTS at 500,000 characters per month. A combined warmup run for new curriculum + Tone Trainer expansion pushed lifetime usage from ~410K to past 500K mid-stream, and Azure started returning HTTP 429 "Quota Exceeded" for the rest of the run. F0 does NOT auto-fall back to paid — once the quota is hit, all neural TTS calls fail until the next billing cycle.

## Decision
Switch the Speech resource from F0 to S0 (Standard) in the Azure Portal. The $200 Azure free credit absorbs the resulting S0 charges.

## Rationale
- S0 pricing is **$16 per 1M characters** for neural TTS. At current scale, organic monthly usage post-cache is well under $1.
- The $200 credit covers the equivalent of 12.5M characters — many years of organic usage at current trajectory.
- F0 is a strictly worse choice once you're seriously caching: the cost savings are illusory (S0 cost is negligible after the cache warms) but the failure mode of hard 429 is real and user-impacting.
- Pronunciation Assessment (5 hours/month free, $1/hour after) draws from the same credit and stays well inside the free tier for normal usage.

## Consequences
- No code change. The server simply stopped seeing 429s once the dashboard switch saved.
- The remaining ~$3 of the failed warmup completed normally on S0 once Niko switched.
- Future monthly Azure spend is expected to be cents, not dollars — as long as the cache stays warm.
- `docs/tts-cache.md` and the wiki document the S0 choice and the metric path to watch usage (Speech resource → Metrics → Synthesized Characters).

## Provenance
- Discussed 2026-05-23 between [niko] and [claude-opus] after the 429s appeared.
- Niko changed the pricing tier in the Azure Portal the same day.
- Tracked through Azure Portal → VNME-Asia → Pricing tier (currently S0).
