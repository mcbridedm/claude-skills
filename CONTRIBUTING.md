# Contributing

How to propose, add or change a skill. Contributions from outside are welcome.

## Contributing from outside

1. **New skill or a big change? Open an issue first.** Say what the skill does, when it would run, and why it's useful on many repositories (section 1). The maintainer replies before you build, so nobody spends a week on something that won't fit.
2. **Small fixes** (wording, a broken link, a wrong example) need no issue.
3. **Fork the repository,** make the change on a branch following the rules below, and run the checks in section 8.
4. **Open a pull request.** Say what changed and why, and how you tested it (section 8). If an AI agent wrote it, say which one, and who runs it.
5. **The maintainer reviews and merges.** Expect questions; a change may be asked to split or to wait for an issue.

By contributing, you agree that your contribution is licensed under the [MIT licence](LICENSE), like the rest of the repository.

## 1. Is it a general skill?

A skill belongs here when it's useful on many repositories. Everything specific to one project (its name, paths, vendors, principles, commands) goes into that project's **profile**, or is discovered from the repository. If a skill only makes sense for one project, keep it in that project's `.claude/skills/`.

## 2. Folder structure and naming

```
plugins/<kind>/                     one plugin per kind: architecture, testing, release, security, docs, ...
  .claude-plugin/plugin.json
  README.md
  agents/<name>.md                  optional: sub-agents the plugin's skills dispatch
  skills/<skill-name>/
    SKILL.md
    README.md
    reference/                      optional
```

- **Agents:** a skill that sends sub-agents to read and judge (reviewers, auditors) dispatches the plugin's own agent, e.g. `subagent_type: "<kind>:reviewer"`, whose `tools` list grants only what the job needs (Read, Grep, Glob; WebFetch and WebSearch only if it researches). That makes read-only enforced, not just asked for. Sub-agents return their output; the lead writes every file and runs every command, saving any output they need (diffs, check results) where they can read it. Give an agent Bash only when it can't be avoided, and then say so in its description and in the skill: a tool list can't make a shell read-only. Front matter needs `name` (the file name), `description` and `tools`; plugin agents ignore `permissionMode`, `hooks` and `mcpServers`. Keep the brief's prose rule as well, and the lead's `git status` check, for the fallback when the agent isn't available.
- **Checker (mechanical work on a cheaper model):** sub-agent work that is clearly mechanical (coverage or inventory checks, link and path existence checks, collecting or extracting data, applying exact text a judgement step already drafted, formatting) may go to the plugin's `agents/checker.md`: the same tools as its `reviewer`, plus `model: sonnet` (any value the [sub-agents docs](https://code.claude.com/docs/en/sub-agents) accept). Judgement work (reviewing, auditing, verifying findings, design and panel reviews, triage, writing new text) stays on the reviewer, on the session's model. A skill that uses a checker copies `templates/skill/reference/checker-escalation.md` into its `reference/` unchanged, points to it from every step that starts a checker, reports its escalations, and offers `models: { checker: <alias or inherit> }` in its profile format. The validator checks the copy matches the template, and that a checker has a `model` and its reviewer's tools.

- **Kind:** a short kebab-case noun. Add a skill to an existing kind when it fits; a new kind is a new plugin, with its own `plugin.json`, `README.md` and an entry in `.claude-plugin/marketplace.json`.
- **Skill name:** kebab-case, at most 64 characters, the same as its folder, and specific enough to read well without the plugin prefix (`architecture-review`, not `review`). Plugin names must not start with `claude-` or `anthropic-` (reserved).
- Start from `templates/skill/`: `cp -R templates/skill plugins/<kind>/skills/<skill-name>`.

## 3. SKILL.md front matter

```yaml
---
name: skill-name
description: What it does and when to use it, in the words a user would type.
argument-hint: "[optional argument]"
disable-model-invocation: true    # for expensive skills or skills with side effects
---
```

**Writing a description that triggers reliably:**
- Lead with the main use case and the verbs users say ("review", "audit", "write release notes").
- Say when to use it, and when not to if there's a near neighbour.
- Mention what it reads from the repository (e.g. "reads `.claude/<skill-name>.md`").
- Keep it under about 1,000 characters; Claude Code caps a skill's listing text at 1,536 and drops descriptions first when there are many skills.
- If the skill spawns agents, commits, pushes or costs a lot, set `disable-model-invocation: true` so it runs only when typed.
- Exception: a skill whose value is being run at the right moment in Claude's own work may stay model-invocable if it's cheap (a few read-only agents, minutes), doesn't commit or push by default, and announces itself before spawning agents. Its README says why (e.g. `design-review`).

