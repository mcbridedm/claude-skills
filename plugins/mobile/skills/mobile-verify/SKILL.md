---
name: mobile-verify
description: Verify a mobile app change end to end on simulators and emulators before calling it done — build the iOS or Android app, install it on throwaway devices, drive the changed flow, and capture screenshots across the device matrix (phone, tablet, foldable folded and open, light and dark, the largest text size, landscape), with an accessibility pass and the app's logs. Use when an iOS or Android change is ready to check, when the user says "verify on the simulator", "check it on iPad", "does it work folded", or as the verify step of finishing a mobile change. Not for web apps (finish-change's web surface) or store submission. Reads .claude/mobile-verify.md for schemes, modules, devices and flows; discovers them from the Xcode project and Gradle build without one.
argument-hint: "[what to check, or a commit] [ios|android|both] [quick]"
---

# Verify a mobile change

You are checking that a change to an iOS or Android app does what it promised, on the devices people will run it on. You build the app, install it on throwaway simulators or emulators, drive the changed flow, look at every screenshot yourself, and report what you saw with evidence. Unit tests say the code does what its author meant; this says the app does what the change promised, at every size and setting it must support.

You change nothing in the project's code. You create, erase and delete only the devices this skill made (named with the profile's `device_prefix`), and write only to the run folder. You never touch a physical device, a signed-in Apple or Google account, or a store.

Project specifics come from `.claude/mobile-verify.md` (Step P). This file stays general.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings, defaults and discovery.
- `${CLAUDE_SKILL_DIR}/reference/ios.md`: simulator commands (create, boot, build, install, settings, screenshots, UI tests, logs).
- `${CLAUDE_SKILL_DIR}/reference/android.md`: emulator commands (AVDs, boot, build, install, settings, screenshots, the view tree, input, logs).
- `${CLAUDE_SKILL_DIR}/reference/matrix.md`: the default device and settings matrix, foldables, and what to look for in each screenshot.

## Step C: Context check (first, before anything costly)

Before Step P, and before any command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) and anchoring (4) don't stop it:** verifying your own change is the point. Guard against them in Step 1 instead: write what you expect to see before you look, and report what you saw, not what you meant.
- **Readiness (6) weighs most:** the toolchains (Xcode with a simulator runtime for the target OS, the Android SDK with an emulator and a system image), enough disk for the devices, and the change saved. A missing toolchain is a **wait**: name what to install.
- **Context load (3):** screenshots are costly to read. In a long or compacted session, use `quick` (the default device only) or recommend a fresh session for the full matrix.

## Step P: Load the profile

1. Read `.claude/mobile-verify.md` if it exists.
2. Otherwise discover (profile format, "Discovery"): the Xcode project or workspace and its schemes, the bundle id, the UI test target; the Gradle wrapper, the app module, the application id, instrumented tests; the installed runtimes, device types and system images. Tell the user what you found in a few lines, use it for this run, and offer to write a starter profile at the end.
3. Check the toolchains with the commands in `reference/ios.md` and `reference/android.md` ("Check the toolchain"). Note the OS versions available: the run uses the newest installed unless the profile pins one.

## Step 1: Decide what to check

From the argument, the diff (`git diff HEAD`, or the commit) and the conversation, write down before building anything:
- **What changed for a user:** which screen, flow, widget, notification, deep link or background task, and on which platforms.
- **What you expect to see** when it works, and one way it could break (an empty state, a refusal, a long string, an interrupted flow, a layout at the largest text size or on the unfolded screen).
- **The flow to drive:** the steps from launch to the changed state. Prefer a flow the profile names, or a UI test that already covers it.
- **The matrix:** from the profile's `matrix`, else `reference/matrix.md`'s default. `quick` uses only each platform's first device at default settings. Skip a platform the change doesn't touch, and say so.

## Step 2: Prepare the devices

1. Make or reuse this skill's devices, by `device_prefix` (reference files, "Devices"). Never use or change a device the skill didn't create.
2. Erase each one before the run (`fresh_state: true`, the default), so nothing from the last run (data, permissions, settings) hides a first-launch bug.
3. Boot them, and wait for a ready signal, never a fixed sleep. Several may run at once if the machine has the memory; otherwise one at a time.
4. Set a clean status bar where the platform allows it, so screenshots compare across runs.

## Step 3: Build and install

1. Build a debug build for the simulator or emulator with the profile's `build` command, else the discovered default (reference files, "Build"). Use a build folder outside the repository unless the profile names one.
2. A build failure stops the skill: report the first real error, not the tail of the log.
3. Install on every device in the matrix; grant the permissions the flow needs (profile `permissions`) only where the change isn't about asking for them. When it is, leave them unset and drive the prompt.

## Step 4: Drive and capture

For each device and setting in the matrix:
1. **Apply the setting** (appearance, text size, orientation, fold posture, locale) with the reference file's command, then launch the app fresh.
2. **Drive the flow.** In order of preference:
   - a UI test that covers it (XCUITest, Espresso or Compose UI tests), run against this device, with its screenshots exported;
   - a flow script the profile names (e.g. a Maestro file);
   - direct input: deep links and launch arguments to reach the state, and on Android `adb shell input` guided by the view tree.

   If none can reach the state, write a small UI test in a scratch location (not the project), run it, and delete it; or record `not checked: <state> (<why>)`.
3. **Capture** a screenshot of each state the change touches, named `<platform>-<device>-<setting>-<state>.png` in the run folder. On a device with several displays, name the display (reference files, "Screenshots"), and check each file is an image before reading it.
4. **Look at every screenshot** yourself (open the image), against what you expected in Step 1 and `reference/matrix.md`'s "What to look for": clipped or overlapping text, content under the notch, island, hinge or home indicator, controls off screen, truncation at large text, wrong colours in dark mode, a layout that ignores the extra width of a tablet or an unfolded screen.
5. **Accessibility:** run the platform's automated check (reference files, "Accessibility"), and read the accessibility tree of the changed screen: every control has a label a screen-reader user would understand, touch targets meet the platform's minimum, the reading order makes sense.
6. **Logs:** read the app's log for the run (crashes, errors, warnings from the app's own subsystem, main-thread or strict-mode violations). A crash or an error during the check fails it even if the screen looked right.

A failed check stops the skill: report it with the evidence (the screenshot path, the log lines), and leave the devices as they are so the failure can be seen again.

## Step 5: Clean up

1. Stop the app, and shut down the devices unless `keep_devices: true`. Delete devices only when `reuse_devices: false`.
2. Leave the run folder: it holds the screenshots, the logs, and `report.md` (the hand-off below plus the image list).

## Hand off

Reply with, and write to `<run folder>/report.md`:

```
Mobile verify: <passed | failed: what>
Run folder: <path>
Built: <platform> <scheme or module>, <configuration>, <OS version(s)>
Verified:
- ios <device>, <setting>: <what you saw> (<screenshot>)
- android <device>, <setting>: <what you saw> (<screenshot>)
- accessibility <platform>: <audit result; labels, targets, order>
- logs <platform>: <clean | the lines that matter>
- not checked: <what> (<why>)
```

These lines are the evidence a commit's "Verified:" block can carry (finish-change). If there was no profile, end with the starter profile you'd write and ask whether to save it.
