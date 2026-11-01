# Profile format: mobile-verify

A project's profile lives at `.claude/mobile-verify.md`: YAML front matter for settings, then optional Markdown notes (how to reach a state, test accounts, known simulator quirks). Every setting has a default, so a profile only needs what differs.

```yaml
---
profile_version: 1
platforms: [ios, android]             # default: the platforms found in the repository
ios:
  project: "App/App.xcodeproj"        # or workspace: "App.xcworkspace"; default: the only one found
  scheme: "App"                       # default: the scheme that builds the app target
  bundle_id: "com.example.app"        # default: read from the built app
  ui_test_target: "AppUITests"        # default: a target ending in UITests, if any
  runtime: newest                     # or an exact runtime id
  build: ""                           # a command that replaces the default xcodebuild line
  fold_command: ""                    # a command taking <udid> and a posture (folded|open), for foldables
android:
  root: "android"                     # the folder with gradlew; default: the repository root or the one found
  module: "app"
  application_id: "com.example.app"
  launch_activity: ".MainActivity"    # default: the launcher activity in the manifest
  api: newest                         # or an API level
  build: ""                           # a command that replaces ./gradlew :<module>:assembleDebug
supports:                             # what the app supports; default: read from the project
  ipad: true
  large_screens: true                 # Android tablets and foldables
  landscape: true
matrix: default                       # or a list, see below
flows:                                # named flows Step 1 can pick by name
  - name: first-launch
    ios_test: "AppUITests/FirstLaunchTests/testOnboarding"
    android_test: "com.example.app.FirstLaunchTest#onboarding"
  - name: share
    deep_link: "example://share?id=demo"
launch_arguments: ["-UITestMode", "1"]   # passed to every launch (iOS); Android reads extras the app documents
permissions: []                       # granted before the flow, e.g. [camera, photos]
device_prefix: "mv-"                  # the skill creates, erases and deletes only devices with this prefix
reuse_devices: true                   # keep the skill's devices between runs (faster); false deletes them
keep_devices: false                   # leave them booted after the run
fresh_state: true                     # erase before each run
output_dir: ""                        # default: a folder under the system temp directory, per project and run
---
```

A `matrix` list overrides the default (`reference/matrix.md`):

```yaml
matrix:
  - { platform: ios, device: "iPhone 17", settings: [default, dark, largest-text] }
  - { platform: ios, device: "iPad Air 13-inch (M3)", settings: [portrait, landscape] }
  - { platform: android, device: "pixel_9", settings: [default, dark, font-2.0] }
```

## Discovery (no profile)

| Setting | Where it's found |
|---|---|
| `ios.project`, `ios.scheme` | `*.xcworkspace` (outside `Pods`), else `*.xcodeproj`; `xcodebuild -list -json` |
| `ios.bundle_id` | `PRODUCT_BUNDLE_IDENTIFIER` in `xcodebuild -showBuildSettings`, or the built app's `Info.plist` |
| `ios.ui_test_target` | a target in `xcodebuild -list` ending in `UITests` |
| `android.root`, `android.module` | the folder with `gradlew` and `settings.gradle(.kts)`; the module that applies `com.android.application` |
| `android.application_id` | `applicationId` in the module's build file |
| `supports` | iOS: `TARGETED_DEVICE_FAMILY` (2 means iPad), `UISupportedInterfaceOrientations`; Android: `screenOrientation` and `resizeableActivity` in the manifest |
| devices | the newest runtime's and system image's device types (`xcrun simctl list devicetypes`, `avdmanager list device`) |

Tell the user what was found, run with it, and offer the starter profile at the end.

## Example

```markdown
---
profile_version: 1
platforms: [ios, android]
ios:
  project: "ios/Tally.xcodeproj"
  scheme: "Tally"
  ui_test_target: "TallyUITests"
android:
  root: "android"
  application_id: "com.example.tally"
supports: { ipad: true, large_screens: true, landscape: false }
flows:
  - name: add-count
    ios_test: "TallyUITests/CountTests/testAddCount"
    android_test: "com.example.tally.CountTest#addCount"
launch_arguments: ["-SeedDemoData", "YES"]
---

`-SeedDemoData YES` fills the list with twelve counters, two with long names, for layout checks.
The Android build reads the same flag from the intent extra `seed_demo_data`.
```
