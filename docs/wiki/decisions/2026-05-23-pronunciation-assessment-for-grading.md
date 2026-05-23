---
title: Pronunciation Assessment as Primary Grading Signal
type: decision
slug: 2026-05-23-pronunciation-assessment-for-grading
date: 2026-05-23
attributed_to: [niko]
belongs_to: [pronunciation-assessment]
source: chat
status: active
tags: [pronunciation, azure, grading, speaking]
related: [pronunciation-assessment, tone-trainer]
---

## Context
The original `speak_sentence` exercise used the browser's `webkitSpeechRecognition` API to transcribe what the user said, then fuzzy-matched the transcript against the reference text. This works for English but is a poor fit for Vietnamese: browser STT transcribes `mã` (code) and `má` (mother) as the same text, so tone errors silently pass grading. For a tonal-language learning app, this hides the most important error category from the learner.

## Decision
Replace browser STT with **Azure Speech Pronunciation Assessment** as the primary grading signal for `speak_sentence`. Grading threshold: accuracy ≥ 70 → correct. Browser STT continues to run in parallel as a fallback transcript source — if Azure is unreachable, the lesson still grades against the STT transcript with the existing fuzzy text match (silently accepting tone errors, but keeping the app usable).

## Rationale
- Phoneme-level scoring is the only way to objectively detect tone errors.
- Azure free tier includes 5 hours/month of pronunciation audio — covers a normal user practicing 10 min/day indefinitely.
- $200 credit covers ~200 paid hours beyond that — thousands of practice sessions before any cost concern.
- Per-word `errorType` (`Mispronunciation`, `Omission`, `Insertion`) lets the UI show users *which* syllable was wrong, not just a binary correct/wrong.
- Parallel browser STT preserves graceful degradation during Azure outages.

## Consequences
- New server endpoint `POST /api/pronunciation?text=<ref>` accepting raw 16 kHz WAV bodies. Returns Azure's accuracy / fluency / completeness / pronunciation scores + per-word breakdown.
- New client utility `src/utils/recordPCM.js` capturing mic audio via `AudioContext` and `ScriptProcessorNode`, downsampling to 16 kHz, packing as WAV Blob.
- `src/components/LessonGame.jsx` updated to record PCM, upload to `/api/pronunciation`, render the score panel, and grade by `pronunciation >= 70`. Browser STT runs in parallel as fallback.
- Spawned the Tone Trainer practice module (`src/pages/Practice/ToneTrainer.jsx`) which uses the same endpoint for production-side tone drilling.
- iOS WebView compatibility verified — critical for the eventual Capacitor mobile port (see [mobile-strategy]).

## Provenance
- Designed and shipped 2026-05-23 in commit `8a20317`.
- Parallel STT fallback added in commit `998fa8a` after Niko asked "What if Azure is down?".
- Tone Trainer landed in commit `7ed8df2`.
