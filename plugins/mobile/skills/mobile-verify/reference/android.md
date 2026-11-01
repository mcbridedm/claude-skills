# Android: emulator commands

Used by Steps P to 5 for Android apps. Two tool sets, both in the Android SDK:
- the **Android CLI** (`android`, in `cmdline-tools/latest/bin`), Google's command-line tool for agents and scripts: it starts emulators and waits until they're ready, installs and runs apps, returns the layout tree as JSON and taps elements by their text or description;
- **`adb`** (`platform-tools`) and `avdmanager`, for what the Android CLI doesn't cover: named devices, settings, folding, multi-display screenshots and logs.

Find the SDK at `$ANDROID_HOME`, else `$ANDROID_SDK_ROOT`, else the OS default (`~/Library/Android/sdk` on macOS, `~/Android/Sdk` on Linux); `android info` prints the one it uses. The tools need a JDK: if `java` isn't on the path, point `JAVA_HOME` at the one Android Studio bundles (on macOS, `/Applications/Android Studio.app/Contents/jbr/Contents/Home`). Flags change between releases: when one fails, read `android <command> <subcommand> --help` before guessing, and say in the report which form worked.

## Check the toolchain

```
android info                          # SDK path and CLI version
android sdk list                      # installed packages (sdkmanager is deprecated in favour of this)
android emulator list                 # existing virtual devices
adb version
```

No SDK, no emulator, no system image for the target API level, or no `cmdline-tools`: a **wait**. Name what to install (`android sdk install <package>`, e.g. the platform and a system image for the newest API level, `arm64-v8a` on Apple silicon, `x86_64` on Intel). Installing SDK packages changes only the SDK folder; do it when the project's instructions allow, otherwise ask.

## Devices

