# setup plugin

Getting a project ready to use the other skills, and keeping a Claude Code setup current.

| Skill | Invoke | What it does |
|---|---|---|
| [project-setup](skills/project-setup/README.md) | `/setup:project-setup [skills] [guardrails]` | Checks which plugins are installed, writes a starter profile for each skill you pick, adds a section to CLAUDE.md or AGENTS.md, and optionally installs guardrails for parallel fix runs: permission ask rules and the protected-paths hook, which refuses shell writes to the folders you name. Shows every change first; never overwrites a profile; commits only if asked. |
| [practice-watch](skills/practice-watch/README.md) | `/setup:practice-watch [sources] [since <date> \| full-history] [report-only]` | Watches the sources you trust (the Claude Code team, its docs and release notes, practitioners) for new tips, triages each against your setup, recommends with a reason, and codifies what you adopt in the right repository, then pushes. Keeps a record so each run reports only what's new. Configured by `~/.claude/practice-watch.md`. |
| [headless-job](skills/headless-job/README.md) | `/setup:headless-job [task and when]` | Turns a recurring task into a headless job: judges whether it can run outside a session, then writes its prompt, scoped tools, a cheap guard, a model and spend cap, and a launchd or systemd schedule for you to install. Cheaper than a session cron, survives restarts, authorized once. |

Install: see the [repository README](../../README.md#install).
