# iOS: simulator commands

Used by Steps P to 5 for iOS and iPadOS apps. Everything here runs from the shell through `xcrun simctl` and `xcodebuild`. Commands change between Xcode releases: when one fails, read `xcrun simctl help <command>` before guessing, and say in the report which form worked.

## Check the toolchain

```
xcode-select -p                      # must be inside an Xcode.app, not CommandLineTools
xcodebuild -version
xcrun simctl list runtimes           # installed iOS runtimes; the newest is the default
xcrun simctl list devicetypes        # device type identifiers for "Devices" below
```

Only the Command Line Tools selected: a **wait**. The user installs Xcode, selects it (`sudo xcode-select -s /Applications/Xcode.app`, which needs their terminal) and accepts the licence (`sudo xcodebuild -license accept`). No iOS runtime: `xcodebuild -downloadPlatform iOS` installs the current one without `sudo` (several GB); run it when the project's instructions allow, otherwise ask.

## Devices

- **Create** one per matrix entry, named `<device_prefix><short name>`:
  `xcrun simctl create "<prefix>iphone" "<device type id>" "<runtime id>"`. It prints the device's UDID; use UDIDs, not names, after that.
- **Device-specific runtimes:** some new devices ship with a runtime of their own, whose identifier names the hardware (e.g. `...SimRuntime.iOS-27-2-iPhone19-4` beside `...SimRuntime.iOS-27-2`). Creating such a device on the general runtime fails with "Incompatible device"; try the runtimes of the same version in turn, and note which one worked in the starter profile.
- **Find** the skill's own: `xcrun simctl list devices -j`, filtered by the prefix.
- **Erase** (fresh state): `xcrun simctl shutdown <udid>` (ignore "already shut down"), then `xcrun simctl erase <udid>`.
- **Boot and wait:** `xcrun simctl boot <udid>`, then `xcrun simctl bootstatus <udid> -b` (returns when booted).
- **Delete:** `xcrun simctl delete <udid>`, only for devices with the prefix.
- **Status bar:** `xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`.

## Build

```
xcodebuild -project <App>.xcodeproj -scheme <Scheme> \      # or -workspace <App>.xcworkspace
  -destination "platform=iOS Simulator,id=<udid>" \
  -configuration Debug -derivedDataPath <build folder> build
```

The app is `<build folder>/Build/Products/Debug-iphonesimulator/<Product>.app`. Read the bundle id from its `Info.plist` if the profile doesn't give it: `/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' <app>/Info.plist`. On failure, search the log for `error:` and report the first one with its file and line.

## Install, launch, permissions

```
xcrun simctl install <udid> <path to .app>
xcrun simctl launch --terminate-running-process <udid> <bundle id> [launch arguments]
xcrun simctl terminate <udid> <bundle id>
xcrun simctl openurl <udid> "<scheme>://<path>"         # deep links and universal links
xcrun simctl privacy <udid> grant <service> <bundle id>  # e.g. photos, camera, location; reset to undo
xcrun simctl push <udid> <bundle id> <payload.json>      # a push notification
```

Launch arguments reach state without tapping: `-AppleLanguages "(de)" -AppleLocale de_DE` for a locale, and any flags the app reads for test data (the profile's `launch_arguments`).

## Settings

```
xcrun simctl ui <udid> appearance dark|light
xcrun simctl ui <udid> content_size <size>    # e.g. large (the default), accessibility-extra-extra-extra-large
xcrun simctl ui <udid> increase_contrast enabled|disabled
```

Orientation has no `simctl` command: rotate inside a UI test (`XCUIDevice.shared.orientation = .landscapeLeft`), or skip landscape and say so.

**Foldables** (e.g. a folding iPhone): the device has more than one display, and may boot folded, showing the app on its cover display only. Folding and opening may be exposed only in the simulator's own window, not in `simctl`: `simctl io <udid> screenConfig --display=<display> power off|on` turns a display off but doesn't change the posture, so the app doesn't move. Check `xcrun simctl help`, `xcrun simctl io help` and the Xcode release notes for a posture command first. Then use the profile's `fold_command` if it names one (a community tool, a UI-automation script), else drive the simulator window with a computer-use tool if one is available, else record `not checked: <posture> (no scriptable fold control)`. Never report the open posture as checked from a screenshot of the cover display.

## Screenshots

- **One display:** `xcrun simctl io <udid> screenshot <file>.png`.
- **Several displays (foldables):** the plain command fails ("Invalid argument"). List the displays with `xcrun simctl io <udid> enumerate`, then pass `--display=<display UUID>`. Tell them apart by size (the cover display is the narrower one) and check which one shows the app: a display that's off captures as solid black.
- **Status bar:** the `status_bar` override is per device; set it on each one, foldables included.

## UI tests (the preferred driver)

```
xcodebuild test -project <App>.xcodeproj -scheme <Scheme> \
  -destination "platform=iOS Simulator,id=<udid>" \
  -only-testing:<UITestTarget>/<TestClass>/<testMethod> \
  -resultBundlePath <run folder>/<name>.xcresult
xcrun xcresulttool export attachments --path <run folder>/<name>.xcresult --output-path <run folder>/<name>-attachments
```

A test adds screenshots with `XCTAttachment(screenshot: app.screenshot())` and `attachment.lifetime = .keepAlways`. Pass settings to the app with `app.launchArguments` and `app.launchEnvironment`.

- **Why it failed:** `xcrun xcresulttool get test-results tests --path <name>.xcresult` gives each test's result and the failure message (e.g. "Failed to tap "Add one" Button: No matches found").
- **What it saw:** the exported attachments' `manifest.json` lists them by name; on a failure Xcode adds the app's UI hierarchy (a text file, marked `isAssociatedWithFailure`) and a screen recording of the run. Read the hierarchy before guessing why an element wasn't found: it's usually not on screen in that size class or posture.
- Run the test once per device in the matrix (a `-destination` per device); a test that passes on one device and fails on another is a layout finding, not a flaky test.

## Accessibility

- In a UI test: `try app.performAccessibilityAudit()` on the changed screen. It fails on missing labels, small hit regions, clipped text at large sizes, contrast and more; report each issue it raises.
- Read labels through the test: `app.buttons`, `app.staticTexts` and each element's `label`. A control whose label is empty or is an image file name fails.
- VoiceOver itself can't be driven from the shell; the audit and the labels stand in for it. Say so under "not checked" when the change is about reading order or custom actions.

## Logs and crashes

```
xcrun simctl spawn <udid> log show --last 10m --style compact \
  --predicate 'process == "<Product>" AND (messageType == error OR messageType == fault)'
```

Add the app's subsystem (`subsystem == "<bundle id>"`) to see its own messages. Crash reports land in `~/Library/Logs/DiagnosticReports/` as `<Product>-*.ips`; any with a time inside the run fails it.
