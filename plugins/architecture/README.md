# architecture plugin

Skills about software architecture.

| Skill | Invoke | What it does |
|---|---|---|
| [architecture-review](skills/architecture-review/README.md) | `/architecture:architecture-review [focus]` | Continuous multi-agent architecture review; a 13-persona panel plus a CTO synthesis, configured per project by `.claude/architecture-review.md`. |
| [user-panel-review](skills/user-panel-review/README.md) | `/architecture:user-panel-review [focus]` | Outside-in review by simulated users (a newcomer, a regular and a bad actor by default; agent personas too when the product has an API, CLI, SDK or MCP server) who see only what real users see; findings verified against the code. Configured by `.claude/user-panel-review.md`. |
| [design-review](skills/design-review/README.md) | `/architecture:design-review [ADR or description]` | Lightweight review of one design before it's built: the 3 to 5 most relevant personas of the architecture-review panel, read-only and in parallel; the lead revises the draft ADR and records a "Design review" section. Never builds. Configured by `.claude/design-review.md`. |

Install: see the [repository README](../../README.md#install).
