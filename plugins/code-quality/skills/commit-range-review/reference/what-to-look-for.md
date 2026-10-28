# What to look for

In order. The first group is what a commit-range review exists for: defects that slip past a passing build when many changes land together, often written by agents that each saw only part of the picture.

## 1. Defects that combine

- **Merge resolutions.** A conflict resolved by taking both sides, which duplicates a line, a registration, a route or an entry in a list. Or one side silently dropped. Or two changes to the same contract that no longer fit.
- **Contract drift.** One change renames or reshapes an event, API field, setting, config key or database column, and another change in the range still uses the old form. Search the whole range for the name.
- **Ordering assumptions.** Code that relies on events, jobs or migrations happening in an order the system doesn't guarantee.

## 2. Tests that pass for the wrong reason

- An assertion loosened in the same commit as the code it tests (`toBe` to `toContain`, a count changed to match, a skip added).
- A test that can't fail: it asserts what it just set up, mocks the thing under test, or never awaits.
- A risky path changed without a test (auth, money, data deletion, migrations, concurrency).
- Tests that depend on timing or on each other (fixed sleeps, shared state, order).

## 3. Correctness and data

- Wrong result on an edge case: empty, null, zero, very large, duplicate, unicode, time zones, daylight saving.
- Errors swallowed or turned into success; partial writes without a transaction; retries that aren't idempotent.
- Migrations that lock large tables, drop or rename what the previous release still reads, or can't run twice.

## 4. Security

- Authorization skipped or checked on the wrong object; a new route without the project's access check.
- Input reaching a query, shell, path, URL fetch or HTML without the project's escaping or validation.
- Secrets or personal data in logs, errors, URLs, caches or responses.
- A weakened default: a cookie flag, a CSP, a CORS rule, a token lifetime.

## 5. The project's own rules

Whatever the project's rules files say, broken in this range. Name the rule and where it's written.

## 6. Documentation and state

A README, ADR, runbook or roadmap that now states something false because of a change in the range. Low severity, unless people or agents act on it (a runbook command, a setup step).

## Not findings

- Style, naming and formatting a linter would catch or a team would argue about.
- A different design you'd prefer, when the chosen one works and is recorded.
- Hypotheticals with no scenario a real user, attacker or operator would reach.
