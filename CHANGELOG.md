# Changelog

All notable changes to this repository are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are per plugin, as set in each `plugin.json`, and follow [Semantic Versioning](https://semver.org/).

## setup 0.7.2 - 2026-11-22

Under a sandbox: which arrangement a project needs, standing clones for workers of the boss's own repository, and a launcher that tests instead of assuming.

### Added

- `boss-workers`, operating rules ("Under a sandbox"): two facts decide where workers work (is the boss's shell sandboxed; do workers change the boss's own repository or repositories nested under its folder), with the arrangement for each. Where the boss is sandboxed and workers change its own repository, they work in standing clones the person makes, never in worktrees of it: they fetch the main branch by the root's path, branch without tracking and commit; the boss fetches each branch from the clone's path and merges in the main checkout. Proven with a worker under Claude Code 2.1.323.
- `boss-workers`, operating rules: a worker is protected by the sandbox its whole process is started in. A session's own sandbox covers its shell commands only, so the worker launcher is never excluded from the sandbox and a worker is never started outside it to get past a refusal.
- `boss-workers`, operating rules: the person's standing steps under a sandbox in one place; a pinned package manager must be a real install on the PATH; state kept in the git folder (claims, caches) is not shared with a clone by itself, and a hook's own tests unset what points at the shared copy; an excluded command leaves the sandbox only as a plain line of its own.
- `boss-workers`, operating rules ("Accounts and pacing"): a sign-in belongs to the config folder, so a `/login` inside one session changes it for every session that uses the folder; a refused boss runs the check once more before sending the person to sign in.
- `boss-workers`, profile: `sandboxed` and `workers_in`. Old profiles need no change (defaults `false` and `own`).
- `boss-workers`, worker launcher template: a self-test before every start (it creates and removes a file where the worker's index and HEAD live, and refuses the folder with exit 4 when it can't); with `sandboxed: true` in the profile it refuses to start a worker from outside a sandbox (exit 5) unless the person passes `--outside-sandbox`, and then prints which protection is missing; it says how far a standing clone is behind the root.

### Changed

- `boss-workers`, operating rules: 0.7.1 said worktrees of another repository under the project are not affected by the sandbox's rule on worktrees. That line had no test behind it when written. It has one now and stands, with its limit: inside the sandbox nothing writes a nested repository's `.git/config` or `.git/hooks`.
- `boss-workers`, setup step 5 (sandbox): records the two facts and names the arrangement; no longer recommends standing worktrees where the boss is sandboxed and workers change its own repository.

### For projects already set up

- Copy the worker launcher template's new blocks into the project's launcher (the `--outside-sandbox` option, the sandbox test moved up, the guard, the self-test), and add `sandboxed` and `workers_in` to the profile.

## setup 0.7.1 - 2026-11-21

### Added

- `boss-workers`, operating rules ("Under a sandbox"): a sandbox can make the worktrees of the boss's own repository read-only, so a worker there can't add, commit or switch branches. The boss tests the worktree's git folder before it starts a worker there, and tells the person where it can't write.

## setup 0.7.0 - 2026-11-19

Accounts with names and addresses, one account per project at a time, and a safe switch.

### Added

- `boss-workers`: a machine file of accounts, `~/.config/boss-workers/accounts`, outside every repository and read by every project's launchers: one line per account with its name, its address and its config folder (`default` for `~/.claude`). The profile names accounts only by name. An account is always shown as its name with its address, never by a number.
- `boss-workers`: a sign-in check in both launchers. Before anything starts, they read which address the account's folder is signed in to (`claude auth status`) and refuse when it differs from the machine file, saying which folder holds which address and that the person signs in there. `--no-sign-in-check` skips it, loudly. `boss --check-accounts` checks every account and starts nothing.
- `boss-workers`: on macOS, the check reports a folder that holds two stored logins (a Keychain item and a credentials file), by name only, and the cure: sign out and in again there, at the machine.
- `boss-workers`, `accounts.md`: never use `/login` in a folder to move it to the other account while sessions run there; sign in at the machine, not over SSH; the switch procedure; what doesn't move with a switch; connectors that must follow the project, not the account.

### Changed

- `boss-workers`: one account per project at a time. The boss launcher exports `BOSS_WORKERS_ACCOUNT`, and the worker launcher uses the boss's account by default. `run-worker --account` is a deliberate exception and prints a warning. Without either, the worker launcher stops instead of taking the first account.
- `boss-workers`: the boss launcher's question shows each account as "name, address", and the boss's opening prompt names its account the same way. Unknown names list the known ones with their addresses.
- `boss-workers`, operating rules: the person decides the switch; the boss tells them when the week runs low and never moves itself or its workers. Work no longer spreads across accounts by reset time; the `reserve` is the point where the boss tells the person.

**To update a project:** write the machine file, drop `config_dir` from the profile's accounts, copy both launchers from the templates with `@ACCOUNTS@` set to the account names, and run `boss --check-accounts`. Launchers with the old `name=folder` pairs keep working; `profile-format.md`, "Moving from the old form", has the steps.

### Fixed

- `boss-workers`: in both launcher templates, a value option given with no value (`--account` or `--model` as the last argument) now stops with the usage. Before, the option loop's `shift 2` failed without shifting and the launcher spun forever with no output.

## setup 0.6.3 - 2026-11-16

From a day with five workers at once, one of them out of the boss's reach.

### Changed

- `boss-workers`: workers run on the boss's account while it has room, because messages don't cross accounts: a worker elsewhere can't ask the boss anything and the boss can't tell it to commit, change course or release what others wait for. Another account is the overflow, or for runs that never need a word with the boss. "Earliest reset first" now applies among the accounts the boss can reach.
- `boss-workers`: the workers' standing rules (and the worker launcher's rules text) add two: commit before any test run or build that may take more than 10 minutes; hold a lock on something other runs wait for only for the stretch that uses it.
- `boss-workers`: a worker messages the boss by the name its brief gives, where it gives one, since an old boss's row can still be listed.

### Added

- `boss-workers`: every dated entry in the boss's state takes its time from the clock in the command that writes it.

### Fixed

- `boss-workers`: the worker launcher ignores SIGHUP, so a worker outlives the terminal it was started from. Tested: a process started the launcher's way survives its starting session ending normally, dies when that session's terminal window or tmux pane is killed, and survives with the hang-up ignored.

**To update a project:** copy the two new sentences into the worker launcher's rules text, add `trap '' HUP` near the top of the worker launcher, and move workers to the boss's account in the profile's account roles.

## setup 0.6.2 - 2026-11-15

### Changed

