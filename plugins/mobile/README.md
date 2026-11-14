# mobile plugin

Skills for iOS and Android apps.

| Skill | Invoke | What it does |
|---|---|---|
| [mobile-verify](skills/mobile-verify/README.md) | `/mobile:mobile-verify [what to check] [ios\|android\|both] [quick]` | Verifies a change on throwaway simulators and emulators: builds the app, drives the changed flow (UI tests first, then flow scripts, deep links and direct input), captures and reads screenshots across phones, tablets, foldables, light and dark, the largest text size and landscape, runs the platform's accessibility audit and reads the logs. Reads `.claude/mobile-verify.md` or discovers the Xcode project and Gradle build. Changes no project files. |
| [os-release-check](skills/os-release-check/README.md) | `/mobile:os-release-check [report-only\|test] [app …]` | Keeps the apps current with OS releases: discovers each app's targets (compileSdk, targetSdk, minSdk, AGP, Gradle, Kotlin, Compose BOM; deployment targets, Xcode and Swift versions), compares them with the newest stable and beta platforms and the stores' current deadlines read from their own pages, and writes a dated report of what each app must change and by when, under the project's policy. Optionally runs the project's tests on the newest emulator image or simulator runtime, on its own device only. Reads `.claude/os-release-check.md` or discovers. Never changes build files or uploads. |

The skills use the platforms' own tools (`xcodebuild`, `xcrun simctl`, the Android SDK's `sdkmanager`, `avdmanager`, `emulator` and `adb`) and plain Node scripts with no dependencies; they install nothing.

Install: see the [repository README](../../README.md#install).
