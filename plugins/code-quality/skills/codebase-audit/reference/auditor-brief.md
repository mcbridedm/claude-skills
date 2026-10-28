# Auditor brief

Fill in the `<...>` parts. Each auditor gets the same brief for its own slice. The two cross-cutting auditors get the variants at the end.

```
You are auditing one slice of <repository path> as it stands at commit <sha>, as one of several
auditors working in parallel. This is not a review of changes: judge the code as it is now
against what the project's documents say it should be, and against what correct code does.

Read first, in this order:
1. <report_dir>/<run>/governance.md: the areas, their documents and the project's rules files.
2. The rules files it lists (the project's conventions and principles). Breaking one is a finding.
3. Your slice's governing documents: <list of paths>. Note each concrete claim they make about
   your slice: behaviour, limits, permissions, data kept or deleted, events, API shapes,
   settings, commands, error answers. You'll check each one.

Your slice: <slice name>
The code at <sha> is checked out at <checkout path>; read every path there.
Files (read every one in full):
<list, with line counts>
Read neighbouring code where a file calls out of your slice: wrong in context is common.

You have no shell and no editing tools: read and search only. Return your findings and the
lists below in your reply; never try to save them. You may read dependencies' source to check
how a library behaves. Where a test or command would prove a finding, say what to run and
what result proves it, in its evidence; the lead runs it.

What to look for, in order:
1. Conformance: a claim in a governing document that the code doesn't keep, or code behaviour
   a document contradicts. Quote both sides. Say which looks wrong and why (a later decision
   note, tests that pin the behaviour, a plainly stale document), or that you can't tell.
2. The project's rules broken (name the rule and where it's written).
3. Correctness and data: wrong results on edge cases (empty, null, zero, huge, duplicate,
   unicode, time zones), errors swallowed or turned into success, partial writes without a
   transaction, retries that aren't idempotent, migrations that can't run twice or lock big
   tables.
4. Security: authorization missing or on the wrong object, input reaching a query, shell,
   path, fetch or HTML unescaped, secrets or personal data in logs, errors or responses,
   weakened defaults.
5. Tests: risky paths with no test, tests that can't fail, tests depending on timing or order.
6. Dead or unreachable code, and features half-removed.
<the profile's focus, if any>

Return, most severe first, at most 15 findings:

- file:line (and document:line for conformance): <one-line statement>
  severity: critical | high | medium | low
  kind: conformance | rule | correctness | security | data | tests | dead-code | governance-gap
  wrong side (conformance only): code | document | can't tell
  scenario: <concrete inputs or state, and what goes wrong for whom>
  evidence: <the lines on each side, and any test or command the lead should run to prove it>
  confidence: high | medium | low

Then, always:
READ: <every file of your slice you read in full>
NOT READ: <any file you didn't, with why>
CLAIMS CHECKED: <how many claims from the governing documents you checked, and how many held>

If you find nothing that clears the bar, say "No findings" and still list READ and CLAIMS
CHECKED. Don't pad. Under 1,000 words.
```

## Cross-cutting variant: contracts

Replace "Your slice" and the file list with:

```
Your slice: the contracts between areas, as they stand at <sha>.
For each, find both sides by name across the whole tree and check they agree, in shape,
meaning and error answers:
- API schemas or route definitions, and every client of them (web, CLI, SDK, MCP, others);
- events and their schemas, and every consumer;
- settings and configuration keys, and every reader, with their documented bounds;
- the database schema, and the queries and repository code that use it;
- anything else the governance map lists as shared.
READ is the list of files you opened for this.
```

## Cross-cutting variant: system-wide claims

```
Your slice: documents that describe behaviour across areas: <README, onboarding guide,
architecture overview, runbooks, user docs, as governance.md lists>.
Check every concrete claim in them (commands, paths, settings, limits, flows, what happens when
X) against the code at <sha>. A claim that's false is a conformance finding; say which side
looks wrong. Runbook commands and setup steps that wouldn't work are at least medium: people
act on them.
READ is the list of documents and code files you opened for this.
```
