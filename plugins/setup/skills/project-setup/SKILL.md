---
name: project-setup
description: Sets up a project to use this repository's skills well - checks which plugins are installed, writes a starter profile for each skill the user picks (from that skill's own profile format and discovery), adds a short section to CLAUDE.md or AGENTS.md (where reports live, the order to run things, fresh sessions), and optionally installs guardrails for parallel fix runs (permission ask rules plus a hook that blocks shell writes to protected paths), a .gitignore line for agent worktrees and a project-scope marketplace registration. Shows every change before writing it, never overwrites an existing profile, safe to run again. Use when the user asks to set up, adopt, onboard or configure these skills in a project, or to add the protected-paths hook.
argument-hint: "[skills to set up, e.g. 'all' or 'docs-sync commit-range-review'] [guardrails]"
disable-model-invocation: true
---

# Project setup

You set up the current repository to use the skills from this marketplace: their profiles, a pointer in the agent instructions, and optional guardrails. You write configuration files only, in this repository, and only after the user has seen each change. You never install plugins, change user-level settings, commit or push unless the user asks.

This skill has no profile of its own: what it writes **is** the other skills' profiles and the project's settings. The user's answers decide everything else.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/skills.md`: the skills, their profile paths, what each profile decides, and where reports and markers go by default.
- `${CLAUDE_SKILL_DIR}/reference/agent-instructions.md`: the section to add to CLAUDE.md or AGENTS.md.
- `${CLAUDE_SKILL_DIR}/reference/guardrails.md`: the permission rules, the hook and how to wire it.
- `${CLAUDE_SKILL_DIR}/hooks/protected-paths/`: the hook itself, its test and an example config.

## Step C: Context check (first, before anything costly)

Before Step 1, and before any write, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Readiness (6) weighs most:** the plugins the user wants must be installed, and the working tree should be clean so the setup's changes are easy to review.
- **Moving target (5):** wait for agents or merges that are editing `.claude/`, CLAUDE.md or AGENTS.md.
- Authorship (2) and anchoring (4) barely matter: this skill judges nothing. A long conversation (3) is fine.

## Step 1: Look at what's there

Without writing anything:
1. The repository root (`git rev-parse --show-toplevel`), `git status --porcelain`, and whether there's a CLAUDE.md, AGENTS.md or both.
2. **Installed plugins:** `claude plugin list` if it works, otherwise ask. Compare with the plugins in `reference/skills.md`. For each missing one the user wants, give the install command (`/plugin install <kind>@<marketplace>`); don't run it.
3. **Existing setup:** which `.claude/<skill-name>.md` profiles exist, `.claude/settings.json` (permissions and hooks), `.claude/protected-paths.json`, `.claude/hooks/`, `.gitignore`, and the agent-instructions section (Step 4) if it's already there.
4. **The project's shape**, for the profiles: README, CLAUDE.md or AGENTS.md, manifests, CI config, decision records, infrastructure folders, docs folders, a roadmap or TODO file.

Tell the user what you found in a short list, and ask which skills to set up (`$ARGUMENTS` may already say: `all`, or names) and whether they want guardrails. Recommend the skills that fit the project's shape (no `cloud-first-apply` without infrastructure as code; no `user-panel-review` without something users run).

## Step 2: Starter profiles

For each chosen skill without a profile:
1. Find that skill's `reference/profile-format.md` and `reference/example-profile.md`. They're in the installed plugin: look under `~/.claude/plugins/` (`find ~/.claude/plugins -path '*skills/<skill-name>/reference/profile-format.md'`, newest version), or in a local clone of this repository if the marketplace was added from one.
2. Fill each setting from Step 1's discovery, the way that skill's own Step P would. Mark everything you guessed with `TODO:` and a short reason, and leave out settings whose default is right.
3. Show the profile and write it to `.claude/<skill-name>.md` only when the user agrees.

Never overwrite an existing profile. If one exists, compare it with the format and list settings the format has gained since (a newer plugin version); offer to add them.

## Step 3: Agent instructions

Read `reference/agent-instructions.md`. Fill it in for this project: the report folders and marker files from the profiles you wrote or found (or the defaults in `reference/skills.md`), and the kinds of change that need `design-review` first if that skill is set up. Add it to the agent-instructions file the project already uses (CLAUDE.md for Claude Code; AGENTS.md if that's the project's only one), as its own section, after showing it. If the section is already there, show what differs and update it only if the user agrees.

## Step 4: Guardrails (only if the user wants them)

Read `reference/guardrails.md` and follow it:
1. Ask which folders agents must not change without asking (suggest from Step 1: infrastructure, CI workflows, deploy scripts, migrations, legal texts). Suggest any formatter that rewrites those files in place as a `rewriters` entry.
2. Show, then write: the `permissions.ask` rules in `.claude/settings.json` (merge; never drop existing entries), `.claude/protected-paths.json`, the hook files copied from `${CLAUDE_SKILL_DIR}/hooks/protected-paths/` into `.claude/hooks/` (keep the executable bit on `protected-paths`), and the `PreToolUse` hook entry in `.claude/settings.json`.
3. Run the hook's test there (`node --test .claude/hooks/protected-paths.test.mjs`). It tests its own example paths, so it passes whatever the project protects. Then try the installed hook once against the project's real config: pipe `{"tool_name":"Bash","tool_input":{"command":"echo x > <a protected path>/probe"},"cwd":"<root>"}` into `.claude/hooks/protected-paths` with `CLAUDE_PROJECT_DIR=<root>` and check it exits 2.
4. Tell the user the hook loads at the next session start (or after reviewing it in `/hooks`).

## Step 5: Housekeeping

Offer each, show it, write it only if the user agrees:
- **Per-turn load:** every skill description and every MCP tool name loads on every turn of every session (and every sub-agent's start). List user and project skills, plugins and MCP servers (`claude plugin list`, `claude mcp list`, `~/.claude/skills`), and suggest setting aside what this project doesn't use: skills moved to a disabled folder (reversible), MCP servers that never connect removed, connectors turned off for this project in `/mcp` (the user does that one). Also flag an agent-instructions file over about 2,500 tokens as a candidate for path-scoped rules.
- `.claude/worktrees/` in `.gitignore`, if agents may work in parallel worktrees.
- A project-scope marketplace registration, so teammates are offered the plugins: give the command (`claude plugin marketplace add <owner>/<repo> --scope project`) for the user to run; it writes `.claude/settings.json`.

## Hand off

Reply with a list: each file created or changed, each profile's `TODO:` lines left for the user, the plugins still to install, and the first skill to try (usually `docs-sync` after the next working session, or `design-review` before the next significant change). Commit only if the user asks, as one commit ("Set up the skills: profiles, agent instructions, guardrails"). Never push.
