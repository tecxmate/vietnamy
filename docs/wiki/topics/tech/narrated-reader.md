---
title: Narrated Reader (slide-synced karaoke reader)
type: topic
slug: narrated-reader
date: 2026-06-17
updated: 2026-06-17
belongs_to: [niko]
source: synthesis
status: active
tags: [reader, tts, karaoke, word-timing, vieneu, forced-alignment, library, explainer]
related: [tts-pipeline, vietnamy-app, curriculum-paths, 2026-06-17-narrated-reader-azure-free-timing]
---

## Summary
The Narrated Reader turns the reading experience into a **slide presentation synced to audio**: a deck of annotated photos auto-advances in step with a narration, while the transcript highlights **word-by-word (karaoke)** and any word is tappable for its meaning. Content is practical "do real things" topics (airport arrival, money/đồng, Grab) authored as a new **`explainer`** content type. It lives in its **own bottom-nav tab, "Reader," which replaced the Watch tab**. One playhead drives both the slide deck and the word sweep.

## Current state

### Surfaces & routing
- **Reader tab** (`reader`) replaced **Watch** in `NAV_TABS` (`src/App.jsx`), `BottomNav.jsx` (Headphones icon, `nav_reader`), loader/lazy. `WatchTab.jsx`/`.css` are now orphaned (not imported, left in place).
- `src/components/Tabs/ReaderTab.jsx` (+`.css`) — landing that lists explainers; opening one renders the full-screen reader.
- `src/components/Tabs/NarratedReader.jsx` (+`.css`) — the reader (slide stage, karaoke transcript, player, Explain sheet, word popup). Styled to the app's dark design tokens.

### Content
- `src/data/explainerData.js` — new `explainer` type: `{ id, type, title_*, slides[], sentences[] }`. Slides carry `image` + normalized `callouts[]` (x/y 0–1 pins) + captions; sentences carry `slide` id, `vi/en/zh`, an Explain `note`, and pre-flagged `save` phrases. One topic authored: `exp_airport_arrival` (5 slides, 12 sentences). Backward-compatible with the article shape.

### Reuse (no new building)
- Tap-to-meaning: `TappableVietnamese` + `WordPopup` + `/api/segment` (compound-aware). `TappableVietnamese` gained optional `karaokeCur` + `onSegments` props (default behaviour unchanged).
- Audio + instant playback: `buildTtsUrl` / `preloadSpeak` (see [tts-pipeline](tts-pipeline.md)); instant word definitions via `lookupWords`.
- Save phrase → `toggleDictSavedWord` (saved-words deck, already surfaced in Library).

### Word timing — two sources, one shape
`src/lib/karaokeTiming.js` produces, either way, an array of cumulative end-times (seconds) aligned to segment indices so the rAF player loop does `windows.findIndex(end => t < end)`:
- **v1 estimate** (`buildEstimateWindows`) — client-side syllable estimate, distributes the real clip duration by syllable weight. No backend. Always available.
- **Phase 4 exact** (`buildExactWindows`) — from per-word marks `[{text,offsetMs,durMs}]`. Our segments keep compounds intact, so a segment of N syllables consumes N marks; its window end = the next mark's offset. Shows an **"Exact" badge** in the mode strip.

The reader fetches `/api/tts-timed` per sentence (and prefetches the next). Success → plays the timed clip + exact marks; any failure (503) → falls back to the estimate. Resume-after-pause is free because the player binds to the real `<audio>` element's clock.

### `/api/tts-timed` — Azure-free, served from a pre-baked cache
`server/server.js`: reads `server/tts-timed-cache/<key>.wav` + `<key>.json` where `key = sha1("timed|{voice}|vi|{text}")` (helper `ttsTimedKey`, matched by the generator). Returns `{ audioBase64, contentType, marks }`; 503 when not yet generated. **No live synthesis, no Azure.** (The earlier prototype that called the Azure Speech SDK `WordBoundary` API live was removed — see the decision.)

### Offline generation pipeline (runs on Niko's machine)
- `scripts/generate_explainer_audio.py` — **VieNeu-TTS** (open Apache-2.0 Vietnamese TTS, GGUF/llama.cpp) → 24 kHz WAV → **CTC forced alignment** (`ctc-forced-aligner`, MMS/wav2vec2, lang `vie`) → `marks.json`, written into `server/tts-timed-cache/` with the server-matching key.
- `scripts/export-explainers.mjs` (sentence source of truth), `scripts/requirements-tts.txt`, `scripts/README-tts-timed.md`.
- Voice ids stay `azure-north`/`azure-south` purely as cache keys (decoupled from Azure); each maps to a VieNeu clone reference (3–5 s clip + transcript) or a preset.
- Runs real-time on an **M1 Pro** (GGUF via Accelerate/Metal); works slower on a **CPU-only box (Ryzen 2500G)**. No CUDA needed. `server/tts-timed-cache/`, `scripts/voices/` are gitignored.

## Open questions
- Push `tts-timed-cache` to the R2/Supabase bucket [tts-pipeline](tts-pipeline.md) uses and have `/api/tts-timed` redirect to the CDN instead of inlining base64 (current prototype is local-file + in-memory cache).
- Whether to migrate the app's **main** `/api/tts` off Azure to VieNeu too (it still keeps Azure REST as a fallback in its provider chain).
- Surface explainers inside the Learn path as purpose-tagged nodes (ties into [adaptive-sequencer](adaptive-sequencer.md)), not just the Reader tab.
- Phase 2 admin authoring (extend `ArticleEditor` into an explainer editor) + more topics (money, Grab, SIM). Phase 5 Shadowing/Dictation modes.

## History
- 2026-06-17: Built the Narrated Reader (Phase 1) + airport explainer; reused TappableVietnamese/WordPopup/SRS; v1 syllable-estimate karaoke bound to the real cached clip.
- 2026-06-17: Made it its own **Reader tab**, replacing Watch.
- 2026-06-17: Phase 4 word timing — first prototyped via Azure Speech SDK `WordBoundary`, then **dropped Azure** for a vendor-neutral offline pipeline (VieNeu-TTS + CTC forced alignment), `/api/tts-timed` serving a pre-baked cache. See [decision](../../decisions/2026-06-17-narrated-reader-azure-free-timing.md). Verified end-to-end with a dummy cache entry (Exact badge + compound-correct sweep); VieNeu/aligner themselves run on Niko's machine.
