# os-release-check

Keeps iOS, Android, watchOS and Wear OS apps current with OS releases: finds what each app targets, compares it with the newest stable and beta platforms and with the stores' current deadlines, and writes a dated report of what each app must change and by when, under the project's own policy. Optionally runs the project's tests on the newest emulator image or simulator runtime.

- **Invoke:** `/mobile:os-release-check [report-only | test] [app …]` when installed as a plugin, or `/os-release-check` when copied into a skills folder.
- **Produces:** a dated report at the profile's `output` (default `docs/platform/os-release-check-<date>.md`): the store requirements with their effective dates and days left, the newest stable and beta of each platform and toolchain, per app a table of what it targets now against what's newest and required, the actions in date order with the behaviour changes and dependencies that come with them, device test results, what's new since the last report, and every source with the date it was read.
- **Cost:** low. One session, no sub-agents; a handful of official pages and the build files. With `test`, add a device boot and the project's test run per app.
- **Side effects:** writes the report, and a starter profile only if you agree. Commits only if the profile says so; never pushes. **Never changes build files, installs SDKs, images or runtimes, or uploads anything,** unless you ask for a specific change in that run. Boots devices only when the profile allows it, only its own (by name prefix), one at a time by default, under the project's device lock if there is one.
- **When to run it:**
  - monthly, from a scheduled job behind a cheap guard ([reference/scheduled-use.md](reference/scheduled-use.md));
  - after a big release (a new iOS in September, a new Android, the first betas);
  - when someone asks "are we on the latest SDK?", "when is the Play target deadline?", "does the app work on the new beta?".
- **Not for:** making the upgrade itself (ask for it afterwards, one change at a time, and verify it with `mobile-verify`), store submission, or third-party SDK audits.

## Steps

1. **Discover** each app's targets from its build files (`scripts/discover.mjs`): compileSdk, targetSdk, minSdk per Gradle module (literals, version-catalog references, simple constants), Wear OS, TV and Automotive modules apart; AGP, Gradle, Kotlin and Compose BOM; deployment targets per platform from the Xcode project, XcodeGen's `project.yml` and `Package.swift`; the pinned Xcode and Swift tools version.
2. **Platforms now:** what this machine has and can install (the Android SDK manager, `xcodebuild`, `simctl`), and from the vendors' own pages the newest stable and beta of each OS and toolchain, with dates, and the behaviour changes that touch these apps.
3. **Store requirements,** read fresh from Google Play's and Apple's pages: the target API level per form factor and its date, the minimum SDK and Xcode for uploads.
4. **Compare under the policy:** store deadlines (urgent within 60 days by default), the policy's windows (betas tested within 14 days, stable adopted within 30, toolchains at most a minor behind, by default), and the concrete change for each, in date order.
5. **Device tests** (optional): the project's own test command on the newest image or runtime the policy wants tested, on the skill's own device, with `ANDROID_SERIAL` set so Gradle never runs on a plugged-in phone.
6. **Report,** and **notify** through the profile's command when something is urgent or new.

## Project profile

`.claude/os-release-check.md`: the apps and their paths, the policy windows, the test commands, whether and how it may boot devices (prefix, how many, a device lock's commands), where reports go, how to notify. Format: [reference/profile-format.md](reference/profile-format.md); a fictional [example](reference/example-profile.md). Without one, it discovers the apps, uses the default policy, boots nothing, and offers a starter profile.

## Context check

Readiness weighs most: deadlines come only from official pages, so without web access it stops; `test` needs the toolchains installed. An upgrade in progress in the working tree means it reports on the committed state, or waits. A decision already made in the conversation ("we stay on the old target until spring") goes into the profile's `## Decisions` first, so the report records it rather than bending to it.

## Model invocation

`disable-model-invocation: true`: it may boot devices and run a project's test suite, and it is meant to run on a schedule or on request, not in the middle of other work.

## Limits

- A version installed on the machine is not proof of its release status; the official pages decide.
- Build logic that computes its versions (a convention plugin, a script) may defeat the discovery script; the skill then reads it by hand, or reports "unresolved".
- It knows a deadline only once a store announces it; until then it says when one is usually expected, marked as a pattern.
- Device tests show what breaks on the new OS with the current target; behaviour that changes only when the target is raised shows after the upgrade, so run the tests again then.

## Sample output (fictional)

```markdown
# OS release check, 2026-11-14

**Summary:** 3 overdue (2 by store rule, 1 by policy), 0 urgent, 1 on track; next store change: App Store SDK minimum, expected around late April 2027, not yet announced.

| Item | Now | Newest | Required by store | Policy | Status |
|---|---|---|---|---|---|
| Phone app targetSdk | 35 (`android/app/build.gradle.kts:9`) | 37 | 36 since 2026-08-31 | stable +30 days | **overdue** |
| Watch app targetSdk | 34 (`android/wear/build.gradle.kts:4`) | 37 | 35 since 2026-08-31 (Wear OS) | decision of 2026-05-02 | **overdue: the store deadline overtook the decision** |
| iPhone app Xcode | 26.4 (`.xcode-version`) | 27.2 | 26 since 2026-04-28: met | stable +30 days: due 2026-10-17 | **overdue (policy only)** |

Device tests: Phone app on Android 37 beta 1 (orc-android-37): 2 failures, both in background location; log in the run folder.
```
