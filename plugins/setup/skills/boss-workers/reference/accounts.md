# Accounts: one folder each, named, one per project at a time

Claude Code keeps its login, settings and history in a config folder: `~/.claude` by default, or the folder named by `CLAUDE_CONFIG_DIR`. Each subscription account gets its own folder, signed in once and kept that way.

Using more than one account is the person's decision, under their plan's terms. Say what the terms you can read say, then follow their choice.

**One account per project at a time.** A project's boss and all its workers run on the same account, until the person switches the whole project to another (below). Every project on the machine is set up the same way.

## The machine file

The names and addresses live in one file on the machine, outside every repository: `~/.config/boss-workers/accounts` (format in `profile-format.md`). Each account has a name the person chose and its address, and the two always appear together, in the launchers' questions and messages and in what the boss writes. Never call an account 1 or 2, first or second, main or second: a number says nothing about which account it is.

```
# name      address               config folder
primary     first@example.com     default
secondary   second@example.com    ~/.claude-secondary
```

Ask the person for the names and addresses; write the file only after they confirm it. A project's profile names accounts only by name, so no address enters a repository.

## 1. Create the folder

Name it after the account (e.g. `~/.claude-secondary`). Link in what should be shared, so sessions behave the same on every account:

```sh
a=~/.claude-secondary; mkdir -p "$a"
for f in CLAUDE.md settings.json plugins skills agents projects statusline.sh keybindings.json; do
  [ -e ~/.claude/$f ] && [ ! -e "$a/$f" ] && ln -s ~/.claude/$f "$a/$f"
done
```

- `projects` holds per-project memory and transcripts: linking it shares memory across accounts.
- Never link the login itself (a credentials file, on systems that keep one in the folder).
- MCP servers added at user level live in a file beside the default folder (`~/.claude.json`), not inside it, so they aren't carried over. Say which the project would miss.

## 2. Proving the logins are separate

Before the person signs in, prove a new folder doesn't read the default login, or a login there could replace it:

```sh
CLAUDE_CONFIG_DIR="$(mktemp -d)" claude auth status --text
```

It must say it isn't logged in. If it shows an address, stop: on this system the folders share a login, and a second login would sign the first one out.

## 3. The person signs in, once per folder

Signing in is interactive, so the person does it, **at the machine itself, not over SSH** (see "Two stored logins in one folder"):

```sh
CLAUDE_CONFIG_DIR=~/.claude-secondary claude
```

then `/login`, signs in with that account's address, and `/exit`. From then on the folder keeps that account.

**Never use `/login` (or `claude auth login`) in a folder to move it to the other account while any session runs in that folder.** On a real machine this went wrong: sessions already running kept spending one account, new sessions spent the other, and the address the folder showed matched neither reliably. Switching account means starting sessions in the other account's folder, never changing a folder's login.

## 4. Prove each one

`boss --check-accounts` prints, per account, its name, its address, its folder and the address the folder is signed in to, and `ok` or `MISMATCH`. Then `claude -p "/usage"` (with `CLAUDE_CONFIG_DIR` for a non-default folder) must print each account's limits.

## The sign-in check

Before anything starts, both launchers read which address the account's folder is signed in to (`claude auth status --json`, which prints `loggedIn` and `email`, never a secret) and compare it with the address in the machine file, ignoring case:

- **Signed in to the right address:** it starts.
- **Signed in to another address, or not at all:** it refuses, and prints which address each of the project's folders holds, and what to do: end every session using that folder, then sign in there, at the machine (step 3). If the machine file has the wrong address, correct it there. The launchers never sign in or out themselves.
- **No address known** (an old-form account the machine file lacks): it starts, with a warning that it can't check.
- `--no-sign-in-check` skips the check and prints a warning that the session may spend another account's week. It's for a broken check, not for daily use.

## Two stored logins in one folder (macOS)

On macOS a folder's login is normally a Keychain item. A folder can also hold a credentials file (`.credentials.json`) at the same time: it is written when the Keychain refuses the write, for example when the login was done over SSH while the Keychain was locked. Which of the two wins is not documented.

- Sign in at the machine itself, not over SSH.
- The sign-in check reports a folder that holds both, by name only: the Keychain item's name and the file's name, never a secret. It looks for the item Claude Code was seen to use: `Claude Code-credentials` for the default folder, and `Claude Code-credentials-` plus the first 8 hex digits of the SHA-256 of the folder's path for any other. That name is observed, not documented; where it changes, the check finds nothing.
- The cure is the person's: end every session in that folder, sign out and in again there, at the machine, then run `boss --check-accounts`.

## Switching the project to the other account

The person decides when to switch. The boss tells them when the account's week runs low, with the reset time, and names both accounts by name and address. Then, for each project on the account:

1. The boss writes its state and every open handoff, commits them, and ends.
2. Each worker finishes, or is stopped at a commit: the boss tells it to commit and end, or waits for its run to end. No worker keeps running on the old account.
3. The person starts the boss again with the other account's name: `boss --account <name>`. The sign-in check runs first.
4. Workers follow the boss: the worker launcher uses the boss's account by default. The boss restarts stopped work from the handoffs.

A session is never resumed on the other account while it still runs on the first: one session, one process at a time. Starting fresh from the state file and the handoffs is the normal way.

**What doesn't move by itself.** Anything tied to the account rather than the project stays behind. Say what the project uses, before the switch:
- hosted connectors (claude.ai connectors such as a mailbox, a drive or a workspace), which are signed in per account;
- a browser extension signed in to one account;
- user-level settings or MCP servers that weren't linked into the other folder (step 1).

## Connectors that must follow the project, not the account

Hosted connectors belong to the account that is signed in. After a switch, the same connector may reach another mailbox, drive or workspace, or none.

A project that must always reach the same mailbox, drive or workspace defines its own MCP servers in the project's `.mcp.json`, with credentials kept outside the repository (an environment variable, or a file the server reads). These run the same on every account. The project may then turn the hosted connectors off for itself in its settings, so a session can't reach the wrong one by mistake.

## Reading the limits

`claude -p "/usage"` prints, per account: the week across all models, the week for any model with its own cap, and, where the plan has one, the current session window, each with a percentage and a reset time. It also lists what used the limits on this machine. The boss reads it at its start and before starting each worker, and names the account by name and address when it reports.
