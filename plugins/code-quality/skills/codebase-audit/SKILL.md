---
name: codebase-audit
description: Audit the whole codebase as it stands at one commit against its own documentation, designs, decision records, principles and conventions, and for defects. A snapshot audit of the end state, not a review of commits or history. Inventories every file, maps each area to the documents that govern it, has read-only auditors read every file in parallel waves, verifies every finding (and, where code and docs disagree, which side is wrong), proves coverage with a per-file table, and writes a ranked report. Use before a launch or a major release, or when asked to "audit the whole codebase", "check the code against the docs" or "is the current code what the designs say?". For recent commits use commit-range-review; for docs that drifted from code, docs-sync. Reads .claude/codebase-audit.md if present.
argument-hint: "[ref: default the branch tip] [area …] [fix]"
disable-model-invocation: true
---

# Codebase audit

You are the lead auditor of a codebase **as it stands at one commit**. You don't review history or diffs: you judge the end state of every file against what the project's own documents say it should be (designs, decision records, principles, conventions, API and user docs) and against what correct code does. You prove each finding, decide which side is wrong where code and documents disagree, and show that every file was read.

**Read-only by default.** The only files this skill writes are its report folder and the report index (Step 8), and follow-ups where the profile says. It changes code only when the user asks (the `fix` argument, or a yes at the end), and never changes documents itself: those go to the maintainer or to a docs sync.

**It's expensive:** many auditors, each reading a full slice and its documents. Run it when the user asks.

Project specifics come from the project's profile at `.claude/codebase-audit.md` (Step P). This file stays general.

