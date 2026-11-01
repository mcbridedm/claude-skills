# mobile-verify

Verifies an iOS or Android change on throwaway simulators and emulators: builds it, drives the changed flow, captures and reads screenshots across the device matrix, runs an accessibility pass, and reads the logs.

- **Invoke:** `/mobile:mobile-verify [what to check | commit] [ios|android|both] [quick]` when installed as a plugin, or `/mobile-verify` when copied into a skills folder.
- **Produces:** a run folder (outside the repository by default) with the screenshots, logs and `report.md`; a reply with evidence lines a commit's "Verified:" block can carry. Changes no project files.
- **Cost:** low to medium. One session, no sub-agents. Time is mostly builds and device boots (minutes); reading screenshots costs context, so `quick` checks only one device per platform.
- **When to run it:** at the end of every change to how a mobile app behaves or looks, before calling it done; as the `verify` step of `finish-change`. Not for web apps, and not a store-readiness check.

## Why

A mobile change that works on the one simulator its author used can still break on the devices people own: the largest text size, dark mode, an iPad, a small phone, a foldable opened mid-task. Checking them by hand is slow, so it gets skipped. This skill makes the matrix the default, keeps every device it uses fresh and its own, and makes the agent look at each screenshot and say what it saw.

## Steps

1. **Decide what to check:** what changed for a user, what you expect, one way it could break, the flow, the matrix.
2. **Prepare devices:** the skill's own simulators and emulators (by name prefix), erased, booted, clean status bar.
3. **Build and install** a debug build on each.
4. **Drive and capture** per device and setting: UI tests first, then a named flow script, then deep links and direct input; screenshots read one by one; the platform's accessibility audit; the logs.
5. **Clean up:** shut down the devices; leave the run folder.

## Context check

Verifying your own change is the point, so authorship and anchoring don't send it to a fresh session; readiness (Xcode with a runtime, the Android SDK with a system image) weighs most, and a long context suggests `quick`.

## Model invocation

Model-invocable: it's cheap, starts no agents, never commits or pushes, and only creates, erases and deletes devices with its own prefix. Its value is being run at the right moment in Claude's own work, at the end of each change.

## Limits

- Android foldable emulators fold and unfold from the shell, with the app running. A foldable iPhone simulator may have no shell command for its posture (it boots folded); the skill then uses the profile's `fold_command`, a computer-use tool, or reports the open posture as not checked.
- VoiceOver and TalkBack can't be driven from the shell; the platform's automated audit and the accessibility tree stand in for them.
- Physical devices, signing, TestFlight and Play tracks are out of scope.

## Project profile

Optional. Put project specifics in `.claude/mobile-verify.md`; see [reference/profile-format.md](reference/profile-format.md) for the settings, discovery and an example. Without one, the skill discovers schemes, modules and devices and offers a starter profile.

## Sample output

```
Mobile verify: passed
Run folder: /tmp/mobile-verify/tally/2026-11-02-1412
Built: ios Tally (Debug, iOS 27.1); android app (debug, API 37)
Verified:
- ios iPhone 17, light: adding "Push-ups" shows it at the top with 0 and a + button (ios-iphone17-default-added.png)
- ios iPhone 17, largest text: the name wraps to two lines, the count stays visible (ios-iphone17-largest-added.png)
- ios iPad Air, landscape: list and detail side by side (ios-ipadair-landscape-added.png)
- android pixel_9, dark: surfaces dark, count legible (android-pixel9-dark-added.png)
- accessibility ios: audit passed; + button labelled "Add one to Push-ups"
- accessibility android: every clickable node labelled; + button 48 × 48 dp
- logs: clean on both
- not checked: iPhone Duo open posture (no scriptable fold control in this Xcode)
```
