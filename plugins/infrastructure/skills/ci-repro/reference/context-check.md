# Context check

Runs first, before the profile's heavier steps and before any agent is spawned, file is written or command with side effects runs. A skill run is expensive whether it succeeds or not: this check makes sure it starts where it has the best chance of getting it right, and says so when it doesn't. It costs a few seconds and reads only this conversation and the repository's state.

This file is shared: every skill in this repository carries the same copy (`node scripts/validate.mjs` checks they match). What differs per skill is in its own **Step C**: how much each signal weighs for it.

## The signals

Answer each from evidence, not impressions. Quote the evidence in the report (a commit, a message, a file).

1. **Fresh start.** Is the skill's invocation the first real work in this conversation (nothing before it but greetings, or the session's own start-up routine)? If yes, signals 2 to 4 can't apply: go straight to 5 to 7.
2. **Authorship.** Did this conversation write, merge, design or argue for the work the skill will judge (the commits in the range, the docs, the design, the pull request)? An author reads their work as they meant it, not as it is, and is inclined to confirm their own summaries. Weighs most for skills that judge work: reviews, audits, syncs.
3. **Context load.** Has the conversation been compacted (a summary of earlier conversation is present, or the harness said so), or is it long: many large tool results, whole files read, hours of work? Detail from before a compaction is gone, and a skill's own reading needs room. Heavy skills read a lot; don't start one in a nearly full context.
4. **Anchoring.** Has the conversation already stated conclusions about the skill's target ("this is fine", "the docs are up to date", a plan, a favoured hypothesis)? The skill would tend to confirm them, and agents briefed from here would inherit them.
5. **Moving target.** Is anything in flight that will change what the skill reads or writes: CI that pushes on success, agents still working, a deploy, another session committing to the same branch? Run against a target that's still moving and the result is stale on arrival, or its commits conflict. This applies in a fresh session too.
6. **Readiness.** Is everything the skill needs present: its plugin loaded, the profile, credentials or sign-ins, Docker or other services, a clean working tree where it commits? Starting without them wastes the run.
7. **Sequence.** Is another skill queued whose output this one should see, or that should see this one's? Run them in order, not side by side, when both commit. A common order: reviews, then the fixes they ask for, then a docs sync.

## The verdict

- **Proceed** when signal 1 holds, or when none of 2 to 4 fires (as weighed in the skill's Step C), and 5 to 7 are clear.
- **Fresh session** when 2, 3 or 4 fires and the skill's Step C weighs it. The skill would run better in a new conversation.
- **Wait** when 5, 6 or 7 fires: name what to wait for or fix, and how you'll know it's done. In a fresh session this is the only verdict that can stop the run.

## The report and what happens next

Say it in a few lines before anything costly, then act on it:

```
Context check: <proceed | fresh session | wait>
- <signal>: <what fired, with the evidence>          (only signals that fired)
Recommendation: <one line, and why>
```

- **Proceed:** one line is enough ("Context check: proceed (fresh session, nothing in flight).") and carry on.
- **Fresh session:** stop. Spend nothing else. Give the user:
  - **What to type** in the new session: the skill's command with the same arguments.
  - **When:** after anything from signal 5 has finished.
  - **What it needs to know:** a new session reads files, not this conversation. If something it needs exists only here (a decision, a judgement call, the reason for a change), write it where the project keeps such things (its decision records, project state or notes) and commit it first, through the project's usual checks.
  - **What not to carry over:** don't paste your conclusions into the new session's prompt; that brings signal 4 with it.
- **Wait:** stop, say what you're waiting for, and offer to run (or to recommend a fresh session) once it's done. If you're watching the jobs yourself, recheck when they finish.

The user decides. If they say to run it here anyway, proceed, and note in the skill's output that it ran in a session with the signals that fired, so its readers can weigh that. Never let a recommendation turn into a silent skip.

**Unattended runs** (a schedule, a loop, a headless call with nobody to answer): proceed only on a **proceed** verdict; otherwise write the report where the skill writes its output, and stop.
