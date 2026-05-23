---
title: Capacitor as the Mobile Distribution Path
type: decision
slug: 2026-05-24-capacitor-mobile-path
date: 2026-05-24
attributed_to: [niko]
belongs_to: [mobile-strategy]
source: chat
status: active
tags: [mobile, capacitor, planning]
related: [mobile-strategy, payment-strategy]
---

## Context
Niko asked how hard it would be to migrate Vietnamy to a native mobile app and what stack to use. The candidates were Capacitor (wrap the existing PWA in a native shell), React Native (port the UI), Flutter, or fully native Swift + Kotlin. Niko explicitly noted he wants to finish the web app first so the architecture is understood before any port.

## Decision
**Defer the mobile port until the web app is feature-complete, then use Capacitor.**

## Rationale
- The Vietnamy product is text, scoring panels, audio playback, lesson cards. No 3D, no real-time camera work, no GPU-heavy operations. WebView performance is genuinely fine for this workload.
- Capacitor preserves ~95% of the codebase. Same Zeabur backend, same Supabase auth, same Azure Speech pipeline. Shipping to both App Store and Play Store takes days, not months.
- Critical features verified to work in iOS WebView during prior work: `MediaRecorder`/`AudioContext` for pronunciation recording, `<audio>` playback, Supabase OAuth deep links.
- A solo founder needs maintenance simplicity. React Native means a second codebase, second build pipeline, second set of bugs. Worth it only if the team grows and "native feel" becomes a retention bottleneck.
- The few features that need replacement (service-worker push, PWA install banner) have well-supported Capacitor plugins.

## Consequences
- **Architectural guardrails while finishing the web app** (recorded in [mobile-strategy]):
  - Keep API calls relative-pathed (`/api/tts`) so Capacitor can rewrite them at build time.
  - Avoid browser-only APIs without WebView equivalents.
  - Avoid bleeding-edge CSS that iOS WebView lags on.
  - Don't depend on URL bar or `history.state` hacks.
- Push notifications will eventually move from service-worker-based (current `public/vnme-sw.js`) to `@capacitor/push-notifications`.
- Payment integration aligned with this choice — IAP via RevenueCat (see [payment-strategy]).
- No code change today. The decision shapes ongoing web-app development to keep the eventual port frictionless.

## Provenance
- Discussed 2026-05-24 between [niko] and [claude-opus].
- No commits yet — the decision is "what to do next" rather than "what to build now."
