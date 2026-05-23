---
title: Payment & Monetization Strategy
type: topic
slug: payment-strategy
date: 2026-05-24
updated: 2026-05-24
belongs_to: [niko]
source: synthesis
status: active
tags: [monetization, iap, stripe, revenuecat]
related: [mobile-strategy, vietnamy-app, 2026-05-24-iap-via-revenuecat]
---

## Summary
When monetization launches, Vietnamy will use **in-app purchases via RevenueCat** for native iOS and Android installs, and **Stripe** for web subscriptions. Apple and Google both require IAP for digital content sold inside their apps — there is no way to use Stripe directly on the native app without app-store rejection. RevenueCat handles both stores with one API and (above $2.5K monthly revenue) takes 1% on top of Apple/Google's 15–30% cut. Long-term, a hybrid model lets web buyers pay via Stripe (~97% take-home) while native users pay via IAP (~70% take-home) for the convenience of the app.

## The three viable paths

### 1. IAP only — easiest, costliest
- Wire StoreKit (iOS) + Google Play Billing (Android) via Capacitor.
- Use **RevenueCat** as the SDK — handles both stores with one API, gives a unified subscription state, manages renewals.
- Take-home: ~70% of revenue, ~85% after one year on the same iOS subscriber (Apple's reduced 15% rate).

### 2. Web-only purchase, unlock in app — best margins, more friction
- User signs up + pays on `vietnamy.tecxmate.com` via Stripe (2.9% + 30¢).
- They sign into the native app with the same Supabase account; app reads subscription state from the server and unlocks content.
- "Reader app" pattern — Spotify, Netflix. Apple now explicitly allows a "link out to web for signup" button after the Epic ruling.
- Take-home: ~97% of revenue.
- Catch: conversion drops 20–40% vs in-app flow because users have to switch context.

### 3. Hybrid — recommended long-term
- IAP at a higher in-app sticker price (eats Apple's 30%).
- Stripe at a lower price on the web.
- This is legal and common (Tinder, Audible). Apple users pay more, web users pay less, average take-home is higher than pure IAP.

## RevenueCat integration sketch
- RevenueCat user identifier = Supabase user ID (already auth state in the app).
- Server checks RevenueCat subscription status (via webhook or API call) before serving premium content.
- One product catalog in the RevenueCat dashboard, mapped to App Store Connect / Google Play Console product IDs.
- Capacitor plugin: well-supported, ~1 day to wire up.

## Pricing benchmarks
Language-learning category norms (Duolingo Super, Babbel, Pimsleur): **$9.99/mo or $59.99/year**.
With IAP at 30% cut: $7 / mo, $42 / year take-home.

Before launching pricing, model against monthly infra costs:
- Azure Speech: ~$0 organic post-cache + occasional spikes.
- Supabase: $0 (free) → $25 (Pro) once over 1 GB or 5 GB egress.
- Zeabur: variable based on container size.
- Vercel: free for current PWA traffic.

## What's NOT in the plan
- Free-tier ads, in-app coin packs, gem economies. Vietnamy is a subscription product if it monetizes at all.
- Lifetime purchases. Subscriptions only; the audio infra has ongoing cost.

## Open questions
- Launch timing — explicitly deferred until web product is feature-complete and there's a small organic user base to test pricing on.
- Whether the Heritage path warrants a separate SKU or is bundled into the same subscription. Probably bundled.
- Annual discount aggressiveness — industry norm is 50% off annual vs monthly.
