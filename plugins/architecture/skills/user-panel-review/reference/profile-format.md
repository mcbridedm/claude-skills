# Profile format

The profile lives at `.claude/user-panel-review.md` in the reviewed repository: YAML front matter for settings, then Markdown sections. Every section is optional; the default applies when it's missing.

## Front matter

```yaml
---
profile_version: 1
project: example        # the product's name, as panelists should know it
report_folder: docs/reviews/users   # default: docs/reviews/users, or reviews/users
index_file: docs/reviews/users/README.md   # default: <report_folder>/README.md
action_id: UP-YYYY-MM-DD-NN         # default
commit: false           # commit the review folder and action items (default false)
push: false             # never true unless the maintainer says so
---
```

## Sections

| Section | What it holds | Default |
|---|---|---|
| `## Product` | What it is and who uses it, in the words of its public pages. Panelists get this and nothing more. | The README's first paragraph |
| `## Run` | Commands to start a **throwaway** instance and seed it, the URLs and ports, how to stop it, and how to get a fresh database. | Discovered from README and scripts |
| `## Instance` | The only instance panelists may use. | `localhost` from `## Run` |
| `## Surfaces` | Each surface and how a user reaches it: web URL, API base, CLI command, SDK, MCP server command, discovery files. | Discovered |
| `## Allowed view` | Per persona: what they may read and run. Everything else, including the source, is off limits. | Public pages, public files, `--help` |
| `## Personas` | The roster: keep, drop, rename, or replace the defaults (`reference/personas.md`); add new ones. One `### Name` per persona with who, what they know, journeys, and for bad actors the hats. | The six defaults |
| `## Journeys` | Shared journeys personas can name instead of repeating them. | Discovered |
| `## Decided sources` | Where recorded decisions live (decision records, a project file), so findings that only disagree with a decision are filed as feedback. | `docs/adr/`, `docs/decisions/` |
| `## Action items` | Where adopted findings go, and where launch blockers go. | The review's README only |
| `## Safety` | Anything panelists must never do here (an email service that really sends, a payment provider, a webhook to a real URL), and how to turn it off for the run. | None |

## Migration

`profile_version: 1` is the first format.
