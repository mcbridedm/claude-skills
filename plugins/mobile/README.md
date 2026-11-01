# mobile plugin

Skills for iOS and Android apps.

| Skill | Invoke | What it does |
|---|---|---|
| [mobile-verify](skills/mobile-verify/README.md) | `/mobile:mobile-verify [what to check] [ios\|android\|both] [quick]` | Verifies a change on throwaway simulators and emulators: builds the app, drives the changed flow (UI tests first, then flow scripts, deep links and direct input), captures and reads screenshots across phones, tablets, foldables, light and dark, the largest text size and landscape, runs the platform's accessibility audit and reads the logs. Reads `.claude/mobile-verify.md` or discovers the Xcode project and Gradle build. Changes no project files. |

The skill uses the platforms' own tools (`xcodebuild`, `xcrun simctl`, the Android SDK's `avdmanager`, `emulator` and `adb`); it installs nothing.

Install: see the [repository README](../../README.md#install).
