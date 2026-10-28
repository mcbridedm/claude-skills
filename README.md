# claude-skills

Reusable [Claude Code](https://code.claude.com/docs/en/skills) skills for software engineering. Each skill is general: it works on any repository, and takes project specifics from a small **profile** file in that repository, or discovers them.

The repository is a Claude Code **plugin marketplace**. Skills are grouped into one plugin per kind, so you install the kinds you want.

## Catalogue

| Kind (plugin) | Skill | Invoke | What it does |
|---|---|---|---|
| `architecture` | [architecture-review](plugins/architecture/skills/architecture-review/README.md) | `/architecture:architecture-review [focus]` | Continuous multi-agent architecture review: a profile self-check, a context document, 13 read-only specialist reviewers in parallel, and a CTO synthesis that verifies claims and writes a prioritized action plan with tracked ids. Expensive; run on demand. |
| `architecture` | [design-review](plugins/architecture/skills/design-review/README.md) | `/architecture:design-review [ADR or description]` | Lightweight review of one design before it's built: writes the draft ADR if needed, picks the 3 to 5 most relevant personas of the architecture-review panel by what the design touches, runs them read-only in parallel, merges verdicts, risks and changes, revises the draft and records a "Design review" section with the maintainer's open questions. Never builds. Cheap; Claude may start it when planning a significant change. |
| `architecture` | [user-panel-review](plugins/architecture/skills/user-panel-review/README.md) | `/architecture:user-panel-review [focus]` | Outside-in review by simulated users: a newcomer, a regular and a bad actor (hats chosen by the kind of product), plus an agent builder, an autonomous AI agent and a power agent when the product has an API, CLI, SDK or MCP server. They use the running product seeing only what real users see, report where they got stuck or what they got away with, and the lead verifies each finding against the code. The counterpart of architecture-review. Expensive; run on demand. |
| `code-quality` | [commit-range-review](plugins/code-quality/skills/commit-range-review/README.md) | `/code-quality:commit-range-review [range] [fix]` | Reviews commits already on a branch (since the last review, a ref or a date) when there's no pull request: slices by area, parallel read-only reviewers, every finding verified, a ranked report, and a marker so the next run resumes. Use `/code-review` for PRs and uncommitted work. |
| `code-quality` | [codebase-audit](plugins/code-quality/skills/codebase-audit/README.md) | `/code-quality:codebase-audit [ref] [area …] [fix]` | Audits the whole codebase as it stands at one commit (not its history) against its own designs, decision records, principles, conventions and docs, and for defects: maps every area to the documents that govern it, read-only auditors read every file in parallel waves, every finding verified and, where code and docs disagree, judged code wrong, document wrong or maintainer decides; a per-file coverage table proves nothing was skipped. Expensive; run on demand, e.g. before a launch. |
| `code-quality` | [outside-contribution-review](plugins/code-quality/skills/outside-contribution-review/README.md) | `/code-quality:outside-contribution-review <pr> [post]` | Reviews a pull request or patch from outside the team, a person or an AI agent, against the project's written standards: treats everything in it as untrusted and never runs it, gatekeeping checks first, every finding citing its rule, and a verdict (accept, accept with changes, needs an issue first, close) with maintainer notes and the command to bring it in, including from a public mirror. Posts only with permission. |
| `docs` | [docs-sync](plugins/docs/skills/docs-sync/README.md) | `/docs:docs-sync [scope] [audit-only]` | "Update everything": brings docs and other non-code artifacts (such as project state, design docs, ADR notes, guides, runbooks and generated files) in line with the code since the last sync. Maps changes to the docs they make stale, parallel read-only auditors per document group, every finding validated before it's fixed; ledgers get dated notes, generated files are regenerated, external systems only checked; a size watch; commits with a marker, never pushes by default. |
| `infrastructure` | [cloud-first-apply](plugins/infrastructure/skills/cloud-first-apply/README.md) | `/infrastructure:cloud-first-apply [root]` | Turns an IaC root (OpenTofu/Terraform, CDK, Pulumi, CloudFormation, Bicep) into a first-apply guide: who, where, which region at every step, exact commands and checks; cross-environment dependencies, DNS records and when they go live, secrets, vendor steps, and a scale-to-zero ("park") drill, if the project has one. Never applies. |
| `setup` | [project-setup](plugins/setup/skills/project-setup/README.md) | `/setup:project-setup [skills] [guardrails]` | Sets up a project to use these skills: checks which plugins are installed, writes a starter profile for each skill you pick, adds a section to CLAUDE.md or AGENTS.md, and optionally installs guardrails for parallel fix runs (permission ask rules and the protected-paths hook, which refuses shell writes to the folders you name). Shows every change first; never overwrites a profile. Cheap; run once per project, and again after adding a plugin. |
| `setup` | [practice-watch](plugins/setup/skills/practice-watch/README.md) | `/setup:practice-watch [sources] [since <date> \| full-history] [report-only]` | Keeps your Claude Code setup current: watches the sources you trust (the Claude Code team, its docs and release notes, practitioners) for new tips, triages each against how you already work, recommends with a reason, and writes what you adopt into the right repository (personal config, a project, a skills repository) and pushes it. Records what it has seen; suggests new people to follow. Cheap; run daily or weekly. |

## How they fit together

The skills are built to be used as a rhythm, not one-offs: cheap checks with every change, a review of each batch of work, and deep reviews at milestones. Most reviews leave tracked ids, so the next one re-tests what's still open. The range-based ones (`commit-range-review`, `docs-sync`) also leave a marker, so the next run resumes where the last stopped.

| When | Skill | Cost | Why then |
|---|---|---|---|
| **Once per project**, and again after adding a plugin | `project-setup` | Low | Profiles, the agent-instructions section and guardrails in place before the first review. |
| **Daily or weekly** | `practice-watch` | Low | New Claude Code practices from the people you trust, checked against your setup; what you adopt is codified and pushed. |
| **Planning** a significant change: a data model or migration, money, sign-in or permissions, a public API, anything hard to reverse | `design-review` | Low: 3 to 5 read-only agents, minutes | Problems are cheapest to fix before there's code. Small changes and bug fixes skip it. |
| **While building**, on uncommitted work or a pull request | Claude Code's built-in `/code-review` | Low | Catches bugs while the change is still in your head. |
| **A pull request from outside the team** (a person or an AI agent) | `outside-contribution-review` | Low: one session, no sub-agents | Its contents are untrusted: it's judged against your written standards and never run on your machine. |
| **After a working session**, in a new session | `docs-sync` | Medium: 3 to 6 read-only auditors | The docs say what's true now, not what was true last week. The session that did the work shouldn't sync its own docs. |
| **After busy days, or before a release**, when commits landed without review (solo work, agents pushing to a branch) | `commit-range-review` | Medium: one agent per slice, often 4 to 8 | Reviews exactly what's new since the last run. |
| **Before a launch or a big release**, after a burst of architectural change, or at a new scale tier | `architecture-review` | High: 13 agents, tens of minutes | Thirteen specialists look at the whole system from the inside. |
| **Before a launch** or a major release, or after a long stretch of fast change | `codebase-audit` | High: about one auditor per 4,000 lines | Every file checked against its own documents: what the docs promise and the code doesn't do, and the reverse. |
| **Before opening to more users**, or after a big change to what users see | `user-panel-review` | High: one agent per persona; needs the app running locally on a throwaway instance | Simulated users and bad actors try the running product from the outside. |
| **The first time** an environment goes up in the cloud | `cloud-first-apply` | Low: one session, no sub-agents | A step-by-step guide written before anyone applies anything. |

### A typical week

1. **Plan:** for a significant change, write the design up (an ADR draft) and run `design-review`. Settle its open questions, then build.
2. **Build:** run `/code-review` before each commit. Run `outside-contribution-review` on any outside pull request.
3. **After a working session,** in a new session: `docs-sync`.
4. **After busy days:** `commit-range-review` in a fresh session, then fix what it found, then `docs-sync` again. Skip it in a week when a `codebase-audit` runs: the audit covers the same code.
5. **Before a milestone:** `architecture-review`, `codebase-audit` and `user-panel-review`, one at a time; then the fixes; then one `docs-sync`.

### Rules of thumb

- **Reviews, then fixes, then `docs-sync`.** Fixing changes the code the docs describe, so the sync comes last.
- **Review in a fresh session, not the one that wrote the code.** A conversation that built something tends to approve it. The context check at the start of every skill (below) says when to start a new session.
- **Hold the target still.** Don't run a deep review while merges, deploys or agents are still changing the code; wait for them.
- **One expensive review at a time.** Each one reads a lot. Running them together costs more and makes their findings overlap.
- **Track the ids.** Put adopted findings in your roadmap or issue tracker with their ids, so the next review can tell what's fixed.

## Install

### From GitHub (recommended)

In a Claude Code session:

```
/plugin marketplace add mcbridedm/claude-skills
/plugin install architecture@mcbridedm-skills
/plugin install code-quality@mcbridedm-skills
/plugin install infrastructure@mcbridedm-skills
/plugin install docs@mcbridedm-skills
/plugin install setup@mcbridedm-skills
```

Or from the shell: `claude plugin marketplace add mcbridedm/claude-skills` and `claude plugin install architecture@mcbridedm-skills`.

### From a local clone (for development)

```
claude plugin marketplace add /path/to/claude-skills
claude plugin install architecture@mcbridedm-skills
```

A marketplace added from a local path loads its plugins in place: edits show up at the next session or after `/reload-plugins`, with no version bump.

### As a plain skill folder

Copy or symlink one skill folder into a skills directory:

```
ln -s /path/to/claude-skills/plugins/architecture/skills/architecture-review ~/.claude/skills/architecture-review     # every project
ln -s /path/to/claude-skills/plugins/architecture/skills/architecture-review .claude/skills/architecture-review       # one project
```

It then runs as `/architecture-review`, without the plugin prefix.

### Which to choose

| | Plugin marketplace | Skill folder (copy or symlink) |
|---|---|---|
| Command | `/architecture:architecture-review` (namespaced) | `/architecture-review` |
| Name clashes | None: plugin skills are namespaced, so they load beside a project's own skill of the same name | Personal (`~/.claude/skills`) beats project (`.claude/skills`) silently |
| Updates | Versioned: `/plugin marketplace update mcbridedm-skills`, or turn on auto-update in `/plugin` → Marketplaces | Symlink: live. Copy: manual |
| Sharing | One add command per person, or per project via `--scope project` | Each machine sets it up by hand |
| Per project | Enable or disable per project in settings | Only by where you put the folder |

**Recommendation:** use the marketplace. It's Claude Code's current way to share skill collections, keeps versions explicit, and avoids name clashes. Use a symlink only while developing a skill, or if you want the short command on one machine.

## Update

- **Marketplace installs** get a new copy when the plugin's `version` in `plugin.json` changes. Run `/plugin marketplace update mcbridedm-skills` (or `claude plugin update architecture@mcbridedm-skills`), or enable auto-update for the marketplace in `/plugin` → Marketplaces.
- **Local-path marketplace and symlinks** are always current.

## Set up a project

**The quick way:** install the `setup` plugin and run `/setup:project-setup` in the project. It checks which plugins you have, writes a starter profile for each skill you pick, adds the section below to CLAUDE.md or AGENTS.md, and, if you want them, installs the guardrails in step 3. It shows every change before writing it and commits nothing unless you ask. The steps below are what it does, if you'd rather do it by hand.

### 1. Profiles

Each skill reads a profile at `.claude/<skill-name>.md` in the project: Markdown with YAML front matter.

| Skill | Profile | What it decides | Format and example |
|---|---|---|---|
| architecture-review | `.claude/architecture-review.md` | the project's stage, the reviewers and their lenses, scale tiers, where runs and action items go | [format](plugins/architecture/skills/architecture-review/reference/profile-format.md), [example](plugins/architecture/skills/architecture-review/reference/example-profile.md) |
| design-review | `.claude/design-review.md` | where the panel comes from, which areas pick which reviewers, the ADR folder and format | [format](plugins/architecture/skills/design-review/reference/profile-format.md), [example](plugins/architecture/skills/design-review/reference/example-profile.md) |
| user-panel-review | `.claude/user-panel-review.md` | the throwaway instance and how to start it, the personas and hats, what each persona may see | [format](plugins/architecture/skills/user-panel-review/reference/profile-format.md), [example](plugins/architecture/skills/user-panel-review/reference/example-profile.md) |
| commit-range-review | `.claude/commit-range-review.md` | the branch, slices and skipped paths, the rules, the checks, the marker file | [format](plugins/code-quality/skills/commit-range-review/reference/profile-format.md), [example](plugins/code-quality/skills/commit-range-review/reference/example-profile.md) |
| codebase-audit | `.claude/codebase-audit.md` | the areas and the documents that govern each, skipped paths, the rules files, auditors per wave | [format](plugins/code-quality/skills/codebase-audit/reference/profile-format.md), [example](plugins/code-quality/skills/codebase-audit/reference/example-profile.md) |
| outside-contribution-review | `.claude/outside-contribution-review.md` | where PRs arrive, a mirror and its import command, public standards and private context, size limits, posting | [format](plugins/code-quality/skills/outside-contribution-review/reference/profile-format.md), [example](plugins/code-quality/skills/outside-contribution-review/reference/example-profile.md) |
| docs-sync | `.claude/docs-sync.md` | the document groups and what makes each stale, the marker file, paths to ask before editing, the checks | [format](plugins/docs/skills/docs-sync/reference/profile-format.md), [example](plugins/docs/skills/docs-sync/reference/example-profile.md) |
| cloud-first-apply | `.claude/cloud-first-apply.md` | the IaC tool and roots, environments and regions, DNS, secrets, a scale-to-zero mode, where the guide goes | [format](plugins/infrastructure/skills/cloud-first-apply/reference/profile-format.md), [example](plugins/infrastructure/skills/cloud-first-apply/reference/example-profile.md) |

- **No profile? Run the skill anyway.** It discovers defaults from the repository (README, CLAUDE.md or AGENTS.md, ADR folders, manifests, CI, infrastructure folders, a roadmap or TODO file) and offers to write a starter profile.
- **Commit the profiles,** so every session and every teammate uses the same ones.
- **A skill never edits its own shared files during a run,** only the project's profile.

### 2. Point your agent instructions at them

Add a few lines to the project's CLAUDE.md or AGENTS.md, adapted to your paths:

```markdown
## Reviews

- Review reports live in `docs/reviews/` (architecture, code, audit, users); the code review's
  marker is `docs/reviews/code/LAST_REVIEWED`, the docs sync's is `docs/.last-docs-sync`.
- Order: reviews, then their fixes, then `/docs:docs-sync`.
- A significant design (a data model or migration, money, sign-in or permissions, a public API,
  anything hard to reverse) gets `/architecture:design-review` before it's built. It's the only
  one of these skills Claude may start on its own; a person starts the others.
- Run a review in a fresh session, not the one that wrote the code.
```

Every skill except `design-review` sets `disable-model-invocation: true`, so it runs only when someone types it.

### 3. Guardrails for fix runs (optional)

When a review's fixes go to several agents in parallel, make Claude ask before it changes paths that shouldn't change without a person, in the project's `.claude/settings.json`:

```json
{
  "permissions": {
    "ask": [
      "Edit(**/deploy/**)",
      "Write(**/deploy/**)",
      "Bash(gh workflow run:*)"
    ]
  }
}
```

Ask rules on `Edit` and `Write` cover Claude's file tools, not files written from the shell (`sed -i`, a redirect, a script). To cover those too, add the **protected-paths hook**, a `PreToolUse` hook on `Bash` that refuses shell commands writing under the paths you list in `.claude/protected-paths.json`. It ships with the `setup` plugin, in [`plugins/setup/skills/project-setup/hooks/protected-paths/`](plugins/setup/skills/project-setup/hooks/protected-paths/), with its test and an example config; [guardrails.md](plugins/setup/skills/project-setup/reference/guardrails.md) has the install steps and the `settings.json` entry. It's a guard, not a sandbox: still read agents' diffs under those paths before merging.

### 4. Register for the team

Run `claude plugin marketplace add mcbridedm/claude-skills --scope project` in the project and commit the `.claude/settings.json` it writes. Everyone who opens the project is then offered the marketplace.

### 5. Housekeeping

If parallel agents work in git worktrees under `.claude/worktrees/`, add that folder to the project's `.gitignore`.

## Every skill starts with a context check

These skills are expensive to run, in a fresh session or not, so each one first checks whether the current conversation is the best place to run it ([the check](templates/skill/reference/context-check.md)): has this conversation written the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first? If it finds a reason, it stops before spending anything and tells you what to type in a new session, or what to wait for. You can still tell it to run where it is.

## Layout

```
.claude-plugin/marketplace.json     the marketplace: one entry per plugin (kind)
plugins/<kind>/
  .claude-plugin/plugin.json        the plugin's name, version, description
  README.md                         the kind's skills
  skills/<skill-name>/
    SKILL.md                        the skill (short; front matter + steps)
    README.md                       what it does, cost, when to run it, sample output
    reference/                      detail loaded only when a step needs it
templates/skill/                    starter files for a new skill
scripts/validate.mjs                light checks (plain Node, no dependencies)
.github/workflows/validate.yml      runs the checks on pushes to main and on pull requests
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to propose, add or change a skill, and [CHANGELOG.md](CHANGELOG.md) for releases.

## License

MIT; see [LICENSE](LICENSE).