- `boss-workers`: the boss launcher has no default account where the profile lists several. Started without `--account`, it lists them and asks; without a terminal it prints its usage and stops. A bare start used to land on the first account listed, which is the wrong one once the boss has moved. With one account it starts as before.

**To update a project:** copy the account question from the boss launcher template (the lines between `accounts=` and the loop that finds the config folder).

## setup 0.6.1 - 2026-11-15

From a second project's first day with workers under a sandbox.

### Fixed

- `boss-workers`: a worker started from a sandboxed shell had no shell at all (macOS refuses a sandbox inside a sandbox; every command failed, the run still exited 0). The worker launcher now tests for an outer sandbox and, only then, starts the worker with its own sandbox off, held by the outer one, and says so. The setup's test worker runs a command that must work and one that must fail.
- `boss-workers`: the boss launcher's rules lookup passes shellcheck (no `ls` in a pipeline).
- `boss-workers`: the worker launcher unsets an inherited `CLAUDE_CONFIG_DIR` for the default account. A boss on a non-default account had every default-account worker run on its own account, while the log named the other.

### Changed

- `boss-workers`: the handoff is the channel for a worker's question; the message to the boss is sent only where the boss is listed, and a failed send never stops a worker. The launcher's rules text says so.
- `boss-workers`: where the person names one boss to decide the shared rules, the others send it their learnings and it changes the skill.

### Added

- `boss-workers`, operating rules: a run is judged by its commits and handoff, not its exit code; the boss never changes directory into a worker's folder; two ways for a worker to use a skill marked for people only; "Under a sandbox"; a session started inside a sandbox can't list or message other sessions unless the sandbox allows the sessions' socket folder; the sandbox setting that lets them (`network.allowUnixSockets`, the person's choice); a standing worktree needs its dependencies installed by the person; the boss checks which account a worker really ran on; a send that reports success proves little; a boss that can't run a relay uses a file and the person.

**To update a project:** copy the worker launcher's sandbox test and rules text, and the boss launcher's rules lookup, from the templates.

## setup 0.6.0 - 2026-11-15

One copy of the rules, after two projects' copies needed the same fixes by hand.

### Changed

- `boss-workers`: the operating rules stay in the skill. The boss launcher finds the installed `operating-rules.md` and the boss reads it at every start; the project's rules doc holds only the project's own rules. `check` reports a full copy in a project, and setup cuts it down. **To migrate:** run `/setup:boss-workers check`, move any general line the skill lacks into the skill, cut the project's rules doc to a pointer and its own lines, and copy the boss launcher's new rules lookup and opening prompt from the template.
- `boss-workers`: the operating rules read the model table, accounts, escalation list, reserve and share from the profile, with no placeholders to fill in.

### Added

- `boss-workers`: "Keeping the rules the same across projects". A boss that learns something about this way of working changes the skill, updates its installed copy and tells the other bosses the new version; a boss records the rules' version in its state and catches up when it differs.
- `boss-workers`: messages don't cross accounts. A session lists and messages only sessions on its own account, so a worker on another account leaves its question in its handoff, and a boss on another account is reached through a relay: a one-shot headless session on that account that sends the message.
- `boss-workers`: check what a model name resolves to. An alias can run an older model than the docs say; where it does, the profile and launcher name the model by its full ID. `CLAUDE_CODE_SUBAGENT_MODEL` stays unset unless every reviewer agent names its model.

## setup 0.5.0 - 2026-11-15

From the skill's first real run in a project.

### Added

