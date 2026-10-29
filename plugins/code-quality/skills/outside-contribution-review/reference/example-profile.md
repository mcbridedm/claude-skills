---
profile_version: 1
pr_repo: quillpine/quillpine-docs
source_repo: quillpine/quillpine
path_map:
  "site/": "docs/site/"
bring_in: import
bring_in_command: "scripts/import-pr.sh {pr}"
commit_command: "make check && git commit"
standards:                       # public: shipped to the mirror, citable in verdicts
  - docs/site/STYLE.md
  - docs/site/CONTRIBUTING.md
maintainer_context:              # private to the monorepo: informs the review, never cited
  - docs/decisions/
template: docs/site/.github/PULL_REQUEST_TEMPLATE.md
required_checks:
  - build
  - links
  - lint
untrusted_code_runs: ci_after_approval
may_approve_ci_runs: false
small_fix:
  max_changed_lines: 40
  kinds: [typo, broken link, clarification]
size_limit:
  max_changed_lines: 300
  max_files: 15
dependencies: forbidden
forbidden_paths:
  - ".github/**"
  - "scripts/**"
  - "package.json"               # the site's build is set in the source repository
generated_paths:
  - "site/reference/api/**"      # generated from the API's OpenAPI document in the source repository
licence: dco
agent_disclosure: optional
save_to: docs/reviews/outside/{date}-pr-{pr}.md
post: true
---

<!-- An example profile for a fictional project, "quillpine": a monorepo (quillpine/quillpine) whose
     public docs site is mirrored to its own repository (quillpine/quillpine-docs), which takes
     outside pull requests. Accepted PRs are imported into the monorepo by a script; the mirror is
     overwritten on the next sync. This profile lives in the monorepo at
     .claude/outside-contribution-review.md, not in the mirror. -->

## Tone

Warm and brief. Thank the contributor by login once. No emoji. Link to `STYLE.md` the first time a rule is cited, then cite by section. For an agent, address it the same way, and thank the person who runs it if they said who they are.

## Scope

Welcome from outside: typo and link fixes, clarifications, new examples for existing guides, translations agreed in an issue. Not accepted from outside: changes to the generated API reference (it comes from the API), new top-level pages without an issue, analytics or tracking scripts of any kind.

## Rules

- **Examples run:** every code sample works against the current release, with its imports (`STYLE.md` "Examples").
- **Links:** relative links inside the site; no tracking parameters on outside links (`STYLE.md` "Links").
- **Images:** every image has alt text that says what it shows (`STYLE.md` "Accessibility").

## Mirror

`scripts/import-pr.sh <n>` fetches the PR's patch from the mirror, maps `site/` to `docs/site/` in the monorepo, keeps the author and sign-off, opens a branch, and runs the monorepo's checks there. Never merge on the mirror: the next sync overwrites it. After the import lands, the sync closes the PR with a link to the commit.

## Check by hand

- The changed pages in the preview build, at phone width and in dark mode.
- Any code sample that calls the live API: it must use the sandbox host, never production.
