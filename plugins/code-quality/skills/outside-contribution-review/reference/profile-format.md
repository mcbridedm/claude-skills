# Profile format: outside-contribution-review

A project's profile lives at `.claude/outside-contribution-review.md` in the project's trusted repository (for a mirror, the private source-of-truth repository): YAML front matter for settings, then optional Markdown sections. Every setting has a default, so a profile only needs what differs.

The profile is trusted input. Keep it in the source repository, never in the public mirror where outside pull requests could change it.

```yaml
---
profile_version: 1
pr_repo: example-org/example-client  # where outside PRs arrive; default: gh repo view
source_repo: example-org/monorepo    # source of truth if pr_repo is a mirror; omit for a single repository
path_map:                            # mirror path prefix -> source path prefix, to read base code for context
  "site/": "docs/site/"
bring_in: import                     # merge | import
bring_in_command: "scripts/import-pr.sh {pr}"   # the exact next command for an accepted PR; {pr} = number
                                     # default for merge: gh pr merge {pr} --repo {pr_repo} --squash
commit_command: "make check && git commit"   # how a commit is made in the source repository, if the project
                                     # chains it (for import: the step after bring_in_command); default: git commit
standards:                           # PUBLIC rules: the contributor's part may cite and quote these.
  - STANDARDS.md                     # read from the trusted base branch; default: discovered (Step P)
  - CONTRIBUTING.md
maintainer_context:                  # PRIVATE context: may inform the review, never cited, quoted or
  - docs/adr/                        # linked in the contributor's part (it may be posted). Use it for
                                     # internal docs of a private source repo. Default: none.
template: .github/PULL_REQUEST_TEMPLATE.md   # default: discovered
required_checks:                     # check names; default: branch protection, else CI on pull requests
  - test
  - lint
untrusted_code_runs: ci_after_approval   # ci_after_approval | sandbox | never
sandbox: ""                          # with untrusted_code_runs: sandbox, how to use it
may_approve_ci_runs: false           # the skill may approve waiting CI runs, if the user also says so
small_fix:                           # what needs no agreed issue
  max_changed_lines: 50
  kinds: [typo, docs, bug fix with a test]
size_limit:                          # beyond this, needs an issue first or a split
  max_changed_lines: 400
  max_files: 20
dependencies: agreed-only            # agreed-only | forbidden | allowed
allowed_paths: []                    # globs; empty = anywhere not forbidden
forbidden_paths:                     # added to the defaults in gatekeeping.md
  - ".github/**"
  - "scripts/release*"
generated_paths:
  - "**/generated/**"
licence: none                        # none | dco | cla | statement
agent_disclosure: optional           # required | optional | none
maintainers: []                      # logins whose comments are trusted; default: OWNER/MEMBER/COLLABORATOR association
save_to: ""                          # e.g. docs/reviews/outside/{date}-pr-{pr}.md; empty = don't save
post: false                          # allow posting part 1 as a PR comment (the user still confirms each time)
---
```

## Sections (all optional)

- **`## Tone`:** how verdicts should sound, e.g. "warm, brief, first names; no emoji; link to the contributing guide once". Overrides the defaults in `verdict-template.md`.
- **`## Scope`:** what the project accepts from outside and what it doesn't, e.g. "bug fixes and docs welcome; new commands only after an issue; no changes to the wire protocol".
- **`## Rules`:** rules that matter most and are easy to miss, or that aren't in a standards file yet. Each gets a short name the verdict can cite ("profile: Rules, 'no new globals'").
- **`## Mirror`:** how the mirror works, for the maintainer notes: what the import command does, what never to do (e.g. "never merge on the mirror; it's overwritten on the next sync").
- **`## Check by hand`:** things reading can't settle that maintainers want listed every time, e.g. "Windows paths", "output on a terminal without colour".

## Defaults without a profile

- **pr_repo:** the URL in the argument, else `gh repo view --json nameWithOwner`. **source_repo:** none.
- **bring_in:** merge; the command is `gh pr merge {pr} --repo {pr_repo} --squash`.
- **commit_command:** from CLAUDE.md or AGENTS.md if they say how commits are made (e.g. a check chained before `git commit`), else `git commit`.
- **maintainer_context:** none. Without a profile, anything not visible in the PR's own repository is treated as maintainer context.
- **standards:** CONTRIBUTING.md, STANDARDS.md, PRINCIPLES.md, CODE_OF_CONDUCT.md, CLAUDE.md or AGENTS.md, a style guide, and an ADR folder, if present.
- **required_checks:** branch protection's required checks if readable, else the workflows that run on `pull_request`.
- **untrusted_code_runs:** `ci_after_approval`. **may_approve_ci_runs:** false.
- **small_fix, size_limit:** as in `gatekeeping.md` (50 lines for a small fix; 400 lines and 20 files).
- **dependencies:** agreed-only. **licence:** none. **agent_disclosure:** none.
- **save_to:** empty (nothing written). **post:** false (draft only).

See `example-profile.md` (a public docs site mirrored from a monorepo) and `example-profile-single-repo.md` (a plain single repository).
