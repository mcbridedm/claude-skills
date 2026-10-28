# The guide's shape

```markdown
# First apply: <environment>

<Two or three sentences: what comes up, in which account and region, roughly how long it takes, and what's done by hand.>

## Blockers

- <Anything that must change before step 1, or "None.">

## Profile used

<The profile file at <commit>, or the discovered values.>

## Before you start

- <Accounts, CLI profile, tools and versions, decisions to make first (e.g. when the apex goes live).>

## Steps

### 1. <Short name>

- **Who:** maintainer | operator | agent
- **Where:** <console path, CLI, DNS provider>
- **Region:** <"Check the top right says N. Virginia (us-east-1)" | "Global: the region doesn't matter">
- **Do:** <exact command or click path; secrets typed at a hidden prompt, never as an argument>
- **Check:** <how to see it worked>
- **If not:** <the likely cause and the fix>

### 2. ...

## DNS records

| When | Type | Name | Target | Notes (proxy, TTL) |
|---|---|---|---|---|

## Secrets

| Where | Name | Who enters it | How (hidden prompt, console) |
|---|---|---|---|

## Scale-to-zero (park) drill, if the project has one

1. Dry run. 2. Park. 3. Consistency check (no changes). 4. Unpark. 5. Smoke test. Time each.

## Smoke test, rollback and cost

- <What proves it's up.>
- <How to undo a failed first apply without losing data.>
- <Cost running and parked, from the project's estimates.>
```

Plain words, short sentences. One action per step; split a step that needs two different places (a console and a DNS provider).