- `boss-workers`: a sandbox check. With Claude Code's sandbox on, workers started from the boss's shell run inside its sandbox, so they can lose `git worktree add` into denied paths, `gh`, package installs and claude.ai connectors. The skill says what workers lose, recommends standing worktrees the person makes once and leaves blocked steps to the boss's sandbox-excluded commands or the person, and never changes the sandbox itself.
- `boss-workers`: registration. The new scripts, the state file and a `.claude-runs/` ignore line go wherever the project registers such things (lint lists, build inputs, generated ignore lists, a handoff hook's file list), and the project's gate runs before the commit.

### Changed

- `boss-workers`: the worker launcher refuses the project root, where the boss works (state commits, merges); workers use sub-folders or worktrees. Both launchers find the root with `git rev-parse --show-toplevel`, so they work at any depth (e.g. a folder per tool). The setup commit is pushed alone: if other commits wait on the branch, the skill gives the person the command to push it by hash.

## setup 0.4.1 - 2026-11-15

### Fixed

- `boss-workers` is in `project-setup`'s list of skills and profiles, so `project-setup` offers its starter profile.
- `boss-workers` and `headless-job` each say when to use the other: a task on a schedule is a headless job; ongoing work handed out and followed is the boss's.
- The README's rules of thumb cover cheaper models for whole sessions (`boss-workers`), beside cheaper models for sub-agents.

## setup 0.4.0 - 2026-11-15

### Added

- `boss-workers`: sets up a project so one interactive boss session, on the strongest model, is the only session the person talks to. The boss picks the work, writes briefs and starts headless workers through a worker launcher (`--model <alias>`, `--account <name>`, one worker per folder at a time, a log per run), and decides what a skill or worker would otherwise ask the person; only the profile's escalation list (money, anything public, physical steps, identity) reaches them. Workers never ask the person: a question they can't settle goes in their handoff and in one message to the boss, and they carry on with the rest of the brief; workers start with incoming messages accepted (`crossSessionInbound: "accept"`), so the boss's answer reaches a running worker at its next step. Before starting a worker, the boss reads each account's limits and reset times with `claude -p "/usage"`, and spends the account whose week resets soonest first, since allowance left at a reset is lost (batch work goes there in its last day); the reserve is kept only on the account that resets last, and `share` caps a project's part of each account's week when projects share accounts. Paid extras stay off. Sub-agents take their worker's model: the skill recommends against `CLAUDE_CODE_SUBAGENT_MODEL` unless every reviewer names its model. Accounts: each in its own config folder (`CLAUDE_CONFIG_DIR`) with links to the shared settings, plugins, skills and memory, a proof that a new folder starts logged out before the person logs in, and a proof afterwards that each login answers as its own account (`reference/accounts.md`). The boss builds its own state file on its first start (`reference/operating-rules.md`). `check` mode audits launchers, accounts, rules and sub-agent models. Profile `.claude/boss-workers.md` (`reference/profile-format.md`, with discovery and a fictional example); the worker launcher reads the profile's `## Worker rules` at every start. `disable-model-invocation: true`.

## mobile 0.3.0 - 2026-11-14

### Added

- `os-release-check`: keeps iOS, Android, watchOS and Wear OS apps current with OS releases. `scripts/discover.mjs` (plain Node, no dependencies) reads each app's targets from its build files: compileSdk, targetSdk and minSdk per Gradle module (literals, version-catalog references, simple constants, the newer `compileSdk { version = release(…) }` form), Wear OS, TV and Automotive modules apart, AGP, Gradle, Kotlin and the Compose BOM; deployment targets per platform from the Xcode project, XcodeGen's `project.yml` and `Package.swift`, the pinned Xcode and the Swift tools version. What it can't resolve it reports as the expression found, never guessed. The skill then reads, on the run's date, the newest stable and beta of each OS and toolchain (the local SDK tools, which show only what's installable, and the vendors' own pages), the behaviour changes that touch the apps, and the stores' current requirements (Google Play's target API level per form factor and its extension date; Apple's minimum Xcode and SDK for uploads), each quoted with its page and date (`reference/sources.md`). It compares them under the project's policy (defaults: betas tested within 14 days, stables adopted within 30, store deadlines urgent within 60 days, toolchains at most a minor behind) and writes a dated report with each app's actions in date order (`reference/output-format.md`). Optional device tests run the project's own test command on the newest image or runtime, only on the skill's own device (name prefix), one at a time by default, under the project's device lock if the profile names one, with `ANDROID_SERIAL` always set so Gradle never runs on a plugged-in phone (`reference/device-tests.md`). `scripts/fingerprint.mjs` is a cheap guard for a monthly headless run: a hash of the platforms the machine can see, optionally the stores' requirement lines and the project's own targets, with a `.pending` file kept only after a successful run (`reference/scheduled-use.md`; no scheduler assumed). Never changes build files, installs SDKs or uploads, unless asked for a specific change. Profile `.claude/os-release-check.md` (`reference/profile-format.md`, with discovery and a fictional example). `disable-model-invocation: true`.

## business 0.1.0 - 2026-11-14

### Added

- New plugin `business`, for skills about selling software, with a read-only `business:researcher` agent (Read, Grep, Glob, WebFetch, WebSearch; effort `medium`).
- `regional-pricing`: recommends a local price per country for each paid product (monthly and yearly subscriptions, one-time or lifetime purchases, in-app purchases), so no country is priced by a store's exchange-rate conversion and no price looks cheap. One researcher per region, in parallel, collects the anchors (Spotify Premium Individual, Apple Music, YouTube Premium and Netflix's cheapest ad-free plan by default; official country pages first, aggregators flagged), the closest competitors' local prices per store, and the World Bank's price level ratio. The lead spot-checks their numbers, then per country: the index (the median of local ÷ base-country anchor prices at one day's exchange rates), a purchasing-power cross-check, the target (base price × index) rounded to the market's natural ending at or just below it (`reference/price-endings.md`, verified each run), a floor (one third of the base by default), the base market's ratios between products, and a value check (share of local Spotify and of the competitor). Store rules are checked fresh every run (`reference/store-rules.md`: price limits and grids, tax, countries where paid products can't be sold, templates or automatic local pricing, price-rise notice and consent). Countries are grouped into tiers; every country sold in gets its own price. Writes a dated table with every number's source and date, blanks where nothing was found, how sure it is, whether the base prices look right, and the judgement calls (`reference/output-format.md`). `review` mode changes a price only when the recommendation moved a full price step; reviews every 6 months, or 3 for high-inflation countries or a currency move over 15%. Never enters or changes a live price. Profile `.claude/regional-pricing.md` (`reference/profile-format.md`, with discovery and a fictional example; method and worked example in `reference/method.md`). `disable-model-invocation: true`.

## architecture 0.8.1 - 2026-11-09

### Fixed

- `cold-visitor`: a `throwaway` visit can reach its local instance. A loopback address bypasses the sandbox's proxy, so the host list alone couldn't allow it. The launcher now allows local connections when a listed host is loopback, which opens every loopback port on that machine to the visitor; the live-site modes don't get it.

## architecture 0.8.0 - 2026-11-09

### Added

- `cold-visitor`: a stranger's test of a site. `scripts/cold-visit.mjs` launches one headless agent from a new empty folder, with no repository, instructions, memory, MCP servers or notes from the caller, and gives it one vague prompt. It runs on the signed-in Claude subscription and is bound by time, not money. A probe on a cheap model runs first and stops the run if a canary word from the profile appears in what the agent says it knows; in a mode with a shell, the probe also proves the OS sandbox holds. The report is a separate second turn, so being asked for one can't change how the visitor behaved. Three modes: `read-only` against the live site, by default (only WebFetch and WebSearch exist, and WebFetch is limited to the listed hosts), `throwaway` for full engagement on a throwaway instance, and `live-full`, which the user must name for a single run and a profile can block. Inside a session's Bash sandbox, the skill hands over the line to run. The lead checks each finding against the code and the site, and sorts it into new defect, known and tracked, or expected. Profile `.claude/cold-visitor.md` (`reference/profile-format.md`, with discovery and a fictional example).

## architecture 0.7.0 - 2026-11-06

### Added

- `user-panel-review`: a screenshot walk, for apps that can't be run during the review (no simulator, emulator, device, browser or local instance, or the run is told not to use one). The skill finds the latest verification screenshot set (the profile's `screenshot_folder`, or a discovered folder of dated sets), and builds an ordered walk per journey from a manifest, the flow and screen names in file names, and the design docs. Each persona walks the screenshots in order as if using the app, reading its words from the images and, where they exist, its words files and design docs. Steps no screenshot shows are marked "not shown", never guessed, and listed in a new "Not shown" section. The bad actor lists the attacks the screens invite, marked not tried, and the lead checks them in the code. Findings are still verified against the code, and against changes since the set was taken. The review opens with a mode block: that it ran from screenshots and why, the set and its commit, and which journeys were fully shown, partly shown or not shown. Surfaces that do run (an API, a CLI) are still used live. The walk runs automatically when the app can't start, or on request with the `screenshots` argument or `run_mode: screenshots`; `run_mode: run` turns it off. New profile settings, all optional with defaults: `run_mode`, `screenshot_folder` and a `## Screenshot walk` section. Screenshot walkers run as the read-only `architecture:reviewer`. Details in `reference/screenshot-walk.md`.

## architecture 0.6.1, code-quality 0.7.3, docs 0.6.1 - 2026-11-05

### Changed

- The plugins' agents set their own effort: `effort: high` on the `reviewer` agents (`architecture-review`, `design-review`, `commit-range-review`, `codebase-audit`, `docs-sync`, `writing-audit`), `effort: low` on `docs:checker` (`docs-sync`'s fix placers). Before this, a subagent ran at the session's effort, so a review started from an `xhigh` session ran every reviewer at `xhigh`. A step that needs more passes the effort with its call. The validator now refuses an agent without a valid `effort` (CONTRIBUTING, section 2).

