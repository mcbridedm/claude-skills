---
profile_version: 1
project: Tallyhall
stage: live
review_dir: docs/reviews/architecture
index: docs/reviews/README.md
run_layout: folder
history_file: docs/notes/2026-03-security-audit.md
adr_dir: docs/decisions
principles_file: docs/engineering-principles.md
tiers:
  - Today 300 teams
  - 3k teams
  - 30k teams
blocker_label: release blocker
timing_milestone: next release
action_items:
  file: ROADMAP.md
  section: "## Now"
  later: "## Later"
  id_format: AR-YYYY-MM-DD-NN
commit: true
push: false
commit_message: "docs: architecture review YYYY-MM-DD"
---

<!--
An example profile for a fictional project. Copy it to .claude/architecture-review.md
in your repository and replace every value. Delete any section you don't need: the skill
falls back to its defaults (reference/profile-format.md).
-->

## Product

One-liner: an invoicing and time-tracking app for small agencies, with a public API

Tallyhall lets agencies of 2–50 people track time, invoice clients and take card payments. Its core domain is **workspaces** (one per agency), **projects**, **time entries**, **invoices** and **payments**. Users are agency staff (owners, admins, members) and their clients, who see invoices through a magic link. About 40 integrations use the public API.

## Reading list

- `docs/engineering-principles.md`: the yardstick.
- `README.md`, `AGENTS.md` (conventions and constraints) and `ROADMAP.md` ("Now" and "Later").
- `docs/runbooks/README.md` and `docs/oncall.md`.
- `docs/decisions/*`: list them all, read the last five in full.
- `docs/cost.md` (the per-tier table only).

## Code to confirm claims

- `app/settings.py`, `app/urls.py` and `app/wsgi.py`;
- one app end to end: `invoices/` (models, services, views, tasks, tests);
- `accounts/permissions.py`, the single access-control path;
- `payments/` and its webhook handler;
- `frontend/src/api/` (the generated client);
- `Dockerfile`, `.gitlab-ci.yml`, `deploy/helm/` and `terraform/`.

## Principles

Boring technology first; one database until it hurts; buy payments, email and search; every money movement is idempotent and auditable; no feature without a test at the level it can break.

## Calibration

Tallyhall is live, with about 300 paying teams. Judge it against today's traffic and the next tier. A scale concern must name the tier where it starts to matter. Severity means harm to customers' money, data or trust, today or at that tier.

Team: three engineers and a part-time designer.

## Key frameworks

Django 6, Celery, PostgreSQL 18, React 20, Terraform's Google provider.

## Context document

- **§4 Data flow:** the Celery queues, the payment webhook path, and what retries.
- **§5 Infrastructure:** GKE Autopilot, Cloud SQL, Memorystore, and the nightly export job.

## Decided sources

- `AGENTS.md` "Constraints";
- `ROADMAP.md` items marked **Decided**;
- ADRs with status "Accepted";
- `docs/legal/open-questions.md`, by number.

## Shared checks

- `poetry run pip-audit --format json`: counts by severity, and the packages behind any high or critical.
- `glab ci list --branch main --per-page 1`, then that pipeline's jobs: the result and the test counts. Don't run the end-to-end suite.
- The commits since the last review, grouped by theme.
- `terraform -chdir=terraform/envs/prod init -backend=false && terraform -chdir=terraform/envs/prod validate`.

## Panel

### 4. Cloud Architect
Lens (add): Is GKE Autopilot still cheaper than Cloud Run at today's load, and at 3k teams?

### 6. Data Architect
Lens (add): Can an invoice's totals ever disagree with its line items, and what would show it?

### 7. AI/ML Architect
Drop: no AI features, and none on the roadmap.

### 13. Trust & Safety Architect
Rename: Fraud & Abuse Architect
Lens (replace): Can a stolen card, a fake agency or a compromised client link be used to move money or send spam invoices? What do Stripe Radar and our own rate limits catch, and how much support time does a fraud wave cost?

## Synthesis themes

Money correctness; access and tenancy; integrations and the public API; operability; cost.

## Action items

Add adopted items to `ROADMAP.md` "Now" as unchecked boxes ending in their id. Tier-triggered items go to "Later". An item that adds infrastructure states its monthly cost from `docs/cost.md` before it's built.

## Commit

Run `pre-commit run --files <changed files>` first.
