---
title: Pronunciation Explanations for Chinese Learners are a Curriculum Task (Bopomofo / Pinyin), Not Translation
type: decision
slug: 2026-06-11-chinese-pronunciation-curriculum
date: 2026-06-11
attributed_to: [niko]
belongs_to: [curriculum-paths]
source: chat
status: active
tags: [curriculum, i18n, pronunciation, sounds, content]
related: [curriculum-paths, 2026-05-23-pronunciation-assessment-for-grading]
---

## Context
The app's pronunciation explanations anchor each Vietnamese sound to an **English word** — `alphabet.js` `sound: 'ah'`, `vowels.js` `sound: '"ah" as in <b>father</b>'`, the tone descriptions, etc. While localizing the app to Chinese (en / zh-s / zh-t), [niko] flagged that these explanations **cannot be literally translated**: "father", "see", "hot" are meaningless anchors to a Chinese speaker. The sound itself has to be re-explained against a phonetic system the learner already owns.

## Decision
Treat the Chinese pronunciation explanations as a **curriculum task, not a translation task**. Re-author each Vietnamese sound's explanation against the learner's native phonetic system:
- **zh-t (Traditional / Taiwan)** → anchor to **Bopomofo (注音符號)** — e.g. ㄚ, ㄧ, ㄨ.
- **zh-s (Simplified / Mainland)** → anchor to **Pinyin** — e.g. a, yī, wū.

Where a Vietnamese sound has **no clean Mandarin equivalent**, give a "closest sound + how to adjust" explanation rather than forcing a false 1:1 mapping. Sequence: (1) draft a full mapping table reviewed by [niko] / a native TW + CN speaker **before** shipping; (2) add a per-language `sound` field to the schema + editors; (3) wire it so zh-t learners see Bopomofo and zh-s learners see Pinyin. Do **not** mass-author unreviewed phonetics — wrong anchors teach wrong pronunciation. Status `proposed`: execute when the English curriculum side is stable enough.

## Rationale
- English-anchored explanations are invisible to Chinese speakers; a literal translation of "as in father" localizes the words but not the *teaching*. [niko] (native Vietnamese speaker, fluent in the Chinese-learner context) named this as the gap.
- The hard cases are what make it curriculum: **ư /ɯ/** (closest = the buzzing vowel in 思/資, lips flat), **â /ə/ & ơ /əː/** (Mandarin has no true schwa; closest = a short ㄜ), and tones **ngã (~)** + **nặng (.)** (glottal/creaky voice Mandarin lacks). The four mappable tones do bridge to Mandarin tones (sắc ´ ≈ 2nd 陽平, hỏi ? ≈ 3rd 上聲) — a useful pedagogical hook — but the glottal pair must be taught explicitly.
- Validating the mapping before authoring protects learners from being taught incorrect sounds, consistent with the app's tonal-accuracy emphasis (see [pronunciation-assessment-for-grading]).

## Consequences
- **Schema:** the single English `sound` string on `src/data/alphabet.js`, `src/data/vowels.js`, and the tone descriptions becomes a per-UI-language field (`{ en, 'zh-s', 'zh-t' }`) — one source of truth, not parallel translated files. Same multilingual-field move tracked for teaching content in `docs/AUDIT.md`.
- **Editors:** `AlphabetEditor`, `VowelsEditor`, `ToneWordEditor` gain per-language inputs.
- **Lessons:** the Sounds / Foundations pronunciation screens select the explanation by UI language.
- **Scope:** alphabet (29), single vowels (11), diphthongs/triphthongs, initial + final consonants, 6 tones.
- **Direction:** author TC (Bopomofo) as canonical and derive where possible, matching the repo's "Traditional canonical, derive Simplified" stance.

## Provenance
- Discussed 2026-06-11 between [niko] (owner) and [claude-opus] (agent).
- **Shipped 2026-06-12** (status now `active`). Per-language `sound`/`approx`/`description` sibling
  fields (`soundZhS`/`soundZhT`, …) read by `lib/pickLocalized.js` with English fallback; admin
  edit spots in the Alphabet / Vowels / Tone editors. Coverage: 29 alphabet letters, 11 single
  vowels, 26 diphthong/triphthong/centering, 6 tones — Bopomofo (zh-t) + Pinyin (zh-s). Single
  vowels + tones owner-validated; diphthongs + consonants are first-pass, correctable in the admin.
- Implementing commits: `559e316` (single vowels + tones + readers + editor columns),
  `19ed265` (diphthongs/triphthongs/centering + consonants + tone-description editor).
- Validated mapping table: `docs/curr/01_Basics/02_Pronunciation_Chinese_Mapping.md`. Captured in
  agent memory `pronunciation-chinese-curriculum`.
