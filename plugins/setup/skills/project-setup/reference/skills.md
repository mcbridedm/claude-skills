# The skills and their profiles

Every profile is optional: a skill without one discovers defaults and offers a starter. A profile makes runs repeatable and lets every session and teammate use the same settings. Each skill's own `reference/profile-format.md` is the authority; this table is the map.

| Plugin | Skill | Profile | What the profile decides | Reports and markers (defaults) |
|---|---|---|---|---|
| `architecture` | `architecture-review` | `.claude/architecture-review.md` | The project's stage and team, reviewers to add or drop, focus areas, where decisions and the roadmap live, what's already decided | Runs in `docs/reviews/architecture/`, index `docs/reviews/README.md`; action items with ids (`AR-YYYY-MM-DD-NN`) |
| `architecture` | `design-review` | `.claude/design-review.md` | Where decision records live, which panel to draw from, the area map that picks 3 to 5 reviewers per design | A "Design review" section in the ADR itself |
| `architecture` | `user-panel-review` | `.claude/user-panel-review.md` | The product, how to run a throwaway instance, the personas and journeys, what each persona may see | Runs in `docs/reviews/users/` (or `reviews/users/`), index there; ids `UP-YYYY-MM-DD-NN` |
| `code-quality` | `commit-range-review` | `.claude/commit-range-review.md` | The branch, slices by area, the rules most often broken, checks to run, where follow-ups go | Runs in `docs/reviews/code/`; marker `docs/reviews/code/LAST_REVIEWED` |
| `code-quality` | `codebase-audit` | `.claude/codebase-audit.md` | The branch, paths to skip, the governance map's hints (which documents govern which areas), checks, follow-ups | Runs in `docs/reviews/audit/`, index there |
| `code-quality` | `outside-contribution-review` | `.claude/outside-contribution-review.md` | Where outside PRs arrive, the written standards, gatekeeping rules, a mirror's path map and import command, where verdicts are saved | Nothing saved by default (`save_to`) |
| `docs` | `docs-sync` | `.claude/docs-sync.md` | The document groups (what each holds, how it may be fixed), generated files and their commands, size thresholds | Marker `docs/.last-docs-sync` |
| `infrastructure` | `cloud-first-apply` | `.claude/cloud-first-apply.md` | The IaC roots, the default root, regions, vendors and accounts, where the guide goes | One guide per root |
| `setup` | `project-setup` | none | | |
| `setup` | `practice-watch` | `~/.claude/practice-watch.md` (or `.claude/practice-watch.md`) | The sources to watch, where the record and reports live, your setup files, where adopted practices go and how they're pushed, your "not for me" list | A record of every item seen and a report per run, in the repository the profile names |

## When each one is started

All of them are started by a person (`disable-model-invocation: true`), except `design-review`, which Claude may start on its own when it plans a significant change: it's cheap and its value is in running at the right moment.

## Recommended order

Reviews first, then the fixes they ask for, then `docs-sync`. A review runs in a fresh session, not in the conversation that wrote the code. Each skill's context check (its Step C) says when to start a new session or wait.
