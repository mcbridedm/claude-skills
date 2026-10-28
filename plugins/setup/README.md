# setup plugin

Getting a project ready to use the other skills.

| Skill | Invoke | What it does |
|---|---|---|
| [project-setup](skills/project-setup/README.md) | `/setup:project-setup [skills] [guardrails]` | Checks which plugins are installed, writes a starter profile for each skill you pick, adds a section to CLAUDE.md or AGENTS.md, and optionally installs guardrails for parallel fix runs: permission ask rules and the protected-paths hook, which refuses shell writes to the folders you name. Shows every change first; never overwrites a profile; commits only if asked. |

Install: see the [repository README](../../README.md#install).
