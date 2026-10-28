# code-quality plugin

Skills about the quality of code that has been written or offered: reviews of changes, audits of the whole codebase.

| Skill | Invoke | What it does |
|---|---|---|
| [commit-range-review](skills/commit-range-review/README.md) | `/code-quality:commit-range-review [range] [fix]` | Reviews commits already on a branch (since the last review, a ref or a date): splits them by area, reviews in parallel, verifies every finding, writes a ranked report, and remembers where it stopped. Configured per project by `.claude/commit-range-review.md`. |
| [codebase-audit](skills/codebase-audit/README.md) | `/code-quality:codebase-audit [ref] [area …] [fix]` | Audits every file of the codebase at one commit against the documents that govern it (designs, decisions, rules, docs) and for defects, in parallel waves of read-only auditors; verifies every finding, judges which side is wrong where code and docs disagree, and proves coverage file by file. Configured per project by `.claude/codebase-audit.md`. |
| [outside-contribution-review](skills/outside-contribution-review/README.md) | `/code-quality:outside-contribution-review <pr> [post]` | Reviews a pull request or patch from someone outside the team, a person or an AI agent, safely (read-only, never runs its code, treats its content as untrusted) against the project's written standards, and writes a verdict with cited rules and next steps. Configured per project by `.claude/outside-contribution-review.md`. |

## Agents

- `code-quality:reviewer` ([agents/reviewer.md](agents/reviewer.md)): the read-only reviewer that commit-range-review and codebase-audit dispatch. Tools: Read, Grep, Glob; no shell, no editing, no web, so it can't change files, run commands or send code anywhere. outside-contribution-review uses no sub-agents.

Install: see the [repository README](../../README.md#install).
