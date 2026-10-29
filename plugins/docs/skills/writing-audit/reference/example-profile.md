# Example profile: writing-audit

A fictional project: a booking app with a web front end, a CLI, user docs, and a bot that posts a weekly changelog to its forum. Copy this to `.claude/writing-audit.md` and adapt it.

```markdown
---
profile_version: 1
standard: docs/writing.md
reports_dir: docs/reviews/writing
id_prefix: wa
tracker: "ROADMAP.md \"Next\""
max_reviewers: 4
commit: true
commit_command: "npm run lint:docs && git commit"
push: false
---

# Writing audit: Bookly

## Surfaces

### Web copy
- kind: files
- audience: readers
- files: `web/src/routes/**`, `web/src/components/**`, `web/src/lib/messages/*.json`
- skip: `**/*.test.*`, `web/src/routes/legal/**` (renders `docs/legal`, counsel's drafts)
- notes: button and field labels don't need numbers.

### User guide
- kind: files
- audience: readers
- files: `docs/guide/**`

### Guide plans
- kind: files
- audience: maintainers
- files: `docs/guide/_plans/**`

### Changelog bot
- kind: live
- audience: readers
- fetch: `curl -sS "https://forum.example.com/api/users/changelog-bot/posts?limit=50"` (public; pages with `?before=<id>`)
- since: 60 days
- writer: `bots/changelog/prompt.md`, and the length check in `bots/changelog/gate.ts`

## Sources of truth

- `api/config/defaults.yaml`: every limit and time the copy mentions.
- `api/src/**`: what the product does.
- `cli/src/commands/**`: the commands and flags the guide quotes.
- `docs/specs/**`: how each feature is meant to work.

## Notes

- "Host" and "guest" are the product's terms; don't flag them as jargon.
```
