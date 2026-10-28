---
profile_version: 1
project: Billfold
report_folder: docs/reviews/users
action_id: UP-YYYY-MM-DD-NN
commit: false
push: false
---

<!-- A fictional example. Copy it to .claude/user-panel-review.md and replace every value. -->

## Product

Billfold is invoicing for small design and dev studios. A team tracks billable work, sends invoices, and clients pay them by card. Accounting tools and scripts can create invoices through a public API.

## Run

- Start: `make dev-reset && make dev` (API on :8080, web on :3000, a fresh database seeded with two sample studios). Payments use the provider's test mode.
- Stop: `make dev-stop`.

## Instance

`http://localhost:3000` and `http://localhost:8080` only.

## Surfaces

- Web: `http://localhost:3000`
- API: `http://localhost:8080/v1` (OpenAPI at `/v1/openapi.json`)
- CLI: `./bin/billfold` (`./bin/billfold --help`)

## Allowed view

- People: the web app and its help pages.
- Agent builder: the web app, `docs/public/` copied to the run folder, the CLI.
- Agents: the OpenAPI file, the public API docs, the API's responses.
- Bad actor: everything public.

## Personas

Keep the three people personas. The API adds the three agent personas. For the bad actor, this run's hats: card tester, credential stuffer, someone reaching another studio's invoices.

### Studio's client (added)

A client who has never heard of Billfold and gets an invoice by email. Journeys: opening the invoice, paying by card, getting a receipt, disputing a line.

## Decided sources

`docs/decisions/`

## Action items

`TODO.md`, under "Usability". Launch blockers under "Before launch".

## Safety

`MAIL=log` for the run: invoices and invitations go to the log, not to real addresses. Payments in test mode only.
