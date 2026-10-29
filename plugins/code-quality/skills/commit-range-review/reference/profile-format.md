# Profile format: commit-range-review

A project's profile lives at `.claude/commit-range-review.md`: YAML front matter for settings, then optional Markdown sections. Every setting has a default, so a profile only needs what differs.

```yaml
---
profile_version: 1
branch: main                      # the branch reviewed; default: the remote's default branch
report_dir: docs/reviews/code     # where reports go (one folder per run) and the index
run_name: YYYY-MM-DD              # a second run on the same day adds -2, -3, ...
marker: docs/reviews/code/LAST_REVIEWED   # one line, the last reviewed SHA; committed with the report
skip:                             # globs left out of review (still listed in the survey)
  - "**/*.lock"
  - "pnpm-lock.yaml"
  - "**/__snapshots__/**"
  - "**/generated/**"
max_reviewers: 8                  # slices reviewed in parallel; one more for cross-cutting
slice_max_lines: 2500             # changed lines per slice
slice_max_files: 40
checks:                           # run at the head (Step 5); default: discovered lint/typecheck/test
  - npm run lint
  - npm test
followups:                        # where unfixed findings are recorded; omit to keep them in the report only
  file: ROADMAP.md
  section: "## Follow-ups"
commit: true                      # commit the report, index, marker and follow-ups
commit_command: "make check && git commit"   # how a commit is made, if the project chains it; default: git commit
push: false
---
```

## Sections (all optional)

- **`## Rules`:** the project's own rules reviewers check changes against, or paths to the files that hold them (e.g. CLAUDE.md, CONTRIBUTING.md, an ADR index). Rules that are easy to break and matter, such as "money in integer minor units, never floats" or "every route checks permissions".
- **`## Decided`:** where recorded decisions live (ADR folder, a decisions log). Findings that only disagree with one are dropped (Step 4).
- **`## Focus`:** what to weight this time or always, e.g. "migrations and auth".
- **`## Areas`:** how to slice the repository when folder names don't say it, e.g. `server/src/*` is one area per top-level folder.

## Defaults without a profile

- **branch:** `origin/HEAD`, else the current branch.
- **report_dir:** `docs/reviews/code`. **marker:** `<report_dir>/LAST_REVIEWED`.
- **skip:** lockfiles, snapshots, minified and generated files, vendored folders.
- **checks:** whatever the repository's manifest or CI config shows for lint, typecheck and test.
- **rules:** CLAUDE.md, AGENTS.md, CONTRIBUTING.md and an ADR folder, if present.
- **commit:** true. **push:** false.
- **commit_command:** from CLAUDE.md or AGENTS.md if they say how commits are made (e.g. a check chained before `git commit`), else `git commit`.

See `example-profile.md` for a filled-in profile.
