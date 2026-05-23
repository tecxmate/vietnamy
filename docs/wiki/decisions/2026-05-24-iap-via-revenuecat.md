---
title: IAP via RevenueCat for In-App Subscriptions
type: decision
slug: 2026-05-24-iap-via-revenuecat
date: 2026-05-24
attributed_to: [niko]
belongs_to: [payment-strategy]
source: chat
status: proposed
tags: [monetization, iap, revenuecat, stripe]
related: [payment-strategy, mobile-strategy]
---

## Context
Niko asked whether payment integration works with Capacitor. Apple and Google both require in-app purchases (IAP) for digital content sold inside their apps, taking 15–30%. Trying to use Stripe directly inside a Capacitor-wrapped app gets it rejected at app review.

## Decision
When monetization launches:
- **Native apps (iOS + Android)**: use IAP via the **RevenueCat** SDK. Pay Apple/Google 15–30%, plus 1% to RevenueCat above $2.5K MRR.
- **Web (`vietnamy.tecxmate.com`)**: use Stripe. Pay 2.9% + 30¢ per transaction.
- Long-term, allow a hybrid where the web tier is priced lower than the IAP tier to recover the Apple/Google cut on average.

## Rationale
- **RevenueCat** is the industry standard for cross-platform subscription apps. One SDK handles both stores, one dashboard for product configuration, unified subscription state to query from the server.
- The 15–30% Apple/Google cut is a real cost but acceptable as a customer-acquisition tax. App Store discoverability is a meaningful funnel for a solo founder with no marketing budget.
- Web Stripe gives the option to offer a cheaper tier to web users — Apple now explicitly allows a "link out to web for signup" button. Hybrid pricing (e.g. $9.99 in-app, $7.99 on web) is legal and common (Tinder, Audible).
- Subscription state lives at the server level (RevenueCat → webhook → our database / lookup), so the rest of the app codebase doesn't care which payment path the user took.

## Consequences
- No code today. Stored as a plan for when monetization is enabled.
- Pricing benchmark: $9.99/mo or $59.99/year matches the category (Duolingo Super, Babbel, Pimsleur). Take-home on IAP: ~$7/mo or ~$42/year per subscriber (Apple's 30% first year, 15% thereafter).
- Server work needed at monetization launch: a `subscription_status` check (RevenueCat REST API or webhook-cached) gated in front of premium content.
- Capacitor plugin work: ~1 day to wire RevenueCat into the native app once the App Store / Play Console product IDs exist.

## Provenance
- Discussed 2026-05-24 between [niko] and [claude-opus] while exploring mobile strategy.
- Status: **proposed**. Will move to **active** once Niko begins implementing.
