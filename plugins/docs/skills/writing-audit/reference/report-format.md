# Report format: writing-audit

One folder per run: `<reports_dir>/<YYYY-MM-DD>/README.md` (a second run the same day adds `-2`). The folder's index, `<reports_dir>/README.md`, gets a row per run.

## Ids and statuses

- **Id:** `<id_prefix>-<YYYY-MM-DD>-NN`, numbered in the report's order, never reused. A fix commit or tracker item cites it; the next audit says which of the last run's ids still fail.
- **Status:**
  - `verified`: the lead saw the copy and the evidence.
  - `plausible`: a reviewer's finding with cited evidence that the lead didn't re-check; or an outside-tool claim that's "unverifiable here".
  - `borderline`: a judgement call; worth a look, not a defect on its own.
  - Not-real findings aren't numbered: they're listed in a line each under "Didn't hold".

## The report

```markdown
# Writing audit, <YYYY-MM-DD>

- **Target:** commit `<short sha>`; live surfaces fetched <time, with zone>.
- **Standard:** <path> (<its tests, or "the default four tests">).
- **Ran:** <n> reviewers, <how the surfaces were split>; the lead read <small surfaces> and verified <n> findings.
- **Context:** <"fresh session", or the context check's signals if it ran anyway>.

## Summary

| Surface | Covered | 1 | 2 | 3 | 4 | Borderline |
|---|---|---|---|---|---|---|
| <name> | <files or items> | n | n | n | n | n |

## The worst

The findings that mislead readers most, verified. A line each: id, location, what it says, what's true.

## Findings

### <surface>

| Id | Location | Test | Text | Why (evidence) | What would pass | Status |
|---|---|---|---|---|---|---|
| wa-2026-03-04-01 | `web/src/routes/plans/+page.svelte:41` (also `:88`, `components/Upgrade.svelte:12`) | 3 | "Cancel any time, refunded in full" | refunds are pro-rated (`api/src/billing/refund.ts:57`) | "refunded for the unused days" | verified |

## Causes and where the fix belongs

A line or two each: the cause, the findings it covers (ids), where the fix belongs (a setting rendered instead of typed,
a prompt, a gate, a review checklist line, a test), and what would make us revisit it.

## Didn't hold

Findings checked and found not real, a line each, so nobody raises them again.

## Not covered

Surfaces or parts skipped, and why (a fetch refused, out of scope, an outside claim nobody could check).

## Checked and true

Claims the reviewers or the lead checked and found accurate, a line each with the evidence. Short.
```

## The index row

```markdown
| Date | Commit | Surfaces | Findings | Worst | Report |
|---|---|---|---|---|---|
| 2026-03-04 | `a41c09e` | web, guide, changelog bot | 31 (9 borderline): 1 ×12, 2 ×4, 3 ×11, 4 ×4 | a refund promise the code doesn't keep | [2026-03-04/README.md](2026-03-04/README.md) |
```
