# Example profile: codebase-audit

A fictional project, `ledgerly`: a Go backend split into services, a web app, and infrastructure code. Saved as `.claude/codebase-audit.md`.

```markdown
---
profile_version: 1
branch: main
report_dir: docs/reviews/audit
skip:
  - "go.sum"
  - "clients/js/src/generated/**"       # generated from the API schema
  - "services/*/db/schema.sql"           # dumped by the migration tool
  - "**/*.png"
max_auditors: 12
checks:
  - make lint
  - make test
followups:
  file: ROADMAP.md
  section: "## Audit follow-ups"
commit: true
commit_command: "make lint && make test && git commit"
push: false
---

## Areas

- `services/<name>/**`: one area per service; docs/specs/<name>.md and the decision records it links
- `web/**`: docs/specs/web.md, docs/accessibility.md
- `clients/js/**`: docs/api/README.md
- `deploy/**`: deploy/README.md, docs/decisions/0012-hosting.md

## Rules

AGENTS.md ("Rules"), docs/engineering-rules.md.

## Decided

docs/decisions/ (index in docs/decisions/README.md). Records are append-only; changes are dated notes at the end of the record they change.

## System-wide documents

README.md, docs/onboarding.md, docs/runbook/*.md.

## Every feature has

A spec in docs/specs/ saying what's built.

## Focus

Permissions (every handler calls `authz.Require` before it reads or writes) and anything that deletes data.
```
