---
profile_version: 1
project: Tidepool
tool: opentofu
default_root: infra/envs/production
main_region: eu-west-1
guide_path: infra/README.md#First apply
commit: false
---

<!-- A fictional example. Copy it to .claude/cloud-first-apply.md and replace every value. -->

## Environments

- production: `infra/envs/production`, account "tidepool-prod", eu-west-1. Comes up first; staging later.

## DNS

The zone is on a DNS provider outside the cloud. Certificate validation records first; mail records any time; `app.` when the smoke test passes; the apex at go-live (lower its TTL to 300 a day before).

## Secrets

Secrets Manager entries are created empty; the maintainer fills them with `scripts/set-secret <name>` (hidden prompt).

## Park

`scripts/park` and `scripts/unpark`; a `parked` parameter the config reads. Park deletes the load balancer; keeps the database (stopped) and its snapshots. Drill: `scripts/park --dry-run`, park, `tofu plan` must be empty, unpark, smoke test.

## Extra steps

- The email service starts in a sandbox: request production access a week before go-live.

## Costs

`docs/cost.md`, "Production".
