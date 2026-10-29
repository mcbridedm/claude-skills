# Profile format: finish-change

A project's profile lives at `.claude/finish-change.md`: YAML front matter for settings, then optional Markdown notes. Every setting has a default, so a profile only needs what differs.

```yaml
---
profile_version: 1
verify: "/run-app"                    # a skill to invoke, or a shell command that starts a throwaway
                                      # instance; default: discovered (verify-by-surface.md)
verify_notes: |                       # optional: how to sign in, where the logs are, how to stop it
  `scripts/stack up` prints the URLs; `scripts/stack signin` gives a browser sign-in link;
  `scripts/stack down` stops it. Logs in .stack/*.log.
keep_instance: false                  # leave the instance running after the run
skip_verify_paths:                    # changes only under these need no run (step 1.2)
  - "docs/**"
  - "*.md"
simplify: "/simplify"                 # a skill or command; "none" to skip
checks: "make check"                  # one command that must pass; default: discovered
commit: true                          # false: stop after the checks
commit_command: "make check && git commit"   # how a commit is made, if the project chains it; default: git commit
commit_style: "imperative subject, under 72 characters; body says why"   # default: recent history
evidence_in_commit: true              # add the "Verified:" lines to the message body
push: false                           # push after committing
---
```

## Discovery (no profile)

| Setting | Where it's found |
|---|---|
| `verify` | a project skill about running or verifying the app; a script or package script that starts a test instance; the end-to-end tests' setup; the README's dev command |
| `checks` | CLAUDE.md or AGENTS.md (a "before committing" or "gate" command), CONTRIBUTING, the CI config's steps on pull requests |
| `commit_command`, `commit_style` | CLAUDE.md or AGENTS.md; the last 20 commit messages |
| `push` | false unless the project's instructions say commits are pushed |

Tell the user what was found, run with it, and offer the starter profile at the end.

## Example

```markdown
---
profile_version: 1
verify: "npm run stack"
verify_notes: |
  Starts Postgres in a container, the API and the web build on free ports, and prints them.
  `npm run stack -- signin` prints a sign-in link; `npm run stack -- down` stops it.
skip_verify_paths: ["docs/**", "*.md"]
checks: "npm run check"
commit_command: "npm run check && git commit"
push: false
---

The admin test account is seeded as `admin@example.test`; sign it in with `npm run stack -- signin admin@example.test`.
```
