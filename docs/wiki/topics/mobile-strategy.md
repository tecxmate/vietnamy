---
title: Mobile Strategy
type: topic
slug: mobile-strategy
date: 2026-05-24
updated: 2026-05-26
belongs_to: [niko]
source: synthesis
status: active
tags: [mobile, capacitor, ios, android]
related: [vietnamy-app, payment-strategy, 2026-05-24-capacitor-mobile-path]
---

## Summary
Vietnamy will ship to the iOS App Store and Google Play via Capacitor — wrapping the existing React/Vite PWA in a native shell. The first Capacitor bootstrap is now underway on branch `mobile/capacitor-bootstrap`; Android debug builds compile successfully, while iOS build verification is blocked until full Xcode is installed. Capacitor preserves the codebase, ships in days not months, and trades a slight loss in "native feel" for a massive gain in maintenance simplicity for a solo founder.

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
- **Route API calls through `src/utils/apiUrl.js`**. Web/local builds can keep relative `/api/...`; packaged native builds need `VITE_API_BASE_URL` set to the deployed backend origin before `npm run cap:sync`.
- **Avoid bleeding-edge CSS** that iOS WebView lags on (currently fine — no container queries or new color functions in use).
- **Don't depend on URL bar or history.state hacks** — Capacitor's address bar is hidden.

## Current bootstrap status
- Capacitor 8 installed and configured with app id `com.tecxmate.vietnamy`.
- Native projects exist in `ios/` and `android/`.
- Android microphone permission and iOS microphone usage description are declared for pronunciation recording.
- `npm run build` passes.
- `npx cap sync` passes.
- Android debug build passes: `cd android && ./gradlew assembleDebug`.
- Debug APK path: `android/app/build/outputs/apk/debug/app-debug.apk` (`7.0M`).
- Local Android tooling footprint installed during bootstrap:
  - Temurin JDK 21: `336M`.
  - Android SDK packages: `546M`.
  - Gradle cache: `1.0G`.

## Android device testing
Install the current debug build on a USB-debugging-enabled device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

For backend-dependent testing, rebuild with the deployed backend origin first:

```bash
VITE_API_BASE_URL=https://your-api-host.example npm run cap:sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Shipping checklist
1. Smoke-test Android on a real device: startup, lesson navigation, dictionary, TTS, microphone recording, pronunciation scoring, audio playback.
2. Install full Xcode and select it with `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
3. Build and smoke-test iOS via Xcode.
4. Configure deep links for Supabase OAuth callback.
5. Wire `@capacitor/push-notifications` to replace the service worker.
6. Replace default Capacitor icons/splash assets with Vietnamy assets.
7. Set up App Store Connect + Google Play Console listings.
8. Wire IAP (see [payment-strategy]).
9. TestFlight + Play internal track for beta.
10. Public release.

The PWA at `vietnamy.tecxmate.com` continues to serve users who don't want a native install.

## Open questions
- Whether to ship Android first now that debug builds compile locally.
- Which deployed API origin should be used for native testing (`VITE_API_BASE_URL`).
