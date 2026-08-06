# R3 Android Debug Build

This repository packages the existing local-first Vite app with Capacitor. The Android wrapper does not add a server URL, account system, telemetry, cloud sync, or release signing.

## Required toolchain

- Node.js 24.x and npm
- JDK 21
- Android SDK with the platform and build tools required by the generated Capacitor project (`compileSdkVersion` 36)
- The committed Gradle wrapper; on Windows use `android\gradlew.bat`

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

`mobile:sync` performs the capacitor-mode Web build and copies `dist/` into the Android assets. `mobile:build:debug` repeats that validation, runs `npx cap sync android`, and invokes `gradlew.bat assembleDebug` on Windows.

The debug APK, when the local Android SDK is available, is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The repository does not commit APKs, AABs, Gradle caches, signing keys, or Android Studio local configuration. A missing SDK/JDK must be reported as a build blocker rather than treated as a successful APK build.
