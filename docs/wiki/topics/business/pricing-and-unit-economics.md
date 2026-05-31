---
title: Pricing & Unit Economics (B2B + B2C)
type: topic
slug: pricing-and-unit-economics
date: 2026-05-29
updated: 2026-05-29
belongs_to: [niko]
source: synthesis
status: proposed
tags: [pricing, revenue, gtm, b2b, b2c]
related: [tw-vn-business-corridor, customer-pipeline, payment-strategy, vietnamy-app]
---

## Summary

Vietnamy runs two revenue engines: **B2B seat-based licenses** (the wedge, validated by CTBC + 5 NTU classes) and **B2C freemium subscriptions** (the volume play). B2B unit economics are ~7× better and should fund B2C acquisition. This page captures the proposed pricing, the math behind it, and the assumptions that need to be retested as we land paying customers.

> **Status:** proposed pricing. No live billing yet. Confirm pricing tiers and discount policy with first 3 paid B2B contracts and the first paid B2C cohort before locking in.

## B2C — Consumer subscription

| Tier | Price | What you get |
| --- | --- | --- |
| Free | NT$0 | 5 lessons / day, basic dictionary, ads |
| Premium (monthly) | NT$299 / month | Unlimited lessons, Tone AI feedback, Hán-Việt unlocked, all 3 paths, no ads |
| Premium (annual) | NT$1,990 / year (≈ NT$166 / mo) | Same as monthly, 44% discount |
| Lifetime (launch promo, capped) | NT$4,990 | Limited launch offer to seed early evangelists |

**Why NT$299/mo.** Roughly aligned to Duolingo Super (~USD $9.99 / mo) at Taiwan PPP. Higher than Ling (~USD $6.99) reflects the AI tone-grading and Hán-Việt differentiators.

**B2C unit economics (Y1 working assumptions):**

- **ARPU (blended):** ~NT$200/mo (mix of free, monthly, annual).
- **CAC target:** NT$300–500. Achievable via TikTok/Instagram content, NTU VSA distribution, and bounded paid social.
- **Avg paid retention:** 4 months on monthly plan (conservative; pre-launch assumption).
- **Avg LTV:** ~NT$1,196 (4 months × NT$299).
- **LTV : CAC:** ~3 : 1 at launch. Improves materially once annual plan share rises and retention extends.

## B2B — Enterprise seat licenses

| Tier | Seat range | Price / seat / month | What's included |
| --- | --- | --- | --- |
| Team | 10–49 seats | NT$249 | Standard product, basic admin dashboard, monthly invoice |
| Growth | 50–199 seats | NT$199 | Volume discount, SSO, role-based learning paths, analytics |
| Enterprise | 200+ seats | Custom (NT$149–179 floor) | Custom corporate vocab, dedicated success manager, API, on-prem dictionary export |

Annual prepay discounts: −10% (Team), −15% (Growth), −20% (Enterprise).

**Why seat-based.** Buyer (HR or L&D) thinks in headcount; existing comparables (Duolingo for Business, Rosetta Stone Enterprise, Babbel for Business) are all per-seat per-month.

**B2B unit economics (Y1 working assumptions):**

- **Avg deal:** 30 seats × NT$199 / mo = **NT$5,970 / mo = NT$71,640 / year**.
- **Sales cycle:** ~30 days from first contact to signed PO (faster for the warm CTBC+NTU pipeline; longer for cold Foxconn-class).
- **CAC:** ~NT$10,000 (founder-led sales, conference + content + intros).
- **Avg contract length:** ~3 years for enterprises that survive year 1 (assumption; needs validation).
- **LTV:** ~NT$215,000 (3 years × NT$71,640).
- **LTV : CAC:** ~**21 : 1**. Each landed enterprise pays for ~14 B2C signups.

## Why B2B leads

- ~7× better LTV:CAC than B2C — every NT$ of enterprise revenue funds disproportionate consumer growth.
- Existing inbound demand: CTBC Bank + 5 NTU classes contacted us without a B2B sales page.
- Smaller addressable market but higher concentration (3,457 TW companies in VN → top 200 are the realistic SOM for Y1–Y2).
- Validates pricing before committing to consumer pricing experiments.

## ARR projection (12 months post-funding)

| Source | Count | Annual rev | ARR contribution |
| --- | --- | --- | --- |
| B2B contracts | 50 | NT$71,640 ea | NT$3,582,000 |
| B2C paid subs (blended) | 1,100 paying × ~NT$2,388 ARPU | — | NT$2,627,000 |
| **Total Y1 ARR target** | | | **~NT$6.2M** |

Justifies the NT$5M / 8% raise (see pitch deck slide 16 and `taiwan-legal-operational-framework` style of sizing).

## Open questions

- **Free-trial vs. freemium.** Free-tier currently caps lessons/day. Should we instead offer 14-day full-feature trial to convert higher % at the cost of more support load?
- **Multi-year B2B prepay.** Is a 2-year contract at −20% sensible to lock in CTBC-class accounts, or do we hold pricing flexibility?
- **Custom-content fee.** Should we monetize custom corporate vocab as a one-time setup fee (NT$30K–80K), separate from seat ARR? Probably yes; standard SaaS pattern.
- **Pricing in USD vs. NTD for multinational HQs.** TW HQ wants NTD invoicing; VN subsidiary wants USD or VND. Decide invoicing currency policy.
- **Gross margin.** Azure Pronunciation Assessment is the largest variable cost. Current S0 pricing is fine for hundreds of users; needs modelling at 10K+ MAU. See [tts-pipeline] and [bucket-storage].

## History

- 2026-05-29 — Initial proposal compiled during pitch deck research; pricing tiers proposed but not yet validated with paying customers.

## Sources

- Pitch deck slide 12, `Vietnamy_Pitch_Deck_2026.pptx`.
- Public pricing comparisons: Duolingo Super, Ling, Pimsleur, Babbel for Business, Rosetta Stone Enterprise.
