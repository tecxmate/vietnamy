---
title: Capacitor as the Mobile Distribution Path
type: decision
slug: 2026-05-24-capacitor-mobile-path
date: 2026-05-24
attributed_to: [niko]
belongs_to: [mobile-strategy]
source: chat
status: active
tags: [mobile, capacitor, planning, android]
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
- The initial Capacitor bootstrap has started on branch `mobile/capacitor-bootstrap`.

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

## Bootstrap Status — 2026-05-26
Capacitor bootstrap is in progress on branch `mobile/capacitor-bootstrap`.

Completed:
- Installed Capacitor 8 packages: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
- Added `capacitor.config.json` with app id `com.tecxmate.vietnamy`, app name `Vietnamy`, and `webDir: dist`.
- Generated native `ios/` and `android/` projects in the main repo.
- Added `src/utils/apiUrl.js`; frontend `/api/*` calls now use `VITE_API_BASE_URL` when set, while remaining relative for local web/Vite.
- Added native microphone permission declarations for pronunciation recording:
  - Android: `RECORD_AUDIO`.
  - iOS: `NSMicrophoneUsageDescription`.
- Added npm scripts: `cap:sync`, `cap:open:ios`, `cap:open:android`, `cap:run:ios`, `cap:run:android`.
- `npm run build` passes.
- `npx cap sync` passes for iOS and Android.
- Android debug build passes with `cd android && ./gradlew assembleDebug`.
- Debug APK produced at `android/app/build/outputs/apk/debug/app-debug.apk` (`7.0M`).

Local Android tooling installed on Niko's Mac:
- Temurin JDK 21: `336M`.
- Android SDK packages under `~/Library/Android/sdk`: `546M`.
- Gradle cache under `~/.gradle`: `1.0G`.

Android device install command:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Important mobile API caveat:
For a real packaged app test that needs dictionary, TTS, pronunciation, push-event, or translate endpoints, rebuild with the deployed backend origin:
```bash
VITE_API_BASE_URL=https://your-api-host.example npm run cap:sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Do not include `/api` in `VITE_API_BASE_URL`; the app appends the path.

iOS status:
- Capacitor iOS project has been generated.
- Full Xcode is not installed or selected. `xcodebuild` currently sees only `/Library/Developer/CommandLineTools`.
- iOS native build requires installing full Xcode, then running `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` and accepting the Xcode license.

Known verification gaps:
- Full repo `npm run lint` still fails on pre-existing lint debt. Generated native web asset copies are now ignored by ESLint.
- Real-device Android smoke test still needs a connected device with USB debugging enabled.
- iOS build/test is blocked on full Xcode.

## Provenance
- Discussed 2026-05-24 between [niko] and [claude-opus].
- Bootstrap implementation started 2026-05-26 with [codex] on branch `mobile/capacitor-bootstrap`.