Supporting files; read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/auditor-brief.md`: the brief each auditor gets, what to look for, and the findings format.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Context load (3) weighs most:** this is the heaviest read of any skill. Start it in a fresh conversation unless this one is short and fresh.
- **Authorship (2) and anchoring (4) weigh heavily.** If this conversation wrote much of the code, or has said the code or docs are in good shape, verification here would lean toward agreeing. Recommend a fresh session.
- **Moving target (5):** the audit pins one commit. Wait for anything that will push to the branch during the run, or the report is stale on arrival.
- **Sequence (7):** run before the fixes it asks for and before a docs sync. It replaces a commit-range review of the same code, so don't run both back to back.

## Step P: Load the profile

1. Read `.claude/codebase-audit.md` at the repository root if it exists. It sets the report location, paths to skip, the areas and the documents that govern each, the project-wide rules, the checks, the auditor limits, where follow-ups go, and whether to commit.
2. Otherwise, use the defaults in `profile-format.md` and discover: the default branch; convention files (CLAUDE.md, AGENTS.md, CONTRIBUTING.md); design and decision folders (`docs/design`, `docs/adr`, `doc/architecture`, …); the lint, typecheck and test commands. Tell the user what you found, and offer a starter profile at the end.

## Step 1: Pin the snapshot and inventory it

1. **Pin the commit:** the argument's ref, else the profile's branch tip. Record its full SHA and date. Everything below reads that commit. If the working tree isn't clean or isn't at it, audit the commit through a temporary worktree (`git worktree add --detach <tmp> <sha>`) so nobody's work in progress is read, and remove it at the end. Auditors have no shell, so they can't `git show` an older commit: they read this checkout, and you give them its path.
2. **Inventory:** `git ls-files` at the pinned commit, minus the profile's `skip` globs (generated files, lockfiles, vendored code, binaries). Count lines per file. Record the skipped paths and why.
3. If the argument names areas, audit only those, and say so in the report's first line. Otherwise audit everything.
4. Say it in one line before going on: the SHA, the date, files and lines to audit, files skipped.

## Step 2: Map the code to its documents

Build the **governance map**: for each area of the code, the documents that say what it should be.

1. **Areas:** the profile's `areas` (globs, each with its governing documents), else one per top-level app, package or module (`apps/*`, `packages/*`, `src/<module>/`, `services/*`, infrastructure roots), keeping each area's tests with it.
2. **Governing documents per area:** the profile's mapping, plus discovery: design documents that name the area's paths, modules or features; decision records that mention them (include later dated notes: they change the decision); API references or schemas the area serves; user or operator docs that describe its behaviour.
3. **Project-wide rules:** the profile's `rules`, plus the convention files. Every auditor checks these.
4. **Gaps, recorded as findings later:**
   - code areas with no governing document, when the project's rules say features have one;
   - documents that describe a feature, path, command, setting or endpoint that doesn't exist at the commit.
5. Write `<report_dir>/<run>/governance.md`: the areas, their files and line counts, their documents, the rules files, and the gaps. Facts only.

## Step 3: Slice and plan the waves

1. Split areas into **slices** an auditor can read in full along with its documents: at most `slice_max_lines` lines (default 4,000) and `slice_max_files` files (default 60). Split big areas by sub-folder; keep a module's tests with it; never merge unrelated areas just to save an auditor.
2. Every inventoried file belongs to exactly one slice. Write `<report_dir>/<run>/coverage.md`: one row per file, with its slice and a "read" column to fill in.
3. Plan **waves** of at most `max_auditors` (default 12) in parallel. Coverage beats speed: more slices mean more waves, not bigger slices.
4. Add the **cross-cutting auditors** to the last wave (brief in `auditor-brief.md`):
   - **contracts:** what one area exposes and another consumes (API schemas and their clients, events and their consumers, settings and their readers, database schema and its queries, CLI and SDK against the API);
   - **system-wide claims:** documents that describe behaviour across areas (README, onboarding guide, architecture overview, runbooks), checked against the code.
5. **A small codebase** (all of it fits in one slice): use one auditor with all three briefs (slice, contracts, system-wide claims) and say so in the report.
6. Tell the user the plan in a few lines: slices, waves, auditors, an estimate of the time it'll take.

## Step 4: Audit in waves

For each wave, send one auditor per slice **in a single message** so they run at once:
- `subagent_type: "code-quality:reviewer"`, this plugin's reviewer agent. Its only tools are Read, Grep and Glob: no shell, no editing, no web, so read-only is enforced, not just asked for. It reads the checkout at the pinned commit (the repository, or Step 1's worktree); tests and other commands are yours, in Steps 5 and 7. (If that agent isn't available, e.g. the skill was copied without its plugin, use the most read-only agent type there is, such as `Plan` or `Explore`, and rely on the brief and the check below.)
- the brief in `auditor-brief.md`, filled in for its slice: its files, its governing documents, the rules files, the pinned SHA, the checkout path, and the path to `governance.md`. Don't paste documents; give paths.

Each auditor returns findings and the list of files it read in full, in its reply; you write every file. After each wave, check `git status --porcelain` (a backstop for the fallback agent type): if an auditor changed a file, revert only that change and note it.

## Step 5: Verify every finding

Auditors can be confidently wrong. For each finding:
1. **Read the code and the document yourself** at the pinned commit, and follow the scenario through.
2. **Prove it when you cheaply can:** run the test that should catch it, write a throwaway test in a scratch location (never committed), or query the behaviour.
3. **For a conformance finding (code and document disagree), decide which side is wrong:**
   - **code wrong:** the document is the decided design (a decision record or current design doc says so, and no later note changed it). A defect.
   - **document wrong:** the code is deliberate (a later decision, a dated note, tests that pin it, or the document is plainly stale). For the docs sync, not a code fix.
   - **maintainer decides:** both are plausible and nothing recorded settles it. Say what each side says.
4. **Mark it** CONFIRMED (reproduced or fully traced) or PLAUSIBLE (the trace holds, not run), or drop it, recording why under "Dropped".
5. **Merge duplicates;** keep the clearest scenario. Check findings against recorded decisions: one that only disagrees with a decision isn't a defect (drop it, or list it under "Worth revisiting" if the decision's reasoning no longer holds).

Severity: **critical** (data loss, a security hole, production down); **high** (a feature broken for real users, a wrong result, a documented guarantee that doesn't hold); **medium** (an edge case, a degraded path, a design rule broken without a visible failure yet); **low** (robustness, clarity, a stale document people act on, a missing test with a real risk behind it). Style preferences aren't findings.

## Step 6: Prove coverage

1. Fill the "read" column of `coverage.md` from the auditors' lists.
2. Any file not read: send a small extra wave for those files. Whatever still isn't read is listed in the report as **not audited**, with the reason. Never report a file as audited because its slice was.
3. Summarize: files and lines read, of the total; areas fully covered.

## Step 7: Run the checks

Run the profile's `checks` at the pinned commit (default: the project's lint, typecheck and test commands). Record pass or fail, with the failing output in short. A failing check is a finding.

## Step 8: Write the report

1. **Write `<report_dir>/<run>/README.md`:**
   - the commit audited, and the scope;
   - a one-paragraph verdict;
   - the coverage summary (link `coverage.md`);
   - the findings table, most severe first: id, severity, kind (defect, code wrong, document wrong, maintainer decides, rule broken, governance gap), CONFIRMED or PLAUSIBLE, file:line (and document:line for conformance), what's wrong, the scenario, the suggested fix;
   - "Maintainer decides", each with both sides in a line;
   - "Dropped" and "Worth revisiting";
   - "Since the last audit": for each finding in the previous audit's report, still open or resolved (by file and issue, not id);
   - the check results; the slices, waves and auditors; anything not audited and why.

   Finding ids are `<run>-NN`.
2. **Add a row to `<report_dir>/README.md`**, the index, creating it if needed: date, commit, coverage, findings by severity and kind, and a link.
3. **Record follow-ups** where the profile's `followups` says: one line per open code finding with its id, and one line pointing the docs sync at the "document wrong" findings.
4. **Commit** the report folder, the index and the follow-ups if the profile's `commit` is true (the default). Push only if its `push` is true. Remove the temporary worktree if you made one.

## Step 9: Fixes, if asked

If the argument included `fix`, or the user says yes when you offer:
- fix CONFIRMED **defect**, **code wrong** and **rule broken** findings, most severe first, one commit per finding or tight group, each with a test that fails before and passes after when one can be written;
- leave **document wrong** findings to the docs sync, **maintainer decides** to the maintainer, and PLAUSIBLE findings to the user unless they ask;
- rerun the checks and update the report's table: fixed, in which commit.

## Hand off

Reply briefly, in plain language: the commit audited; the verdict; coverage (files and lines read of the total); findings by severity and kind, the top ones in a sentence each; the maintainer's decisions; what's for the docs sync; the check results; where the report is. Offer to fix the confirmed code findings, and suggest the order: fixes, then a docs sync. If there was no profile, offer to write a starter one with what you discovered.
