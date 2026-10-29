---
name: finish-change
description: Finish a change the same way every time before calling it done — verify it end to end in the running app (not just unit tests), simplify the diff, run the project's checks, then commit with the evidence in the message. Use when a change is ready, when the user says "finish", "wrap up", "we're done", "commit it" or "ship it", or as the last step of building something. Not a code review (use /code-review) or a docs update (docs-sync). Reads .claude/finish-change.md for the project's verify, simplify, check and commit steps; discovers them without one.
argument-hint: "[what the change was for, or a commit range] [no-commit]"
disable-model-invocation: true
---

# Finish a change

You are finishing a change you (or another session) built. The goal: the change is **shown working**, as small as it can be, passes the project's checks, and is committed with evidence. Four steps, in order; stop at the first that fails, fix, and start again from step 1.

Unit tests say the code does what its author meant. Step 1 says the product does what the change promised, by running it and looking. Never skip it for a change in behaviour; say plainly when there was nothing to run.

Project specifics come from `.claude/finish-change.md` (Step P). This file stays general.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/verify-by-surface.md`: how to drive each kind of surface (web, API, CLI, job, library) when the profile doesn't say.

## Step C: Context check (first, before anything costly)

Before Step P, and before any command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) and anchoring (4) don't stop it:** finishing your own change is the point. Guard against them in Step 1 instead: write what you expect to see before you look, and report what you saw.
- **Readiness (6) weighs most:** what Step 1 needs (a container runtime, a browser tool, a built app) and a working tree holding only this change. Unrelated changes in the tree: wait, or ask which files belong to it.
- **Moving target (5) and sequence (7):** another session committing to the same branch, or a review queued for this change, means wait.

## Step P: Load the profile

1. Read `.claude/finish-change.md` if it exists.
2. Otherwise discover (see the profile format's "Discovery"): the project's run or verify skill or script, a throwaway or dev instance, the check command from CLAUDE.md, AGENTS.md, CONTRIBUTING or the CI config, and the commit convention from recent history. Tell the user what you found in a few lines, use it for this run, and offer to write a starter profile at the end.

## Step 1: Verify

1. **Decide what to check**, from the argument, the diff (`git diff HEAD`, or the range) and the conversation. Write down, before running anything:
   - what changed for a user (a page, an endpoint, a command, a job, a library function), and for whom;
   - what you expect to see when it works, and one way it could break;
   - the surfaces to drive (several when the change crosses them).
2. **Skip** only for changes with no behaviour (docs, comments, formatting, a refactor the tests pin down). Say "nothing to run: <why>" and go to step 2.
3. **Run it** with the profile's `verify` (a skill to invoke, or a command), else by surface (`reference/verify-by-surface.md`). Use a throwaway instance where the project has one; never production, never real accounts.
4. **Drive it** like a user: the happy path, the break you named, the refusal (signed out, wrong account) where access is involved. Then read the app's logs for errors.
5. **Record evidence** as lines: `<surface> <where>, <as whom>: <what you saw>`, plus `not checked: <what> (<why>)`. A failed check stops the skill: report it with the evidence, fix, start again.
6. **Stop what you started** (the instance, browser tabs) unless the profile says to keep it.

## Step 2: Simplify

Run the profile's `simplify` (default: the built-in `/simplify`, which reviews the diff for reuse, simplification and efficiency and applies fixes). If it changed behaviour-bearing code, go back to step 1 for the parts it touched. `simplify: none` in the profile skips it; say so in the report.

## Step 3: Checks

Run the profile's `checks` command (default: what Step P found). All must pass; a failure stops the skill with its output. Never skip or weaken a check to get through: fix the cause.

## Step 4: Commit

Unless `commit: false` in the profile or `no-commit` in the arguments:
1. Stage only this change's files (`git add <paths>`, not `-A`, when the tree holds anything else).
2. Write the message in the project's style (`commit_style`, or recent history): one logical change, the subject saying what changed, the body saying why. Add the verify evidence from step 1 (a "Verified:" block) when `evidence_in_commit` is on (default).
3. Commit the way the profile says (`commit_command`, e.g. with the checks chained before it), with any trailer the session requires.
4. Push only when `push: true` in the profile and the user hasn't said otherwise.

## Hand off

Reply with:

```
Finished: <commit sha and subject | not committed: why>
Verified (<instance>):
- <surface> <where>, <as whom>: <what you saw>
- not checked: <what> (<why>)
Simplify: <what changed | nothing | skipped: why>
Checks: <command>: passed
```

If there was no profile, end with the starter profile you'd write and ask whether to save it.
