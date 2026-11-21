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

1. A worker with a question it can't settle writes it in its handoff under "Questions for the boss" and commits the handoff. **The handoff is the channel the boss relies on**: it reads every run's handoff when the run ends.
2. Where it can, it also sends the boss **one** message (SendMessage; the boss is the session at the project root in ListAgents, and where the brief names the boss's session, only that name: an old boss's row can still be listed) naming the folder, the run and the question. If the boss isn't listed or the send fails, it carries on: the handoff already holds the question. A worker never stops, retries or waits over a failed send.
3. It sets that part aside and carries on with the rest of its brief. It stops early only when everything left depends on the answer.
4. The boss answers by message while the worker runs (workers start with incoming messages accepted, so the answer arrives at the worker's next step), or in the next run's brief once it has ended.

Workers send no other messages. Progress goes in their handoffs.

**Messages don't cross accounts.** A session sees, and can message, only sessions logged in to the same account (the same config folder): ListAgents lists no others. A worker on another account than the boss (an exception, "Accounts and pacing") can't send step 2's message, so its question waits in its handoff, which the boss reads when the run ends. **Nor out of a sandbox.** A session started from inside the boss's shell sandbox lists no sessions at all, on any account, unless the sandbox lets it connect to the folder where sessions keep their sockets (a `cc-socks` folder under `/tmp`, e.g. `/tmp/cc-socks`, when this was written; listing the folder isn't enough). The person allows it by adding that folder to the sandbox's `network.allowUnixSockets` in the project's settings; it's their choice, since it lets workers message any session on their account. A running boss picks the change up without a restart. The setup's test worker lists the boss to prove it.

**A send that succeeds proves little.** ListAgents can show a stale or offline row with a similar name (a Remote Control session, say), and a send to it reports success as queued. A boss counts a message as delivered only to a session it has just seen listed as running on this machine.

**Across accounts, a relay.** To message a session on another account, run a one-shot headless session on that account that sends it: `CLAUDE_CONFIG_DIR=<that account's folder> claude -p --model <cheapest> "Send the contents of <file> to <session name>, verbatim, with SendMessage"` (a one-shot on that account with ListAgents shows the name). A reply goes to the relay, which has ended, so the message says how to answer: by a relay the other way, or a file the sender can read. A boss may not be able to run a relay itself (its sandbox, or its permission checks, can refuse a one-shot on another account); it never works around that. The fallback is a file the other boss can read plus one line to the person, or the person runs the relay.

## What reaches the person

Only from the boss, and only what the profile's `## Escalate to the person` section lists (e.g. spending money, anything public, anything sent for outside review, physical steps, the person's identity or legal agreements). Everything else is decided and recorded, for the person to read when they like.

## Accounts and pacing

The accounts are named once per machine, in the machine file (`accounts.md`): a name the person chose, the address and the config folder. The profile's `accounts` lists this project's by name.

- **Name an account by its name and its address**, always together, in the state, in messages and to the person. Never by a number, "first" or "second", or "main".
- **One account per project at a time.** The boss and all its workers run on the account the boss was started on. The worker launcher uses the boss's account by default. `--account` on a worker is a deliberate exception, for a run that never needs a word with the boss (messages don't cross accounts, "Questions"); the launcher prints a warning, and the brief says the boss can't be reached.
- **The person decides the switch.** The boss reads its account's limits and reset times with `claude -p "/usage"` at its start and before starting each worker, and records them in its state. When the week runs low (it won't last until the reset at the current pace, or less than the profile's `reserve` is left), it tells the person once, with the reset time and the other account's room, and keeps going until they decide. It never moves itself or its workers to the other account. The switch follows `accounts.md`, "Switching the project to the other account".
- **The sign-in is the person's.** The launchers refuse to start when an account's folder is signed in to another address. The boss never signs in or out, and never uses `/login` to change a folder's account: it tells the person what the launcher said.
- **Shares.** When several projects use the same account, this project keeps to the profile's `share` of the week, counting from its reset.
- A worker stopped by a limit waits in its handoff. The boss tells the person, and restarts it after the switch or the reset.
- **The boss checks which account a worker really ran on** when it changes launchers or accounts: the launcher's log line says what was asked for, not what ran. `/usage` before and after a run, or the worker's own report of its config folder, shows it.
- If the boss's own model nears its cap, the boss carries on as the next model down until the reset.
- Paid extras (usage credits, extra usage) stay off. No session turns them on.

## Reading a run's result

- **A run is judged by its commits and its handoff, not its exit code.** A worker that could do nothing (no shell, a refused tool) still ends with exit 0 and a polite summary. After every run the boss reads the closing summary, the commits the run added (`git -C <folder> log`), and the handoff, before it counts the work as done.
- **The boss never changes directory into a worker's folder.** A `cd` can stay in force for the rest of the session. It uses `git -C <folder>` and absolute paths, so its own commands keep running at the root.

