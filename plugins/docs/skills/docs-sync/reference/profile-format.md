# Profile format: docs-sync

A project's profile lives at `.claude/docs-sync.md`: YAML front matter for settings, then Markdown sections, the most important being the document groups. Every setting has a default, so a profile only needs what differs. A filled-in example is in [example-profile.md](example-profile.md).

## Front matter

```yaml
---
profile_version: 1
branch: main                    # the branch synced; default: the current branch
marker: docs/.last-docs-sync    # one line, the last synced commit; committed with the sync
max_auditors: 6                 # read-only auditors in parallel (Step 3)
size_threshold_kb: 40           # docs over this are reported in the size watch
growth_threshold_kb: 10         # docs that grew more than this since the base are reported
ask_before:                     # globs whose edits need the user's OK first (Step 5)
  - "deploy/**"
checks:                         # run after the edits (Step 6); default: discovered lint and test
  - npm run lint
  - npm test
commit: true                    # commit the edited docs and the marker in one commit
push: false
commit_message: "Docs sync: <range>"
---
```

| Key | Default |
|---|---|
| `branch` | the current branch |
| `marker` | `docs/.last-docs-sync` |
| `max_auditors` | 6 |
| `size_threshold_kb` | 40 |
| `growth_threshold_kb` | 10 |
| `ask_before` | none, plus whatever the project's agent instructions protect |
| `checks` | the lint and test commands found in the manifest or CI config |
| `commit` | true with a profile; without one, only if the user says so |
| `push` | false |
| `commit_message` | `Docs sync: <base short>..<head short>` |

## Sections

### `## Groups` (the checklist)

One `###` subsection per group. Each group has a **kind**:

| Kind | What the skill does with it |
|---|---|
| `docs` | Audited; wrong or missing text is corrected in place. |
| `ledger` | Append-only: records written when something happened (ADRs, changelogs, postmortems, done-archives, review reports). Audited, but fixes are only dated notes under an entry, new entries, or index rows. Never rewritten. |
| `generated` | Never hand-edited. Regenerated with its `regenerate` command when its triggers match. |
| `external` | Systems outside the repository (an incident tool, a code host's settings, chat, DNS). Checked read-only; drift goes to the maintainer. |

Each group lists, as bullets:

- **kind:** one of the four above.
- **files:** each path or glob, with what it's the **source of truth for** (one line). Sections can be named: `ROADMAP.md` "Next".
- **triggers:** path globs and change kinds that make the group's files possibly stale. `always` means every sync. A file can carry its own triggers after its description.
- **checks:** how to confirm a claim in this group (a test that reads the doc, a command, a file to compare against).
- **rules:** editing rules for this group (e.g. "small factual fixes only", "keep the 'Last verified' line current", "ask first").
- **regenerate:** (generated only) the command, and whether it needs network or credentials.
- **check with:** (external only) the tool, CLI or connector to read it with, and what to compare.

### `## Change kinds` (optional)

Maps paths to change kinds, so triggers can name kinds instead of paths. Defaults, matched by common names when the profile has none:

| Kind | Typical paths or signals |
|---|---|
| `api` | route files, OpenAPI documents, controllers, handlers |
| `schema` | ORM schema files, models |
| `migration` | migration folders |
| `events` | event catalogs, message schemas |
| `settings` | defaults and config files, settings schemas, environment variable lists |
| `infra` | IaC folders (`infra/`, `terraform/`, `cdk/`), Dockerfiles, compose files |
| `alarms` | alarm or monitor definitions, metrics |
| `jobs` | schedulers, cron definitions, workers |
| `dependencies` | manifests and lockfiles, new vendors or SDKs |
| `ui` | web app routes, components, styles |
| `cli` | command-line entry points and commands |
| `legal-data` | anything that collects, keeps, shares or deletes personal data: schema, analytics, exports, emails, new vendors |
| `process` | agent instructions, contributing guides, CI workflows, skills and their profiles |
| `docs` | documentation only |

### `## Rules` (optional)

The project's rules about docs, or paths to where they are (e.g. "CLAUDE.md, 'Keeping state accurate'"). Auditors and fixers get them.

### `## Archiving` (optional)

How the project archives or splits large documents (e.g. "finished items move to `docs/done-YYYY-MM.md`, leaving one line"). The size watch suggests these moves; it never makes them.

### `## Not docs` (optional)

Globs the claims grep (Step 2) skips: vendored docs, fixtures, generated reports.

## Discovery (no profile)

Look for, and tell the user what was found:

- **Project state:** a roadmap, TODO, status or project file at the root; a charter or vision doc; a strategy folder.
- **Guides:** README files, CLAUDE.md, AGENTS.md, CONTRIBUTING.md, onboarding docs, `docs/` trees.
- **Design:** an ADR folder (`docs/adr/`, `docs/decisions/`, `adr/`) as a **ledger**, with its index as docs; design or spec folders as docs.
- **Operations:** runbooks, a service catalog (`catalog-info.yaml`), IaC READMEs, a vendor list.
- **Developers and public docs:** API docs, a changelog (ledger), an OpenAPI file or SDK built by a script (generated).
- **Legal:** privacy policy, terms, content policy.
- **Generated:** files with a "generated" or "do not edit" header, and outputs of codegen scripts in the manifests; their regenerate command from the manifest.
- **Ledgers:** CHANGELOG.md, ADRs, postmortems, review reports, any file of dated entries.
- **Checks:** lint and test commands from the manifests or CI. Note tests that read docs (grep the test files for `docs/` paths).
- **Protected paths:** from the agent instructions and any permission rules in `.claude/settings.json`.

Group them as above with triggers guessed from folder names; mark guesses `TODO` in the starter profile.
