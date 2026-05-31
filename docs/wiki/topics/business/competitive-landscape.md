---
title: Competitive Landscape — Vietnamese Learning Apps
type: topic
slug: competitive-landscape
date: 2026-05-29
updated: 2026-05-29
belongs_to: [niko]
source: synthesis
status: active
tags: [competition, positioning, market]
related: [han-viet-moat, pricing-and-unit-economics, vietnamy-app, pronunciation-assessment]
---

## Summary

Vietnamy operates in a market where every major language app technically offers Vietnamese but none does it well. The two consistent gaps across competitors are (a) **no tone grading** — text-match scoring can't detect tone errors, the single most distinctive feature of Vietnamese; and (b) **no Hán-Việt overlay** — the Sino-Vietnamese vocabulary that gives Mandarin speakers a 60% head start is invisible everywhere else. Vietnamy is the only entrant taking both seriously, and the only one with B2B seat-based plans.

## The 2×2 we sit in

Axes: tone-grading (x) vs. Sino-aware curriculum (y). Vietnamy is alone in the upper-right quadrant.

```
                           Sino-aware
                              ↑
                              |
                              |               Vietnamy ★
                              |
                              |     Hello Chinese (CN→VN)
                              |
   ─────────────── ───────────┼─────────── ────────────────
                              |     italki tutors
   Babbel  Pimsleur           |
   Duolingo  Ling             |
   Rosetta Stone              |
                              ↓
                          Generic UX
   No tone grading                              Tone AI grading
```

## Competitor notes

### Duolingo
- **Vietnamese course exists**, gamified, free with Super (~USD $9.99 / mo).
- **No tone grading.** Speaking exercises rely on browser STT + text match. A learner mispronouncing every tone can still get 5/5.
- **No Hán-Việt exposure.** Vocabulary is presented as opaque syllables.
- **No B2B.** Duolingo for Business does not include Vietnamese as of May 2026.
- **Course depth:** A1 only. No B2 / C1 content for business learners.
- **Why we win:** depth + tone + Hán-Việt + enterprise plans.

### Ling
- Specializes in less-common Asian languages including Vietnamese.
- Subscription ~USD $6.99–14.99 / mo depending on plan.
- Chatbot tutor with scripted dialogues; no real STT grading.
- No Hán-Việt; targets generic English-speaking traveler.
- **Why we win:** AI tone scoring, Hán-Việt, dual-dialect TTS, B2B.

### Pimsleur
- Audio-first, very strong on pronunciation drills (no tone grading though — recall-based).
- ~USD $20+ / mo. Premium pricing.
- No interactive grading, no analytics, no enterprise plans.
- Excellent for audio learners but no community, no SRS, no reading content.
- **Why we win:** interactive grading, visual reading library, B2B seats.

### Babbel
- Largest course depth among consumer apps. ~USD $12 / mo, lifetime ~$300.
- Vietnamese is **not** in Babbel's offering (as of May 2026 — Babbel covers 14 languages, none of which is Vietnamese).
- **Why we win:** they don't compete in this category.

### Rosetta Stone
- Enterprise-strength (B2B exists for English and select languages).
- Vietnamese is **not** in Rosetta's enterprise catalog.
- TruAccent claims tone scoring for tonal languages but lacks Vietnamese parity.
- **Why we win:** they don't compete in Vietnamese; we offer the same enterprise model.

### italki (tutors)
- 1:1 human tutors, ~USD $10–25 per 30-min lesson.
- Highest-quality output; no scale, no async product, no curriculum continuity.
- Complementary rather than head-on: Vietnamy users may book italki tutors for live practice.
- **Why we win:** async, gamified, scalable, B2B seat licenses for teams that can't afford per-employee tutoring.

### Hello Chinese (CN → VN edge case)
- Hello Chinese is a popular Mandarin-learning app. Not directly competitive.
- Mentioned because Hello Chinese has demonstrated that the Mandarin↔Sino-language angle works; we're the inverse.
- **Why we win / lose:** orthogonal — different language pair.

### Pimsleur, Memrise, Mango, FluentU, etc.
- Same pattern as Duolingo: shallow Vietnamese courses, no tone grading, no Hán-Việt, no B2B.

## What we do that nobody else does

1. **Azure Pronunciation Assessment** for phoneme-level tone scoring. See [pronunciation-assessment].
2. **Hán-Việt overlay** with 漢字 + pinyin on every Sino-derived word. See [han-viet-moat].
3. **Multi-dialect TTS** — Northern (Nam Minh) and Southern (Hoài Mỹ) voices on every word.
4. **Three learner paths** in one product (Explore / Professional / Heritage).
5. **B2B seat-based plans** with admin dashboard + custom corporate vocab.
6. **9 UI languages** including 繁體中文 and 簡體中文 — Mandarin learners read in their native language.

## What we're worse at (honest)

- **Mobile distribution.** PWA only today; competitors have App Store / Play Store presence. Mitigation: Capacitor wrap shipping Q3 2026 (see [mobile-strategy]).
- **Brand reach.** Duolingo and Babbel have global marketing budgets we can't match. Mitigation: founder-led content + NTU/VSA distribution + B2B funded paid acquisition.
- **Live tutors.** italki has the marketplace. Mitigation: don't compete; integrate later.

## Open questions

- Should we publish a public head-to-head comparison page on the marketing site? (High SEO value, polarizing.)
- Whether italki / Vietnamy referral integration is worth pursuing or distracting.
- How to monitor when Duolingo finally adds tone-grading or Hán-Việt — both are inevitable; we want a 12+ month head start.

## History

- 2026-05-29 — Compiled during pitch deck research after surveying public pricing pages and product feature sets of all listed competitors.

## Sources

- Direct app inspection (Duolingo, Ling, Pimsleur) — May 2026.
- Public pricing pages of Babbel, Rosetta Stone, italki.
- Pitch deck slide 13, `Vietnamy_Pitch_Deck_2026.pptx`.
