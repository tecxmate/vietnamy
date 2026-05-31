---
title: Hán-Việt as a Competitive Moat
type: topic
slug: han-viet-moat
date: 2026-05-29
updated: 2026-05-29
belongs_to: [niko]
source: synthesis
status: active
tags: [moat, differentiation, product, content]
related: [tw-vn-business-corridor, competitive-landscape, vietnamy-app, pronunciation-assessment]
---

## Summary

Vietnamese vocabulary is **50–70% Sino-derived** (Hán-Việt, 漢越) — borrowed from Classical and Middle Chinese during ~1,000 years of Chinese rule. In formal, business, and technical contexts the figure rises to ~60%. Mandarin and Cantonese speakers already half-know Vietnamese, but no major language-learning app exposes the Sino-Vietnamese layer. Vietnamy does. This is the single largest unfair advantage we can offer Chinese-character-speaking learners — and the basis of our differentiation versus Duolingo, Ling, Pimsleur, and Babbel.

## The mechanic

Each Hán-Việt word is presented as a card showing:

1. The Vietnamese spelling (e.g. **vạn sự như ý**).
2. The corresponding Chinese characters (萬事如意), one per syllable, with pinyin (wàn shì rú yì) and a gloss.
3. A bilingual phrase example: "Chúc bạn vạn sự như ý trong cuộc sống. / 祝你生活萬事如意。"

Pedagogically this works because Sino-Vietnamese morphemes preserve **systematic sound correspondences** from Middle Chinese. Once a learner internalizes a few hundred mappings (法 → pháp, 國 → quốc, 學 → học), thousands of compound words become decodable on sight.

## Why this is defensible

- **Content depth, not algorithm depth.** The moat is a hand-curated mapping of ~3,000 Sino-Vietnamese morphemes plus example compounds. A competitor would need to redo this work from scratch.
- **Cross-listed dictionary.** Vietnamy's dictionary surfaces the Hán-Việt overlay automatically for any word containing a Sino root. Competitors would need to rebuild their dictionary schema to support multi-script entries.
- **Aligned with the actual buyer.** Our enterprise buyers (CTBC Bank, TW manufacturers in VN) are exactly the Mandarin-native learners this feature serves best.
- **No competitor has signalled intent.** Duolingo's Vietnamese course doesn't acknowledge Hán-Việt; Ling treats it as background trivia; Pimsleur is audio-only.

## Scope of the asset (current state)

- **8 dictionary databases** in `server/databases/` covering Vietnamese ↔ English, Mandarin (Simplified + Traditional), Sino-Vietnamese (漢越), Korean, Japanese, French, German, and 2 more.
- **Sentence-aligned reading library** that highlights Sino-Vietnamese words in red and offers tap-to-expand character cards.
- **9 UI languages** so a learner can read explanations in English, 簡體中文, 繁體中文, 日本語, 한국어, Français, Deutsch, Italiano, Norsk, or Español.

## Where it shows up in product

- **Dictionary detail view** — every Sino-derived word renders the Hán-Việt card above the standard meaning.
- **Reading library** — Sino-derived words have a distinct highlight; tap to inspect character composition.
- **Lesson exercises** — vocabulary cards for Professional and Heritage paths surface the 漢字 alongside Vietnamese.

## Strategic implications

- **B2C positioning angle.** "Vietnamese is half-Chinese. We unlock that half on day one." Targets Mandarin/Cantonese speakers, Heritage learners, and Chinese-character-fluent diaspora.
- **B2B angle for TW enterprises.** A Foxconn line supervisor with a junior-high level of Chinese already knows ~60% of the technical Vietnamese they'll encounter. We make that visible. Halves time-to-proficiency.
- **International expansion.** Korean (~60% Sino-Korean) and Japanese (~60% Sino-Japanese) speakers benefit from the same mapping. The same Hán-Việt asset extends Vietnamy into KR and JP markets without rewriting the moat.

## Open questions

- Do we surface Hán-Việt by default to all learners, or gate it behind a "Reading mode" toggle so it doesn't overwhelm beginners with no Chinese-character background?
- How much should the Tone Trainer cross-link with Hán-Việt? (e.g. show that 發 → pháp / phát depending on tone family.)
- Whether to publish a free public "Hán-Việt explorer" web page as a content-marketing top-of-funnel.

## History

- 2026-05-29 — Identified as the primary B2B differentiator during pitch deck research. Paired with Azure Pronunciation Assessment (see [pronunciation-assessment]) as the two-pillar moat.

## Sources

- Wikipedia, "Sino-Vietnamese vocabulary" — https://en.wikipedia.org/wiki/Sino-Vietnamese_vocabulary
- Talkpal, "How much of Vietnamese vocabulary is of Chinese origin?" — https://talkpal.ai/culture/how-much-of-vietnamese-vocabulary-is-of-chinese-origin/
- Multidisciplinary Journals, "Some Influences of the Sino-Vietnamese Words"
