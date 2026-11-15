# A second account in its own config folder

Claude Code keeps its login, settings and history in a config folder: `~/.claude` by default, or the folder named by `CLAUDE_CONFIG_DIR`. Each subscription account gets its own folder, so sessions on different accounts can run at the same time.

Using more than one account is the person's decision, under their plan's terms. Say what the terms you can read say, then follow their choice.

## 1. Create the folder

Name it from the profile (e.g. `~/.claude-account-2`). Link in what should be shared, so workers behave the same on every account:

```sh
a=~/.claude-account-2; mkdir -p "$a"
for f in CLAUDE.md settings.json plugins skills agents projects statusline.sh keybindings.json; do
  [ -e ~/.claude/$f ] && [ ! -e "$a/$f" ] && ln -s ~/.claude/$f "$a/$f"
done
```

- `projects` holds per-project memory and transcripts: linking it shares memory across accounts.
- Never link the login itself (a credentials file, on systems that keep one in the folder).
- MCP servers added at user level live in a file beside the default folder (`~/.claude.json`), not inside it, so they aren't carried over. Say which the project's workers would miss.

## 2. Proving the logins are separate

Before the person logs in, prove a new folder doesn't read the default login, or a login there could replace it:

```sh
CLAUDE_CONFIG_DIR="$(mktemp -d)" claude -p "Reply with just: ok" --model haiku
```

It must answer "Not logged in". If it answers "ok", stop: on this system the folders share a login, and a second login would sign the first one out. On macOS, each folder's login is a separate Keychain item: list the names, never the secrets, with `security dump-keychain | grep -o '"svce"<blob>="Claude Code[^"]*"'`.

## 3. The person logs in

Logging in is interactive, so the person runs it in their own terminal:

```sh
CLAUDE_CONFIG_DIR=~/.claude-account-2 claude
```

then `/login`, signs in with that account, and `/exit`.

## 4. Prove both work

For each account, `claude -p "/usage"` (with `CLAUDE_CONFIG_DIR` for a non-default one) must print its limits. The account's address is in its folder's `.claude.json` (default: `~/.claude.json`) as `emailAddress`; check each folder answers as the account the person meant. On macOS, the Keychain now lists one item per folder.

## Reading the limits

`claude -p "/usage"` prints, per account: the week across all models, the week for any model with its own cap, and, where the plan has one, the current session window, each with a percentage and a reset time. It also lists what used the limits on this machine. The boss uses it before starting each worker.
