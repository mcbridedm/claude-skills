# Triage and the report

## Judging a tip

For each kept item, answer in a line each:

1. **What it is:** the practice, in your own words, and the kind (workflow, setting, hook, prompt pattern, tool, habit, trap).
2. **Credible?** Who says it and from what experience; whether the product's docs or release notes confirm it (check them); how many trusted sources say the same. One practitioner's untested idea is **watch**, not **recommend**.
3. **Still true?** Check it against the current version (`claude --version`, the docs). Tips go stale when defaults change.
4. **Already doing it?** Search the setup files (Step 1). Cite the file and line if so. Partly doing it counts: say what's missing.
5. **Does it fit?** Against the person's setup and risks: what it touches (credentials, live systems, outside services), the profile's "Not for me" list, and how they work (alone or in a team, in a terminal or remotely). A tip that weakens a safety measure needs a strong case.
6. **Cost:** S (a line or a setting), M (a hook, a rule file, a script with a test), L (a new skill or a workflow change).
7. **Where it would go:** the profile route, or "unrouted" with a suggestion.

Verdicts: **recommend**, **already doing**, **not for you** (with why), **watch** (promising; say what evidence would settle it).

## The report

```markdown
# Practice watch, YYYY-MM-DD

Sources checked: <n> (<names>); items found: <n>; kept: <n>. Unreadable: <source: why, what to allow>.

## Recommended
| # | Practice | Source (date) | Why for you | Where | Cost |
|---|---|---|---|---|---|
| 1 | ... | [name](link) (YYYY-MM-DD) | ... | route | S |

## Already doing
- <practice>: <file:line> ([source](link))

## Not for you
- <practice>: <why> ([source](link))

## Watch
- <practice>: <what would settle it> ([source](link))

## Candidate sources
- <name> (<where>): cited by <who>; <why worth following>
```

Rank recommendations by value to this person first, then cost. Keep the report short: a line per item, the link for detail.
