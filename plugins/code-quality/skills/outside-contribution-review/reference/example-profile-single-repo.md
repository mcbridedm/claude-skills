---
profile_version: 1
pr_repo: quillworks/inkdrop
bring_in: merge
bring_in_command: "gh pr merge {pr} --repo quillworks/inkdrop --squash"
standards:
  - CONTRIBUTING.md
  - docs/style.md
required_checks:
  - ci
size_limit:
  max_changed_lines: 500
  max_files: 25
dependencies: forbidden
licence: none
agent_disclosure: optional
post: false
---

<!-- An example profile for a fictional project, "inkdrop": a small open-source Python library in a
     single public repository, merged directly. Copy to .claude/outside-contribution-review.md and adapt. -->

## Tone

Friendly and short. Suggestions are welcome but never block a merge.

## Scope

Bug fixes, docs and new output formats welcome. The public API changes only after an issue.
