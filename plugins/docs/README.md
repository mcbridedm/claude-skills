# docs plugin

Skills that keep a project's documentation true.

| Skill | Invoke | What it does |
|---|---|---|
| [docs-sync](skills/docs-sync/README.md) | `/docs:docs-sync [scope] [audit-only]` | "Update everything": maps what changed since the last sync to the docs it makes stale, audits them with read-only agents in parallel (one per document group), validates every finding, fixes them (ledgers get dated notes, generated files are regenerated, external systems are only checked), runs the checks, and commits with a marker for next time. Configured per project by `.claude/docs-sync.md`. |

## Agents

- `docs:reviewer` ([agents/reviewer.md](agents/reviewer.md)): the read-only auditor and fix drafter that docs-sync dispatches. Tools: Read, Grep, Glob; no shell, no editing, no web. It returns findings and exact replacements; the lead makes every edit.

Install: see the [repository README](../../README.md#install).