## infrastructure 0.4.1 - 2026-11-01

### Changed

- `cloud-account-setup`: the baseline says how the management account is made on AWS: "Sign up for AWS (advanced)", with its link. The newer sign-up that offers to "create a project" makes accounts with no root user, in an organization whose policies AWS manages, with no choice of region, and they can't leave that organization. The guide names the advanced link and warns against the other. It also notes that the sign-up page may refuse while other AWS sessions are open in the browser, and that a private window avoids it.

## infrastructure 0.4.0 - 2026-11-01

### Added

- `cloud-account-setup`: plans a project's cloud organization and accounts the same way every time, or checks an existing setup against the pattern (`plan` or `check`). The pattern, in `reference/baseline.md`, has six parts:
  - one organization per company, sharing nothing with another;
  - a management account for billing, single sign-on and policies only, its root email a role address on the project's domain;
  - one member account per environment in the main region;
  - single sign-on with no personal keys, and Identity Center's home region recorded;
  - guardrail policies (allowed regions, root denied, the audit trail protected), budgets and an organization trail;
  - a fallback region documented, not built: what's already there, what the code must take as a variable, the steps, who decides and when to revisit.

  Every plan carries a hand-over checklist, so the project can be sold or handed over. A plan is recorded for the owner's approval before the guide is written. The guide states the region at every regional step and "global" at every global one, and puts steps with a lead time first. It never creates, closes or moves accounts. AWS is the worked default; the baseline maps it to Google Cloud and Azure. Profile `.claude/cloud-account-setup.md` (`reference/profile-format.md`, with discovery and a fictional example).

## mobile 0.2.0 - 2026-11-01

### Changed

- `mobile-verify`: foldables come in more than one shape. Book-style foldables differ between models (a nearly square inner screen behind a full-size phone cover screen, or a landscape-shaped inner screen behind a short, wide cover screen), and a layout that suits one can fail the other. The default matrix gains a row for a foldable of the other shape; `reference/matrix.md` says what each shape asks of a layout and to name the shape in each evidence line; `reference/android.md` shows how to emulate a shape with no emulator profile by overriding a foldable emulator's screen size and density (`wm size`, `wm density`), checking the result in dp, and reporting it as "emulated size", since the fold and hinge information doesn't change.

## mobile 0.1.0 - 2026-11-01

### Added

- New plugin `mobile`, for skills for iOS and Android apps.
- `mobile-verify`: verifies a mobile change on throwaway simulators and emulators. Writes down what changed for a user, what to expect and one way it could break before building; makes or reuses only devices with its own name prefix (`device_prefix`), erases them, boots them with a ready check and sets a clean status bar; builds a debug build and installs it; per device and setting (appearance, text size, orientation, fold posture, locale) drives the flow with UI tests first (XCUITest, Espresso, Compose), then a named flow script, then deep links and direct input, and reads every screenshot against `reference/matrix.md`'s list (text, safe areas, size, dark mode, touch, state, platform fit); runs the platform's accessibility audit and checks labels and touch targets in the accessibility tree; reads the logs and crash reports. A default matrix of phones, a small phone, a tablet and a foldable, folded and open, with `quick` for one device per platform. Foldable postures with no shell command go through the profile's `fold_command`, a computer-use tool, or "not checked". Writes screenshots, logs and `report.md` to a run folder outside the repository; changes no project files, never touches physical devices or stores. Command references `reference/ios.md` (`simctl`, `xcodebuild`, `xcresulttool`; device-specific runtimes; multi-display screenshots with `--display`) and `reference/android.md` (the Android CLI for starting emulators, running apps, the layout tree and taps by text, with `adb` for settings, `emu fold`/`unfold`, per-display screenshots and logs; emulator noise told apart from the app's errors), both dry-run on Xcode 27.2 with iOS 27.2 and the Android 17 SDK, phones and foldables. Profile `.claude/mobile-verify.md` (`reference/profile-format.md`, with discovery and an example). Model-invocable, since it's cheap, starts no agents and never commits.

## code-quality 0.7.2 - 2026-11-01

### Changed

- `finish-change`: `reference/verify-by-surface.md` has a "Mobile apps" section that points to `mobile-verify`, with a fallback when it isn't installed.

## infrastructure 0.3.0 - 2026-11-01

### Added

- `ci-repro`: reproduces a failing CI or workflow job locally before any code changes. Pins the failed run and its first real error, reads the job's definition (runner, container image and flags, setup steps and versions, how the code arrives, the failing command) and lists the differences from a local replica, reproducible and not. Builds the replica in a throwaway, labelled container: the same image by digest, the same flags without the user's credentials, the failing commit's files, the same setup, no real secrets. Runs the failing step with the debug output the CI log didn't keep (a tool's debug mode, a child process's stderr), and narrows the cause one difference at a time, recording each try. When the replica passes, writes the smallest read-only diagnostic for the user to run on the real runner, ideally in a throwaway copy, never printing process command lines or environments. Tries the fix in the replica, offers to make the job keep the output that was missing, cleans up its containers. Never pushes, reruns or dispatches CI, or changes CI settings; commits nothing unless asked. Profile `.claude/ci-repro.md` (`reference/profile-format.md`, with discovery and an example). `disable-model-invocation: true`.

## code-quality 0.7.1 - 2026-10-31

### Changed

- `commit-range-review`: `context.md` and the report name paths relative to the repository root. Both are committed, and an absolute path carries the user's home folder (often their name) and is wrong on any other machine. Absolute paths stay in the reviewers' briefs, which aren't committed.

## ui 0.1.0 - 2026-10-30

### Added

- New plugin `ui`, for skills that check what users see.
- `icon-check`: renders a project's icons at the sizes people see them on one review sheet (PNG), with a small Node script (`scripts/icon-sheet.mjs`, only dependency `sharp`, taken from the project or a scratch folder): each favicon at 16 and 32 px at true size with nearest-neighbour zooms (8× and 4×); the favicon in mocked light and dark browser tab bars, active and inactive, beside two neutral placeholder tabs, at 1× and Retina; the manifest's "any" 192 and 512, the maskable icon with Android's 80% safe circle and two launcher crops, and the Apple touch icon with a home-screen preview. Reports an SVG favicon linked beside size-specific PNGs (supporting browsers use the SVG at every size), missing sizes and wrong dimensions, maskable content outside the safe circle, transparent corners, how much of the 16 px tile the drawing fills, and the favicon's weakest contrast against the tab bar shades; Claude then judges the sheet against `reference/guidance.md`. Finds icons from the HTML link tags and the web manifest, or a profile `.claude/icon-check.md` (`reference/profile-format.md`). Never edits icons or commits. Model-invocable, since it's cheap and most useful right after an icon changes.

