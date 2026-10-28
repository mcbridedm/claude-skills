---
name: docs-sync
description: Update everything. Brings a project's documentation and other non-code artifacts (such as roadmap and status files, design docs, ADR notes, guides, runbooks, generated docs, and where a project has them a service catalog, settings comments or legal drafts) back in line with what the code and the project state actually are. Scopes to what changed since the last sync (a marker), a commit range or a date; maps the changes to the docs they make stale; audits with a few read-only agents in parallel, one per document group; validates every finding before editing; fixes, runs the project's checks, and commits. Use after a working session, before a restart, a handover or a review, or when the user says "update everything", "update all docs", "sync docs", "docs are stale" or "bring the docs up to date". Not for writing new documentation from scratch or reviewing code. Reads .claude/docs-sync.md; without one, discovers the docs and offers a starter profile.
argument-hint: "[blank = since the last sync | <ref>..<ref> | since <ref or date> | all] [audit-only]"
disable-model-invocation: true
---

# Docs sync

You are the project's documentation lead after a working session. Code and project state moved; the documents that describe them may not have. You find every place where a document now says something untrue or leaves out something it's meant to hold, prove each one, fix it, and leave a marker so the next sync starts where this one stopped.

**The rules that matter most:**
- **Validate before you edit.** Auditors can be confidently wrong. Nothing changes until you've checked it yourself (Step 4).
- **Change only documents.** Code bugs found on the way are reported, never fixed here. Settings files count as documents only for their comments.
- **Respect each group's kind:** ledgers get dated notes or new entries, never rewrites; generated files are regenerated, never hand-edited; external systems are checked, never changed.
- **Never two agents on the same file.**
- **Ask before editing paths the project's rules protect** (the profile's `ask_before`, or the project's own instructions).
- **Commit and push only as the profile says.** Default: commit, never push.

Project specifics come from the project's profile at `.claude/docs-sync.md` (Step P). This file stays general. Its own files are shared by many projects: never edit them during a run; propose profile changes instead (Step 7).

Supporting files; read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings, group kinds, change kinds and defaults.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starting point for a starter profile.
- `${CLAUDE_SKILL_DIR}/reference/auditor-brief.md`: the brief for auditors and fixers, and the finding format.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) weighs most.** If this conversation made the changes being synced, it will tend to see each document as already updated, because it remembers updating it. Recommend a fresh session.
- **Context load (3) weighs heavily:** a sync reads many documents and the whole change range.
- **Moving target (5) and sequence (7):** wait for pushes, agents and CI runs that commit. Run after reviews and the fixes they ask for, so the sync sees them too.

## Step P: Load the profile

1. Read `.claude/docs-sync.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md` for what it may hold.
2. Also read the project's agent instructions (CLAUDE.md, AGENTS.md, CONTRIBUTING.md) for rules about docs: what must be updated with every change, which paths need permission, writing style. They add to the profile; where they conflict, the stricter rule wins.
3. **No profile:** discover the docs without sub-agents, as in "Discovery" in `reference/profile-format.md`. Tell the user in a few lines which groups you found, their kinds, the checks, and what you guessed. **Offer to write a starter profile** at `.claude/docs-sync.md` (shaped like `reference/example-profile.md`, `TODO` where you guessed); write it only if they agree. Run with the discovered values either way, but without a profile don't commit unless the user says so.

## Step 1: Scope

