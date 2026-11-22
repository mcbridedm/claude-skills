# The boss-workers profile

Location: `.claude/boss-workers.md` in the project. Markdown with YAML front matter. The worker launcher reads its `## Worker rules` section each time it starts a worker, so rules change without touching the script.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | This format's version. | `1` |
| `boss_model` | The boss's model: an alias, or a full model ID where the alias resolves to an older model (the operating rules say how to check). | `fable` |
| `boss_fallback` | The boss's model when its own cap is near. | `opus` |
| `accounts` | A list of `{ name, role }`: this project's accounts, by the names in the machine file (below). The address and the config folder come from the machine file, never from the repository. No account is the boss's: the boss launcher asks which one, and every worker follows it. The old form `{ name, config_dir, role }` still works (see "Moving from the old form"). | every account in the machine file |
| `boss` | The boss launcher's path, at any depth (e.g. `tools/boss/boss` in a folder-per-tool layout). | `tools/boss` |
| `worker` | The worker launcher's path. | `tools/run-worker` |
| `worker_root` | Where worker folders are, relative to the root. Workers never run in the root itself; with `.`, each worker folder is a sub-folder or a worktree inside it. | `.` |
| `sandboxed` | `true` where the boss's shell runs inside Claude Code's sandbox. The worker launcher then refuses to start a worker when it finds itself outside a sandbox, unless the person passes `--outside-sandbox`. | `false` |
| `workers_in` | What workers change: `own` (the boss's own repository) or `nested` (other repositories under its folder that the root ignores). With `sandboxed`, it names the arrangement in the operating rules, "Under a sandbox". | `own` |
| `state_file` | The boss's state. | `docs/boss-state.md` |
| `rules_doc` | The project's own rules for the boss, beside the skill's general ones (which stay in the skill and are never copied). | `docs/boss-workers.md` |
| `reserve` | The share of the account's week the boss keeps for the person and anything urgent. When less would be left before the reset, the boss tells the person, who decides the switch. | `15%` |
| `share` | This project's share of each account's week, when other projects use the same accounts. | `100%` |
| `commit` | Commit the setup. | `true` |
| `push` | Push the setup commit. | `false` |

## Body sections

| Section | What it holds | Used by |
|---|---|---|
| `## Models` | A table: model, and the work it takes. | The operating rules |
| `## Escalate to the person` | The only things the boss brings to the person. | The operating rules |
| `## Worker rules` | The project's own rules for every worker: checks before a commit, push rules, shared machines or devices, what never to touch. Plain text; the launcher appends it to every worker's prompt. | `run-worker` |

## The machine file

One file per machine, outside every repository, read by every project's launchers, so two projects can't name the same account differently: `~/.config/boss-workers/accounts` (the variable `BOSS_WORKERS_ACCOUNTS` points elsewhere, e.g. for tests). One line per account, three fields separated by spaces or tabs; `#` starts a comment; blank lines are ignored.

```
# name      address               config folder ("default" is ~/.claude)
primary     first@example.com     default
secondary   second@example.com    ~/.claude-secondary
```

- **name:** the person's own word for the account. Never a number or "main" and "second": the name and the address always appear together, so nobody has to remember which number is which.
- **address:** the address the account signs in with. The launchers refuse to start when the folder is signed in to another address (`accounts.md`, "The sign-in check").
- **config folder:** `default`, or a path (`~` allowed).

A line with other than three fields, or a name listed twice, stops both launchers with the line named.

## Placeholders in the launchers

| Placeholder | Replaced with |
|---|---|
| `@ACCOUNTS@` | This project's account names, separated by spaces, e.g. `primary secondary`. Empty means every account in the machine file. |
| `@BOSS_MODEL@` | `boss_model` |
| `@WORKER_ROOT@` | `worker_root` |
| `@RULES_DOC@` | `rules_doc` |
| `@STATE_FILE@` | `state_file` |

## What the launchers do with accounts

- `boss --account <name>` starts on that account. `boss` alone asks, where the project has several accounts, with one line per account, `  <name>, <address>`, and reads a name. Without a terminal it prints the same list and stops; it never guesses. With one account it starts on it.
- Before anything starts, both launchers run the sign-in check (`accounts.md`). `--no-sign-in-check` skips it and prints a warning; it's for a broken check, not for daily use. `boss --check-accounts` checks every account and starts nothing.
- The boss launcher exports `BOSS_WORKERS_ACCOUNT=<name>`, and `CLAUDE_CONFIG_DIR=<folder>` (unset for `default`). The worker launcher runs on `BOSS_WORKERS_ACCOUNT` by default. `run-worker --account <name>` is a deliberate exception: it prints one warning line that the worker spends that account's week and can't message the boss. Without either, it stops with the list.

## Moving from the old form

Profiles and launchers from setup 0.6 and earlier name each account with its folder (`{ name, config_dir }`; `@ACCOUNTS@` as `name=folder` pairs, e.g. `main= second=~/.claude-second`). The new launchers still read those pairs. Where the machine file has the same name, its address is checked, and its folder must match the pair's. Where it doesn't, the launcher starts with a warning that it can't check the sign-in. To move:

1. Write the machine file, one line per account, with names the person chooses (they may differ from the old ones).
2. In the profile, drop `config_dir` from each account and use the new names.
3. Copy the new launchers from the templates and set `@ACCOUNTS@` to the names.
4. Run `boss --check-accounts`.

## Example (fictional)

```markdown
---
profile_version: 1
boss_model: fable
boss_fallback: opus
accounts:
  - { name: primary, role: "the week the project uses first" }
  - { name: secondary, role: "when primary's week is used up" }
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
