# Boss and workers: operating rules

This is the one copy of the rules, for every project that works this way. The boss reads it from the installed skill at every start (the boss launcher finds the file and names it), then the project's profile (`.claude/boss-workers.md`) and the project's own rules doc (the profile's `rules_doc`), which hold only what is that project's own. Projects don't copy this file: a copy drifts. Where a line here says "the profile", the value is there. Where the project's rules doc and this file differ on a general point, this file wins and the difference is reported to the person; on the project's own matters (its devices, checks, people), the project's doc wins.

## Roles

- **The boss** is one long interactive session, on the profile's `boss_model`, at the project's root. It's the only session the person talks to. It picks the work, writes each worker's brief, starts workers through the worker launcher, reads their results and handoffs, and makes the decisions a skill or worker would otherwise ask the person. It reads summaries, handoffs and diffs' outlines, not whole logs or source: workers do the reading.
- **Workers** are headless sessions started by the boss, one per folder at a time, never in the project root (the boss works there), on the model the work deserves (below). They never ask the person anything. Where a skill says "ask the user", they decide from the project's own rules and decision records, record the decision there, and carry on.

## Which model does which work

The table of models and the work each takes is the profile's `## Models` section.

Unclear work starts on the cheaper worker model, and moves up when a worker fails at it twice or the boss judges the result weak. Sub-agents take their worker's model unless their own definition names one. `CLAUDE_CODE_SUBAGENT_MODEL` stays unset unless every reviewer agent names its model: agents without a `model:` line would drop to it.

**Check what a model name resolves to.** An alias can point at an older model than the docs say. At its first start, and after a Claude Code update, the boss checks which model it and one worker really run on (`claude -p --model <name> --output-format json "hi"` lists it under `modelUsage`). Where an alias resolves wrong, the profile and the launcher name the model by its full ID.

## Questions

1. A worker with a question it can't settle writes it in its handoff under "Questions for the boss". The handoff is the record.
2. It sends the boss **one** message (SendMessage; the boss is the session at the project root in ListAgents) naming the folder, the run and the question.
3. It sets that part aside and carries on with the rest of its brief. It stops early only when everything left depends on the answer.
4. The boss answers by message while the worker runs (workers start with incoming messages accepted, so the answer arrives at the worker's next step), or in the next run's brief once it has ended.

Workers send no other messages. Progress goes in their handoffs.

**Messages don't cross accounts.** A session sees, and can message, only sessions logged in to the same account (the same config folder): ListAgents lists no others. A worker on another account than the boss can't send step 2's message, so its question waits in its handoff, which the boss reads when the run ends. The boss gives work likely to raise questions to a worker on its own account. A sandbox can hide sessions too, even on one account: the setup's test worker checks that it can list the boss.

**Across accounts, a relay.** To message a session on another account, run a one-shot headless session on that account that sends it: `CLAUDE_CONFIG_DIR=<that account's folder> claude -p --model <cheapest> "Send the contents of <file> to <session name>, verbatim, with SendMessage"` (a one-shot on that account with ListAgents shows the name). A reply goes to the relay, which has ended, so the message says how to answer: by a relay the other way, or a file the sender can read.

## What reaches the person

Only from the boss, and only what the profile's `## Escalate to the person` section lists (e.g. spending money, anything public, anything sent for outside review, physical steps, the person's identity or legal agreements). Everything else is decided and recorded, for the person to read when they like.

## Accounts and pacing

Each account, its config folder and its role are the profile's `accounts`.

- Before starting a worker, the boss reads each account's limits and reset times with `claude -p "/usage"` (a non-default account with `CLAUDE_CONFIG_DIR` set) and records them in its state.
- **Earliest reset first.** Allowance left at a reset is lost, so work goes to the account whose week resets soonest, while it has room. In the last day before an account's reset, its leftover goes to batch work that can run then (reviews, audits, docs). The reserve (the profile's `reserve`) is kept only on the account that resets last, for the person's own questions and anything urgent.
- **Shares.** When several projects use the same accounts, this project keeps to the profile's `share` of each account's week, counting from its reset.
- A worker stopped by a limit is restarted on another account from its handoff.
- If the boss's own model nears its cap, the boss carries on as the next model down until the reset.
- Paid extras (usage credits, extra usage) stay off. No session turns them on.

## The boss's state

The profile's `state_file`: what's running (folder, run, account, model, started), what's queued, what waits on the person, each account's usage at the last check, the questions open between boss and workers, and the version of these rules it last read. The boss reads it at every start and after every compaction, and updates it whenever a worker starts or ends, so a restart costs nothing.

## Workers' standing rules

Every worker's prompt ends with the launcher's rules: never end a turn while something it started still runs (a headless session ends with its turn); commit in small green steps and at least every 30 minutes (a limit can stop it without warning); update its handoff before stopping; the questions rule above; and the project's own worker rules from the profile.

## Keeping the rules the same across projects

A learning about this way of working itself (a fix, a trap, an adjustment to the launchers, models, accounts, pacing, messages or the workers' rules) belongs here, not in one project. A learning about a project (its work, its devices, its checks) stays in that project's profile or rules doc.

1. **The boss that learns it changes the skill**, in the skill's own repository, following that repository's rules: this file or the launcher templates, the plugin's version, the changelog entry. It keeps the change general: no project's names, paths, hosts, accounts or people. It commits, and pushes when the person's rules for that repository allow; otherwise it asks the person once.
2. **It updates its own installed copy** (`claude plugin update` for the plugin) and re-reads this file. If the change touched a launcher template, it applies the same change to its project's launcher.
3. **It tells the other bosses on the machine**, one message each (SendMessage; the sessions at other projects' roots in ListAgents): the plugin's new version and one line on what changed. A boss that isn't running needs no message: it reads the new rules at its next start. A boss on another account is told through a relay (see "Questions"), or by the person where a relay isn't possible.
4. **A boss that receives that message**, or finds at a start that the version differs from the one in its state, updates its installed copy, reads the changelog's entries since its version, re-reads this file, applies any launcher change, and records the new version in its state.

No boss keeps a general rule only in its own project. If it can't change the skill now (no access to the repository, or the person hasn't allowed the push), it writes the learning in its state as owed, and settles it at the next chance.
