# finish-change

Finishes a change the same way every time: verify it in the running app, simplify, run the checks, commit with the evidence.

- **Invoke:** `/code-quality:finish-change [what it was for | range] [no-commit]` when installed as a plugin, or `/finish-change` when copied into a skills folder.
- **Produces:** one commit (unless `no-commit` or the profile says not to), whose body carries a "Verified:" block; a short report of what was seen, what wasn't checked, what simplify changed, and the checks' result.
- **Cost:** low. One session, no sub-agents of its own (the built-in `/simplify` may start a few). Time is mostly the app starting and the checks.
- **When to run it:** when a change is ready, before saying it's done. Not for reviewing someone else's work (`/code-review`, `commit-range-review`) or updating docs (`docs-sync`).

## Why

Agents tend to report "done" once the unit tests pass. Running the app and looking at the change is what catches the rest: a form the framework refuses, an error only the log shows, a page that renders but says the wrong thing. This skill makes that part of finishing, puts it before the cleanup and the checks, and leaves the evidence in the commit so a reviewer can see what was actually tried.

## Steps

1. **Verify:** decide what changed for a user and what you expect to see, start a throwaway instance (the project's own, or discovered), drive the change as a user would (happy path, one break, the refusal case), read the logs, write the evidence. A failure stops the run.
2. **Simplify:** the built-in `/simplify` on the diff; back to step 1 if it touched behaviour.
3. **Checks:** the project's one check command.
4. **Commit:** only this change's files, in the project's style, with the evidence; push only if the profile says so.

## Context check

Finishing your own change is the point, so authorship and anchoring don't send it to a fresh session; readiness (what verifying needs, a tree holding only this change) weighs most.

## Model invocation

`disable-model-invocation: true`, because it commits. Projects that want it as the default end of every change say so in their CLAUDE.md or AGENTS.md ("finish every change with `/code-quality:finish-change`"), and the person types it, or Claude follows the same steps by hand.

## Project profile

Optional. Put project specifics in `.claude/finish-change.md`; see [reference/profile-format.md](reference/profile-format.md) for the settings, discovery and an example. Without one, the skill discovers the verify, check and commit steps and offers a starter profile.

## Sample output

```
Finished: 3f2a91c Add "rising" sort to community feeds
Verified (npm run stack, free ports):
- web /c/general, signed in as a test member: "rising" lists the two newest active posts first; switching back to "hot" keeps the old order
- api GET /v1/feed?sort=rising, signed out: 200, same order; sort=bogus: 400 with the allowed values
- not checked: the mobile layout (no change to markup)
Simplify: merged two copies of the score query into one helper
Checks: npm run check: passed
```