## Skills a worker can't call

A skill marked for people only (`disable-model-invocation`) refuses a worker's Skill tool. Two ways round it, both the boss's to choose in the brief:
- Start the worker with the skill's slash command as its prompt (`/plugin:skill`), when the run is that skill and nothing else.
- Or the brief says: don't call the Skill tool; read the skill's `SKILL.md` and the reference files it names from the installed copy (the newest version's folder, where the cache holds several) and follow them by hand. The brief answers the skill's "ask the user" points and its context check in advance.

An account whose installed plugins differ from the boss's can lack the skill: the boss checks before it sends that work there.

## Under a sandbox

Where the boss's shell is sandboxed, a worker started from it is confined by that sandbox, and can't start one of its own inside it (on macOS every shell command of the worker's then fails, while its file tools still work). The worker launcher tests for this and, only when an outer sandbox already confines it, starts the worker with its own sandbox off, and says so. The worker is then held by the boss's sandbox alone, so that sandbox's rules are what protect the machine: the boss tells the person so once, at setup. No session turns the boss's sandbox off or widens it. A step the sandbox blocks (updating the installed plugin, making a worktree in a protected path, installing dependencies) goes to the person.

**A standing worktree needs its dependencies.** A new worktree has none installed, and a sandboxed worker usually can't install them (the package manager's store is outside the paths it may write), so the project's commit gate fails there and the worker can commit nothing. Whoever makes the worktrees runs the project's install in each, and again after a lockfile change.

**Worktrees of the boss's own repository can be read-only.** A sandbox can protect the git folder of the repository the boss runs in, and with it that repository's `.git/worktrees`. A worker in such a worktree then can't write its index or HEAD: no add, no commit, no branch switch (`cannot lock ref 'HEAD': ... Operation not permitted`). Worktrees of another repository under the project (one the root repository ignores) are not affected. Before the boss sends a worker into a worktree, it checks that it can create and remove a file in that worktree's folder under `.git/worktrees`. Where it can't, it starts no worker there and tells the person, whose choice it is to change the sandbox or where the worktrees live.

## The boss's state

The profile's `state_file`: the account the boss runs on (name and address), what's running (folder, run, account, model, started), what's queued, what waits on the person, each account's usage at the last check, the questions open between boss and workers, and the version of these rules it last read. The boss reads it at every start and after every compaction, and updates it whenever a worker starts or ends, so a restart costs nothing. Every dated entry takes its time from the clock, in the command that writes it (`date`), never from the boss's sense of the time: a long session's guess drifts, and a wrong time in the record misleads the next reader.

## Workers' standing rules

Every worker's prompt ends with the launcher's rules: never end a turn while something it started still runs (a headless session ends with its turn); commit in small green steps, before any test run or build that may take more than 10 minutes, and at least every 30 minutes (a limit can stop it without warning, and a long run with everything uncommitted loses the most); hold a lock on something other runs wait for (a test device, a deploy slot) only for the stretch that uses it, and release it in between, never through work that doesn't need it; update its handoff before stopping; the questions rule above; and the project's own worker rules from the profile.

## Keeping the rules the same across projects

A learning about this way of working itself (a fix, a trap, an adjustment to the launchers, models, accounts, pacing, messages or the workers' rules) belongs here, not in one project. A learning about a project (its work, its devices, its checks) stays in that project's profile or rules doc.

0. **One boss decides, where the person named one.** The other bosses send it their learnings (what happened, what they changed, general or the project's own) and it makes the change; this keeps two bosses from editing the skill at once. Where the person named none, the boss that learns it makes the change.
1. **The boss that learns it changes the skill**, in the skill's own repository, following that repository's rules: this file or the launcher templates, the plugin's version, the changelog entry. It keeps the change general: no project's names, paths, hosts, accounts or people. It commits, and pushes when the person's rules for that repository allow; otherwise it asks the person once.
2. **It updates its own installed copy** (`claude plugin update` for the plugin) and re-reads this file. If the change touched a launcher template, it applies the same change to its project's launcher.
3. **It tells the other bosses on the machine**, one message each (SendMessage; the sessions at other projects' roots in ListAgents): the plugin's new version and one line on what changed. A boss that isn't running needs no message: it reads the new rules at its next start. A boss on another account is told through a relay (see "Questions"), or by the person where a relay isn't possible.
4. **A boss that receives that message**, or finds at a start that the version differs from the one in its state, updates its installed copy, reads the changelog's entries since its version, re-reads this file, applies any launcher change, and records the new version in its state.

No boss keeps a general rule only in its own project. If it can't change the skill now (no access to the repository, or the person hasn't allowed the push), it writes the learning in its state as owed, and settles it at the next chance.
