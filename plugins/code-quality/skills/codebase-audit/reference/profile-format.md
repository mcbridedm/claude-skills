# Profile format: codebase-audit

A project's profile lives at `.claude/codebase-audit.md`: YAML front matter for settings, then optional Markdown sections. Every setting has a default, so a profile only needs what differs.

```yaml
---
profile_version: 1
branch: main                      # whose tip is audited when no ref is given; default: the remote's default branch
report_dir: docs/reviews/audit    # one folder per run, plus the index README.md
run_name: YYYY-MM-DD              # a second run on the same day adds -2, -3, ...
skip:                             # globs left out of the audit (listed in the report with the reason)
  - "**/*.lock"
  - "**/generated/**"
  - "**/*.png"
max_auditors: 12                  # auditors per wave; more slices mean more waves
slice_max_lines: 4000             # lines per slice, read in full along with its documents
slice_max_files: 60
checks:                           # run at the audited commit; default: discovered lint/typecheck/test
  - npm run lint
  - npm test
followups:                        # where open findings are recorded; omit to keep them in the report only
  file: ROADMAP.md
  section: "## Follow-ups"
commit: true                      # commit the report folder, the index and the follow-ups
commit_command: "make check && git commit"   # how a commit is made, if the project chains it; default: git commit
push: false
---
```

## Sections (all optional)

- **`## Areas`:** how to cut the code into areas, and the documents that govern each. One line per area: a glob, then its documents. Areas not listed are discovered (one per top-level app, package or module).
  ```
  - `src/billing/**`: docs/design/billing.md, docs/adr/0007-payments.md
  - `apps/web/**`: docs/design/web.md, docs/style-guide.md
  ```
- **`## Rules`:** the project-wide rules every auditor checks, or the files that hold them (CLAUDE.md, CONTRIBUTING.md, a principles file).
- **`## Decided`:** where recorded decisions live (an ADR folder, a decisions log) and how later changes are recorded (dated notes, superseding records). Used to decide which side of a disagreement is wrong.
- **`## System-wide documents`:** documents that describe behaviour across areas (README, onboarding, runbooks, user docs), for the system-wide auditor.
- **`## Every feature has`:** what the project requires per feature (e.g. "a design document under docs/design"), so a missing one is a governance gap.
- **`## Focus`:** what to weight, e.g. "permissions and data deletion".

## Defaults without a profile

- **branch:** `origin/HEAD`, else the current branch. **report_dir:** `docs/reviews/audit`.
- **skip:** lockfiles, snapshots, minified, generated and vendored files, binaries.
- **areas:** one per top-level app, package or module; governing documents discovered by name.
- **rules:** CLAUDE.md, AGENTS.md, CONTRIBUTING.md, a principles file, if present. **decided:** an ADR folder, if present.
- **checks:** whatever the repository's manifest or CI config shows for lint, typecheck and test.
- **commit:** true. **push:** false.
- **commit_command:** from CLAUDE.md or AGENTS.md if they say how commits are made (e.g. a check chained before `git commit`), else `git commit`.

See `example-profile.md` for a filled-in profile.
