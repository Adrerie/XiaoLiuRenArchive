# R3 Android Debug Build

This repository packages the existing local-first Vite app with Capacitor. The Android wrapper does not add a server URL, account system, telemetry, cloud sync, or release signing.

## Required toolchain

- Node.js 24.x and npm
- JDK 21
- Android SDK with the platform and build tools required by the generated Capacitor project (`compileSdkVersion` 36)
- The committed Gradle wrapper; the npm build command selects `android\gradlew.bat` on Windows and `./gradlew` on Linux/macOS

The first Gradle build may need network access to download Gradle and Maven dependencies. After those artifacts are cached, the app's runtime remains local-only. Runtime source URLs are displayed as user-clicked links; the application does not fetch them.

## Commands

```text
npm ci
npm run validate:knowledge
npm run audit:network
npm run typecheck
npm run build
npm run mobile:sync
npm run mobile:build:debug
```

`mobile:sync` performs the capacitor-mode Web build and copies `dist/` into the Android assets. `mobile:build:debug` runs `mobile:sync`, then `scripts/build-android-debug.mjs` selects the repository wrapper for the current platform and invokes `assembleDebug`; users do not need to edit the command or install a global Gradle.

GitHub Actions runs the same local Web sync followed by `./gradlew assembleDebug --no-daemon` on Ubuntu with JDK 21 and Android SDK platform/build tools 36. A successful run uploads a short-lived `xiaoliurenarchive-debug-apk` artifact; the APK is never committed to Git.

The debug APK, when the local Android SDK is available, is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The repository does not commit APKs, AABs, Gradle caches, signing keys, or Android Studio local configuration. A missing SDK/JDK must be reported as a build blocker rather than treated as a successful APK build.
