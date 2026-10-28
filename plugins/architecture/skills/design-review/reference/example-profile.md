---
profile_version: 1
project: Tallyhall
stage: live, about 300 paying teams; three engineers and a part-time designer
principles_file: docs/engineering-principles.md
panel_source: .claude/architecture-review.md
adr_dir: docs/decisions
adr_index: docs/decisions/README.md
adr_naming: NNNN-kebab-title.md
adr_template: docs/decisions/template.md
review_section: Design review
reviewers_min: 3
reviewers_max: 4
fallback: [Solution, Domain]
ask_one_at_a_time: false
commit: true
push: false
commit_message: "docs: design review for ADR NNNN"
---

<!--
An example profile for a fictional project. Copy it to .claude/design-review.md in your
repository and replace every value. Delete any section you don't need: the skill falls back
to its defaults (reference/profile-format.md).
-->

## Product

One-liner: an invoicing and time-tracking app for small agencies, with a public API

## Principles

Boring technology first; one database until it hurts; buy payments, email and search; every money movement is idempotent and auditable; no feature without a test at the level it can break.

## Decided sources

`AGENTS.md` "Constraints", `ROADMAP.md` items marked **Decided**, and ADRs with status "Accepted".

## ADR conventions

- A new record starts as `Status: Proposed`. It gets a row in the index only once accepted.
- Accepted reads `Status: Accepted (<name>, YYYY-MM-DD)`. Only Priya or Sam accept records that touch money.
- Records over about 300 lines move their review sections to `NNNN-<title>-review.md` beside them, linked from the record.

## Area map

### Payments
Personas: Security, Data, Product Strategy
Signals: checkout, card, refund, payout, Stripe, `payments/`
Read: `payments/`, `payments/webhooks.py`, `docs/decisions/0012-payments.md`

### Invoices and money totals
Personas: Data, Domain, QA
Signals: invoice, line item, tax, currency, rounding, `invoices/`
Read: `invoices/models.py`, `invoices/services.py`

### Accounts and access
Personas: Security, Solution, UI/UX
Signals: workspace, role, invite, client link, `accounts/`
Read: `accounts/permissions.py`

### Public API and integrations
Personas: Solution, Security, Domain
Signals: endpoint, API key, webhook out, OpenAPI, `api/`
Read: `api/openapi.yaml`, `docs/api-versioning.md`

### Frontend
Personas: UI/UX, Frontend
Signals: page, form, React, `frontend/`
Read: `frontend/src/api/`, `frontend/src/design/tokens.ts`

### Hosting and operations
Personas: Cloud, DevOps/Platform
Signals: GKE, Cloud SQL, Celery queue, cron, Terraform, `deploy/`, `terraform/`
Read: `terraform/envs/prod/`, `docs/cost.md`, `docs/oncall.md`

## Panel

### Fraud & Abuse Architect
Lens (add): For design reviews, start from what a fake agency could do with this on day one.
