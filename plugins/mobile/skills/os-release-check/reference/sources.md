# Where each version and deadline comes from

Read every value on the run's date. Official pages first; a news site or blog only to find the official page, never as the source. Quote what the page says, with its URL and the date read. Pages move: if a URL below no longer has the content, search the vendor's own site for it and note the new URL in the report.

## Local tools (what this machine has and can install)

| What | Command | Notes |
|---|---|---|
| Android packages, installed and available | `sdkmanager --list --channel=3` | Channel 3 includes previews. Older versions print `platforms;android-36 \| …`; newer ones (a wrapper around the Android command-line tool, which may print a deprecation notice and name its replacement, e.g. `android sdk`) print `platforms/android-37.0   2.0.0   …` under "Installed packages" and "Available packages". Prefer the replacement the notice names when it's installed. Without `ANDROID_HOME`, look in the SDK's usual folders (`~/Library/Android/sdk` on macOS, `~/Android/Sdk` on Linux). |
| Android emulators | `avdmanager list avd`, `emulator -list-avds` | Only the ones named with the profile's `device_prefix` are this skill's. |
| Xcode | `xcodebuild -version`; other Xcodes in `/Applications/Xcode*.app` (`CFBundleShortVersionString`) | The selected one is what builds run with (`xcode-select -p`). |
| Simulator runtimes | `xcrun simctl list runtimes` | Each line: name, version, build, identifier. A beta runtime shows a beta build. |
| Simulator runtimes downloadable | `xcodebuild -downloadPlatform <platform> -exportPath …` (report only; never run it) | Installing is the user's call. |

The skill's `scripts/fingerprint.mjs --print` lists all of these at once.

A platform installed locally is evidence that it's installable; it is not evidence of its release status or date. Take release status from the official pages.

## Official pages: platforms and toolchains

| What | Page |
|---|---|
| Android versions, newest stable and preview, with dates | https://developer.android.com/about/versions |
| Android behaviour changes for apps targeting a version, and for all apps | linked from each version's page ("Behavior changes: apps targeting …", "Behavior changes: all apps") |
| Android platform release notes (SDK platform revisions) | https://developer.android.com/tools/releases/platforms |
| Wear OS versions | https://developer.android.com/training/wearables/versions |
| Android Gradle plugin, with its compatible Gradle, JDK and highest supported API level | https://developer.android.com/build/releases/gradle-plugin |
| Gradle | https://gradle.org/releases/ |
| Kotlin | https://kotlinlang.org/docs/releases.html |
| Compose BOM to library versions | https://developer.android.com/develop/ui/compose/bom/bom-mapping |
| Apple software releases (OS and Xcode, stable and beta) | https://developer.apple.com/news/releases/ |
| Xcode: supported SDKs, minimum macOS, deployment target range | https://developer.apple.com/xcode/system-requirements |
| Xcode release notes | https://developer.apple.com/documentation/xcode-release-notes |
| iOS, iPadOS, watchOS release notes (per version) | https://developer.apple.com/documentation/ios-ipados-release-notes, https://developer.apple.com/documentation/watchos-release-notes |

**Stable or beta:** a version is stable when the vendor's page calls it released (Android: a stable release on the versions page and an SDK platform without a preview or beta suffix; Apple: a release on the releases page without "beta" or "RC"). Release candidates are betas for this skill. Name the build (e.g. "Xcode 27.2 (27B52)") where the page gives one.

## Official pages: store requirements

| Store | Requirement | Page |
|---|---|---|
| Google Play | Target API level for new apps and updates, for existing apps to stay visible to new users, separate levels for Wear OS, Android TV, Android Automotive and Android XR, the extension date | https://developer.android.com/google/play/requirements/target-sdk and the Play Console Help article it links (https://support.google.com/googleplay/android-developer/answer/11926878) |
| Apple App Store | Minimum Xcode and SDK for App Store Connect uploads, per platform, and minimum deployment targets | https://developer.apple.com/news/upcoming-requirements/ |

Read the whole requirement, not just the headline: Google Play's levels differ by form factor (a Wear OS module usually has a lower required target than a phone app in the same year), and "existing apps" has a separate, lower level that controls whether the app stays visible to new users on newer devices. Apple's requirement names an Xcode version and an SDK per platform (iOS, iPadOS, tvOS, visionOS, watchOS) and applies to every upload, including updates.

**Patterns, to check, never to assume:** in recent years Google Play has raised the required target once a year, effective at the end of August, about a year behind the newest Android release, with extensions to November on request; Apple has required the newest major SDK for uploads each spring, around late April. Use these only to say "no requirement announced yet; expect one around <month>", and mark it as an expectation, not a deadline.

## Third-party SDKs

A new target or SDK often needs newer versions of the project's own dependencies (analytics, ads, payments, crash reporting). Don't research every dependency; flag the ones whose release notes or issue trackers the run happened to see mention the new version, and the ones a failing test points at.
