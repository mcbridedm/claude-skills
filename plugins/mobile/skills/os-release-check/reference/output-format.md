# The report

One Markdown file per run, at the profile's `output` (default `docs/platform/os-release-check-<date>.md`). Dates are ISO (`2026-11-14`); "days left" counts from the run's date.

```markdown
# OS release check, <date>

**Summary:** <one line: N urgent, N overdue, N on track; the nearest deadline and its date>

Previous report: <path, or "none">. Profile: <path, or "none (discovered)">.

## Store requirements

| Store | Requirement | Applies to | Effective | Days left | Source (read <date>) |
|---|---|---|---|---|---|
| Google Play | New apps and updates target API 36+ | phone apps | 2026-08-31 | in force | <url> |
| Google Play | Target API 35+ | Wear OS apps | 2026-08-31 | in force | <url> |
| App Store | Built with Xcode 26+ and the iOS 26 / watchOS 26 SDK | every upload | 2026-04-28 | in force | <url> |
| … | No new requirement announced yet; expected around <month> (pattern, not a deadline) | | | | |

## Platforms now

| Platform | Newest stable (released) | Newest beta (first beta) | Installed here | Source |
|---|---|---|---|---|
| Android | … | … | … | … |
| Wear OS | … | | | |
| iOS / iPadOS | … | | | |
| watchOS | … | | | |
| Xcode | … | | | |
| AGP / Gradle / Kotlin / Compose BOM | … | | | |

## Apps

### <app name> (<platform>, <path>)

| Item | Now | Newest | Required by store | Policy | Status |
|---|---|---|---|---|---|
| targetSdk | 35 (`android/app/build.gradle.kts:9`) | 37 | 36 since 2026-08-31 | stable +30 days: overdue since <date> | **overdue** |
| compileSdk | … | | | | |
| minSdk | … | | | report only | — |
| AGP | … | | | one minor behind allowed | ok |

**Actions, by date:**
1. <what to change, in which file, from what to what> — by <date> (<why: store deadline / policy window>). Comes with: <behaviour changes to check, dependencies that must move>.
2. …

**What's new that matters here:** <behaviour changes that touch this app, each with its page>.

(Repeat per app.)

## Device tests

| App | OS image / runtime | Device | Result | Log |
|---|---|---|---|---|
| … | Android 37 beta 1 | orc-android-37 | 2 failures: <first failure> | <path> |
| … | | | not run: <why> | |

## Since the last report

- New: <releases, requirements, behaviour changes that weren't in the previous report>.
- Done: <actions from the previous report that the code now shows as done>.

## Decisions respected

- <decision from the profile> — <still holds / overtaken by <deadline> on <date>>.

## Could not source

- <value>: <what was tried>.

## Sources

- <url> — read <date> — <what it gave>.
```

**Statuses:** `overdue` (a policy window or store deadline has passed), `urgent` (a deadline within `deadline_margin_days`), `open` (a window is open and not yet due), `ok`, `—` (nothing asked by policy), `unresolved` (the value couldn't be read).

Keep the summary line machine-readable enough for a notification: it is what `notify` receives.