## docs 0.6.0 - 2026-10-29

### Added

- `writing-audit`: audits what a project has written against its own writing standard, or four default tests (specific, says what was tried, claims checked or labelled, adds something new). Surfaces are `files` (UI copy, message catalogues, docs, guides) or `live` (what the project's bots or agents publish, read with a read-only fetch command into a scratch folder that's deleted afterwards). Read-only `docs:reviewer` agents in parallel (`reference/reviewer-brief.md`); claims about the product checked against the profile's sources of truth; the lead verifies every claims finding that isn't borderline, every one it calls worst, and two others per reviewer. The report (`reference/report-format.md`) has ids `<prefix>-<date>-NN`, statuses verified, plausible, borderline, a "Didn't hold" list, and the causes behind repeated failures with where each fix belongs. Never fixes, posts or edits copy; commits the report by default, never pushes. Profile `.claude/writing-audit.md` (`reference/profile-format.md`, with discovery and an example). `disable-model-invocation: true`.
- `docs:reviewer`'s description names writing-audit's reviewers.

## setup 0.3.4 - 2026-10-29

### Changed

- `project-setup`, the protected-paths hook's tests: more cases for the `~` and `$` handling of `cd`, `pushd` and `git -C` targets (`${HOME}`, `pushd ~/...`, `"${dir}"`, `git -C ~/...` and `git -C $HOME/...` writes; `cd $HOME`, a `cd` from an unknown folder to an absolute one, and `git -C ~/...` reads). The hook is unchanged.

## code-quality 0.7.0 - 2026-10-29

### Added

- `commit-range-review`, `codebase-audit`: optional profile setting `commit_command`, how the project makes a commit (e.g. `make check && git commit`), as in `finish-change`. The report commit and each fix commit are made with it. Default: what CLAUDE.md or AGENTS.md says, else `git commit`.
- `outside-contribution-review`: optional profile setting `commit_command`. The skill still never commits; when bringing a PR in leaves a commit to make (an import), the maintainer notes name the commit step with this command after the import command. Default as above.

## docs 0.5.0 - 2026-10-29

### Added

- `docs-sync`: optional profile setting `commit_command`, how the project makes a commit (e.g. `npm run lint && npm test && git commit`), as in `finish-change`. The sync's commit is made with it. Default: what CLAUDE.md or AGENTS.md says, else `git commit`.

## code-quality 0.6.0 - 2026-10-28

### Added

- `finish-change`: finishes a change the same way every time. Step 1 verifies it end to end in a throwaway instance of the running app (the profile's verify skill or command, or discovered: a project run skill, the end-to-end tests' setup, the dev command), writing what's expected before looking and evidence lines after (`reference/verify-by-surface.md` for web, API, CLI, jobs and libraries); step 2 runs `/simplify`; step 3 the project's checks; step 4 commits only this change's files with a "Verified:" block, and pushes only if the profile says so. Profile `.claude/finish-change.md` (`reference/profile-format.md`, with discovery and an example). `disable-model-invocation: true`, since it commits.

## docs 0.4.0 - 2026-10-28

### Added

- `agents/checker.md` (`docs:checker`): a read-only checker for mechanical sub-agent work, on a cheaper model (`model: sonnet`). Same tools as `docs:reviewer` (Read, Grep, Glob). It does exactly the task, marks anything that needs a judgement call `NEEDS-JUDGEMENT: <why>` instead of guessing, and reports in the exact shape asked.
- `docs-sync`: `reference/checker-escalation.md`, the shared escalation rule: the lead re-runs a checker's unit with `docs:reviewer` for items marked `NEEDS-JUDGEMENT`, a malformed or incomplete reply, or a failed spot check (at least 3 items); units touching security, money, credentials, personal data or published text use the reviewer from the start; never re-run on the cheaper model; every escalation is reported, and a role escalating in more than about a third of its units is recommended for the stronger model.
- `docs-sync`: optional profile setting `models: { checker: sonnet }` (the default); an alias changes the checker's model, `inherit` runs everything on the session's model.

### Changed

- `docs-sync`: on large runs, Step 5 splits the fix agents. Files whose fixes all carry exact, validated text go to **fix placers** (`docs:checker`, new fix placer brief), which only copy the current text and pair it with the lead's; files needing new wording go to fix drafters (`docs:reviewer`), as before. The report gains an "Escalations" line. Auditors and validation are unchanged and stay on the session's model.

## Repository - 2026-10-28 (checkers)

### Added

- `templates/skill/reference/checker-escalation.md`: the original of the shared escalation rule, copied unchanged into every skill that uses a checker.

### Changed

- `scripts/validate.mjs`: an agent's `model` must be an accepted value; a `checker` agent must set `model` and have exactly its plugin reviewer's tools; a skill that dispatches a checker must point to `reference/checker-escalation.md`, carry a copy identical to the template, and document `models` in its profile format.
- CONTRIBUTING section 2 and the README (Layout, rules of thumb): mechanical sub-agent work may run on a cheaper `checker` agent with automatic escalation; judgement work stays on the session's model.
- Every other skill's sub-agent roles were classified as judgement and left on the session's model: `architecture-review` panelists, `design-review` reviewers, `user-panel-review` panelists, `commit-range-review` slice and cross-cutting reviewers, `codebase-audit` auditors, `docs-sync` auditors and fix drafters. `outside-contribution-review`, `cloud-first-apply` and `practice-watch` use no sub-agents.

## architecture 0.6.0 - 2026-10-28

### Added

- `agents/reviewer.md` (`architecture:reviewer`): a read-only reviewer agent. Tools: Read, Grep, Glob, WebFetch, WebSearch; no shell, no editing tools.

### Changed

- `architecture-review`, `design-review`: reviewers are dispatched as `architecture:reviewer` instead of `Plan`, so read-only is enforced by the agent's tool list, not only by the brief. The briefs say reviewers have no shell, read instead of running commands, return their report in the reply, and name any command the lead should run. The `git status` check stays as a backstop for the fallback agent type.
- `user-panel-review`: unchanged; its panelists stay general-purpose agents, since they need a shell and a browser to use the product.

## code-quality 0.5.0 - 2026-10-28

### Added

- `agents/reviewer.md` (`code-quality:reviewer`): a read-only reviewer agent. Tools: Read, Grep, Glob; no shell, no editing, no web.

### Changed

