---
title: Tone Trainer
type: topic
slug: tone-trainer
date: 2026-05-23
updated: 2026-05-24
belongs_to: [niko]
source: synthesis
status: active
tags: [practice, tones, pronunciation]
related: [pronunciation-assessment, curriculum-paths]
---

## Summary
The Tone Trainer is a dedicated practice module that asks the user to produce a specific Vietnamese tone and scores them with Azure Pronunciation Assessment. Unlike the existing `TonePractice*` modules — which test tone *recognition* by playing audio and asking the user to pick the right tone — the Tone Trainer tests tone *production*. Critical because production is where learners actually fail, and tone errors are exactly what tonal-language apps usually can't grade.

## Mechanics
Per session (10 rounds):
1. Pick a minimal-pair cluster (e.g. `ma / má / mà / mả / mã / mạ`).
2. Pick a target word from that cluster (e.g. `mả`).
3. Show the target word large, with its tone label (`Hỏi · Dipping`) and meaning ("grave / tomb"). Auto-play the model audio.
4. Show all same-base alternatives below as visual context.
5. User taps mic, says the word.
6. PCM uploads to `/api/pronunciation`. Server returns per-word accuracy.
7. Coloured result card: ≥80 green, ≥60 yellow, <60 red. Plus "Azure heard: <recognized>" and a hint if `errorType` is `Mispronunciation`.
8. User can Retry (no score recorded) or Next.

After 10 rounds: average accuracy + pass count summary screen.

## Content
`src/data/toneTrainerData.js` exports `TONE_TRAINER_PAIRS`. 111 minimal-pair clusters covering:
- **Open single-syllables** across all common base vowels (a, ê, ô, ơ, e, i, o, u, ư).
- **Glide-final pairs** (-ai, -ay, -ao, -au, -eo, -ưu).
- **Closed nasal finals** (-n, -m, -ng, -nh) including the classic `tinh/tính/tình/tỉnh/tĩnh/tịnh` family.
- **Closed stop finals** (-p, -t, -c, -ch) where only sắc/nặng are valid.
- **Classic learner-trap pairs** (`tôi/tối/tồi/tội`, `môi/mối/mồi/mỗi`, `đôi/đối/đồi/đổi/đội`).
- **Two-syllable real phrases** (`gia đình`, `cảm ơn`, `xin lỗi`, `bạn bè`) with common misreadings.

468 real-word targets after filtering out `(rare)` / `(misreading)` entries via `isRealWord()`. Session duplicate-prevention ensures a 10-round drill picks 10 distinct words.

## Files
- `src/pages/Practice/ToneTrainer.jsx` — module component.
- `src/data/toneTrainerData.js` — minimal-pair data.
- Route: `/practice/tone-trainer` (wired in `src/App.jsx`).
- Entry: Grammar tab → "Pronunciation" section (`src/components/Tabs/GrammarTab.jsx`).

## Audio coverage
All 468 target words are warmed in both Nam Minh and Hoài Mỹ voices. The pre-gen script's `VI_KEY_PATTERN` includes `word` so the tone-trainer data is automatically picked up alongside curriculum strings.

## Open questions
- Per-tone difficulty progression — currently a flat random pick. Could group rounds by tone for focused practice, or adapt based on which tones the user keeps failing.
- Phoneme-level feedback — Azure returns it but the UI doesn't render it. Worth surfacing to show users which segment of the word was off, not just "your tone was wrong."
