# Boss and workers: operating rules

The skill copies this file into the project (the profile's `rules_doc`) and fills in the parts marked `<from the profile>`. The boss reads it at every start.

## Roles

- **The boss** is one long interactive session, on `<boss model, from the profile>`, at the project's root. It's the only session the person talks to. It picks the work, writes each worker's brief, starts workers through the worker launcher, reads their results and handoffs, and makes the decisions a skill or worker would otherwise ask the person. It reads summaries, handoffs and diffs' outlines, not whole logs or source: workers do the reading.
- **Workers** are headless sessions started by the boss, one per folder at a time, never in the project root (the boss works there), on the model the work deserves (below). They never ask the person anything. Where a skill says "ask the user", they decide from the project's own rules and decision records, record the decision there, and carry on.

## Which model does which work

<from the profile: the table of models and the work each takes>

Unclear work starts on the cheaper worker model, and moves up when a worker fails at it twice or the boss judges the result weak. Sub-agents take their worker's model unless their own definition names one.

## Questions

1. A worker with a question it can't settle writes it in its handoff under "Questions for the boss". The handoff is the record.
2. It sends the boss **one** message (SendMessage; the boss is the session at the project root in ListAgents) naming the folder, the run and the question.
3. It sets that part aside and carries on with the rest of its brief. It stops early only when everything left depends on the answer.
4. The boss answers by message while the worker runs (workers start with incoming messages accepted, so the answer arrives at the worker's next step), or in the next run's brief once it has ended.

Workers send no other messages. Progress goes in their handoffs.

## What reaches the person

Only from the boss, and only: <from the profile: the escalation list, e.g. spending money, anything public, anything sent for outside review, physical steps, the person's identity or legal agreements>. Everything else is decided and recorded, for the person to read when they like.

## Accounts and pacing

<from the profile: each account, its config folder and its role>

- Before starting a worker, the boss reads each account's limits and reset times with `claude -p "/usage"` (a non-default account with `CLAUDE_CONFIG_DIR` set) and records them in its state.
- **Earliest reset first.** Allowance left at a reset is lost, so work goes to the account whose week resets soonest, while it has room. In the last day before an account's reset, its leftover goes to batch work that can run then (reviews, audits, docs). The reserve (`<reserve, from the profile>`) is kept only on the account that resets last, for the person's own questions and anything urgent.
- **Shares.** When several projects use the same accounts, this project keeps to `<share, from the profile>` of each account's week, counting from its reset.
- A worker stopped by a limit is restarted on another account from its handoff.
- If the boss's own model nears its cap, the boss carries on as the next model down until the reset.
- Paid extras (usage credits, extra usage) stay off. No session turns them on.

## The boss's state

`<state file, from the profile>`: what's running (folder, run, account, model, started), what's queued, what waits on the person, each account's usage at the last check, and the questions open between boss and workers. The boss reads it at every start and after every compaction, and updates it whenever a worker starts or ends, so a restart costs nothing.

## Workers' standing rules

Every worker's prompt ends with the launcher's rules: never end a turn while something it started still runs (a headless session ends with its turn); commit in small green steps and at least every 30 minutes (a limit can stop it without warning); update its handoff before stopping; the questions rule above; and the project's own worker rules from the profile.
