# boss-workers

Sets up a project so one boss session on the strongest model is the only session you talk to, and it dispatches the work to headless workers on cheaper models. A project runs on one subscription account at a time; you switch it when that account's week is used up.

- **Invoke:** `/setup:boss-workers [setup | check]` when installed as a plugin, or `/boss-workers` when copied into a skills folder.
- **Produces:** a boss launcher and a worker launcher (with `--model` and `--account`, and a sign-in check), a short rules doc for the project's own rules, a section in CLAUDE.md or AGENTS.md, a profile, and, with you, the machine's file of named accounts and a second account's config folder. The boss writes its own state file on its first start.
- **Cost:** low. One session, no sub-agents, and one throwaway worker run per account on the cheapest model.
- **When to run it:** once per project, when you want to stop answering several sessions and talk to one; again with `check` after adding an account or changing launchers. Not for a single long task: one session is simpler. Not for a task that repeats on a schedule: `headless-job` runs that without any session.

## How it works

| | The boss | Workers |
|---|---|---|
| Model | The strongest (e.g. Fable), falling back when its cap is near | By the work: e.g. Opus to build and review, Sonnet for checks and docs |
| Runs | One interactive session at the project root | Headless, one per folder at a time, started by the boss |
| Talks to | You, and workers | Nobody, except one message to the boss when a question blocks it |
| Keeps | Its state file, read at every start and after compaction | Its handoff |

Workers never ask you anything. A worker that can't settle a question writes it in its handoff, sends the boss one message and carries on; the boss answers by message, or in the next brief. You hear from the boss only about what your profile lists: money, anything public, physical steps, your identity.

## Accounts

- **Named, with their addresses.** One file on the machine, `~/.config/boss-workers/accounts`, names each account once (e.g. `primary`, `first@example.com`, its config folder) for every project. The name and the address always appear together; an account is never "1" or "second".
- **One account per project at a time.** The boss and all its workers run on the account the boss was started on. Started without `--account`, the boss launcher asks, showing each account as "name, address".
- **The sign-in check.** Before anything starts, the launchers check that the account's folder is signed in to the account's address, and refuse when it isn't. You sign in yourself, once per folder, at the machine. Never use `/login` in a folder to move it to the other account.
- **The switch is yours.** The boss reads its account's limits (`claude -p "/usage"`) and tells you when the week runs low. To switch, the boss saves its state and ends, workers stop at a commit, and you start the boss again with the other account's name; workers follow. See [reference/accounts.md](reference/accounts.md).

Paid extras such as usage credits stay off, so a limit stops work instead of spending money.

Using more than one account is your decision, under your plan's terms; the skill says what the terms it can read say, and follows your choice.

## One copy of the rules

The operating rules ([reference/operating-rules.md](reference/operating-rules.md)) stay in the skill. Every project's boss reads them from the installed skill at each start, so two projects can't drift apart. A boss that learns something about this way of working changes the skill, updates its installed copy and tells the other bosses the new version; a project's own rules stay in its profile and rules doc.

## Context check

Weighs moving target and sequence: the boss must not start while another session still orchestrates the project.

## Project profile

`.claude/boss-workers.md`; see [reference/profile-format.md](reference/profile-format.md). Without one, the skill discovers the project's launchers, handoffs and config folders and offers a starter profile.

## Sample output

```
boss-workers: setup done

Written: .claude/boss-workers.md, docs/boss-workers.md, tools/boss, tools/run-worker, AGENTS.md (section "Boss and workers")
Accounts (~/.config/boss-workers/accounts):
  primary, first@example.com     ~/.claude             sign-in ok; /usage answers (week 41%, resets Thu 3am)
  secondary, second@example.com  ~/.claude-secondary   sign-in ok; separate login; test worker printed ~/.claude-secondary
Start the boss: tools/boss --account primary   (primary, first@example.com, has room this week)
Close first: the session "planner" still orchestrates; ask it to wind down, then start the boss.
Still yours: nothing.
```
