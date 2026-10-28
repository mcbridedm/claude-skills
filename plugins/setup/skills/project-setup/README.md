# project-setup

Sets up a project to use this repository's skills well. In one session, without sub-agents:

1. **Looks** at what's there: installed plugins (gives the install commands for missing ones), existing profiles, settings, hooks, CLAUDE.md or AGENTS.md, and the project's shape.
2. **Writes starter profiles** for the skills you pick, from each skill's own profile format and the same discovery the skill would do, with every guess marked `TODO:`. It never overwrites an existing profile; it offers to add settings a newer version has gained.
3. **Adds a section to CLAUDE.md or AGENTS.md:** where reports and markers live, which changes need `design-review` first, the order (reviews, then fixes, then `docs-sync`), and that reviews run in fresh sessions.
4. **Optionally installs guardrails** for parallel fix runs: `permissions.ask` rules for the folders you name, and the **protected-paths hook**, which refuses shell commands that write there (ask rules alone cover only the Edit and Write tools). It copies the hook into `.claude/hooks/`, writes `.claude/protected-paths.json`, wires it in `.claude/settings.json`, and tests it.
5. **Housekeeping:** `.claude/worktrees/` in `.gitignore`, and the command to register the marketplace for the team.

Every change is shown before it's written. It's safe to run again: it fills gaps and reports what differs.

## Invoke

```
/setup:project-setup                      # asks which skills, and whether you want guardrails
/setup:project-setup all guardrails
/setup:project-setup docs-sync commit-range-review
```

## Cost

Low: one session, no sub-agents, a few minutes. It reads the repository's top-level docs and manifests, and writes only configuration files in `.claude/`, the agent-instructions file and `.gitignore`.

## Context check

Readiness weighs most: install the plugins you want first, and start from a clean working tree so the setup's changes are easy to review.

## What it doesn't do

- Install plugins, or change user-level settings (`~/.claude/`).
- Commit or push, unless you ask (then one commit).
- Run any of the skills it sets up.

## Doing it by hand

The repository README's "Set up a project" section lists the same steps. The hook and its guide are in [`hooks/protected-paths/`](hooks/protected-paths/) and [`reference/guardrails.md`](reference/guardrails.md).

## Sample output

```
Set up for the skills:
- Profiles written: .claude/docs-sync.md (3 TODO), .claude/commit-range-review.md (1 TODO)
- Kept: .claude/architecture-review.md (two settings available since 0.5.0, not added)
- CLAUDE.md: added "Reviews and docs (skills)"
- Guardrails: ask rules and the protected-paths hook for deploy/ and .github/; test passed; a probe write to deploy/ was refused. Loads at the next session.
- .gitignore: added .claude/worktrees/
- Still to install: /plugin install infrastructure@mcbridedm-skills
- Next: run /docs:docs-sync after your next working session, in a new session.
Nothing committed.
```
