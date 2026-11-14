# The os-release-check profile

Location: `.claude/os-release-check.md` in the repository. Markdown with YAML front matter. Every setting has a default, so a profile only needs what differs. Without a profile the skill discovers the apps (below), uses the default policy, never boots a device, and offers a starter from `example-profile.md`.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | Format version. | `1` |
| `apps` | The apps and modules to check. Each: `name`, `platform` (`android`, `ios`, `watchos`, `wearos`, `tvos`, `macos`), `path` (the Gradle module folder, or the Xcode project, XcodeGen spec or `Package.swift`), and optionally `scheme` or `module`, `store` (`google-play`, `app-store`, `none` for an internal or unpublished app) and `notes`. | Discovered: every Gradle module applying `com.android.application`, every app target in an Xcode project or XcodeGen spec |
| `policy.beta_test_days` | Days after a new OS beta's first release within which the apps should have been tested on it. | `14` |
| `policy.stable_adopt_days` | Days after a stable OS release within which targetSdk (Android) or the build SDK and Xcode (Apple) should be raised to it. | `30` |
| `policy.deadline_margin_days` | A store deadline closer than this is urgent. | `60` |
| `policy.toolchain_lag` | How far AGP, Gradle, Kotlin and the Compose BOM may trail the newest stable: `patch`, `minor` or `major`. | `minor` |
| `policy.min_os_policy` | What to say about minSdk and deployment targets: `report` (values only), or a rule such as `last 4 major versions` or `drop below 5% share` (with the share source in `## Notes`). | `report` |
| `policy.betas` | Which betas count: `developer` (all), `public`, or `none`. | `developer` |
| `tests.list` | Per app: `app` (its name), `command` (the project's own test command, with `{serial}` or `{udid}` where the device goes; Android commands also get `ANDROID_SERIAL`), `device` (an AVD device profile or simulator device type, e.g. `pixel_9`, `wearos_large_round`, `iPhone 17`, `Apple Watch Series 11 (46mm)`), and optional `timeout_minutes`. | None: no tests run |
| `tests.on_run` | Run the tests on every run, not only with `test`. | `false` |
| `devices.may_boot` | Whether the skill may create and boot simulators and emulators at all. | `false` |
| `devices.device_prefix` | Name prefix of the skill's own devices; it touches no other. | `orc-` |
| `devices.max_booted` | Devices booted at once. | `1` |
| `devices.reuse` | Keep the skill's devices between runs. | `true` |
| `devices.lock` | Optional shared device lock: `wait`, `check` and `release` commands, `owner` (replaces `{owner}`), `max_wait_minutes`. See `device-tests.md`. | None |
| `output` | Where the report goes; `<date>` is replaced. | `docs/platform/os-release-check-<date>.md` |
| `notify` | A command run with the summary line as its argument and `OS_RELEASE_REPORT` set to the report path (e.g. a script that posts to a chat or opens an issue). | None |
| `notify_on` | `urgent` (urgent or overdue items), `new` (a new stable or beta since the last report), `always`. A list is allowed. | `[urgent, new]` |
| `sources` | Extra official pages to read (a vendor whose SDK the app depends on, an enterprise store's policy). | None |
| `commit` | Commit the report. | `false` |

## Sections

| Section | What it holds | Default |
|---|---|---|
| `## Decisions` | Decisions already made that the report should respect, with the date and reason ("Wear module stays on API 34 until the watch face library supports 35; decided 2026-05-02"). The report still shows the deadline, and says the decision covers it, or that the deadline overtakes it. | None |
| `## Notes` | Anything else: how the apps are released, where market share data comes from, which CI job builds which app. | None |

## Discovery without a profile

| Value | Where it's found |
|---|---|
| Android apps and modules | `build.gradle(.kts)` applying `com.android.application` or `com.android.library`; Wear OS from `androidx.wear` or `play-services-wearable` dependencies or `android.hardware.type.watch` in the manifest; TV and Automotive from the manifest's features |
| compileSdk, targetSdk, minSdk | literals, `libs.versions.<name>` from `gradle/*.versions.toml`, simple `val` or `ext` constants in the build logic; anything else read by hand |
| AGP, Kotlin, Compose BOM, Gradle | the version catalog, the `plugins` block, `gradle/wrapper/gradle-wrapper.properties` |
| Apple apps and targets | `*.xcodeproj/project.pbxproj` (`*_DEPLOYMENT_TARGET`, `LastUpgradeCheck`, `SWIFT_VERSION`), XcodeGen `project.yml` (`options.deploymentTarget`, per-target `deploymentTarget`, `xcodeVersion`), `Package.swift` (`platforms:`, `swift-tools-version`) |
| Xcode pinned | `.xcode-version`, XcodeGen `xcodeVersion`, the CI configuration's Xcode selection |
| Store | a Play publishing plugin or Fastlane lane, an App Store Connect configuration; else ask, or assume each app is published |

`scripts/discover.mjs` does the first five rows. Say where each value came from, and offer the starter profile at the end.
