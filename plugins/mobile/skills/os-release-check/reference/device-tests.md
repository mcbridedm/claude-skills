# Device tests on a new image or runtime

Only when the profile's `devices.may_boot` is `true` and the run is in `test` mode (or `tests.on_run: true`). Without a profile, never.

## Rules

- **Only the skill's own devices.** Create, boot, erase and delete only simulators and emulators whose name starts with the profile's `device_prefix` (default `orc-`). Never use, boot, shut down or change another device, even one with a matching OS.
- **Never touch a physical device.** On Android, Gradle's connected and instrumented test tasks run on **every** attached device and uninstall the app afterwards, which wipes a person's data on a phone that happens to be plugged in. Always set `ANDROID_SERIAL` to the emulator you booted (e.g. `ANDROID_SERIAL=emulator-5554`) for every `adb` and Gradle device command, and check with `adb devices` that the serial is the emulator before running. Never run `pm clear` or `adb uninstall` on any device but that emulator.
- **On iOS, name the simulator.** Pass `-destination 'platform=iOS Simulator,id=<udid>'` (or the watchOS equivalent) for the device you created. Never `xcrun simctl shutdown all` or `erase all`; shut down and erase by UDID.
- **One at a time, unless the profile allows more** (`devices.max_booted`, default 1). Machines shared by several sessions or jobs run out of memory fast.
- **Quiet devices.** Tests never call real third-party services. If the project has a quiet-device setup (no network for analytics, a test configuration), the profile's `test` command includes it.
- **Install nothing.** A missing system image or runtime is reported with its install command (`sdkmanager "system-images;android-37.0;google_apis;arm64-v8a"`, `xcodebuild -downloadPlatform iOS`); the user installs it.

## The device lock (when the profile names one)

Some machines share their simulators and emulators between sessions or scheduled jobs through a lock command. The profile's `devices.lock` gives up to three commands, each with `{owner}` replaced by `devices.lock.owner` (default: `os-release-check <repository folder name>`):

| Command | When | Exit 0 means |
|---|---|---|
| `wait` | once, before the first boot | you hold the lock (or your place in its queue has come up) |
| `check` | before **every** boot, and again if the run takes longer than the lock's stated renewal interval | you may boot now |
| `release` | at the end, also after a failure | released |

If `wait` exits non-zero, run it again in a bounded loop (at most `devices.lock.max_wait_minutes`, default 30, in steps of a few minutes each), keeping your place; never switch to another way of taking the lock. If `check` refuses, boot nothing: wait in the same bounded way, or skip the tests and say so in the report. Always run `release`, even when a test fails or the run stops early.

## Steps

1. **Pick the target:** the newest OS the policy wants tested (Step 4 of the skill), per platform the project ships on: e.g. Android 37 beta for phone apps, the newest Wear OS image for a Wear module, the newest iOS runtime for an iOS app, the newest watchOS runtime for a watch app.
2. **Device:** reuse `<prefix><platform>-<os>` if it exists, else create it (`avdmanager create avd -n <name> -k <image> -d <device>`; `xcrun simctl create <name> <device type> <runtime id>`). Erase it before the run.
3. **Boot**, after the lock's `check`, and wait for a ready signal (`adb -s <serial> wait-for-device` then `getprop sys.boot_completed` = 1; `xcrun simctl bootstatus <udid> -b`), never a fixed sleep.
4. **Run the app's test command** from the profile's `tests`, with the device named (`ANDROID_SERIAL=<serial>` in the environment; `{udid}` or `{serial}` replaced in the command). Write its output to a log in the run folder. A command that may take longer than a few minutes runs with its output to a file, and you check on it until it ends; never leave it running when you hand off.
5. **Read the result:** the test report (JUnit XML, `.xcresult`) for failures; the first real error for a build failure, not the last lines of the log. Say whether a failure looks caused by the new OS (it passes on the current one per the project's CI or a run on the current OS) or not established.
6. **Shut down** the device you booted (by serial or UDID), delete it only if `devices.reuse: false`, and run the lock's `release`.
