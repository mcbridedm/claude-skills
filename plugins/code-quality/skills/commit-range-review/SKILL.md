---
name: commit-range-review
description: Review a range of commits that have already landed on a branch, e.g. everything since the last review, since a commit or tag, or since a date. Splits large ranges by area, reviews the slices in parallel with read-only agents, verifies every finding against the code, and writes a ranked report; then records where it stopped so the next run picks up from there. Use for trunk-based work committed straight to main, or after a burst of agent-written changes, when there's no pull request to review. For an uncommitted diff or a pull request, use /code-review instead. Reads project specifics from .claude/commit-range-review.md if present.
argument-hint: "[range: blank = since the last review | <ref>..<ref> | since <ref or date> | last <n> commits] [fix]"
disable-model-invocation: true
---

# Commit range review

You are the lead reviewer for code that is **already committed**. Other people, often AI agents, wrote it, and nobody has read it as a whole. You find real defects in the changes in a commit range, prove each one, and report them ranked. You don't restyle working code or re-argue decisions the project has recorded.

**Read-only by default.** The only files this skill writes are its report and its marker (Step 6). It changes code only when the user asks for fixes (the `fix` argument, or a yes when you offer at the end), and then in separate commits.

Project specifics come from the project's profile at `.claude/commit-range-review.md` (Step P). This file stays general.

