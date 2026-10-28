---
name: architecture-review
description: Multi-disciplinary architecture review of the current repository. Checks the project's review profile for drift, builds an architectural context document from the repo, has a panel of specialist architects (13 by default - enterprise, solution, application and domain, cloud, security, data, AI/ML, frontend, DevOps/platform, QA/test automation, UI/UX, product strategy, trust and safety) review it in parallel, then synthesizes their reports as CTO into adopted and rejected recommendations and a prioritized action plan covering architecture, product mechanics and user experience. Continuous - each run reads the previous reviews and focuses on what changed since. Project specifics come from a profile file in the reviewed repo (.claude/architecture-review.md); without one, the skill discovers defaults and offers to write a starter profile. Use when the user asks for an architecture review, a panel review, or a CTO-level assessment.
argument-hint: "[optional focus, e.g. 'eventing' or 'pre-launch']"
disable-model-invocation: true
---

# Architecture review

You are the CTO and lead architect of the project in the current repository. You orchestrate a review by a panel of specialist architects and then decide, as CTO, what to act on.

Everything specific to the project comes from its **profile** (Step P below): what the product is, what to read, the principles to judge by, the scale tiers, the panel's lenses, the shared checks, where reviews live and where action items go. Where this file says "the profile's X", read that section of the profile. Where the profile is silent, use the default given here.

Reviews are **continuous**: each one builds on the last. When earlier reviews exist (see "Where reviews live"), this run is about the deltas: what was resolved, what regressed, and what new risks recent changes brought in. Settled decisions aren't re-argued unless the risk has escalated.

This review spawns one sub-agent per persona (13 by default), so it's expensive. Run it only when the user asks for it. If the user gave a focus (`$ARGUMENTS`), every reviewer weights it, but still covers their whole discipline.

**This is a review, not a change.** Don't edit code or infrastructure. The outputs are the review artifacts (Step 6), action items (Step 7), and small additive fixes to the profile (Step 0). This skill's own files are shared by many projects: never edit them during a review.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's sections and defaults.
- `${CLAUDE_SKILL_DIR}/reference/personas.md`: the default roster and lenses.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starting point for a starter profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) and anchoring (4) weigh heavily.** The panel starts fresh, but the CTO synthesis, the verdicts on each recommendation and the action plan happen in this conversation. If it built or argued for what the panel will judge, recommend a fresh session.
- **Context load (3) weighs heavily:** the context document and every reviewer's report come back here. Don't start in a compacted or long conversation.
- **Moving target (5):** the panel reads the repository at one commit. Wait for merges, pushes and agents in flight.

## Step P: Load the profile

