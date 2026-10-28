# Profile format

The profile is Markdown with YAML front matter, at `~/.claude/practice-watch.md` (it follows you across projects) or `.claude/practice-watch.md` in a repository (a team's shared watch). The repository one wins when both exist.

## Settings (front matter)

```yaml
---
record: ~/config/practice-watch/record.md     # every item seen, with its verdict; required
reports: ~/config/practice-watch/reports      # one report per run, YYYY-MM-DD.md; default: beside the record
record_push: always                           # always | ask | never: commit and push the record and report after a run
cadence: daily                                # daily | weekly: what a missed run means; the schedule itself is set outside the skill
---
```

The record and reports belong in a repository you control (a private config repository is a good home), so the history of what you've seen and chosen is kept.

## `## Sources`

One row per source. `via` is how to read it: `fetch` (a public page or feed), `gh` (GitHub releases or commits), or `browser` (a site that needs your signed-in browser; reading only).

```markdown
| Name | Who | Where | Via | Notes |
|---|---|---|---|---|
| docs | the product's team | https://example.com/docs/changelog | fetch | the docs' own change history |
| releases | the product's team | example-org/example-cli | gh | release notes |
| jane | a core team member | https://social.example/@jane | browser | posts tips in threads |
| blog-a | a practitioner | https://blog.example/feed.xml | fetch | only posts tagged with the product |
```

Group them as you like (for example "The team" and "Practitioners"); the skill weighs a tip from the product's own team, or confirmed by its docs, above one from a single practitioner.

## `## Setup`

The files that describe how you work today, compared with each tip. Default when omitted: `~/.claude/CLAUDE.md`, `~/.claude/settings.json`, installed plugins, and the current repository's CLAUDE.md or AGENTS.md, `.claude/settings.json`, `.claude/rules/`, hooks and skills.

## `## Routes`

Where an adopted practice goes, by kind, and how it's pushed. The first matching row wins. A practice that matches none is reported as unrouted, with a suggestion.

```markdown
| Kind | Repository | Where in it | Push |
|---|---|---|---|
| Personal instructions, user settings, user hooks | ~/config | home/.claude/ (synced from ~/.claude) | always |
| A project's own setup | the project | CLAUDE.md, .claude/ | ask |
| A generic skill or skill change | ~/src/my-skills | plugins/ | ask |
| Machine setup: installed tools, plugins, browser settings, habits | ~/config | machine/ | always |
```

`Push`: `always` (commit and push after its checks pass), `ask` (show the commit, push when the user says), `never` (commit only).

## `## Not for me`

Practices you've decided against for good, with why (for example "no skip-permissions mode: live cloud credentials on this machine"). Tips that amount to one of these are marked "not for you" without asking again.