- `commit-range-review`: slice and cross-cutting reviewers are dispatched as `code-quality:reviewer`. The lead now saves each slice's `git diff` and each merge's `git show --remerge-diff` inside the git directory (never tracked or committed, deleted at the end), and gives reviewers a checkout at the head (a temporary worktree if the working tree isn't there). Reviewers no longer run tests: they say what to run, and the lead runs it when verifying.
- `codebase-audit`: auditors are dispatched as `code-quality:reviewer` and read the checkout at the pinned commit (the repository or the temporary worktree) instead of `git show`. Tests and commands are the lead's, in verification.
- `outside-contribution-review`: unchanged; it uses no sub-agents.

## docs 0.3.0 - 2026-10-28

### Added

- `agents/reviewer.md` (`docs:reviewer`): a read-only reviewer agent. Tools: Read, Grep, Glob; no shell, no editing, no web.

### Changed

- `docs-sync`: auditors are dispatched as `docs:reviewer` and read a per-group diff the lead saves inside the git directory (deleted at the end). Fixer agents are replaced by read-only **fix drafters** (large runs only) that return exact old/new text; the lead checks and applies every edit. External groups are checked by the lead only.

## Repository - 2026-10-28 (agents)

### Changed

- README "Layout" and CONTRIBUTING section 2: plugins may ship `agents/`; review sub-agents use the plugin's own read-only agent; Bash only when unavoidable, and said so.
- `scripts/validate.mjs`: checks each plugin's `agents/*.md` for front matter with `name` (matching the file name), `description` and `tools`, and that an agent granting Bash says so in its description.

## setup 0.3.3 - 2026-10-28

### Fixed

- `headless-job`: a failed run is retried. The template guard writes its new fingerprint to `<name>.fp.pending`, and `bin/run` keeps it only after a run whose reply has no `FAILED:` line; before, the guard saved it before Claude started, so a failed run was skipped until the watched thing changed again. A `FAILED:` line also raises a notification.
- `headless-job`: the template prompt names every allowed command exactly as the `tools` rules match it and says any other shell command is refused by design. Without that, a job whose first shell command (a `grep`) was refused concluded the shell was unavailable and stopped without trying the commands it was allowed. SKILL.md Step 2 says to write prompts this way.
- `headless-job`: `bin/run` sets `-f`, so a tool rule such as `Bash(gh pr list:*)` is never expanded against file names.

## setup 0.3.2 - 2026-10-28

### Changed

- `project-setup`, the protected-paths hook: follows `cd` and `pushd` within one command (relative paths after them are judged from the new folder, also inside a subshell's parentheses) and `git -C <dir>`. A folder it can't resolve (`cd "$dir"`, `cd -`) counts as protected; a `~` or `$HOME` target is taken literally. It also blocks `cp`/`mv`/`install -t` and `--target-directory` into a protected folder, `curl -o`/`-O`, `wget -O`/`-P`, `tar -x -C`, `--write` and `--fix` (prettier, eslint and other formatters), and `awk -i inplace`. Its test has 40 more cases (81 in all).

## setup 0.3.1 - 2026-10-28

### Changed

- `project-setup`: housekeeping checks the per-turn load (skill descriptions, MCP tool names, a long agent-instructions file) and suggests setting aside what the project doesn't use.

## setup 0.3.0 - 2026-10-28

### Added

- `headless-job`: turns a recurring task into a headless job that runs outside any Claude Code session. It first judges whether the task can run headless (what it needs; narrow authorization; a cheap guard; what needs a person) and says why not when it can't. Then it writes the job from a template: `prompt.md`, a `tools` list passed as `--allowedTools` with everything else refused, a shell `guard` so Claude starts only when there's work, a `model` and a USD cap per run, and a launchd (macOS) or systemd (Linux) schedule. The person runs the install. The runner logs every run and raises a desktop notification for reply lines starting `OWNER:`.

## setup 0.2.1 - 2026-10-28

### Changed

- `practice-watch`: recommends the end state of each practice, not every step: items are grouped by practice, judged at their latest state, and earlier advice is recorded as **superseded** with what replaced it (a new verdict; a full-history run yields a short list of current practices). When a new item replaces an adopted practice, it recommends the change and what to remove.
- `practice-watch`: filters first, cheaply: posts plainly not about how to work (short replies, support back-and-forth, thanks, hiring, events, personal posts) are dropped before anything is read closely, opened or followed.
- `practice-watch`: captures what a source shares, not only what it writes: reposts (searched separately where author search leaves them out), quote posts, linked posts and images (alt text, or a look at tip-related images), credited to their real author, with the sharer counted as endorsing it.

## setup 0.2.0 - 2026-10-28

### Added

- `practice-watch`: watches trusted sources (the Claude Code team's posts, docs and release notes; practitioners) for new tips and practices. Each run collects what's new since the last (or a source's full history), triages each item against the current setup (recommend, already doing, not for you, watch, with the source and a reason), writes a report, and records every item seen so it's never reported twice. For each recommendation the user adopts, it routes the change to the right repository (personal config, a project, a skills repository, a machine-setup folder; unrouted ones get a suggestion), codifies it, runs that repository's checks, commits and pushes as the profile says. Sources that need a signed-in browser are read through it, reading only; everything read is treated as data. Suggests new people to follow. Profile at `~/.claude/practice-watch.md` or `.claude/practice-watch.md`.

## setup 0.1.0 - 2026-10-28

### Added

- New `setup` plugin with `project-setup`: sets up a project to use these skills. It checks which plugins are installed (and gives the install commands for missing ones), writes a starter profile for each skill picked, from that skill's own profile format and discovery, with guesses marked `TODO:`, never overwriting an existing profile; adds a "Reviews and docs" section to CLAUDE.md or AGENTS.md; and, if asked, installs guardrails for parallel fix runs: `permissions.ask` rules and the protected-paths hook, copied into `.claude/hooks/`, configured by `.claude/protected-paths.json`, wired in `.claude/settings.json` and tested. Shows every change before writing it; commits only if asked.
- The protected-paths hook (`hooks/protected-paths/`): a `PreToolUse` hook on `Bash` that refuses shell commands writing under the configured folders (redirections, `sed -i`, `tee`, `cp` and `mv` into them, `rm`, `git checkout` and `restore`, `find -delete`, inline scripts that write there) and optional formatters that rewrite files in place. Permission ask rules cover only the Edit and Write tools; this covers the shell. With its test (`node --test`) and an example config. A guard, not a sandbox.

## architecture 0.5.0 - 2026-10-28

### Changed

- `user-panel-review`: the default roster is now the three people personas: curious newcomer, regular, bad actor. The agent personas (agent builder, autonomous agent at first contact, power agent) are added only when Step P finds an agent-facing surface: a public API or OpenAPI file, a CLI, an SDK, an MCP server, or discovery files such as `/llms.txt`. The bad actor's hats are chosen by the kind of product (community, commerce, SaaS or API), plus the prompt injector when agents are in the panel. New example profile and sample output, on a team invoicing app. Migration: a profile that keeps "the defaults" now gets three personas on a product with no agent-facing surface; name the agent personas in `## Personas` to keep them.
- `architecture-review`: offers to publish the report as a page only if the host can publish pages.
- All three skills: the person who decides is "the maintainer", not "the owner". Sample ids and dates are clearly illustrative.

## code-quality 0.4.1 - 2026-10-28

### Changed

- `commit-range-review`, `codebase-audit`, `outside-contribution-review`: examples and sample outputs rewritten as different, generic projects (an online shop's conventions, a Go backend with specs, a docs site mirrored from a monorepo). The mirror capability is unchanged.
- `codebase-audit`: the finding kind "owner decides" is now "maintainer decides".

## docs 0.2.1 - 2026-10-28

### Changed

- `docs-sync`: service catalog, settings comments and legal drafts are examples, not standard artifacts; neutral example paths (`config/settings.toml`, `ROADMAP.md` "Next", `deploy/**`); runs after a working session, in a new one; "the maintainer" for the person who decides.

## infrastructure 0.2.1 - 2026-10-28

### Changed

- `cloud-first-apply`: the park drill is described as a scale-to-zero ("park") drill, if the project has one; plugin and marketplace descriptions match; a neutral root in the argument hint; the sample names the DNS provider's proxy generically.

## Repository - 2026-10-28

### Added

- README: "How they fit together", the recommended rhythm (which skill when, its cost, a typical week, rules of thumb), with cost and cadence matching each skill's README.
- README: "Set up a project": a profile per skill, a snippet for the project's agent instructions, optional guardrails for fix runs, registering the marketplace for a team, and housekeeping.
- CONTRIBUTING: "Contributing from outside" (an issue first for a new skill, fork, pull request, the maintainer reviews and merges; contributions are under MIT).
- `templates/skill/reference/context-check.md` and a Step C in the template; CONTRIBUTING section 4b; `scripts/validate.mjs` requires Step C first in every skill and an unchanged copy of the check.

### Changed

- Licensed under MIT (was proprietary). Each `plugin.json` says `"license": "MIT"`.
- README catalogue grouped by plugin. Examples across all skills generalised, so each reads as a different, generic project.

### Removed

- README and CONTRIBUTING: the private-repository install note, personal clone paths (now `/path/to/claude-skills`), and the one-person approval flow.

## code-quality 0.4.0 - 2026-10-28

### Added

- `codebase-audit`: audits the whole codebase as it stands at one commit, not its history, against its own documents and for defects.
  - Pins one commit (a temporary worktree if the working tree differs) and inventories every tracked file, minus the profile's skipped paths.
  - A governance map: each area's governing documents (designs, decision records with their later dated notes, API and user docs) and the project-wide rules; areas without a document and documents about things that don't exist are governance gaps.
  - Slices small enough to read in full with their documents, run in parallel waves of read-only auditors (default 12 per wave; more slices mean more waves, never bigger slices), plus two cross-cutting auditors: contracts between areas, and system-wide documents.
  - Each auditor checks every concrete claim in its documents, the rules, correctness, security, tests and dead code, and lists every file it read.
  - Every finding verified at the pinned commit; each code-versus-document disagreement judged code wrong, document wrong or maintainer decides.
  - A per-file coverage table; unread files get an extra wave, and anything still unread is reported as not audited.
  - Report with "since the last audit", an index, follow-ups; commits by default, never pushes unless the profile says so. Fixes only when asked, code findings only; document fixes go to docs-sync.
  - Starts with the shared context check, weighing context load most.
  - Profile at `.claude/codebase-audit.md`, with a documented format, an example, and discovery when there's none. `disable-model-invocation: true`.

## architecture 0.4.0 - 2026-10-28

### Added

- `architecture-review`, `design-review`, `user-panel-review`: a first step, **Step C: Context check**, before any costly work: the shared check in `templates/skill/reference/context-check.md` (proceed, fresh session or wait). `architecture-review` and `user-panel-review` weigh authorship and context load most; `design-review` runs in the author's session and briefs reviewers from the design document only.

## code-quality 0.3.0 - 2026-10-28

### Added

- `commit-range-review`, `outside-contribution-review`: a first step, **Step C: Context check**, before any costly work: the shared check in `templates/skill/reference/context-check.md` (proceed, fresh session or wait). `commit-range-review` weighs authorship most; `outside-contribution-review` weighs anchoring most.

## docs 0.2.0 - 2026-10-28

### Added

- `docs-sync`: a first step, **Step C: Context check**, before any costly work: the shared check in `templates/skill/reference/context-check.md` (proceed, fresh session or wait). It weighs authorship and context load most, and runs after reviews and their fixes.

## infrastructure 0.2.0 - 2026-10-28

### Added

- `cloud-first-apply`: a first step, **Step C: Context check**, before any costly work: the shared check in `templates/skill/reference/context-check.md` (proceed, fresh session or wait). It weighs authorship when the guide is for someone else, and waits for any apply or deploy in flight.

## docs 0.1.0 - 2026-10-26

### Added

- `docs-sync`, a new `docs` plugin: "update everything", bringing a project's documentation and other non-code artifacts in line with the code and project state.
  - Scope: since the last sync (a marker file holding a commit), a commit range, `since <ref or date>`, or `all` for a full audit. Asks when there's no marker; recommends committing code first.
  - A per-project checklist of document groups, each with its files and what each is the source of truth for, triggers (path globs and change kinds such as API, schema, settings, infra, alarms, legal-relevant data) and checks. Group kinds: `docs`, `ledger` (append-only: dated notes and new entries only), `generated` (regenerated, never hand-edited) and `external` (checked read-only, never changed).
  - Maps changes to documents: triggered items, plus a grep for claims about the changed areas (renamed or removed names and paths, numbers from changed settings, counts and lists).
  - One read-only auditor per triggered group, in parallel, reporting file:line, the wrong text, the evidence and the corrected text.
  - Every finding validated by the lead before any edit (code, counts never personal data, quick checks), marked confirmed, partly true, not real or unverified, as in `design-review`'s step 4b.
  - Fixes by the lead or one fixer per group, never two agents on one file; asks before editing protected paths; never fixes code.
  - Runs the project's checks, separating its own failures from pre-existing ones.
  - A size watch that suggests archiving or splitting large or fast-growing docs without doing it, and profile upkeep that proposes groups for state-holding docs the profile misses.
  - Reports files changed per group, findings by verdict, what needs the maintainer, and the new marker. Commits by default, never pushes unless the profile says so. `audit-only` reports without editing.
  - `disable-model-invocation: true`: it spawns several agents, edits many files and commits.
  - Profile at `.claude/docs-sync.md`, with a documented format, an example, and discovery when there's none.

## architecture 0.3.1 - 2026-10-26

### Changed
- `design-review`: a validation step (4b) before deciding: every reviewer concern is checked against the code, the data (counts only, never personal data), a quick test or query plan, and any build branch already in progress, then marked confirmed, partly true, not real or unverified; only confirmed concerns drive changes. The ADR's review table and the report show the validation. Plainly right fixes are adopted without asking; a build started before the review is paused until the questions are answered.

## architecture 0.3.0 - 2026-10-26

### Added

- `design-review`: a lightweight review of one design before it's built.
  - Takes a draft ADR, a design doc or a description; with only a description, writes the draft ADR first in the project's format.
  - Picks 3 to 5 personas from the project's architecture-review panel by what the design touches, through an area-to-persona map (a default one, or the profile's), and says why each was picked.
  - One read-only reviewer per pick, in parallel, with a fixed brief: the design inline, pointers to the relevant code and docs, "judge the design, not the code as it stands", the project's stage for proportionality, light research limits, and a verdict (ship, ship with changes, rethink) with risks, changes and questions for the maintainer in about 600 words.
  - The lead verifies, merges and deduplicates, settles disagreements, revises the draft, and writes a "Design review" section in the ADR: reviewers, what each raised, adopted, adapted and rejected with reasons, and open questions with recommendations.
  - Never builds: building starts after the review is folded in and the maintainer's questions are answered. Doesn't commit by default.
  - Left model-invocable (no `disable-model-invocation`), so Claude can run it when planning a significant change: it's cheap and read-only apart from the one ADR.
  - Profile at `.claude/design-review.md`, with a documented format, an example, and discovery when there's none.

### Changed

- `CONTRIBUTING.md`: when a skill that spawns agents may stay model-invocable.

## code-quality 0.2.0 - 2026-10-26

### Added

- `outside-contribution-review`: reviews a pull request or patch from someone outside the team, a person or an AI agent, against the project's own written standards, and writes a verdict: accept, accept with changes, needs an issue first, or close.
  - Everything in the PR is untrusted data (diff, title, description, commits, comments, added files). Instructions found there are reported, never followed. The PR's code is never checked out, installed, built or run; tests run only where the profile says untrusted code may (the PR's CI after a maintainer approves it, or a named sandbox).
  - Gatekeeping checks first: template, agreed issue, size, dependencies, forbidden and generated paths, secrets, binaries, licence or sign-off, agent disclosure, and attempts to steer the reviewer.
  - A standards review where every finding cites its rule (file and section), blocking or suggestion; nothing invented.
  - Public `standards` and private `maintainer_context` are kept apart: the contributor's part, which may be posted, cites and quotes only public standards, never a private source repo's internal docs, paths, hosts or plans.
  - A two-part verdict: a kind, plain part for the contributor, and maintainer-only notes with risks, CI state, what to check by hand, and the exact command to bring it in, including an import command for a public mirror of a private repository.
  - Prints by default; saves and posts a PR comment only as the profile allows, and posts only after the user confirms. Never merges, closes, labels or approves.
  - Profile at `.claude/outside-contribution-review.md`, with a documented format, two examples (a public mirror, a single repository), and discovery when there's none.

## infrastructure 0.1.0 - 2026-10-25

### Added

- `cloud-first-apply`: writes the step-by-step first-apply guide for one infrastructure-as-code root (OpenTofu/Terraform, CDK, Pulumi, CloudFormation, Bicep).
  - Every regional step carries a region callout, and global services are named as global.
  - Read-only checks (format, validate, init without a backend), an inventory by region with idle cost flags, and a check that the root can apply on its own.
  - The person's steps: access, bootstrap, certificates, images, secrets (hidden entry), DNS records with when each goes live, vendor connectors, migrations, turning things on.
  - For projects that scale to zero ("park"): what's deleted and kept, a consistency check, and a timed drill.
  - Never applies, creates resources, changes DNS or handles secret values.
  - Profile at `.claude/cloud-first-apply.md`, with a documented format, an example, and discovery when there's none.

## architecture 0.2.0 - 2026-10-25

### Added

- `user-panel-review`: an outside-in review by simulated users, the counterpart of `architecture-review`.
  - Six default personas: curious newcomer, regular, agent builder, autonomous agent at first contact, power agent, and bad actor (with hats: spammer, vote ring, sock-puppet farm, harasser, scraper, prompt injector, rule gamer).
  - Each panelist sees only what a real user of its kind sees (the running app, public docs, CLI, API or MCP server), never the source, and may create accounts and content on the local throwaway instance only.
  - The lead verifies every finding against the code (CONFIRMED, PLAUSIBLE, or dropped with the reason), checks which defence stopped or failed each attack, and groups findings by journey.
  - Re-tests the last run's open findings first.
  - Profile at `.claude/user-panel-review.md`, with a documented format, an example, and discovery when there's none.

## code-quality 0.1.0 - 2026-10-24

### Added

- `commit-range-review`: reviews a range of commits already on a branch, for trunk-based work and bursts of agent-written changes with no pull request.
  - The range is since the last review (a marker file), a ref, a date or the last n commits.
  - Large ranges are split by area across parallel read-only reviewers, plus a cross-cutting reviewer for merge conflict resolutions (`git show --remerge-diff`), contracts between areas and loosened tests.
  - Every finding is verified by the lead and marked CONFIRMED or PLAUSIBLE, or dropped with the reason. Findings that only disagree with a recorded decision are dropped.
  - Runs the project's checks, writes a ranked report and an index, and records follow-ups. The marker moves only after a complete run. Optional fixes, one commit per finding, each with a test.
  - Profile at `.claude/commit-range-review.md`, with a documented format, an example, and discovery when there's none.

## architecture 0.1.0 - 2026-10-24

### Added

- `architecture-review`: a general, continuous multi-agent architecture review, generalised from a project-specific skill.
  - Project specifics come from a profile at `.claude/architecture-review.md`, with a documented format, an example, and discovery plus a starter-profile offer when there's none.
  - Step 0 self-check: additive fixes go into the profile; structural changes are proposed. The shared skill is never edited during a review.
  - 13 default personas with general lenses; profiles can replace or extend lenses, and add, drop or rename personas.
  - Reviewers read the context document from disk instead of having it pasted into each brief.
  - Reviewers state the time window and source behind any rate or total they estimate.
  - Shared checks, scale tiers, blocker label, action-item location and id format, and commit behaviour are profile settings with generic defaults.
- Repository scaffolding: marketplace and plugin manifests, README, CONTRIBUTING, a skill template, `scripts/validate.mjs` and a small validation workflow.
