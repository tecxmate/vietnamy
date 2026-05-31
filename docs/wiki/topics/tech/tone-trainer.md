---
title: Tone Trainer
type: topic
slug: tone-trainer
date: 2026-05-23
updated: 2026-05-30
belongs_to: [niko]
source: synthesis
status: active
tags: [practice, tones, pronunciation]
related: [pronunciation-assessment, tone-training-data, curriculum-paths]
---

## Summary
Tone learning lives in the **Sounds tab → Tones section** as a single guided lesson (`ToneLesson`) with three steps — **Learn → Identify → Speak**. This replaced the old standalone `ToneTrainer` module and the orphaned `TonePractice*` / `TonePitchTraining*` practice routes, folding their value (recognition quiz + spoken production) into one intentional flow. The lesson is also deep-linked from the Grammar tab ("Pronunciation → Tone Lesson").

## Mechanics
- **Learn** — carousel through all 6 tones. Each shows an animated pitch-contour graph (the dot traces the curve in time with the spoken syllable), the tone name/label/description, and an auto-played example word from the canonical `ma / má / mà / mả / mã / mạ` minimal set.
- **Identify** — listen-and-pick quiz (8 questions across the 6 tones), scored with correct/incorrect feedback.
- **Speak** — record the example word via mic. The learner's **pitch contour is extracted client-side** (autocorrelation F0, normalized to semitones around their own median, smoothed, resampled to ~24 points) and **overlaid on the target contour** ("Target" solid vs "You" dashed). The verdict comes from **pitch-shape classification** — the produced contour is matched against all 6 tone templates and is correct only if it best matches the target. Azure's transcript is shown as a small hint, not the judge.

A summary screen reports the Identify score and the percentage of tones spoken right.

## Why shape, not Azure recognition
Azure `vi-VN` speech recognition is **too lenient about tone** — its language model will "hear" the right toned word even when the pitch is wrong (observed: a clearly non-falling attempt at `mà` was still recognized as `Mà`). And Azure Pronunciation Assessment does **not support Vietnamese** (only ~33 locales; vi-VN isn't one), so it returns no accuracy score. The learner's actual pitch contour is the only reliable signal we have, so the verdict is based on contour-shape classification.

## Known limitation
F0-template matching is **not robust** for tone grading and produces false negatives — even for native speakers. Root causes:
- **Glottalization defines Ngã/Nặng**, not pitch; the glottal stop breaks voicing so F0 tracking drops out or octave-errors, and gap-filling smooths away the defining feature.
- **Timing isn't aligned** between a correct-but-time-shifted contour and the template.
- **Dialect**: templates are Hanoi (Northern); Southern/Central merges Ngã↔Hỏi and weakens the glottal break.

The accepted path forward is a small **learned** tone-scoring model trained on real labeled data — see [Tone Training Data](tone-training-data.md).

## Files
- `src/components/Sounds/ToneLesson.jsx` — the 3-step lesson (Learn/Identify/Speak, self-labeling, summary).
- `src/components/Sounds/PitchGraph.jsx` — animated SVG pitch-contour graph + user-pitch overlay.
- `src/utils/pitch.js` — autocorrelation F0 tracking (`pitchContourFromSamples`) and contour classification (`classifyContour`).
- `src/utils/recordPCM.js` — mic capture; `stop()` returns the WAV blob and exposes the 16 kHz samples for local pitch analysis.
- `src/data/toneContours.js` — reference contours + practice words.
- Entry points: Sounds tab Tones section CTA; Grammar tab "Pronunciation → Tone Lesson" (deep-links via `location.state.openToneLesson`). Old `/practice/tones` and `/practice/tone-trainer` now redirect into the lesson.

## Open questions
- When do we switch the Speak verdict from the heuristic classifier to a trained model? (Needs enough labeled samples — see [Tone Training Data](tone-training-data.md).)
- Dialect-conditioned templates / scoring (Northern vs Southern Ngã/Hỏi).
- Per-tone difficulty progression and adaptive selection of the tones a learner keeps failing.

## History
- 2026-05-23 — Original standalone Tone Trainer (Azure-scored minimal-pair production drill) ([decision](../../decisions/2026-05-23-pronunciation-assessment-for-grading.md)).
- 2026-05-30 — Replaced standalone module + orphaned tone routes with the Sounds-tab Learn→Identify→Speak lesson; added client-side pitch overlay and shape-classification verdict; demoted Azure recognition to a hint after confirming vi-VN tone leniency and lack of pronunciation-assessment support.
