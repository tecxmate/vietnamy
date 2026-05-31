---
title: Mobile Strategy
type: topic
slug: mobile-strategy
date: 2026-05-24
updated: 2026-05-24
belongs_to: [niko]
source: synthesis
status: active
tags: [mobile, capacitor, ios, android]
related: [vietnamy-app, payment-strategy, 2026-05-24-capacitor-mobile-path]
---

## Summary
Vietnamy will ship to the iOS App Store and Google Play via Capacitor — wrapping the existing React/Vite PWA in a native shell. Native development is deferred until the web app is feature-complete; the current PWA at `vietnamy.tecxmate.com` is the de facto product and design document. Capacitor preserves the codebase, ships in days not months, and trades a slight loss in "native feel" for a massive gain in maintenance simplicity for a solo founder.

## Path comparison

| Path | Effort | Code reuse | Native feel | Verdict |
| --- | --- | --- | --- | --- |
| **Capacitor** (wrap PWA) | 1–2 weeks | ~95% | Decent (web UI in native shell) | **Chosen** |
| React Native (port UI) | 2–4 months | ~40–50% | Strong | Re-evaluate post-launch if growth justifies team |
| Flutter / Swift+Kotlin | 6+ months | 0% | Best | Overkill for a content app |

## What ports cleanly to Capacitor
- Everything React/Vite — unchanged build.
- `localStorage` state — works natively in WebView.
- Supabase Auth (Google OAuth) — needs deep-link config but works.
- Azure TTS playback (`<audio>` in WebView) — works.
- `MediaRecorder`/`AudioContext` for pronunciation recording — works in iOS WebView (verified during pronunciation-assessment design).
- React Router — works.
- All CSS, lucide icons, Tone Trainer, lesson engine — unchanged.

## What needs replacement
- **Service-worker push notifications** → `@capacitor/push-notifications` plugin (~1 day of work).
- **PWA install banner** → delete it; native install is via the App Store / Play Store.
- **iOS Safari quirks** → iOS WebView quirks (usually better, sometimes worse).

## Constraints to keep in mind while finishing the web app
- **Avoid browser-only APIs** that have no WebView equivalent.
- **Keep API calls relative-pathed** (`/api/tts`). Capacitor rewrites these at build time without code changes.
- **Avoid bleeding-edge CSS** that iOS WebView lags on (currently fine — no container queries or new color functions in use).
- **Don't depend on URL bar or history.state hacks** — Capacitor's address bar is hidden.

## Shipping checklist (when ready)
1. `npx cap init`, `npx cap add ios`, `npx cap add android`.
2. Point Capacitor at the `dist/` build.
3. Configure deep links for Supabase OAuth callback.
4. Wire `@capacitor/push-notifications` to replace the service worker.
5. Set up App Store Connect + Google Play Console listings.
6. Wire IAP (see [payment-strategy]).
7. TestFlight + Play internal track for beta.
8. Public release.

The PWA at `vietnamy.tecxmate.com` continues to serve users who don't want a native install.

## Open questions
- Timing — explicitly deferred. Niko will revisit after the web app is feature-complete and a small paying user base exists.
- Whether to ship Android first (faster review, lower barrier) or iOS first (better learner-app market).
