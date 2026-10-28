# commit-range-review

Reviews a range of commits that have **already landed** on a branch. It's for trunk-based work committed straight to `main`, and for the day after a burst of changes by AI agents, when there's no pull request to review and nobody has read the changes as a whole.

- **Invoke:**
  - `/code-quality:commit-range-review [range] [fix]` when installed from the plugin marketplace;
  - `/commit-range-review …` when the skill folder is copied or symlinked into a skills folder.

  It runs only when you type it.
- **Range:**
  - blank: since the last review (its marker);
  - `<ref>..<ref>`;
  - `since <ref>`;
  - `since yesterday` or `since 2026-03-09`;
  - `last 20 commits`.

  Add `fix` to fix the confirmed findings after the review.
- **Project specifics:** from `.claude/commit-range-review.md` in the repository. Format: [reference/profile-format.md](reference/profile-format.md). Example: [reference/example-profile.md](reference/example-profile.md). Without a profile it discovers defaults (branch, conventions files, test commands) and offers to write one.

## Why not `/code-review`?

Claude Code's built-in `/code-review` reviews the uncommitted diff, a pull request, a branch or a path. A branch compared with `main` is empty when the work is already on `main`, and a path reviews whole files rather than what changed. This skill reviews a **commit range**. It also:
- remembers where the last review stopped;
- splits large ranges across parallel reviewers;
- looks specifically at how merges resolved their conflicts.

For a pull request or your own uncommitted work, `/code-review` is the right tool.

## What it does

1. **Profile:** loads `.claude/commit-range-review.md`, or discovers defaults.
2. **Range:** resolves the argument to a base and head. With no argument it uses the marker; with no marker either, it asks.
3. **Survey:**
   - lists the commits, noting which an AI agent co-wrote;
   - sizes the change;
   - finds the merges and how their conflicts were resolved (`git show --remerge-diff`);
   - splits the changed files into slices by area.
4. **Review:** one read-only reviewer per slice, in parallel (eight by default), plus a cross-cutting reviewer for merge resolutions, contracts between slices, and tests loosened alongside their code. It checks afterwards that no reviewer changed a file.
5. **Verify:** the lead reads every finding at the cited lines and proves it when it can, by running a test or writing a throwaway one. It marks each CONFIRMED or PLAUSIBLE, or drops it with the reason. Findings that only disagree with a recorded decision (an ADR) are dropped.
6. **Checks:** runs the project's lint, typecheck and test commands at the head.
7. **Report:** writes a ranked report and an index row, records follow-ups where the profile says, and moves the marker to the reviewed head. A failed run leaves the marker alone.
8. **Fixes (optional):** one commit per confirmed finding, each with a test that fails before and passes after.

## What it produces

```
docs/reviews/code/README.md            index: date, range, commits, findings by severity
docs/reviews/code/YYYY-MM-DD/
  context.md                           the range, commits, slices, merges, rules files
  README.md                            verdict, findings table, dropped, worth revisiting, checks
docs/reviews/code/LAST_REVIEWED        the last reviewed commit (one line)
```

Plus one commit (if the profile's `commit` is on, the default). Paths are profile settings.

## Cost

One agent per slice, plus one cross-cutting agent. A day of heavy changes (say 40 files across a monorepo) is usually 4 to 8 agents. A small range uses one. The lead then reads every finding itself, which takes as long as the review. Run it on demand: daily after busy days, or before a release.

## When to run it

- after a day or a week of commits straight to `main`, especially agent-written ones;
- after merging several branches at once;
- before cutting a release, over the range since the last one.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. A fresh session matters most when this conversation wrote, merged or fixed commits in the range: an author verifying findings reads the code as they meant it. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

```
Range 4f1c2a9..e81d330 on main: 46 commits (31 co-written by an AI agent), 2026-03-10.
Verdict: sound overall; one merge broke a contract.

| Id | Sev | Status | Where | What's wrong |
|---|---|---|---|---|
| 2026-03-10-01 | high | CONFIRMED | events/consumers.ts:45 | order.created went to v2 in one branch; the email consumer still accepts only v1, so receipts stop sending. Fix: accept [1, 2]. |
| 2026-03-10-02 | medium | CONFIRMED | db/migrations/0030.sql:4 | Plain CREATE INDEX on a table the same range made large; blocks writes during the build. Fix: CONCURRENTLY. |
| 2026-03-10-03 | low | PLAUSIBLE | routes/orders.ts:61 | A refund retried after a timeout can be recorded twice; no idempotency key. |

Dropped (2): one style preference; one that contradicted ADR 0012.
Checks: lint, typecheck and 412 tests pass.
```
