# Guardrails for fix runs

When a review's fixes go to several agents at once, some folders should change only after a person has seen the change: infrastructure, CI workflows, deploy scripts, migrations, legal texts. Two layers do that.

## 1. Ask rules (the Edit and Write tools)

In `.claude/settings.json`, merged into any existing `permissions`:

```json
{
  "permissions": {
    "ask": [
      "Edit(**/deploy/**)",
      "Write(**/deploy/**)",
      "Edit(**/.github/**)",
      "Write(**/.github/**)",
      "Bash(gh workflow run:*)"
    ]
  }
}
```

One `Edit(...)` and one `Write(...)` per protected folder. Add `Bash(...)` rules for commands that act on the outside world (running a workflow, applying infrastructure).

These rules cover the Edit and Write tools only. A shell command (`sed -i`, a heredoc, a short script) can still write there without asking. That's what the hook is for.

## 2. The protected-paths hook (shell writes)

The hook is in this skill's `hooks/protected-paths/` folder:

| File | What it is |
|---|---|
| `protected-paths` | The hook command (bash). Runs the checker with whatever Node it finds; without Node it still blocks, roughly. |
| `protected-paths.mjs` | The checker: splits the command line and blocks redirections, `sed -i`, `awk -i inplace`, `tee`, `cp`/`mv` into (also `-t`/`--target-directory`), `rm`, `git checkout`/`restore`, `find -delete`, downloads (`curl -o`, `wget -O`), `tar -x` into, `--write`/`--fix` formatters, and inline scripts that write under a protected path. It follows `cd`, `pushd` and `git -C` within one command, judging relative paths from the new folder; a folder it can't resolve (`cd "$dir"`, `cd -`) counts as protected, and a `~` or `$HOME` target is taken literally. |
| `protected-paths.test.mjs` | Its test (`node --test`), on its own example paths. |
| `protected-paths.example.json` | An example config. |

Install it:
1. Copy the four files into the project's `.claude/hooks/`, keeping `protected-paths` executable (`chmod +x`).
2. Write `.claude/protected-paths.json`:
   ```json
   {
     "paths": ["deploy", ".github"],
     "rewriters": [
       { "pattern": "\\b(tofu|terraform)\\s+fmt\\b", "unless": "-check\\b", "why": "tofu fmt rewrites files in place (use tofu fmt -check)" }
     ],
     "message": "See CONTRIBUTING.md, \"Protected paths\"."
   }
   ```
   - `paths`: folder names from the repository root. Required; with none, the hook allows everything.
   - `rewriters`: commands that rewrite files wherever they run (formatters), blocked unless `unless` matches. Optional.
   - `message`: added to the refusal. Optional.
3. Wire it in `.claude/settings.json`, merged into any existing `hooks`:
   ```json
   {
     "hooks": {
       "PreToolUse": [
         { "matcher": "Bash", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protected-paths" }] }
       ]
     }
   }
   ```
4. Test: `node --test .claude/hooks/protected-paths.test.mjs`, then one real refusal (SKILL.md, Step 4).
5. It loads at the next session start.

**It's a guard, not a sandbox.** A script file that writes there without naming the path on the command line still gets through. Whoever merges agents' work still reads the diffs for changes under protected paths, and agents' briefs say: edit those paths only with the Edit and Write tools, never from the shell, even with approval.
