---
name: boss-workers
description: Sets up a project so one "boss" session on the strongest model is the only one a person talks to, and it dispatches the work to headless worker sessions on cheaper models (e.g. Opus to build and review, Sonnet for checks and docs), across one or more Claude subscription accounts. Writes a boss launcher, a worker launcher with --model and --account, the boss's state file, the operating rules both follow (workers never ask the person; a blocking question goes to the boss by one message), a CLAUDE.md or AGENTS.md section, and walks the person through logging in a second account in its own config folder. `check` mode audits an existing setup. Use when someone wants "a boss session", "one session I talk to", to "dispatch work to cheaper models" or "use both my accounts". Not for a task that repeats on a schedule (use headless-job). Reads .claude/boss-workers.md.
argument-hint: "[setup | check]"
disable-model-invocation: true
---

# Boss and workers

You set up a project for a way of working: one long interactive **boss** session, on the strongest model, is the only session the person talks to. It picks the work, writes the briefs, starts **workers** (headless `claude -p` sessions on cheaper models) and decides what a worker would otherwise ask the person. The person hears from the boss only about what truly needs them.

You write the launchers, the rules and the state file, and help set up accounts. You never start the boss or real workers yourself, never log in to an account, and never turn on paid extras (usage credits, extra usage): those are the person's.

Project specifics come from `.claude/boss-workers.md` (Step P). This file stays general.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings, defaults and a fictional example.
- `${CLAUDE_SKILL_DIR}/reference/operating-rules.md`: the rules the boss and workers follow; copied into the project.
- `${CLAUDE_SKILL_DIR}/reference/accounts.md`: a second subscription account in its own config folder, and how to prove the logins stay apart.
- `${CLAUDE_SKILL_DIR}/reference/template/`: `boss` and `run-worker`, with `@PLACEHOLDERS@` (listed in `profile-format.md`).

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any write, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Moving target (5) and sequence (7) weigh most:** other sessions may be running in the project. Changing a launcher they use mid-run is safe (scripts are read at start), but the boss must not start while another session still orchestrates: say so in the hand-off.
- Authorship (2) and anchoring (4) don't apply. A long conversation (3) that discussed the setup is an advantage.

## Step P: Load the profile

1. Read `.claude/boss-workers.md` if it exists.
2. Otherwise discover: the agent-instructions file (CLAUDE.md or AGENTS.md), any existing launcher scripts for headless sessions (grep for `claude -p`), handoff or state files, where work happens (the root, or sub-folders such as `apps/*` or worktrees), the project's push and commit rules, and other config folders under `~` that hold a Claude login (`.claude-*`). Tell the user what you found and offer a starter profile (`profile-format.md`). Ask only what can't be found: the accounts and which is the main one.

## Step 1 (check mode, or before setup): what's there

Report, without changing anything:
1. Launchers: do the profile's `boss` and `worker` paths exist, and do they pass `--model` and the account's config folder?
2. Accounts: for each, does its config folder exist, and does `claude -p "/usage"` (with `CLAUDE_CONFIG_DIR` set for a non-default one) answer with limits rather than "Not logged in"? Do the logins stay apart (`accounts.md`, "Proving the logins are separate")?
3. Rules: is the operating-rules copy present and does the agent-instructions file point to it and to the state file?
4. Sub-agent models: list the project's and installed plugins' agents without a `model:` line. They inherit the worker's model, which is usually right; say which would change if `CLAUDE_CODE_SUBAGENT_MODEL` were set, and recommend not setting it unless every reviewer names its model.

In `check` mode, stop here with the report and the fixes.

## Step 2: Write the setup

Show every file before writing it; never overwrite a file the person changed without showing the diff.
1. **Profile:** write `.claude/boss-workers.md` if missing.
2. **Operating rules:** copy `operating-rules.md` to the profile's `rules_doc`, with the profile's model table, accounts and escalation list filled in.
3. **Launchers:** copy `template/boss` and `template/run-worker` to the profile's paths, replace every `@PLACEHOLDER@` from the profile, `chmod +x`, and syntax-check them (`bash -n`). If the project already has a worker launcher, add the options to it instead, keeping its own rules, and say so.
4. **State file:** don't write it. The boss builds it on its first start from the project's handoffs (the boss launcher's opening prompt says how), so its first picture of the project is its own.
5. **Agent instructions:** add a short section to CLAUDE.md or AGENTS.md: the boss is the only session the person talks to; workers start through the launcher; where the rules doc and the state file are.
6. **Accounts:** for each non-default account, follow `accounts.md`: create its config folder with links to the shared settings, prove a fresh folder starts logged out, then give the person the login command. After they say it's done, prove both logins work and stay apart.
7. **Test:** run one throwaway worker through `run-worker` on each account with the cheapest model, in a scratch folder the launcher accepts, briefed to change nothing and print `$CLAUDE_CONFIG_DIR`. Delete the scratch folder.
8. Commit if the profile's `commit` is on (default on; one commit, the project's trailers). Push only if `push` is on.

## Hand off

Reply with: the files written; the accounts and whether each was proven; how to start the boss (the exact command, and on which account first, given each account's usage now); what to close first (any session still orchestrating; others wind down at a clean point and the boss takes over their work); and what the person still has to do. Never claim an account works until its `/usage` answered.