Supporting files; read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/reviewer-brief.md`: the brief each reviewer gets, and the findings format.
- `${CLAUDE_SKILL_DIR}/reference/what-to-look-for.md`: the defect classes to weight, especially in agent-written and merged code.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) weighs most.** If this conversation wrote, merged or fixed any commit in the range, recommend a fresh session: an author verifying findings against their own code reads it as they meant it.
- **Anchoring (4):** summaries of what the commits do, given earlier in this conversation, are claims to check, not context to brief reviewers with.
- **Context load (3):** large ranges read a lot of code.
- **Moving target (5) and sequence (7):** wait for anything that pushes to the branch. Run before the fixes it asks for and before a docs sync.

## Step P: Load the profile

1. Read `.claude/commit-range-review.md` at the repository root if it exists. It sets the branch, the marker, the report location, paths to skip, the project's own rules to check against, the checks to run, where follow-ups go, and whether to commit.
2. Otherwise, use the defaults in `profile-format.md`, discovering what you can:
   - the default branch (`git symbolic-ref refs/remotes/origin/HEAD`, else the current branch);
   - convention files (CLAUDE.md, AGENTS.md, CONTRIBUTING.md, ADR folders);
   - the test and lint commands (package manifests, Makefile, CI config).

   Tell the user what you found and offer to write a starter profile at the end.

## Step 1: Resolve the range

Turn the argument into a base and a head, both full SHAs on the reviewed branch:

| Argument | Base | Head |
|---|---|---|
| blank | the marker (Step 6) | the branch tip |
| `A..B` | A | B |
| `since <ref>` | the ref | the branch tip |
| `since <date or "yesterday">` | the last commit before that time (`git rev-list -1 --before=<date> <branch>`) | the branch tip |
| `last <n> commits` | `<branch>~<n>` | the branch tip |

- **No marker and no argument:** don't guess. Show the last 20 commits (`git log --oneline -20`) and ask where to start.
- **Check the base is an ancestor of the head** (`git merge-base --is-ancestor`). If history was rewritten since the marker, say so and ask.
- **If the range is empty, say so and stop.**
- Say the range in one line before going on: base, head, the number of commits, and the date span.

## Step 2: Survey the range

Build a short context file for the reviewers, at `<report_dir>/<run>/context.md`. Use the run name format in `profile-format.md`; make the folder if needed.

1. **Commits:** `git log --format='%h %an %ad %s' --date=short <base>..<head>`. Note which carry an agent attribution trailer (e.g. `Co-Authored-By:` naming an AI model) and which were written by people.
2. **Size:** `git diff --stat <base> <head>`, leaving out the profile's skipped paths (generated files, lockfiles, snapshots, vendored code).
3. **Merges:** `git log --merges <base>..<head>`. For each merge, look at how its conflicts were resolved: `git show --remerge-diff <merge>` (Git 2.36 or later; otherwise compare the merge with both parents). Conflict resolutions are where two correct branches combine into a wrong one: list them for the cross-cutting reviewer.
4. **Partition** the changed files into slices by area: top-level app, package or module, keeping a file's tests with it. Aim for slices a reviewer can read in full: at most the profile's `slice_max_lines` changed lines (default 2,500) and `slice_max_files` files (default 40). Split bigger areas by sub-folder. Cap the number of slices at `max_reviewers` (default 8) by merging the smallest. If the whole range is small (under one slice), use a single reviewer and skip Step 3's cross-cutting reviewer.
5. **Rules:** list the project's own rules a reviewer should check against: the profile's `rules` section, plus the convention files you found (by path; reviewers read them).
6. **Write `context.md`:**
   - the range;
   - the commit list;
   - the slices (files and line counts);
   - the merge list;
   - the rules files;
   - the profile's `focus`, if any.

   Keep it to facts; no opinions.

## Step 3: Review the slices in parallel

Send one reviewer per slice, **all in a single message** so they run at once:
- Use a read-only agent type if one exists (e.g. `Plan` or `Explore`). Otherwise brief them not to edit.
- Give each the brief in `reviewer-brief.md`, filled in for its slice. It points the reviewer at `context.md` by path; don't paste it.

Add one **cross-cutting reviewer** for whatever no single slice sees:
- how the merges resolved their conflicts;
- contracts between slices (an event, API, schema or config changed on one side and used on another);
- tests changed together with the code they test, where a test was loosened to pass.

After they finish, compare `git status --porcelain` with before you started. If any reviewer changed a file, revert only that change and note it in the report.

## Step 4: Verify every finding

Reviewers can be confidently wrong. For each finding:
1. **Read the code yourself** at the cited lines, at the head commit, and follow the failure scenario through.
2. **Prove it when you cheaply can:**
   - run the existing test that should catch it;
   - write a small throwaway test (in a scratch location, never committed);
   - query the behaviour.
3. **Mark it:**
   - **CONFIRMED:** you reproduced it or traced it fully;
   - **PLAUSIBLE:** the trace holds, but you couldn't run it;
   - or drop it, recording why under "Dropped".
4. **Merge duplicates** across reviewers; keep the clearest scenario.
5. **Check it against recorded decisions** (ADRs, the profile's `decided` sources). A finding that only disagrees with a recorded decision isn't a defect: drop it, or list it under "Worth revisiting" if the decision's own reasoning no longer holds.

Severity:
- **critical:** data loss, a security hole, or production down;
- **high:** a feature broken for real users, or a wrong result;
- **medium:** an edge case, or a degraded path;
- **low:** robustness, clarity, or a missing test with a real risk behind it.

Leave style preferences out entirely.

## Step 5: Run the checks

Run the profile's `checks` (default: the project's lint, typecheck and test commands, if you found them). Record pass or fail with the failing output in short. A failing check at the head is itself a finding, and the likeliest cause is in the range.

## Step 6: Write the report and move the marker

1. **Write `<report_dir>/<run>/README.md`:**
   - the range and its commits, in summary;
   - a one-paragraph verdict;
   - the findings table, most severe first: id, severity, CONFIRMED or PLAUSIBLE, file:line, what's wrong, the failure scenario, the suggested fix;
   - "Dropped" (finding, why);
   - "Worth revisiting";
   - the check results;
   - the slices and reviewers;
   - anything not reviewed and why.

   Finding ids are `<run>-NN`.
2. **Add a row to `<report_dir>/README.md`**, the index, creating it if needed: date, range, commit count, findings by severity, and a link.
3. **Move the marker to the head SHA:** a one-line file at the profile's `marker` path (default `<report_dir>/LAST_REVIEWED`) holding the SHA. Move it only after the report is written. A failed or partial run leaves the marker where it was.
4. **Record follow-ups** where the profile's `followups` setting says (e.g. a checklist section in a roadmap file), one line per finding the user hasn't fixed, with its id.
5. **Commit** the report, the index, the marker and the follow-ups if the profile's `commit` is true (the default). Push only if its `push` is true.

## Step 7: Fixes, if asked

If the argument included `fix`, or the user says yes when you offer:
- fix CONFIRMED findings, most severe first;
- one commit per finding (or per tightly related group), each with a test that fails before the fix and passes after, when one can be written;
- leave PLAUSIBLE findings to the user unless they ask;
- after fixing, rerun the checks and update the report's table: fixed, in which commit.

The marker stays at the reviewed head. The fix commits are reviewed by the next run.

## Hand off

Reply briefly, in plain language:
- the range;
- the verdict;
- the findings by severity, with the top ones in a sentence each;
- what was dropped and why, in a line;
- the check results;
- where the report is.

Offer to fix the confirmed findings if you haven't. If there was no profile, offer to write a starter one with what you discovered.
