---
title: Narrated Reader + Azure-free word timing (VieNeu-TTS + forced alignment)
type: decision
slug: 2026-06-17-narrated-reader-azure-free-timing
date: 2026-06-17
attributed_to: [niko]
belongs_to: [narrated-reader, tts-pipeline]
source: chat
status: active
tags: [reader, tts, word-timing, vieneu, forced-alignment, azure, open-source]
related: [narrated-reader, tts-pipeline, 2026-06-11-r2-public-url-custom-domain]
---

## Context
The reading experience was reworked into a **Narrated Reader** — slide deck synced to narration with word-by-word karaoke highlighting (see [narrated-reader](../topics/tech/narrated-reader.md)) — and promoted to its own **Reader tab, replacing Watch**. The karaoke sweep shipped as a client-side syllable estimate (v1, no backend). For pixel-accurate highlighting (Phase 4) we needed real per-word timings.

First we prototyped that with the **Azure Speech SDK `WordBoundary`** events (confirmed via Microsoft Learn: `audioOffset`/`duration` in ticks; JS class `SpeechSynthesisWordBoundaryEventArgs`; only the SDK/batch API expose it, not the REST endpoint `/api/tts` uses). Niko then asked to drop Azure entirely ("i really hate azure") and evaluate open Vietnamese TTS on Hugging Face — specifically **VieNeu-TTS**.

## Decision
Replace the Azure timing path with a **vendor-neutral, offline pipeline**, and serve it from a pre-baked cache:
- **TTS:** [VieNeu-TTS](https://huggingface.co/pnnbao-ump/VieNeu-TTS) (open, Apache-2.0, NeuTTS-Air-based, GGUF/llama.cpp, on-device, voice cloning).
- **Timing:** **CTC forced alignment** (`ctc-forced-aligner`, MMS/wav2vec2, ISO `vie`) of the generated WAV against the known transcript → per-word timestamps. Vendor-neutral: works with any audio source.
- **Serving:** `scripts/generate_explainer_audio.py` writes `<key>.wav` + `<key>.json` into `server/tts-timed-cache/` (`key = sha1("timed|{voice}|vi|{text}")`); `GET /api/tts-timed` just reads that cache (`{audioBase64, marks}`), 503 → client estimate fallback. The Azure Speech SDK and its npm dependency were removed from the server.

Generation is **offline and cached forever**, so it needs no live GPU/Azure at request time. It runs on Niko's hardware: an **M1 Pro** (recommended — VieNeu GGUF real-time via Accelerate/Metal) or, slower, a **CPU-only Ryzen 2500G**.

## Rationale
- Niko wants off Azure; open weights remove the vendor, the S0 cost, and the eastasia dependency. [niko]
- Forced alignment is **better than betting on one vendor's word events** — it's portable across TTS engines and even works on Google/Azure audio if ever needed.
- Fits the existing architecture: audio is already cached forever after first synthesis (see [tts-pipeline](../topics/tech/tts-pipeline.md)), so slow offline generation is fine; runtime just serves static files.
- Voice cloning is a bonus: a northern + southern reference clip can stand in for `azure-north`/`azure-south` (kept only as cache-key ids now).
- Rejected: keeping the live Azure SDK path (defeats the goal); `facebook/mms-tts-vie` and friends were noted as lighter alternatives but VieNeu/F5 win on quality.

## Consequences
- `microsoft-cognitiveservices-speech-sdk` uninstalled from `server/`; `/api/tts-timed` no longer synthesizes — it serves the offline cache.
- New: `scripts/generate_explainer_audio.py`, `scripts/export-explainers.mjs`, `scripts/requirements-tts.txt`, `scripts/README-tts-timed.md`. `server/tts-timed-cache/` + `scripts/voices/` gitignored.
- **Niko's to run:** install the Python deps, drop in reference clips, run the generator on the M1 Pro/Ryzen to populate the cache. Until then the reader works on the v1 syllable estimate (no Exact badge).
- The app's **main `/api/tts` still uses its existing providers** (Azure REST + Google fallback); migrating that off Azure too is a documented follow-up, not done here.
- Production follow-up: move `tts-timed-cache` into the R2/Supabase bucket and redirect to the CDN instead of inlining base64.

## Provenance
- Discussed 2026-06-17 between [niko] (owner) and [claude-opus] (agent): built the reader, swapped Watch→Reader, prototyped Azure WordBoundary, then pivoted to VieNeu-TTS + forced alignment after Niko's request and a HW check (M1 Pro vs Ryzen 2500G — both viable, GGUF needs no CUDA).
- Verified end-to-end with a dummy cache entry: `/api/tts-timed` 200, "Exact" badge, per-syllable marks correctly highlighting compound segments; missing sentences fall back. `buildExactWindows` unit-tested. VieNeu/aligner run on Niko's machine.
- Implementing commit: see this change set.
