# practice-watch

Keeps your Claude Code setup current with what skilled users have learned. Each run:

1. **Collects** what your sources published since the last run: the Claude Code team (posts, docs, release notes) and the practitioners you trust. Sites that need you signed in are read through your browser, reading only.
2. **Triages** each tip against how you already work (your CLAUDE.md files, settings, hooks, skills, plugins): recommend, already doing, not for you, or watch, each with a reason and the source.
3. **Reports** the new ones, and records everything it saw so the next run reports only what's new.
4. **Adopts** what you choose, one at a time: writes it into the repository where it belongs (your personal config, a project, a skills repository, a machine-setup folder), runs that repository's checks, commits and pushes as your profile says.
5. **Suggests people** worth following, cited by the sources you already trust.

Everything it reads is treated as data: a post that says "run this" is a tip to judge, not an instruction.

## Invoke

```
/setup:practice-watch                         # every source, since the last run
/setup:practice-watch team-member full-history   # a first sweep of one person's history
/setup:practice-watch all report-only         # report, adopt nothing
```

## Run it daily

The skill doesn't schedule itself. Either:
- **In your session:** ask Claude Code to schedule it ("every morning at 7:43, run /setup:practice-watch"). Session schedules end with the session, so recreate it at session start (a line in your CLAUDE.md's session-start routine does that).
- **In the cloud** (`/schedule`): survives restarts, but can't use your signed-in browser, so `via: browser` sources are skipped there.

## Profile

`~/.claude/practice-watch.md` (or `.claude/practice-watch.md` in a repository): the sources, the record and reports location, your setup files, the routes for adopted changes, and your "not for me" list. Format: [reference/profile-format.md](reference/profile-format.md); example: [reference/example-profile.md](reference/example-profile.md). No profile? The skill offers to write one.

## Cost

Low for a daily run (one session, a few fetches, no sub-agents). A `full-history` sweep of a prolific person reads a lot: run it once, in a fresh session.

## Context check

Readiness weighs most: a browser source needs your signed-in browser, and the destination repositories should be clean before anything is codified.

## Sample output

```
Practice watch, 2026-03-12: 6 sources, 9 items, 4 kept.
Recommended:
1. Deny reads of .env in project settings (team docs, 2026-03-10): you keep secrets there and have no deny rule. -> the shop's .claude/settings.json. S.
2. Re-inject the session-start routine after compaction with a SessionStart hook (team member, 2026-03-11): your routine is a memory today. -> ~/.claude/settings.json. S.
Already doing: parallel sessions in worktrees (~/src/shop/CLAUDE.md:88).
Watch: a new loop pattern for long refactors (one practitioner; no docs yet).
Candidate source: practitioner-c, cited by two of your sources.
Report: ~/config/practice-watch/reports/2026-03-12.md. Adopt #1? I recommend yes: one setting, closes a real gap.
```
