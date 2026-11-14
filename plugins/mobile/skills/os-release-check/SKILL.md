---
name: os-release-check
description: Keeps iOS, Android, watchOS and Wear OS apps current with OS releases. Discovers each app's targets (compileSdk, targetSdk, minSdk, AGP, Gradle, Kotlin, Compose BOM; deployment targets, Xcode and Swift versions from the Xcode project, XcodeGen or Package.swift), compares them with the newest stable and beta platforms (the local SDK tools and Apple's and Google's official pages), reads the stores' current deadlines (Google Play's target API level, Apple's minimum SDK for uploads) with their dates, and writes a dated report of what's new, what each app must change and by when, under the project's policy. Optionally runs the project's tests on a new emulator image or simulator runtime. Never changes build files unless asked; never uploads. Reads .claude/os-release-check.md. Use monthly, after a WWDC or Android release, or when asked "are we on the latest SDK", "what's the Play target deadline", "check the new iOS beta".
argument-hint: "[report-only | test] [app …]"
disable-model-invocation: true
---

# OS release check

You keep a project's mobile apps current with the operating systems they run on. For each app you find what it targets today, what the platforms offer now (stable and beta), and what the stores require and from when, and you write a dated report: what's new, what each app must change, and by when, measured against the project's policy. When the profile allows it, you also run the project's own tests on the newest emulator image or simulator runtime and list what broke.

**You never change a build file, manifest or project setting unless the user asks for that change in this run, and you never upload a build or touch a store console.** You may install nothing either: a missing SDK, image or runtime is reported with the command to install it. Every version and deadline comes from a source read on this run, with its date; never from memory or the previous report.

Project specifics come from the project's profile (Step P). This file stays general.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings, defaults and discovery.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in fictional example, also the starter profile.
- `${CLAUDE_SKILL_DIR}/reference/sources.md`: where each version and deadline is read (local tools and official pages), and how to tell stable from beta.
- `${CLAUDE_SKILL_DIR}/reference/device-tests.md`: running the tests on a new image or runtime safely (the device lock, naming, `ANDROID_SERIAL`).
- `${CLAUDE_SKILL_DIR}/reference/output-format.md`: the report's shape.
- `${CLAUDE_SKILL_DIR}/reference/scheduled-use.md`: running it monthly from a headless job behind a cheap guard.
- `${CLAUDE_SKILL_DIR}/scripts/discover.mjs`: reads the targets from the build files (Node, no dependencies).
- `${CLAUDE_SKILL_DIR}/scripts/fingerprint.mjs`: the guard: a hash of the platforms this machine can see.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Readiness (6) weighs most:** web fetch must work (deadlines come only from official pages), and for `test` the toolchains must be installed. Without web access, stop: a report without sourced dates is worse than none.
- **Moving target (5):** if a platform upgrade is in progress in the working tree (changed build files, an open migration branch), report on the committed state and say so, or wait until it lands.
- **Anchoring (4):** a conversation that already decided "we stay on the old SDK until spring" bends the report. Put that decision in the profile's `## Decisions` and run from the record.
- A long conversation (3) matters less: the run reads a few pages and build files.

## Step P: Load the profile

1. Read `.claude/os-release-check.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md`.
2. **No profile:** run `node "${CLAUDE_SKILL_DIR}/scripts/discover.mjs" --root <repo>`. Tell the user in a few lines what it found (apps and modules, their targets, the toolchain versions), use it for this run with the default policy, and at the end **offer a starter profile** from `reference/example-profile.md` filled with what was found. Write it only if they agree. Device tests are off without a profile.
3. Read the previous report at `output`, if any: it says what was already known, so this run can say what's new since.

## Step 1: Discover each app's targets

Run `discover.mjs` (with `--json` when it helps) over the repository, and check its output against the profile's `apps`. For each app and module, record: platform and form factor (phone, Wear OS, watchOS, TV), compileSdk, targetSdk and minSdk, or deployment target(s), plus the toolchain (AGP, Gradle wrapper, Kotlin, Compose BOM; Xcode pinned or required, Swift tools version). Where the script reports `?` (an expression it couldn't resolve), read the build logic yourself; where you still can't, say "unresolved" in the report rather than guess. Note where each value came from (file and line).

