# docs plugin

Skills that keep a project's documentation, and the rest of what it writes for readers, true.

| Skill | Invoke | What it does |
|---|---|---|
| [docs-sync](skills/docs-sync/README.md) | `/docs:docs-sync [scope] [audit-only]` | "Update everything": maps what changed since the last sync to the docs it makes stale, audits them with read-only agents in parallel (one per document group), validates every finding, fixes them (ledgers get dated notes, generated files are regenerated, external systems are only checked), runs the checks, and commits with a marker for next time. Configured per project by `.claude/docs-sync.md`. |
| [writing-audit](skills/writing-audit/README.md) | `/docs:writing-audit [surface …]` | Audits what the project has written (UI copy, docs, guides, and what its bots or agents publish, read live and never written to) against its own writing standard, or four default tests: specific, says what was tried, claims checked or labelled, adds something new. Checks every claim about the product against the code; read-only reviewers in parallel; every serious finding verified; a report with ids and the causes behind repeated failures. Never fixes. Configured per project by `.claude/writing-audit.md`. |

## Agents

- `docs:reviewer` ([agents/reviewer.md](agents/reviewer.md)): the read-only auditor and fix drafter that docs-sync dispatches, and writing-audit's reviewers, on the session's model. Tools: Read, Grep, Glob; no shell, no editing, no web. It returns findings and exact replacements; the lead makes every edit.
- `docs:checker` ([agents/checker.md](agents/checker.md)): the read-only fix placer for docs-sync's mechanical work: placing fixes whose exact text the lead already validated. Same tools as the reviewer; `model: sonnet`. It marks anything that needs judgement `NEEDS-JUDGEMENT` instead of guessing, and the lead re-runs those, malformed replies and failed spot checks with the reviewer (the skill's `reference/checker-escalation.md`). A profile's `models: { checker: inherit }` turns it off.

Install: see the [repository README](../../README.md#install).
