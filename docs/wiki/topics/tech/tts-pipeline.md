---
title: TTS Pipeline (Two-Tier Cache)
type: topic
slug: tts-pipeline
date: 2026-05-23
updated: 2026-06-11
belongs_to: [niko]
source: synthesis
status: active
tags: [tts, azure, supabase, r2, cache, infrastructure, latency]
related: [bucket-storage, pronunciation-assessment, backups-recovery, 2026-05-23-two-tier-tts-cache, 2026-05-23-azure-s0-pricing-tier, 2026-05-24-v9-processed-rename, 2026-06-11-r2-public-url-custom-domain]
---

## Summary
Every Vietnamese audio clip the app plays comes from `/api/tts` on the Zeabur server. The endpoint serves a 302 redirect from a Supabase Storage bucket whenever possible, and only calls Azure Speech when neither tier of the cache has the requested string. The cache is **two-tier**: a permanent `source/` folder holding raw Azure PCM, and a versioned `<TTS_CACHE_VERSION>/` folder holding the post-processed WAV that's actually served. Changing post-processing parameters (clarity, loudness, prosody) is therefore free — just bump the version, and the server re-derives WAVs from source PCM locally with no Azure calls.

## Request flow

```
Browser → GET /api/tts?text=...&voice=...&ck=<version>
         │
         ├─ 1. derived hit?  HEAD <version>/<voice>/<sha1>.wav    →  302 redirect to Cloudflare → Supabase Storage
         │
         ├─ 2. source hit?   HEAD source/<voice>/<sha1>.pcm        →  download PCM, re-derive WAV locally,
         │                                                            upload to <version>/, serve inline
         │
         └─ 3. miss          → Azure Speech REST                   →  save raw PCM to source/,
                                                                       apply clarity + loudness, wrap WAV,
                                                                       upload to <version>/, serve inline
```

Response header `X-TTS-Cache` reveals which tier resolved: `hit`, `hit-source`, `miss`, or `disabled`.

## Object layout

```
tts-cache/
├── source/                       # unversioned, never invalidated
│   ├── azure-north/<sha1>.pcm    # raw trimmed Azure PCM (Nam Minh, vi-VN-NamMinhNeural)
│   └── azure-south/<sha1>.pcm    # raw trimmed Azure PCM (Hoài Mỹ, vi-VN-HoaiMyNeural)
└── v9-processed/                 # current TTS_CACHE_VERSION
    ├── azure-north/<sha1>.wav    # post-processed WAV ready to serve
    └── azure-south/<sha1>.wav
```

Hash is `sha1(voice|lang|text)`. Same Vietnamese string therefore has separate north / south / google entries.

## Post-processing
Applied in `server/server.js` between `synthesizeWithAzureSourcePcm` and `deriveAzureWav`:
1. `trimPcm16MonoSilence` — strip leading/trailing silence.
2. `addPcm16MonoClarity` (azure-south only, amount=0.32) — high-frequency boost to brighten Hoài Mỹ.
3. `normalizePcm16MonoLoudness` (RMS target 0.2 south, 0.13 north).
4. `pcm16MonoToWav` — wrap as RIFF/WAV.

Tweaking any of these only affects new derived files. To roll out a re-process to existing strings, bump `TTS_CACHE_VERSION` (e.g. `v10-foo`) and redeploy. The server transparently re-derives from `source/` for every miss.

## Production baseline (2026-05-24)

| Folder | Files | Role |
| --- | --- | --- |
| `source/azure-north/` | 11,173 | Nam Minh master PCM |
| `source/azure-south/` | 11,188 | Hoài Mỹ master PCM |
| `v9-processed/azure-north/` | 8,842 | Nam Minh served WAVs |
| `v9-processed/azure-south/` | 8,839 | Hoài Mỹ served WAVs |
| Total | ~40,000 | ~1.4 GB |

Coverage: full curricula (Explore Vietnam + Professional + Heritage, A1 → C2), all article titles and sentences, top 3,000 Vietnamese words by subtitle frequency, and the ~468 Tone Trainer minimal-pair words.

Lifetime Azure usage: ~700K characters (F0 free tier crossed once, now on S0).

## Scripts
All in `scripts/`:
- `prebuild-tts.mjs` — warm-up: walks `src/data/` for known Vietnamese keys, optionally adds top-N dictionary words, POSTs to `/api/tts`. Idempotent.
- `backfill-tts-source.mjs` — one-shot migration: ensures every cached string has a source PCM. Used 2026-05-24.
- `backup-tts.mjs` — downloads files referenced by the app's curriculum to a local folder.
- `mirror-bucket.mjs` — full-bucket mirror (for home-PC cron, see [backups-recovery]).
- `rename-tts-version.mjs` — bulk-renames a version folder in Supabase via the move API.
- `cleanup-legacy-tts.mjs` — deletes obsolete folders.

## Server code
All TTS logic lives in `server/server.js`:
- `ttsCacheKey`, `ttsSourceKey`, `ttsPublicUrl`, `ttsCacheHas`, `ttsCacheGetBuffer`, `ttsCachePut` — bucket helpers.
- `synthesizeWithAzureSourcePcm`, `deriveAzureWav`, `synthesizeWithAzure` — Azure pipeline.
- `synthesizeWithGoogleTranslate` — last-resort fallback (no post-processing).
- `app.get('/api/tts', ...)` — the endpoint itself.

