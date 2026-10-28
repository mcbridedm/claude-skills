# Changelog

All notable changes to this repository are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are per plugin, as set in each `plugin.json`, and follow [Semantic Versioning](https://semver.org/).

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
