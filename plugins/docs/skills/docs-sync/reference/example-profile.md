---
profile_version: 1
branch: main
marker: docs/.last-docs-sync
max_auditors: 5
size_threshold_kb: 40
growth_threshold_kb: 10
ask_before:
  - "deploy/**"
checks:
  - npm run lint
  - npm test
commit: true
push: false
commit_message: "Docs sync: <range>"
---

<!-- An example profile for a fictional project, "harbourlog": a Python API and a React web app
     for boat-yard bookings, with Terraform in deploy/. Copy to .claude/docs-sync.md and adapt. -->

## Rules

- `AGENTS.md`, "Docs with every change": the roadmap, the feature's spec and the runbook move with the code.
- Plain, short sentences. British spelling.
- Decisions are ADRs; a changed decision is a dated note under the old ADR, or a new ADR for a new decision.

## Groups

### Project state
- **kind:** docs
- **files:**
  - `ROADMAP.md`: what's done, what's next, what blocks the public launch.
  - `docs/vision.md`: who it's for and what's out of scope (rarely changes; its changelog at the end).
- **triggers:** always.
- **checks:** every ticked item names a commit that exists (`git cat-file -e`); every open item is still open in the code.
- **rules:** tick items with the date and commit; don't delete them.

### Design
- **kind:** docs
- **files:**
  - `docs/specs/<feature>.md`: how each feature works today; "Last verified" line.
  - `docs/specs/README.md`: the index of specs.
- **triggers:** `api/app/**`, `web/src/**`; kinds api, schema, ui.
- **checks:** routes against `api/openapi.json`; settings against `api/settings.toml`.
- **rules:** update "Last verified" to today and the head commit for every spec checked.

### Decisions
- **kind:** ledger
- **files:**
  - `docs/adr/NNNN-*.md`: each decision as made, with dated notes.
  - `docs/adr/README.md`: the index (docs, not ledger: rows can be corrected).
- **triggers:** kinds schema, infra, dependencies, process.
- **rules:** a dated note under the ADR when its decision changed in the range; a new ADR is proposed to the maintainer, not written.

### Operations
- **kind:** docs
- **files:**
  - `docs/runbook/*.md`: procedures, one per incident kind.
  - `docs/runbook/alerts.md`: one section per alert.
  - `deploy/README.md`: how to deploy and roll back.
- **triggers:** `deploy/**`; kinds alarms, jobs, infra.
- **checks:** every alert in `deploy/alerts.tf` has a section in `alerts.md` (`pytest tests/test_ops_docs.py`).
- **rules:** `deploy/**` is in `ask_before`.

### API reference
- **kind:** generated
- **files:**
  - `api/openapi.json`: the API's contract.
  - `web/src/api/types.ts`: client types.
- **triggers:** `api/app/routes/**`, `api/app/schemas/**`.
- **regenerate:** `make openapi` (no network).

### Changelog
- **kind:** ledger
- **files:**
  - `CHANGELOG.md`: what users of the API notice, per release.
- **triggers:** kind api.
- **rules:** add under "Unreleased"; never edit a released section.

### Legal
- **kind:** docs
- **files:**
  - `docs/legal/privacy.md`: what personal data is collected, kept, shared, and for how long.
- **triggers:** kind legal-data.
- **rules:** draft only; list every change under "Needs the maintainer" for a lawyer to see.

### External
- **kind:** external
- **files:**
  - the alerting tool: each alert in `deploy/alerts.tf` routes to an on-call schedule.
  - the code host: branch protection on `main` matches `CONTRIBUTING.md`.
- **triggers:** kinds alarms, process.
- **check with:** the alerting tool's CLI (read-only list commands); `gh api repos/{owner}/{repo}/branches/main/protection`.

## Change kinds

- api: `api/app/routes/**`, `api/app/schemas/**`
- schema: `api/app/models/**`, `api/migrations/**`
- legal-data: `api/app/models/**`, `api/app/analytics/**`, `api/app/emails/**`

## Archiving

- `ROADMAP.md`: finished items move to `docs/roadmap/done-YYYY.md`, leaving one line with the commit.

## Not docs

- `web/node_modules/**`
- `docs/vendor/**`
