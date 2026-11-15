# boss-workers

Sets up a project so one boss session on the strongest model is the only session you talk to, and it dispatches the work to headless workers on cheaper models, across one or more subscription accounts.

- **Invoke:** `/setup:boss-workers [setup | check]` when installed as a plugin, or `/boss-workers` when copied into a skills folder.
- **Produces:** a boss launcher and a worker launcher (with `--model` and `--account`), the operating rules both follow, a section in CLAUDE.md or AGENTS.md, a profile, and, with you, a second account's config folder. The boss writes its own state file on its first start.
- **Cost:** low. One session, no sub-agents, and one throwaway worker run per account on the cheapest model.
- **When to run it:** once per project, when you want to stop answering several sessions and talk to one; again with `check` after adding an account or changing launchers. Not for a single long task: one session is simpler.

## How it works

| | The boss | Workers |
|---|---|---|
| Model | The strongest (e.g. Fable), falling back when its cap is near | By the work: e.g. Opus to build and review, Sonnet for checks and docs |
| Runs | One interactive session at the project root | Headless, one per folder at a time, started by the boss |
| Talks to | You, and workers | Nobody, except one message to the boss when a question blocks it |
| Keeps | Its state file, read at every start and after compaction | Its handoff |

Workers never ask you anything. A worker that can't settle a question writes it in its handoff, sends the boss one message and carries on; the boss answers by message, or in the next brief. You hear from the boss only about what your profile lists: money, anything public, physical steps, your identity.

Before starting a worker, the boss reads each account's limits (`claude -p "/usage"`) and picks one with room. Paid extras such as usage credits stay off, so a limit stops work instead of spending money.

Using more than one account is your decision, under your plan's terms; the skill says what the terms it can read say, and follows your choice.

## Context check

Weighs moving target and sequence: the boss must not start while another session still orchestrates the project.

## Project profile

`.claude/boss-workers.md`; see [reference/profile-format.md](reference/profile-format.md). Without one, the skill discovers the project's launchers, handoffs and config folders and offers a starter profile.

## Sample output

```
boss-workers: setup done

Written: .claude/boss-workers.md, docs/boss-workers.md, tools/boss, tools/run-worker, AGENTS.md (section "Boss and workers")
Accounts:
  main    ~/.claude          proven: /usage answers (week 41%, resets Thu 3am)
  second  ~/.claude-second   proven: separate login; test worker printed ~/.claude-second
Start the boss: tools/boss            (main has room this week)
Close first: the session "planner" still orchestrates; ask it to wind down, then start the boss.
Still yours: nothing.
```
