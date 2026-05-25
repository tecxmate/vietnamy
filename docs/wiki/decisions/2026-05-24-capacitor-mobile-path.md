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

## Repository Strategy
Keep iOS and Android in the main repository once Capacitor is introduced. Do not maintain long-lived `ios` and `android` branches.

Recommended shape:
- Add Capacitor from a short-lived integration branch, for example `mobile/capacitor-bootstrap`.
- Commit `capacitor.config.*`, `ios/`, and `android/` into the main repo after the bootstrap works.
- Keep shared React/Vite code in `src/`, shared backend code in `server/`, and platform-specific native files only inside `ios/` and `android/`.
- Use normal temporary branches for platform work, for example `mobile/ios-iap`, `mobile/android-push`, or `mobile/deep-links`, then merge them back to `main`.

Why:
- Capacitor is a single web app with native shells, not two separate apps. Permanent platform branches would cause drift in app logic, dependencies, assets, and release behavior.
- Native project files are part of the distributable product and need to evolve with web code, package versions, plugin versions, icons, permissions, deep links, and release settings.
- A single mainline keeps CI, QA, and store builds reproducible: one commit should answer "what exact web, iOS, and Android app are we shipping?"

The practical exception is credentials and generated build output: signing keys, provisioning profiles, keystores, `DerivedData`, Gradle build output, and local Xcode/Android Studio state should stay out of git.

## Implementation Path
1. Finish the web app features and stabilize the browser/PWA path.
2. Add a small API base resolver before the Capacitor bootstrap. Relative `/api` works for local Vite proxy and same-origin web deploys, but packaged mobile assets run from the Capacitor WebView origin, so production mobile builds need an explicit backend origin such as the Zeabur API URL.
3. Install Capacitor dependencies and initialize the app using the existing Vite `dist` build output.
4. Add iOS and Android projects with Capacitor, then commit the generated native directories after reviewing the native config.
5. Verify the critical mobile flows on real devices or simulators: auth/deep links, recording, playback, lesson navigation, offline behavior, and subscription/paywall behavior.
6. Add native-only features incrementally: push notifications, RevenueCat/IAP, app icons/splash screens, and store metadata.

## Provenance
- Discussed 2026-05-24 between [niko] and [claude-opus].
- No commits yet — the decision is "what to do next" rather than "what to build now."