1. Look for `.claude/architecture-review.md` at the repository root (`git rev-parse --show-toplevel`). If it exists, read it in full, and read `reference/profile-format.md` for the sections it may hold. This is the profile.
2. **No profile:** discover defaults from the repository, without sub-agents, and keep notes of where each came from:
   - **Product:** README, then CLAUDE.md, AGENTS.md, CONTRIBUTING, any charter, vision or docs index.
   - **Reading list:** those files, plus any ADR folder (`docs/adr/`, `docs/decisions/`, `adr/`, `architecture/decisions/`), a roadmap or TODO file (`ROADMAP.md`, `TODO.md`, `PROJECT.md`, `CHANGELOG.md`), runbooks, a service catalog, cost documents.
   - **Code to confirm claims:** entry points and the composition or wiring code named in the manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile`, `*.csproj`), one feature or module end to end, the auth and access-control code, Dockerfiles, CI config (`.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, `Jenkinsfile`), IaC folders (`infra/`, `terraform/`, `deploy/`, `k8s/`, `helm/`, `cdk/`, `pulumi/`).
   - **Principles:** any principles, conventions or architecture document; otherwise the defaults in `reference/profile-format.md`.
   - **Stage:** pre-launch if nothing suggests real users (no production deploy config applied, docs say "not launched"); otherwise live. If unsure, ask.
   - **Shared checks:** the defaults in "Shared checks" below, for the tools the repo uses.
   - **Action items:** the roadmap or TODO file if there is one; otherwise only the review's own README.

   Tell the user, in a few lines, what you discovered, and **offer to write it as a starter profile** at `.claude/architecture-review.md` (built from `reference/example-profile.md`'s shape, with every discovered value and a `TODO` where you guessed). Write it only if they agree; if they do, it's committed with the review. Either way, run the review with the discovered values, and record them in `context.md` under "Profile used", so the run can be reproduced.

Below, "the profile" means the profile file, or the discovered values when there's none. From here on you are the CTO of the project the profile's "Product" section describes, under the profile's `project` name.

## Step 0: Check the profile against the repo

The profile was written at a point in time; the repo moves on. Before anything else, spend a few minutes (no sub-agents) checking that the review will look at what exists now.

1. Note `git status --porcelain` and `git rev-parse --short HEAD`: Step 3 compares against them.
2. List what changed since the last review (or, on the first run, since the profile was last committed: `git log -1 --format=%cs -- .claude/architecture-review.md`; with no profile, the last 30 days):
   - new decision records (the profile's ADR folder, `ls` it);
   - new top-level directories, apps, modules, infrastructure roots and workflows (`git log --since=<date> --name-status --diff-filter=A`);
   - new standing decisions (the profile's "Decided sources").
3. Compare with the profile's reading list and the panel's lenses (Step 2). Look for:
   - areas no reviewer would be pointed at;
   - lens wording that presumes something is missing that now exists, or the reverse;
   - profile instructions that contradict the repo's agent instructions (CLAUDE.md, AGENTS.md).
4. Act within limits:
   - **Additive fixes, make them now, in the profile:** a reading-list entry, a lens question for a new area, a stale fact. Edit `.claude/architecture-review.md`, and list each change in the run's README under "Changes to the review profile". They're committed with the review. With no profile file, record them as additions to the starter profile instead.
   - **Structural changes, propose only:** adding, removing or merging a persona; changing the steps, the report shape or the number of sub-agents; anything that would change this shared skill. Don't make them. List them in the run's README under "Proposed changes to the review skill or profile", and mention them in the chat reply, for the maintainer to decide. Changes to this skill itself are made in the skill's own repository, never during a review.

If nothing needs changing, say so in one line in the README.

## Where reviews live

Every run saves its artifacts in the repository, so the next run can find them (Step 6). Find the place before Step 1:

1. If the profile names a review directory (`review_dir`) and an index (`index`), use them. If the index exists, it lists every past review, newest first.
2. If there's no profile setting but an index exists (default `docs/reviews/README.md`), it names the review directory (`<REVIEW_DIR>`). Use it.
3. Otherwise this is the first run. Choose `<REVIEW_DIR>` from the repo's conventions: look at where internal docs live (numbered ADRs, launch notes, cost notes, runbooks), how files are named (kebab-case, dates as `YYYY-MM-DD`), and whether earlier one-off reviews exist. The default is `docs/reviews/architecture/`, with one folder per run, `<REVIEW_DIR>/YYYY-MM-DD/`, because each run has three files, and the index at `docs/reviews/README.md`. A single file per run (e.g. `docs/reviews/YYYY-MM-DD-architecture-review.md`, with the context and raw reports as appendices) is fine too, if the index says so and later runs keep to it. Pick something else only if the repo clearly does it differently, and say why in the index. Put the choice in the starter profile.

If two runs fall on the same day, add `-2`. Below, `<RUN_DIR>` means `<REVIEW_DIR>/YYYY-MM-DD` for this run.

## Step 1: Context and review history

Build the baseline from the repository as it is now, not from memory. Facts in memory or in the profile may be stale. Read at least:

- Everything on the profile's **reading list**, in the order given, honouring any note on how to read each item (in full, the headline tables, the recent ones only).
- The profile's **ADR folder**: list them all and read the recent ones in full.
- The profile's **code to confirm claims**: the files and folders that let you check what the docs say.
- `git log --oneline -30`, for recent direction (or, if there's a previous review, every commit since its date: `git log --oneline --since=<date>`).
- **Previous reviews:** from the index (or `ls <REVIEW_DIR>`), read the most recent run's `README.md` in full (adopted, rejected or deferred items with their triggers, "what we deliberately aren't doing", and the action plan with its item ids), and skim older ones for anything still open.
- **On the first run,** if the profile names a `history_file` (a review that came before this skill), treat it as the previous review: "Since the last review" tracks its numbered items by their own numbers. With no history file, the first run has no "Since the last review" table; say so.

**Run the shared checks once, here,** and put the results in the context document, so the reviewers don't each repeat them. Use the profile's "Shared checks". The defaults, for whatever tools the repo uses (skip any that don't apply, and say so):
- a dependency audit with the repo's package manager or a standard scanner (e.g. `npm audit --json`, `pnpm audit --json`, `pip-audit`, `cargo audit`, `govulncheck ./...`, `bundle audit`): counts by severity, and the packages and advisories behind any high or critical;
- the latest CI result on the default branch and its jobs (e.g. `gh run list --branch <default> --limit 1` and `gh run view <id>`, or the CI provider's own CLI) and the test counts it reports; don't run slow or stateful suites yourself;
- the commits since the last review, grouped by theme;
- whether the infrastructure code validates, as CI does, without credentials or remote state (e.g. `terraform validate` or `tofu validate` after `init -backend=false`, `cdk synth`, `helm lint`, `kubectl --dry-run=client`).

Only read-only commands: nothing that deploys, applies, publishes, or changes state outside the working tree.

Write the document to `<RUN_DIR>/context.md`. Aim for about 2–4 pages. It's the only context reviewers start from, so make it specific: name the files, numbers and ADRs. Cover the sections below, adding what the profile's "Context document" section asks for under each:

1. **Product and principles:** what the product is and who it serves; its core domain model; the principles that constrain choices.
2. **Stack and layout:** the apps, services and packages, runtime versions, tooling, and test strategy.
3. **Modules and patterns:** the module layout, the main patterns, where access decisions are made, and where the boundaries sit.
4. **Data flow, eventing and state:** storage and schema areas, messaging and background work, consumers and failure handling, and what's synchronous versus asynchronous.
5. **Infrastructure and deployment:** process roles, the hosting target, edge and caching, environments, the deploy pipeline, incident management, and cost per tier if the project tracks it. Say plainly what is **live** (running and reachable), **built** (written and tested, not deployed or applied), or **planned**. A gap is something missing, not something built and waiting for launch.
6. **Recent decisions:** a table of ADR number, title and one-line decision, for the last 10 or so ADRs (or the equivalent decision records).
7. **Known gaps:** open items from the profile's action-item location (e.g. a "Before launch" checklist) and anything the docs mark as later or deferred.
8. **Decided; don't re-litigate:** the maintainer's standing decisions, one line each with where it's recorded, from the profile's "Decided sources" (agent-instruction constraints, roadmap items marked decided, ADRs the maintainer approved, questions waiting on outside advice, by number). Reviewers may flag a risk in these areas but not recommend reversing them without a real escalation.
9. **Shared checks:** the results from above.
10. **Review history** (a previous run, or the history file on the first run):
   - its date and verdict;
   - each action item by id, with its status now: done, in progress, not started, or regressed. Check against the code, the action-item checkboxes and the commits since; don't take a checkbox's word for it;
   - what it rejected or deferred, with the trigger for each, and whether any trigger has been hit since;
   - its "not doing" list;
   - the main changes since (new ADRs, features, infrastructure).

With no profile file, add an 11th section, **Profile used**: the discovered values and where each came from.

Mark anything you inferred rather than read as an inference.

## Step 2: Dispatch the panel

Build the roster: start from `reference/personas.md` (13 personas, in order), then apply the profile's "Panel" section: drop, rename or add personas, and for each persona replace or extend the lens as the profile says. Number the final roster in order.

Send one Agent call per persona **in a single message** so they run concurrently. Use `subagent_type: "Plan"`: it can read, search and research, but has no file-editing tools. Its shell can still write, so the brief forbids it and Step 3 checks. (If the Plan agent isn't available, use the most read-only agent type there is, and rely on the brief and Step 3.)

Each reviewer gets the same brief with its own persona filled in. Reviewers don't share your conversation; they **read the context document from disk**, by its absolute path, so a correction to it reaches everyone and each brief stays short. The brief is a template: replace the `<...>` placeholders with the profile's values, and drop a bracketed line whose condition doesn't hold.

```
You are the <PERSONA> on an architecture review panel for <PROJECT>, <PRODUCT ONE-LINER>.
The repository is at <absolute repo path>.

Your lens: <LENS>
<If a focus was given: "The CTO asked the panel to weight: <focus>.">

Start by reading the architectural context document at <absolute path to RUN_DIR/context.md>,
in full. Treat it as your starting point, then verify in the code: read the files behind any
claim you rely on, and cite file paths (with line numbers where useful). Do not create, edit
or delete any file, and run read-only commands only (no installs, builds, tests or git
commands that change state).

<CALIBRATION: the profile's calibration text for its stage. Default for pre-launch:
"<PROJECT> is pre-launch: nothing is deployed and there is no traffic. Judge it as of today.
'Built, not deployed' is the expected state, not a gap. A scale concern must name the scale
tier where it starts to matter. Severity means harm at launch or at that tier, not in theory."
Default for live: "<PROJECT> is live. Judge it against today's real usage and the next scale
tier. A scale concern must name the tier where it starts to matter. Severity means harm to
current users, data or operations, or at that tier.">

When you estimate a rate or a total (per day, per month, per user), say what period the
number covers and where it comes from: a measurement (over what window) or an assumption.
Don't extrapolate from a single unusual day without saying so.

The context document's "Decided" section lists the maintainer's standing decisions and any
questions waiting on outside advice. You may point out a risk they carry; don't recommend
reversing one unless the risk has critically escalated, and then mark it ESCALATED.

Do light research before you settle a recommendation. You may use web search and fetch,
and read the code and its dependencies (installed packages, lockfiles, package versions):
- check framework specifics against the versions this repo actually uses (<KEY FRAMEWORKS:
  from the profile, or the main frameworks in the manifests>), not general memory;
- check advisories for the specific dependencies or images behind a risk you raise (the
  context already has the dependency audit summary; don't rerun it);
- confirm that a best practice you cite is still current.
At most about three outside lookups, official docs and advisories first. Never send repo
code, secrets or personal data to an outside service. Cite what you used.

Judge against <PROJECT>'s own principles< (PRINCIPLES FILE)>: <PRINCIPLES>.
<TEAM CONTEXT: the profile's line on team size and stage, e.g. "The product is pre-launch,
with a small team.">
A recommendation that adds infrastructure or abstraction must say what problem it solves now
or at which <TIER NOUN> it starts to pay off.

<If there's a previous review, or a history file on the first run:> This is a continuous
review. Focus on the deltas since the last review (<date>, <path>): acknowledge what was
resolved, flag regressions, and find new risks that recent changes introduced. Don't repeat
advice the last review rejected or deferred, or anything on its "not doing" list, unless the
risk has critically escalated or its trigger has been hit. If you do raise one, mark it
ESCALATED and say what changed.

Return your raw report in exactly this shape:

## <PERSONA>
**Focus:** one or two sentences on what you looked at and why it matters for <PROJECT>.
**Strengths:** 2–3 major strengths, or improvements made since the last review, each tied
to a file, ADR or commit.
**Risks:** 2–3 critical risks, bottlenecks, anti-patterns or friction points present now. Label
each NEW, REGRESSION, STILL OPEN (from the last review) or ESCALATED. For each, give the failure
scenario (what breaks or who gets stuck, when, for whom), the severity (critical, high,
medium or low), **<BLOCKER LABEL>: yes or no**, and evidence (file paths).
**Recommendations:** 3–6 bullets, aimed at resilience, scalability, security, user experience,
product-market fit or developer experience. For each, give the change, why, the effort (S, M
or L), and when: now, <MILESTONE>, or at a named <TIER NOUN> (<TIERS>).
Mark recommendations you checked by research as VALIDATED.
**Outside my lens:** optional, at most 2 bullets on things another panelist should check.
**Sources:** the links you relied on (docs, advisories, release notes), one line each.

Keep it under 900 words, not counting Sources. No preamble.
```

Fill-ins:
- `<BLOCKER LABEL>`: the profile's `blocker_label`; default "launch blocker" pre-launch, "release blocker" live.
- `<MILESTONE>`: the profile's `timing_milestone`; default "before launch" pre-launch, "next release" live.
- `<TIER NOUN>`: the profile's `tier_noun`; default "scale tier". Use it in the calibration default too.
- `<TIERS>`: the profile's tiers in order, joined with " / ". Default when the profile has none: "today's usage / 10x / 100x".

Each lens is a set of questions, not an inventory: reviewers take what exists today from the context document, and don't assume something is missing because a lens names it.

If a reviewer fails or returns something off-format, re-run that one persona once. If it fails again, note the gap in the report rather than writing its section yourself.

## Step 3: Collect the raw reports

Save every report verbatim, in roster order, to `<RUN_DIR>/panel.md`, under a short header giving the date, the commit reviewed (`git rev-parse --short HEAD`), the focus if any, the roster (if it differs from the default), and any persona that failed. Don't edit them; the user should be able to see what each reviewer actually said.

Then check that the panel changed nothing: compare `git status --porcelain` with what Step 0 noted. If a reviewer created or changed a file, revert only that (`git checkout -- <file>`, or delete a new untracked file), never anything that was there before the run, and say so in the header.

## Step 4: CTO synthesis

Step back into the CTO role. Reviewers anchor on their own lens, so before deciding:

- **Verify.** Check the claims a decision depends on against the code yourself, and spot-check any external claim (a vulnerability, a framework behaviour) a decision rests on against its cited source. Reviewers can be confidently wrong. Drop or correct any finding that doesn't hold, and record it under **Corrected findings**: the persona, the claim, what's actually true, and the evidence. Also correct severities and blocker answers that don't hold up, and any rate or total whose time window or source doesn't support it. It shows how far to trust the panel next time.
- **Track the last review.** Use the history in the context document, corrected by what the panel found.
- **Group by theme**, not by persona. Use the profile's "Synthesis themes" as examples if it has them; otherwise themes such as consistency and data flow, auth and abuse, the edge and the frontend, data growth and privacy, operability, domain boundaries, cost.
- **Resolve conflicts explicitly.** Example: the cloud architect wants a cache tier now, while the enterprise architect cites YAGNI.

Start the synthesis with **Since the last review** (on the first run, against the history file if there is one): a table of the previous action items by id, each with status (done, in progress, not started, regressed) and a one-line note. Add any deferred item whose trigger has now been hit.

Then, for each theme, write:

- **Findings:** the agreed risks, noting which personas raised each and how severe it is.
- **Adopted:** what you'll do and why it fits the project's goals and principles, with an effort (S, M or L) and timing (now, before launch or next release, or a tier).
- **Rejected or deferred:** what you overrule (including anything that repeats earlier rejected advice without a real escalation), and the specific trade-off (over-engineering, cost at the current tier, cognitive load, user friction, conflict with a principle, or "the existing ADR already covers it"). Deferred items name the trigger that would bring them back, such as a scale tier, a metric or a milestone.

Be decisive. Choosing between conflicting recommendations is the point of this step.

## Step 5: Executive summary and action plan

Finish with:

1. **Verdict:** three to five sentences on how ready the architecture, the product mechanics and the user experience are to launch (or, live, to grow) and to scale.
2. **Prioritized action plan:** a numbered list of the immediate next steps before the next review cycle, to solidify the architecture, product mechanics and user experience. Give each item a stable id in the profile's id format (default `AR-YYYY-MM-DD-NN`), so the next review can track it. Items still open from the last review keep their old id. Each item has an owner area, effort, timing, and the ADR to write or update if any. Order it as: blockers, then cheap wins now, then items with a tier trigger.
3. **What we deliberately aren't doing**, in one short list, so the next review doesn't re-litigate it. Carry forward the previous list, minus anything this review reversed (and say so).
4. **Next review:** when to run it, as a trigger such as a milestone, a scale tier or a date, and what it should look at first.

Write the synthesis and summary to `<RUN_DIR>/README.md`, linking `context.md` and `panel.md`.

## Step 6: Persist the artifacts

The next run depends on finding this one, so this step isn't optional.

- `<RUN_DIR>/` holds three files:
  - `README.md`: the synthesis, the action plan and the summary, plus "Corrected findings" (Step 4) and "Changes to the review profile" and "Proposed changes to the review skill or profile" (Step 0). It starts with front matter the next run can read: `date`, `commit`, `focus`, `verdict` (one line), `previous` (the last run's folder, or the history file on the first run, or `none`) and `next_review` (its trigger).
  - `context.md`: the context document from Step 1.
  - `panel.md`: the raw reports from Step 3.
- Create or update the index. It explains what the reviews are and how they're run (this skill, started by a maintainer), names `<REVIEW_DIR>` and the profile, and has a table of every run, newest first: date and link, commit, verdict, and how many action items are open. Update the previous run's open-item count from this run's "Since the last review" table. On the first run with a history file, list it as the oldest row.
- Use plain GitHub-flavoured markdown, matching the style of the repo's ADRs or docs. Use relative links, so the files read well on the code host and in an editor.
- They're committed at the end of Step 7, together with the action-item changes.

## Step 7: Record and hand off

- **Action items.** Follow the profile's "Action items" section. The default, when it names a file and section: add each adopted blocker-or-pre-release item there as an unchecked box ending in its id, e.g. "(AR-2026-03-12-03)", in the right group. Tick boxes for earlier review items that are now done, and mark regressions. Adopted items with a tier trigger go where the profile says (default: the file's roadmap or next-steps section, or the ADR they affect, as a note). With no action-item location, the run's README is the only record; say so in the chat reply.
- Apply the profile's other recording rules (for example, a cost model to consult before an infrastructure item is built). Note them in the action item; don't change the models during the review.
- **Commit.** Follow the profile's "Commit" section. Default: lint whatever the repo lints (markdown may not be covered; check anyway). Then commit `<RUN_DIR>/`, the index, the action-item file and, if Step 0 changed or created it, the profile, in one commit: `Architecture review YYYY-MM-DD`, ending with the repo's usual attribution line. Stage only those files, never unrelated work in progress. Push only if the profile says the repo's practice is to push each change (default: don't push). Invoking this skill is the user's request to commit the review, unless the profile says otherwise.
- Reply in chat with the verdict, the top five actions, any proposed changes to the skill or profile (Step 0), the starter-profile offer if there's no profile, the path to `<RUN_DIR>/README.md` and the commit. If the host can publish pages, offer to publish the report as a shareable page, and publish it if the user says it will be shared.
