# architecture-review

A continuous, multi-agent architecture review of any software repository. A panel of specialist architects reviews the repo in parallel; then Claude, as CTO, verifies their claims and decides what to adopt, defer or reject.

- **Invoke:** `/architecture:architecture-review [focus]` when installed from the plugin marketplace, or `/architecture-review [focus]` when the skill folder is copied or symlinked into a skills folder. The focus is optional (e.g. `eventing`, `pre-launch`). It only runs when you type it (`disable-model-invocation: true`).
- **Project specifics:** from `.claude/architecture-review.md` in the reviewed repo. Format: [reference/profile-format.md](reference/profile-format.md). Example: [reference/example-profile.md](reference/example-profile.md). Without a profile, the skill discovers defaults and offers to write one.

## What it does

1. **Step P, profile:** loads the profile, or discovers defaults.
2. **Step 0, self-check:** compares the profile with what changed in the repo since the last review. Small additive fixes go into the profile; structural changes are proposed to the maintainer. The shared skill is never edited during a review.
3. **Step 1, context:** reads the reading list and the code behind its claims, runs the shared checks once (dependency audit, latest CI, commits since, infrastructure validation), and writes a 2–4 page context document.
4. **Step 2, panel:** 13 read-only reviewers by default (enterprise, solution, application and domain, cloud, security, data, AI/ML, frontend, DevOps/platform, QA, UI/UX, product strategy, trust and safety), in parallel. Each reads the context from disk, verifies in code, does up to three outside lookups, and returns a fixed-shape report. Lenses come from [reference/personas.md](reference/personas.md), adjusted by the profile.
5. **Step 3:** saves the raw reports verbatim, and checks `git status` to prove the panel changed nothing.
6. **Step 4–5, CTO synthesis:** verifies the claims decisions rest on, records **Corrected findings**, tracks the last review's items by id, groups by theme, adopts or rejects with trade-offs, and writes a verdict, a prioritized action plan with stable ids, a "not doing" list and the next-review trigger.
7. **Step 6–7:** saves the artifacts and the index, records action items where the profile says, and commits the review.

## What it produces

In the reviewed repository (default paths):

```
docs/reviews/README.md                       index: every run, newest first, open-item counts
docs/reviews/architecture/YYYY-MM-DD/
  README.md     decisions: since-last-review table, corrected findings, themes, action plan, verdict
  context.md    what the reviewers started from
  panel.md      each reviewer's report, verbatim
```

Plus action items with ids such as `AR-2026-03-12-03` in the file the profile names, and one commit.

## Cost and when to run it

- **Expensive:** one coordinator plus 13 parallel sub-agents, each reading code and doing light web research. Expect a large token bill and tens of minutes. Run it on demand, not on a schedule.
- **Good triggers:** before a launch or a big release; after a burst of architectural change; when the last review's "next review" trigger is hit; at a new scale tier.
- **Not for:** reviewing one pull request (use a code review), or a repo with almost no code yet.
- The profile can drop personas that don't apply, which makes it cheaper.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. A fresh session matters most when this conversation built or argued for what the panel will judge, or is long: the synthesis happens here. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output

A fictional excerpt from a run's `README.md`:

```markdown
## Since the last review

| Item | Status | Note |
|---|---|---|
| AR-2026-01-15-01 webhook idempotency | Done | `payments/webhooks.py:41`, verified |
| AR-2026-01-15-04 nightly export on the primary | Regressed | Moved back by `a1b2c3d` |

## Corrected findings

1. **Cloud, egress cost:** estimated 2 TB a month from one day's logs during a backfill. Over the
   last 30 days it's 240 GB. Severity lowered to low; no action.

## Prioritized action plan

1. **AR-2026-03-12-01** Make refunds idempotent on the provider's event id. Payments, S, now. Release blocker.
2. **AR-2026-03-12-02** Alarm on the export job's heartbeat. Platform, S, now.
3. **AR-2026-03-12-03** Read replica for reporting. Data, M, at 3k teams.
```

The panel reports follow this shape for every persona: Focus, Strengths, Risks (each labelled NEW, REGRESSION, STILL OPEN or ESCALATED, with severity, blocker yes/no and evidence), Recommendations (effort and timing), Outside my lens, Sources.
