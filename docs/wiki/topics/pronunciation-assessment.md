---
title: Pronunciation Assessment
type: topic
slug: pronunciation-assessment
date: 2026-05-23
updated: 2026-05-23
belongs_to: [niko]
source: synthesis
status: active
tags: [azure, pronunciation, speaking, tones]
related: [tts-pipeline, tone-trainer, vietnamy-app, 2026-05-23-pronunciation-assessment-for-grading]
---

## Summary
Azure Speech Pronunciation Assessment provides per-phoneme accuracy scoring for user-spoken Vietnamese. It's the only reliable way to detect tone errors — browser STT transcribes `mã` and `má` to the same text, masking pronunciation mistakes from a transcript-based grader. Vietnamy uses it as the primary grading signal in `speak_sentence` exercises and as the entire engine for the Tone Trainer practice module.

## Endpoint
`POST /api/pronunciation?text=<reference>` in `server/server.js`.

**Request:** raw 16 kHz mono PCM WAV body, the user's recording.

**Response:** JSON with four 0–100 scores and per-word breakdown.

```json
{
  "recognized": "xin chào",
  "status": "Success",
  "scores": {
    "accuracy": 92,
    "fluency": 88,
    "completeness": 100,
    "pronunciation": 90
  },
  "words": [
    { "word": "xin", "accuracy": 95, "errorType": "None", "phonemes": [...] },
    { "word": "chào", "accuracy": 89, "errorType": "None", "phonemes": [...] }
  ]
}
```

`errorType` ∈ `None | Mispronunciation | Omission | Insertion`.

## Client recording
`src/utils/recordPCM.js` records mic audio via `AudioContext` + `ScriptProcessorNode`, downsamples to 16 kHz mono, packs as a WAV `Blob` ready to POST. Works in all browsers including Safari iOS WebView (verified — required for Capacitor mobile port).

## Two consumer surfaces

### 1. `speak_sentence` lesson exercises
In `src/components/LessonGame.jsx`. Flow:
- User taps the mic. Both PCM recording AND browser `webkitSpeechRecognition` start in parallel.
- User taps stop. PCM uploads to `/api/pronunciation`. Browser STT result is already in state.
- **Primary grading**: if Azure returns scores, grade by `pronunciation >= 70`.
- **Fallback grading**: if Azure fails (outage, 502, etc.), fall back to fuzzy text-match against the browser STT transcript. Tone errors silently pass on the fallback, which is the honest trade-off — keeping the app usable beats blocking the user.
- UI renders the four big scores plus a coloured chip strip showing per-word accuracy (green ≥80, yellow ≥60, red <60, strikethrough for omissions).

### 2. Tone Trainer practice module
See [tone-trainer]. Dedicated minimal-pair drill that uses the single-word `accuracy` score from this endpoint as the round result.

## Cost
- Azure free tier includes **5 hours/month of audio**.
- Beyond that, ~$1 per audio hour on S0.
- A typical learner practicing 10 min/day stays inside the free tier indefinitely.
- The $200 Azure credit covers ~200 paid hours on top, equivalent to thousands of practice sessions.

## Failure modes
- **Mic denied** → typed input fallback in `speak_sentence`. Tone Trainer shows an error and won't proceed.
- **Azure outage / 502** → fuzzy text grading via browser STT transcript (lessons), or "Scoring unavailable" message (Tone Trainer).
- **Empty audio** → "No speech detected" + retry prompt.

## Open questions
- Calibrating the pass threshold per CEFR level — currently a flat 70 for all `speak_sentence` exercises. May want lower at A1, higher at B2+.
- Surfacing per-phoneme detail to the user (currently only per-word). The data is there in the JSON; the UI doesn't render it yet.
