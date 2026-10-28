# The agent-instructions section

Add this to the project's CLAUDE.md (or AGENTS.md if that's its only agent-instructions file) as one section. Fill the `<...>` from the profiles you wrote or found, or the defaults in `skills.md`. Leave out the rows for skills the project doesn't use. Keep the project's own writing style.

```markdown
## Reviews and docs (skills)

The review and docs skills are configured by profiles in `.claude/` (one per skill, `.claude/<skill-name>.md`). Read a skill's profile before running it; change the profile, never the shared skill.

| Question | Where |
|---|---|
| Past architecture reviews and their action items | `<docs/reviews/architecture/>`, index `<docs/reviews/README.md>` |
| Past code reviews, and where the last one stopped | `<docs/reviews/code/>`, marker `<docs/reviews/code/LAST_REVIEWED>` |
| Whole-codebase audits | `<docs/reviews/audit/>` |
| Past user panel reviews | `<docs/reviews/users/>` |
| When the docs were last synced | `<docs/.last-docs-sync>` |

- **Design first:** a significant change (<data models and migrations, money, sign-in and permissions, public API changes, anything hard to reverse>) is written up as a decision record draft and reviewed with `design-review` before it's built. Small changes and bug fixes skip it.
- **Order:** reviews, then the fixes they ask for, then `docs-sync`.
- **Fresh sessions:** run a review in a new session, not the one that wrote the code. Each skill's context check says when.
- **Findings:** adopted findings go into <the roadmap or issue tracker> with their ids, so the next review can tell what's fixed.
```

If guardrails were installed (guardrails.md), add one line:

```markdown
- **Protected paths:** `<deploy/>`, `<.github/>` are edited only with the Edit and Write tools, which ask first; never from the shell. A hook (`.claude/hooks/protected-paths`) refuses shell writes there. Briefs for agents working in parallel say so.
```