- **Hardware profiles:** `avdmanager list device -c` (e.g. `pixel_10`, `small_phone`, `medium_tablet`, and foldables such as `pixel_10_pro_fold`). `android emulator create --list-profiles` shows a shorter list.
- **Create** one per matrix entry with `avdmanager`, which takes a name (`android emulator create` doesn't):
  `echo no | avdmanager create avd -n <prefix>phone -k "system-images;android-<api>;<tag>;<abi>" -d <profile>`.
- **Start and wait:** `android emulator start --headless --cold <name>`. It returns once the device is fully started and prints its serial (`emulator-5554`). Pass that serial to every later command (`--device=<serial>` for `android`, `-s <serial>` for `adb`). `--cold` skips the snapshot, so each run starts from a boot, not from where the last run left the device.
- **Fresh state:** `adb -s <serial> shell pm clear <application id>` clears the app's data; for the whole device, delete and recreate it, or start the emulator binary with `-wipe-data`.
- **Stop:** `android emulator stop <name>`. **Delete:** `avdmanager delete avd -n <name>`, only for the prefix.
- **Lock screen:** `adb shell locksettings set-disabled true` once per device, so a posture change or a restart doesn't stop at a lock screen.
- **Status bar (demo mode):**
  ```
  adb shell settings put global sysui_demo_allowed 1
  adb shell am broadcast -a com.android.systemui.demo -e command enter
  adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
  ```
  Demo mode can reset after a fold or a restart; send it again before a screenshot that's meant to compare.

## Build

`./gradlew :<module>:assembleDebug` (module default `app`). The APK is under `<module>/build/outputs/apk/debug/`. Read the application id from the profile, else the module's `applicationId`. On failure, report the first `e:` or `error:` line with its file and line, not Gradle's summary.

## Install, launch, permissions

```
android run --device=<serial> --apks=<apk>                   # installs and launches the default activity
android run --device=<serial> --apks=<apk> --activity=<name> # a specific activity
adb shell am force-stop <application id>
adb shell am start -W -a android.intent.action.VIEW -d "<scheme>://<path>"   # deep links
adb shell pm grant <application id> android.permission.<NAME>
```

## Settings

```
adb shell cmd uimode night yes|no                  # dark theme
adb shell settings put system font_scale <scale>   # 1.0 default; 2.0 is the largest on recent versions
adb shell wm density <dpi> | reset                  # display size
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0|1|2|3 # portrait, landscape, ...
adb shell cmd locale set-app-locales <application id> --locales <tag>
```

Force-stop and relaunch the app after a change; some settings apply only to new activities.

## Foldables

On a foldable virtual device, with the app running:

```
adb -s <serial> emu fold
adb -s <serial> emu unfold
adb -s <serial> shell wm size        # confirms the posture took: the folded and open sizes differ
```

**Another foldable shape, emulated:** when no emulator profile matches a foldable the app must support (e.g. one with a landscape-shaped inner screen), override the screen of a foldable emulator to that model's resolution and density while it's in the matching posture, relaunch the app, capture, and reset:

```
adb -s <serial> shell wm size <width>x<height>     # the model's inner (unfolded) or cover (folded) resolution
adb -s <serial> shell wm density <dpi>             # about the model's pixel density
adb -s <serial> shell dumpsys window | grep mGlobalConfig   # check the new size in dp (w…dp h…dp)
adb -s <serial> shell wm size reset && adb -s <serial> shell wm density reset
```

This changes the screen's size, not the fold and hinge information the app reads from the window manager, so report it as "emulated size". A real profile for the shape beats it.

After each change the device may show "Swipe up to continue" or a lock screen, as a real phone does. Continue with `adb shell wm dismiss-keyguard`, then a swipe up (`adb shell input swipe <x> <y-near-bottom> <x> <y-near-top> 200`). Then check the app is still the one on screen, `adb shell dumpsys activity activities | grep topResumedActivity`, before capturing: a posture change that loses the app, or its state (text typed, the selected item, the scroll position), is a failure.

## Screenshots

- **One display:** `android screen capture --device=<serial> -o <file>.png`.
- **Several displays (foldables):** `android screen capture` and a plain `screencap` pick a display themselves, and the device's warning can end up inside the PNG while the command still reports success. Name the display:
  ```
  adb -s <serial> shell dumpsys SurfaceFlinger --display-id      # lists the display ids
  adb -s <serial> exec-out screencap -p -d <display id> > <file>.png
  ```
  Capture the display that matches the posture (its size matches `wm size`).
- **Check every file** before reading it: `file <file>.png` must say PNG image data. A text file with a `.png` name means the capture failed.

## The layout tree and input

```
android layout --device=<serial> --flat -o <run folder>/<name>.json
android input tap --device=<serial> "text=Add one"
android input text --device=<serial> "<text>"
android input key --device=<serial> <key>
```

The layout lists every element with `text`, `content-desc`, `resource-id`, its interactions (`CLICKABLE`, `FOCUSABLE`) and `bounds`, plus a `center`. Selectors are comma-separated `key=value` pairs that must all match **one** element. In Compose, a button's label is often a child of the clickable node, so `text=OK,clickable=true` matches nothing while `text=OK` works. `android screen capture --annotate` labels elements on a screenshot by number, and `android screen resolve` turns those numbers into coordinates, for elements the tree can't name.

## Instrumented tests (the preferred driver)

`./gradlew :<module>:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=<package>.<TestClass>#<method>` runs on the connected emulator (`ANDROID_SERIAL=<serial>` picks one). Compose UI tests and Espresso tests save screenshots where the test writes them; pull them with `adb pull`.

## Accessibility

- From the layout tree: every clickable element has a `text` or `content-desc` a screen-reader user would understand (on the element or a child); clickable bounds are at least 48 dp each way (pixels ÷ density × 160, density from `adb shell wm density`).
- In tests, where the project uses them: Espresso's accessibility checks (`AccessibilityChecks.enable()`), or the Compose testing equivalent.
- TalkBack itself can't be driven reliably from the shell; the tree checks stand in for it. Say so under "not checked" when the change is about reading order or custom actions.

## Logs and crashes

```
adb logcat -c                                                   # before launching
adb logcat -d --pid=$(adb shell pidof -s <application id>) '*:W'
adb logcat -d -b crash                                          # any crash fails the run
```

Look for `FATAL EXCEPTION`, `ANR in <application id>`, `StrictMode` violations and the app's own error tags. Emulator noise isn't the app's: graphics warnings (`HWUI`, `EGL`), `libc` property access warnings, and a "System UI isn't responding" dialog after many posture changes. For the last, stop the emulator and start it cold, then repeat the step; report it only if it comes back.