Other fields (`allowed-tools`, `model`, `effort`, `context`, `paths`, ...) are listed in the [skills docs](https://code.claude.com/docs/en/skills). Use them only when needed.

## 4. Progressive disclosure

- Keep `SKILL.md` short and procedural: the steps, the rules, the output shape. Under about 300 lines; the validator warns past 500.
- Put detail in `reference/` files (formats, defaults, long lists, examples) and point to them from the step that needs them, with `${CLAUDE_SKILL_DIR}/reference/<file>.md`. Claude Code replaces `${CLAUDE_SKILL_DIR}` with the skill's folder wherever it's installed.
- Put the most important instructions near the top: after a context compaction, only the start of a skill may survive.

## 4b. The context check (every skill)

Every skill run is expensive, so every skill starts where it has the best chance of getting it right. Its first step is **Step C: Context check**, before Step P's heavier work and before any agent, write or command with side effects:

- Copy `templates/skill/reference/context-check.md` into the skill's `reference/` unchanged. It holds the signals (fresh start, authorship, context load, anchoring, moving target, readiness, sequence), the verdicts (proceed, fresh session, wait), the report, and what to hand the user. The validator fails a skill without Step C as its first step, or with a copy that differs from the template. To change the check, change the template and copy it to every skill in the same commit.
- In the skill's Step C, say which signals weigh most for it and why, in a few bullets (see the template's `SKILL.md`). A skill that judges work weighs authorship and anchoring heavily; one that reads a lot weighs context load; one that commits weighs moving target and sequence. A skill meant to run mid-work in the author's own session (like `design-review`) says so, and what it does instead.
- Add a "Context check" section to the skill's `README.md`, with the one line that's specific to it.

## 5. Generality rules

- No project names, paths, vendors, clouds, languages or package managers as assumptions. Name them only as examples ("e.g. `npm audit`, `pip-audit`, `cargo audit`") or as defaults the profile can override.
- **Profile:** project specifics live at `.claude/<skill-name>.md` in the project (Markdown with YAML front matter). Document its format in `reference/profile-format.md` and give an example.
- **Discovery:** without a profile, the skill discovers sensible defaults from the repository, tells the user what it found, and offers to write a starter profile.
- **Self-maintenance:** a skill that checks itself for drift edits the project's profile, never the shared skill. Changes to the skill are made here, in a commit, not during a run in another project.
- **Side effects:** say exactly what the skill may change, commit or push, and let the profile turn commit and push on or off.

## 6. Documentation required per skill

- `SKILL.md` with valid front matter.
- `README.md` in the skill folder: what it does, the invoke name, what it produces, its cost (agents, time), when to run it, the profile (with links), and a short fictional sample of its output.
- `reference/profile-format.md` and an example, if it reads a profile.
- A row in the root `README.md` catalogue and in the plugin's `README.md`.
- A `CHANGELOG.md` entry that names the skill.

`node scripts/validate.mjs` checks the parts it can.

## 7. Versioning

- Each plugin has a `version` in its `plugin.json` (semver). **Bump it with every change to that plugin**: marketplace users only receive a new copy when the version changes. Don't set `version` on the marketplace entry as well.
- Patch: wording fixes. Minor: new skill, new profile setting with a default, new step that doesn't change outputs. Major: a change existing profiles or saved outputs must adapt to (renamed settings, a new output layout).
- Record the change in `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)) under the plugin's new version, naming the skill.
- Profile formats carry `profile_version`. When a change breaks old profiles, bump it, keep reading the old one if you can, and say in the changelog how to migrate.

## 8. Test locally before committing

1. `node scripts/validate.mjs` and `claude plugin validate .` (and `claude plugin validate plugins/<kind>`).
2. Install from your clone: `claude plugin marketplace add /path/to/claude-skills`, then `claude plugin install <kind>@mcbridedm-skills`. Local-path marketplaces load in place, so later edits need only `/reload-plugins` in a running session. Check that `claude plugin details <kind>@mcbridedm-skills` lists the skill.
3. **Dry run on a sample repository**, not a project you care about: clone or create a small repo, start Claude Code there, and run the skill (`/<kind>:<skill-name>`). Run it once **without a profile** (discovery and the starter-profile offer) and once **with** the example profile adapted to that repo. For skills that commit, use a throwaway branch or clone.
4. For a skill that replaces a project's local skill, run both on the same commit and compare the outputs.
5. Commit one logical change, with the checks green.

## 9. Commits

One logical change per commit, with a clear subject. End messages with any attribution trailer your tools add. Outside contributors open a pull request; the maintainer merges and pushes to `main`.
