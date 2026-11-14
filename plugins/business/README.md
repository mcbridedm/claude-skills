# business plugin

Skills about selling software: prices, stores and the decisions around them.

| Skill | Invoke | What it does |
|---|---|---|
| [regional-pricing](skills/regional-pricing/README.md) | `/business:regional-pricing [review] [country …] [product …]` | Recommends a local price per country for each paid product (subscriptions, one-time and in-app purchases): a digital price index from mainstream subscriptions priced per country, a purchasing-power cross-check, the closest competitors' local prices, each market's natural price ending, a floor, and each store's current rules; writes a dated table with every number sourced, and says when to review it. Recommends only; never changes live prices. Configured by `.claude/regional-pricing.md`. |

## Agents

- `business:researcher` ([agents/researcher.md](agents/researcher.md)): the read-only researcher that regional-pricing dispatches, one per region. Tools: Read, Grep, Glob, WebFetch, WebSearch; no shell, no editing, so it can't change files, sign in or buy. It returns prices with their sources and the lead writes the table. Effort `medium`: the work is mostly looking up and matching public prices, with some judgement about which plan matches.

Install: see the [repository README](../../README.md#install).
