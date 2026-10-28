---
record: ~/config/practice-watch/record.md
reports: ~/config/practice-watch/reports
record_push: always
cadence: daily
---

<!-- An example profile for a fictional developer who keeps their Claude Code setup in a private
     repository at ~/config, works mostly in ~/src/shop, and maintains a small public skills
     repository at ~/src/my-skills. Copy to ~/.claude/practice-watch.md and adapt. -->

## Sources

**The team**

| Name | Who | Where | Via | Notes |
|---|---|---|---|---|
| cc-docs | Claude Code docs | https://code.claude.com/docs/en/best-practices | fetch | and the pages it links to; compare with the last run |
| cc-releases | Claude Code release notes | anthropics/claude-code | gh | new features and changed defaults |
| team-member | a Claude Code team member | https://social.example/@member | browser | posts tips in threads; search by month for history |

**Practitioners**

| Name | Who | Where | Via | Notes |
|---|---|---|---|---|
| practitioner-a | an experienced engineer who writes about agentic coding | https://blog-a.example/feed.xml | fetch | only posts about coding agents |
| practitioner-b | a library author who uses agents daily | https://blog-b.example/atom.xml | fetch | |

## Setup

- `~/.claude/CLAUDE.md`, `~/.claude/settings.json`, the installed plugins
- `~/src/shop/CLAUDE.md`, `~/src/shop/.claude/`

## Routes

| Kind | Repository | Where in it | Push |
|---|---|---|---|
| Personal instructions, user settings, user hooks | ~/config | home/.claude/ (copied from ~/.claude by its sync script) | always |
| The shop's own setup | ~/src/shop | CLAUDE.md, .claude/ | ask |
| A generic skill or skill change | ~/src/my-skills | plugins/ | ask |
| Machine setup: installed tools, plugins, browser settings, habits | ~/config | machine/ | always |

## Not for me

- Skipping permission prompts: this machine holds live cloud credentials.
