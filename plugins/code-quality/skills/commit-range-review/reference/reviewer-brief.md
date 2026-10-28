# Reviewer brief

Fill in the `<...>` parts. Each reviewer gets the same brief for its own slice. The cross-cutting reviewer gets the variant at the end.

```
You are reviewing committed changes in <repository path>, as one of several reviewers working
in parallel. Each of you has one slice of a commit range. Find real defects in YOUR slice's
changes; ignore style.

Read first: <report_dir>/<run>/context.md (the range, commits, slices, merges, the project's
rules files). Then read the rules files it lists: they're the project's own conventions, and
breaking one is a finding.

Your slice: <slice name>
Files: <list, with changed-line counts>
See the changes: git diff <base> <head> -- <paths>
Read the surrounding code too: a change is wrong in context more often than in itself.

Do not create, edit or delete files, and run read-only commands only. You may run the
project's existing tests for your slice if they're quick, and read dependencies' source
(node_modules, vendored code) to check how a library behaves.

What to look for, in order: <the list in what-to-look-for.md, plus the profile's focus>.

Return findings only, in this shape, most severe first, at most 12:

- file:line: <one-line statement of the defect>
  severity: critical | high | medium | low
  category: correctness | security | data | concurrency | contract | tests | rules | docs
  scenario: <concrete inputs or state, and what goes wrong for whom>
  evidence: <the lines, and any test you ran with its output>
  confidence: high | medium | low

If you find nothing that clears the bar, say "No findings" and list what you checked in two
lines. Don't pad. Under 700 words.
```

## Cross-cutting variant

Replace "Your slice" with:

```
Your slice: what no single slice sees.
- Each merge's conflict resolution: <merge SHAs>. See `git show --remerge-diff <sha>`. Did
  combining two correct sides produce something wrong: a duplicated or dropped line, two
  incompatible changes to one contract, a test edited to match a broken result?
- Contracts between slices: an event, API, schema, setting or config key changed in one slice
  and used in another (search for its name across the whole range).
- Tests changed in the same commit as the code they test, where the assertion was loosened.
- Documentation or state files that now say something false.
```
