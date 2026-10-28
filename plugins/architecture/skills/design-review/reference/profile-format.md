# The design-review profile

The profile lives at **`.claude/design-review.md`** in the repository: YAML front matter for settings, then Markdown sections. Every setting and section is optional; a missing one uses the default below. Write prose the way reviewers should read it: parts of it are pasted into their briefs.

The skill reuses the project's architecture-review panel rather than defining its own, so the two stay in step: a lens changed for the full review applies to design reviews too.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | Format version of this file. | `1` |
| `project` | The project's name, as reviewers should call it. | The repository folder name |
| `stage` | One line on the project's stage and team, pasted into the brief for proportionality (e.g. "pre-launch, a small team", "live, 300 paying teams, three engineers"). | Discovered |
| `principles_file` | The file the principles come from, named in the brief. | None |
| `panel_source` | Where the panel comes from: a path to a skill file with a persona table (e.g. a project's own `.claude/skills/architecture-review/SKILL.md`), a path to an architecture-review profile (its "Panel" section applied to that skill's default roster), or `inline` (this profile's "Panel" section). | `.claude/architecture-review.md` if it exists, then a project skill, then the architecture-review default roster |
| `panel_heading` | The heading in `panel_source` above the persona table, if the file has more than one table. | The first table with `Persona` and `Lens` columns |
| `adr_dir` | Folder of decision records. | Discovered (`docs/adr/`, `docs/decisions/`, ...) |
| `adr_index` | The ADR index file. | `<adr_dir>/README.md` if it exists |
| `adr_naming` | File name pattern for a new record. | Discovered from existing records, else `NNNN-kebab-title.md` |
| `adr_template` | A template file for a new record, or a comma-separated list of section names. | Discovered from the latest records, else `Context, Decision, Alternatives, Consequences` |
| `review_section` | The heading of the section the review writes into the ADR. | `Design review` |
| `reviewers_min` | Fewest reviewers. | `3` |
| `reviewers_max` | Most reviewers. | `5` |
| `fallback` | Personas added, in order, when the area map matches too few. | Solution, Domain, QA |
| `ask_one_at_a_time` | Ask the maintainer the open questions one at a time, waiting for each answer. | `false` |
| `commit` | Commit the ADR at the end of the run. | `false` |
| `push` | Push after committing. | `false` |
| `commit_message` | The commit subject. | `Design review: <ADR title>` |

## Body sections

| Section | What it holds | Used in |
|---|---|---|
| `## Product` | A line starting `One-liner:` (pasted into the brief after the project's name), and optionally a short paragraph. | Brief |
| `## Principles` | One paragraph to paste into the brief as the yardstick. | Brief |
| `## Decided sources` | Where the maintainer's standing decisions are recorded. | Brief |
| `## ADR conventions` | How the project writes and accepts records: status wording for proposed and accepted, whether proposed records get an index row, where long records keep their history, who approves. | Steps 1, 5, 6 |
| `## Area map` | Design areas, each with the personas to pick, the signals that match it, and what to read. Replaces the default map below. | Steps 2, 3 |
| `## Panel` | With `panel_source: inline`, the personas: one `###` heading per persona with a `Lens:` line. With another source, `Lens (add):` lines per persona, applied for design reviews only. | Step 2 |

### The Area map section

One `###` heading per area:

```markdown
### Payments
Personas: Security, Data, Product Strategy
Signals: checkout, refund, invoice, webhook, `payments/`
Read: `payments/`, `docs/decisions/0012-payments.md`
```

- **`Personas:`** names from the panel, in priority order. A short name matches the persona whose name contains it as whole words, ignoring case ("Security" matches "Security Architect", "Domain" matches "System/Application and Domain Architect"). If it matches more than one, use the full name.
- **`Signals:`** words, paths or modules that show the design touches the area. The lead also matches by reading the design, so signals are hints, not rules.
- **`Read:`** pointers given to every reviewer when this area matches, on top of what the lead finds in Step 1.

### Default area map

Used when the profile has none. Persona names are from the architecture-review default roster.

| Area | Personas, in priority order | Signals |
|---|---|---|
| Data model and migrations | Data, Domain, QA | new tables or columns, schema, migration, backfill, index, retention |
| Money | Security, Data, Product Strategy | payment, billing, invoice, refund, price, checkout, webhook from a payment provider |
| Identity, sign-in and access | Security, Solution, UI/UX | sign-in, session, token, password, passkey, OAuth, roles, permissions |
| Abuse surface | Trust & Safety, Security, Product Strategy | user content, sign-up, invites, rate limits, reports, anything a stranger can trigger at scale |
| User interface | UI/UX, Frontend, Product Strategy | pages, forms, flows, navigation, accessibility, emails users read |
| Infrastructure and hosting | Cloud, DevOps/Platform, Enterprise | new service, queue, schedule, IaC, region, cost, vendor |
| Delivery and operations | DevOps/Platform, QA, Cloud | CI, deploys, alarms, runbooks, jobs, backups |
| Integrations and APIs | Solution, Domain, Security | public API, SDK, webhooks out, events, third-party providers |
| AI and agents | AI/ML, Trust & Safety, Security | models, prompts, agents, ranking, generated content |
| Module boundaries | Domain, Solution, QA | a new module, moving responsibility between modules, shared state |
| Product scope | Product Strategy, Enterprise, UI/UX | a new feature, pricing, onboarding, what users are promised |

## Without a profile

The skill discovers the ADR folder, its conventions and the panel (SKILL.md, Step P), runs with the default area map, tells the user what it used, and offers to write a starter profile shaped like `example-profile.md`, with `TODO` where it guessed.

## Migration

`profile_version: 1` is the first format.