Turn the argument into a base and a head (full SHAs on the profile's `branch`, default the current branch):

| Argument | Base | Head |
|---|---|---|
| blank | the marker (the profile's `marker`, a one-line file holding a commit) | `HEAD` |
| `A..B` | A | B |
| `since <ref>` | the ref | `HEAD` |
| `since <date or "yesterday">` | `git rev-list -1 --before=<date> HEAD` | `HEAD` |
| `all` | none: a full audit of every group, every file | `HEAD` |

- **No marker and no argument:** don't guess. Show `git log --oneline -15` and ask where to start; recommend `all` for a first run on a project whose docs have never been synced, or `since <date>` for the date the docs were last known good.
- **Check the base is an ancestor of the head** (`git merge-base --is-ancestor`). If history was rewritten, say so and ask.
- **Uncommitted changes:** if `git status --porcelain` shows changes outside the docs, say so. Recommend committing them first, so the docs describe committed code and this run's commit holds only docs. Include them in the scope only if the user says so.
- **Empty range:** say so. Offer a size watch (Step 7) and stop.
- Say the scope in one line: base, head, commits, date span, files changed.

Note `git status --porcelain` now; Steps 3 and 5 compare against it.

## Step 2: Map changes to documents

Build the work list: which document items this change set may have made stale, and why. With `all`, every group and file is on it.

1. **Classify the changes.** `git diff --name-status <base> <head>` and `git log --format='%h %s' <base>..<head>`. Tag each changed file with the change kinds it represents (the profile's `## Change kinds`, or the defaults in `profile-format.md`: api, schema, migration, events, settings, infra, alarms, jobs, dependencies, ui, cli, legal-data, process, docs). Note renamed and deleted paths.
2. **Match the triggers.** For each group and each file in it, its triggers (path globs, change kinds) against the classified changes. A file is triggered when any trigger matches. Record the matching changes as the reason.
3. **Find the claims.** Grep the documentation (every group's paths plus any other Markdown) for facts about the changed areas:
   - names that changed or were removed: module, route, command, setting key, environment variable, table, event, alarm, file path;
   - links and paths to renamed or deleted files;
   - numbers that come from changed settings (limits, lifetimes, sizes);
   - counts and lists that the change grew or shrank ("13 reviewers", "the four apps").

   A doc that matches is added to the work list even if no trigger named it. A match outside every group is a candidate for Step 7.
4. **Generated groups:** for each, decide whether its sources changed (its triggers). If they did, it needs regenerating in Step 5; it isn't audited by an agent.
5. **External groups:** list which checks the change set calls for (e.g. a new alarm should exist in the incident tool). They're checked read-only in Step 3.
6. **Show the work list** in brief: per group, the triggered files and the reason in a few words. Then go on, unless it's very large (more than about 60 files outside `all`); then ask whether to narrow it.

## Step 3: Audit in parallel

Send one auditor per triggered group, **all in a single message** so they run at once:
- At most the profile's `max_auditors` (default 6). Merge the smallest groups to fit; split a group with more than about 25 triggered files.
- Use a read-only agent type (`Plan` or `Explore`). Their shells can still write, so the brief forbids it and you check afterwards.
- Give each the auditor brief in `reference/auditor-brief.md`, filled in: the group, its kind and rules, its files with what each is the source of truth for, the triggered items and reasons, the change summary, the relevant claims from Step 2, and the group's checks.
- **Ledger groups:** the auditor may propose only a dated note under an existing entry, a new entry, or an index row. Never a rewrite of what's recorded.
- **External groups:** you check these yourself, read-only, with whatever tool or CLI the profile names (or one read-only agent if the checks are many). Record differences as findings with the fix the maintainer would make; never change the external system.

If an auditor fails or returns something off-format, re-run it once. If it fails again, say so in the report and carry on; never write its audit yourself.

Afterwards compare `git status --porcelain` with Step 1. If an auditor created or changed a file, revert only that, and say so.

## Step 4: Validate every finding

Auditors read; you can also run things. An auditor can be confidently wrong, about the code, the data or what a document is for. **Before a finding changes anything, validate it yourself:**
- read the cited lines (and the lines around them; check the claim, not just the citation), and the code or state that is the evidence;
- check the data where it decides the matter, with **counts and shapes only, never personal data** (e.g. "how many settings keys exist", "how many alarms are defined", not the rows);
- run a quick check: the command the doc documents (`--help`, a dry run), the test that guards the doc, a grep across the code, a generator in a scratch location, never against production;
- check whether the document is the right place: the group's "source of truth for" line, and the project's rules (a fact may belong in another file, which this one should link to instead).

Mark each finding **confirmed**, **partly true** (say which part), **not real** (with the evidence) or **unverified** (say why it couldn't be checked; it goes to the report, not into the docs). Only confirmed and partly true findings drive edits, and partly true ones only for the part that holds. Merge duplicates across auditors. Keep the evidence (file:line, the command and its output in a line, the count) for the report.

If the argument was `audit-only`, skip to Step 8 now: report, no edits, no marker.

## Step 5: Fix

1. **Plan the edits.** Assign every file to exactly one editor: you, or one fixer agent per group (for large runs, more than about 15 files to edit). A file named by two groups goes to the first group that lists it. **Never two agents on the same file.**
2. **Ask first where the rules say so.** Collect the edits that touch `ask_before` paths (or paths the project's instructions protect) into one question to the user: each edit in a line, with your recommendation to apply it and why. Apply only what they approve. Don't route around the protection with shell edits.
3. **Apply by kind:**
   - **docs:** the corrected text, in the project's writing style and the file's own format. Keep "last verified" or "last updated" lines current where the file has them.
   - **ledger:** a dated note (`YYYY-MM-DD: ...`) under the entry, a new entry in the ledger's format, or an index row. A new decision that needs a new record (an ADR) is proposed to the maintainer, not written, unless the project's rules say the docs sync writes them.
   - **generated:** run the group's `regenerate` command; never hand-edit. If it needs network or credentials and fails, report it.
   - **external:** never. Report the fix for the maintainer.
4. **Fixer agents** (when used) get the fixer brief in `reference/auditor-brief.md`: only the validated findings for their files, the exact corrected text where you have it, their file list, and "edit only these files". Use an agent type that can edit; run them in one message.
5. Afterwards, check that `git status --porcelain` shows changes only in files you planned to edit. Revert anything else.

## Step 6: Verify

Run the profile's `checks` (default: the project's lint and test commands, if found; some test suites read the docs). Also check that every link and path this run added or changed resolves.

- A failure in a file this run edited: fix it and re-run.
- A failure elsewhere: check whether it also fails without this run's edits (`git stash` the edits, run the one failing check, `git stash pop`). If it does, it's pre-existing: report it, don't fix code.

## Step 7: Size watch and profile upkeep

- **Size watch:** list documents over the profile's `size_threshold_kb` (default 40), and those that grew by more than `growth_threshold_kb` (default 10) since the base (`git show <base>:<path> | wc -c`). For each, *suggest* archiving or splitting, following the profile's `## Archiving` conventions if it has them (e.g. finished items to a monthly archive file). Don't do it.
- **Profile upkeep:** propose additions to `.claude/docs-sync.md`: state-holding documents no group covers (from Step 2's grep, or new docs added in the range), triggers that missed a doc an auditor found stale, groups whose paths no longer exist. Write the profile change only if the user agrees; it's the project's file, never this skill's.

## Step 8: Report, marker and hand off

1. **Marker:** write the head SHA to the profile's `marker` path (default `docs/.last-docs-sync`), only after a complete run with checks green. A partial, failed or `audit-only` run leaves it where it was.
2. **Commit** if the profile's `commit` is true (the default with a profile; without one, only if the user said so): stage only the files this run edited and the marker (never `git add -A`), in one commit with the profile's `commit_message` (default `Docs sync: <base short>..<head short>`), ending with the repository's attribution line. **Push** only if the profile's `push` is true (default false).
3. **Reply** in chat, short and plain:
   - **Scope:** the range, commits and date span.
   - **Files changed, per group:** each file with a few words on what changed.
   - **Findings by verdict:** counts per confirmed, partly true, not real, unverified; then the not-real ones in a line each (so the maintainer sees what didn't hold) and the unverified ones with why.
   - **Needs the maintainer:** edits waiting on permission, external drift with the fix, proposed new records (ADRs), code bugs found on the way, pre-existing check failures; each with your recommendation.
   - **Size watch** and **profile suggestions,** a line each.
   - **Checks:** pass or fail.
   - **Marker:** the new SHA (or "not moved", and why), and the commit hash, or "not committed".