## Cold-start latency (brand-new sentences)
The cache makes warm playback instant, but a string that has **never** been synthesized pays full freight. Measured on prod (2026-06-11), same sentence, cache miss:

| | Google | Azure (Nam Minh) |
| --- | --- | --- |
| Time to first byte | ~0.73 s | **~1.66 s** |
| Payload | 29 KB mp3 | 114 KB WAV |

The ~0.9 s gap is **Azure neural synthesis being inherently heavier** than Google's `translate_tts`, plus server-side PCM post-processing — almost all of it before the first byte (transfer is the last ~0.14 s). It is **not** network distance: the Zeabur server is in Tokyo (`ap-northeast-1`) and Azure Speech is `eastasia` (Hong Kong), ~50 ms apart. So for genuinely novel text, ~1.5 s is irreducible; the fix is to make it *not* novel (warm ahead of the tap) or make the wait feel intentional.

Mitigations shipped (commit `b04452e`):
- **`src/utils/speak.js`** broadcasts per-text state (`loading`/`playing`/`idle`); the **`useSpeakingState(text)`** hook drives a spinner on speaker buttons during the cold-synth gap. Warm/preloaded clips jump straight to `playing`, so the spinner never flashes for cached audio.
- **`preloadSpeak()`** now fires on the read-aloud surfaces that used to play cold — article sentences (Reading Library), Word Popup, Dictionary headword — so a tap hits a warm cache. (LessonGame already did this for multiple-choice, which is why those always felt instant.)
- **`scripts/prebuild-tts.mjs` bug fix**: it warmed `/api/tts` **without** the app's `ck` cache version, populating a different cache slot than the client reads (client uses `tts-v10-voice-preview-<voice>`). Now sends the matching `ck` and defaults to `azure-north`. Note: a *full* `302 → CDN` warm only pays off once the R2 public URL works — see [2026-06-11-r2-public-url-custom-domain](../../decisions/2026-06-11-r2-public-url-custom-domain.md).

## Voice availability
`src/data/ttsVoices.js` is the single source of truth for which voices are offered. **Google is always on**; the Azure "reading voices" are toggleable. **`azure-south` ships disabled by default** (the southern Hoài Mỹ voice is unstable) — off for every user via the code default, with a per-device admin override at **Admin → Voice Settings** (`src/pages/Admin/VoiceSettings.jsx`). The TopBar picker, onboarding, and `speak.js` all filter to enabled voices and fall back (north → Google) if a saved selection is disabled.

## Word-timed variant (Narrated Reader)
Separate from this main `/api/tts` path, the [narrated-reader](narrated-reader.md) needs **per-word timings** for karaoke highlighting, which `/api/tts` can't provide. That uses a distinct **Azure-free, offline** pipeline — **VieNeu-TTS** (open Apache-2.0 model) → 24 kHz WAV → **CTC forced alignment** → `marks.json`, generated by `scripts/generate_explainer_audio.py` and served as a pre-baked cache by **`/api/tts-timed`** (`server/tts-timed-cache/<key>.wav|.json`). See [2026-06-17-narrated-reader-azure-free-timing](../../decisions/2026-06-17-narrated-reader-azure-free-timing.md). The main `/api/tts` here is unchanged (still Azure REST + Google fallback); migrating it to VieNeu is an open follow-up.

## Deeper doc
See `docs/tts-cache.md` for the exhaustive operational reference: setup, env vars, failure modes, capacity envelope, reference-run logs, and future-improvement backlog.

## History
- 2026-05-22: Single-tier cache shipped. All audio at `<voice>/<sha1>.wav`.
- 2026-05-23: First voice-quality iteration created the `TTS_CACHE_VERSION` prefix concept (`v9-nam-minh-lower`). Old files orphaned.
- 2026-05-23: F0 quota exhausted mid-warmup → moved to S0 ([see decision](../../decisions/2026-05-23-azure-s0-pricing-tier.md)).
- 2026-05-23: Two-tier cache shipped ([see decision](../../decisions/2026-05-23-two-tier-tts-cache.md)). Source backfill ran the same day.
- 2026-05-24: Folder renamed `v9-nam-minh-lower` → `v9-processed` for clarity ([see decision](../../decisions/2026-05-24-v9-processed-rename.md)).
- 2026-06-11: Disabled `azure-south` by default (unstable) + added Admin → Voice Settings toggle; Google always on (`src/data/ttsVoices.js`).
- 2026-06-11: Cold-synth latency diagnosed + mitigated — per-text loading spinner, `preloadSpeak` on read-aloud surfaces, and a `prebuild-tts.mjs` cache-key fix (commit `b04452e`). Found R2 public-URL misconfig → [custom-domain decision](../../decisions/2026-06-11-r2-public-url-custom-domain.md).
- 2026-06-17: Added a separate **Azure-free word-timed** path for the [narrated-reader](narrated-reader.md) — VieNeu-TTS + CTC forced alignment, offline-generated, served by `/api/tts-timed` ([decision](../../decisions/2026-06-17-narrated-reader-azure-free-timing.md)). Main `/api/tts` unchanged.