## Step 2: What the platforms offer now

Following `reference/sources.md`, collect for each platform the project ships on:
1. **Locally:** what this machine has and can install (`sdkmanager --list`, or its successor; `xcodebuild -version`; `xcrun simctl list runtimes`). Local is evidence of what's installable, not of what's released.
2. **Officially:** the newest **stable** and the newest **beta or preview** of each OS (Android, Wear OS, iOS, iPadOS, watchOS), the newest stable AGP, Gradle, Kotlin and Compose BOM, and the newest stable and beta Xcode, each with its release date and the page and date read.
3. **What's new that matters to these apps:** from each new version's behaviour-change pages, the changes that apply to apps targeting it, and those that apply to all apps on it. Keep only the ones that touch what these apps use (their permissions, background work, notifications, the features in the manifest or entitlements), with the page for each.

## Step 3: What the stores require, and from when

Read the current requirements from the stores' own pages (`reference/sources.md`): Google Play's target API level requirement (new apps and updates, existing apps, and the separate levels for Wear OS, TV, Automotive and XR), the extension date if any; Apple's minimum SDK and Xcode for App Store Connect uploads, and any minimum deployment target. Quote each requirement, with its effective date, page and the date you read it. A requirement announced but not yet in force is listed with its date. If a page can't be read, say so: never fill a deadline from memory.

## Step 4: Compare under the policy

For each app and each item (target SDK, compile SDK, Xcode/SDK, deployment target, toolchain), work out:
- **Store deadline:** the requirement it doesn't meet yet, and the date it bites. Days left. Anything within the profile's `deadline_margin_days` (default 60) is urgent.
- **Policy windows:** from the profile's policy (defaults: a beta tested within `beta_test_days` (14) of its first release, a stable OS adopted, meaning targetSdk or SDK raised, within `stable_adopt_days` (30) of release, toolchains no more than `toolchain_lag` (one minor) behind). Say which windows are open, which are met, and which are overdue, with dates.
- **What to change:** the concrete edit (which file, which setting, from what to what), the behaviour changes to check that come with it, and the dependencies that often must move with it (AGP for a new compileSdk, Kotlin for a new AGP, Xcode for a new SDK). These are recommendations: you don't make them.
- **minSdk / deployment target:** only report what the profile's `min_os_policy` asks for (default: report the current values, recommend nothing).

Order the actions by date: overdue first, then by deadline.

## Step 5: Device tests (only with `test`, or the profile's `tests.on_run: true`)

Only if the profile's `devices.may_boot` is true, and only by the rules in `reference/device-tests.md`:
1. Pick the newest image or runtime that the policy says should be tested (a beta inside its test window, or a stable not yet adopted). If it isn't installed, report the install command and skip; never install it yourself.
2. Take the device lock if the profile names one, and run its check before every boot. If it refuses, wait (in a bounded loop) or skip the tests and say so.
3. Create or reuse a device named with the profile's `device_prefix`, boot only that one, and run the project's own test command for that app from the profile, pointed at that device only (on Android, `ANDROID_SERIAL` set to it). Run nothing else on it.
4. Shut down only the device you booted, release the lock, and record per app: passed, failed (the first real failures, with the log path), or not run (why).

A failing test on a new OS is a finding for the report, not a reason to change code in this run.

## Step 6: Write the report

Write the report in the shape of `reference/output-format.md` to the profile's `output` (default `docs/platform/os-release-check-<date>.md`): the summary line, the store deadlines table, each app's actions with dates, what's new since the last report, the test results, and every source with its date. Keep previous reports; each run is a new dated file. A value you couldn't source is blank with what you tried.

## Step 7: Notify (only if the profile says how)

If the profile names a `notify` command and the report has something its `notify_on` covers (default: an urgent or overdue item, or a new stable or beta since the last report), run it with the summary line and the report path. Otherwise do nothing.

## Hand off

Reply with the report's path, the summary line, the urgent and overdue items (each with your recommendation and why), the tests' results, and anything you couldn't source. Commit the report only if the profile's `commit` is on (default off); never push. Never edit build files, install SDKs, images or runtimes, or upload anything, unless the user asks for that specific change; then make only that change, and say what you changed.
