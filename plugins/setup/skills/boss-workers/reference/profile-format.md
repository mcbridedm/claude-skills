# The boss-workers profile

Location: `.claude/boss-workers.md` in the project. Markdown with YAML front matter. The worker launcher reads its `## Worker rules` section each time it starts a worker, so rules change without touching the script.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | This format's version. | `1` |
| `boss_model` | The boss's model alias. | `fable` |
| `boss_fallback` | The boss's model when its own cap is near. | `opus` |
| `accounts` | A list of `{ name, config_dir, role }`. `config_dir: default` is `~/.claude`. The first is the boss's account. | one account, `main`, `default` |
| `boss` | The boss launcher's path, at any depth (e.g. `tools/boss/boss` in a folder-per-tool layout). | `tools/boss` |
| `worker` | The worker launcher's path. | `tools/run-worker` |
| `worker_root` | Where worker folders are, relative to the root. Workers never run in the root itself; with `.`, each worker folder is a sub-folder or a worktree inside it. | `.` |
| `state_file` | The boss's state. | `docs/boss-state.md` |
| `rules_doc` | Where the operating rules are copied. | `docs/boss-workers.md` |
| `reserve` | The share of the latest-resetting account's week the boss keeps for the person and anything urgent. | `15%` |
| `share` | This project's share of each account's week, when other projects use the same accounts. | `100%` |
| `commit` | Commit the setup. | `true` |
| `push` | Push the setup commit. | `false` |

## Body sections

| Section | What it holds | Used by |
|---|---|---|
| `## Models` | A table: model, and the work it takes. | The rules doc |
| `## Escalate to the person` | The only things the boss brings to the person. | The rules doc |
| `## Worker rules` | The project's own rules for every worker: checks before a commit, push rules, shared machines or devices, what never to touch. Plain text; the launcher appends it to every worker's prompt. | `run-worker` |

## Placeholders in the launchers

| Placeholder | Replaced with |
|---|---|
| `@ACCOUNTS@` | The accounts as space-separated `name=config_dir` pairs, the boss's account first; an empty `config_dir` for the default folder, `~` allowed. E.g. `main= second=~/.claude-second`. |
| `@BOSS_MODEL@` | `boss_model` |
| `@WORKER_ROOT@` | `worker_root` |
| `@RULES_DOC@` | `rules_doc` |
| `@STATE_FILE@` | `state_file` |

## Example (fictional)

```markdown
---
profile_version: 1
boss_model: fable
boss_fallback: opus
accounts:
  - { name: main, config_dir: default, role: "the boss, long builds and reviews" }
  - { name: second, config_dir: ~/.claude-second, role: "short runs: checks, docs, overflow" }
worker_root: services
state_file: docs/boss-state.md
rules_doc: docs/boss-workers.md
reserve: 15%
share: 50%
push: true
---

## Models

| Model | Work |
|---|---|
| opus | Features, design, reviews, hard debugging |
| sonnet | Tests and checks, docs, changelogs, checklists |
| haiku | Read-only lookups inside a worker |

## Escalate to the person

Spending money; anything public; production deploys; anything in their name.

## Worker rules

Run `make check` before every commit, and push to origin over HTTPS after it passes. Never touch `infra/prod`. The test database is local only; never point tests at a shared one.
```
