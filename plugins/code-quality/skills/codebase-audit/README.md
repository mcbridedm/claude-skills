# codebase-audit

Audits the whole codebase **as it stands at one commit** against its own documentation (designs, decision records, principles, conventions, API and user docs) and for defects. It answers "is the current code what the documents say, and is it right?", not "are the recent commits right?".

- **Invoke:** `/code-quality:codebase-audit [ref] [area …] [fix]`. No argument: the branch tip, every area.
- **Produces:** a report folder (`README.md` with the ranked findings, `governance.md` mapping code to documents, `coverage.md` with every file and whether it was read), a row in the audit index, and follow-ups.
- **Profile:** `.claude/codebase-audit.md` ([format](reference/profile-format.md), [example](reference/example-profile.md)). Without one, it discovers areas and documents and offers a starter profile.

## Why not commit-range-review?

`commit-range-review` reads **changes**: a commit range's diff, its merges and conflict resolutions. It's the right tool after a burst of commits. It never looks at code that didn't change in the range, and it judges changes, not the end state.

`codebase-audit` reads **every file** at one commit, next to the documents that govern it. It finds what a diff review can't: a design document's promise the code never kept, a rule broken in code nobody touched lately, documents describing features that no longer exist, areas with no design at all. Run one or the other on the same code, not both back to back.

## What it does

1. **Context check** (Step C): this is the heaviest skill here, so it insists on a fresh conversation unless the current one is short and fresh.
2. **Pins one commit** and inventories every tracked file (minus generated and vendored ones), with line counts.
3. **Maps code to documents:** each area gets the design documents, decision records (with their later dated notes), API docs and user docs that govern it, plus the project-wide rules. Areas without a document, and documents about things that don't exist, are recorded as governance gaps.
4. **Slices and plans waves:** slices small enough to read in full with their documents; waves of parallel read-only auditors, never bigger slices to save agents. Two cross-cutting auditors: contracts between areas (APIs and clients, events and consumers, settings and readers, schema and queries), and system-wide documents (README, onboarding, runbooks).
5. **Audits:** each auditor checks every concrete claim in its documents against the code, the project's rules, correctness, security, tests and dead code, and lists every file it read.
6. **Verifies every finding** at the pinned commit, and for each code-versus-document disagreement decides which side is wrong: **code wrong** (a defect), **document wrong** (for the docs sync), or **maintainer decides** (both plausible, nothing recorded settles it).
7. **Proves coverage:** files not read get an extra wave; anything still unread is listed as not audited. A file is never counted as audited because its slice was.
8. **Runs the checks**, writes the report (with "since the last audit": which earlier findings are resolved), the index row and the follow-ups, and commits if the profile says so.
9. **Fixes, if asked:** code findings only, one commit each with a test. Document fixes go to `docs-sync`; maintainer decisions to the maintainer.

## Cost and when to run it

Expensive: about one auditor per 4,000 lines of code, in waves of 12, plus two cross-cutting auditors; a 200,000-line codebase is roughly 50 auditors in five waves. Run it before a launch or a major release, after a long stretch of fast change, or when the designs and the code are suspected to have drifted apart. The usual order: this audit, then its fixes, then `/docs:docs-sync` for the "document wrong" findings.

`disable-model-invocation: true`: it runs only when typed.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. It weighs context load most, then authorship and anchoring: a conversation that wrote the code or called it finished should hand off. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

```
Codebase audit, ledgerly @ 4f2c9a1 (2026-03-14): 214 files, 61,240 lines; 12 skipped (generated).
Coverage: 214 of 214 files read (100%); 9 areas, 18 slices, 2 waves, 2 cross-cutting.

Verdict: the API keeps its design documents with three exceptions, one serious: refunds
can exceed the original charge, which docs/specs/billing.md says is impossible.

| id | sev | kind | | where | what |
|---|---|---|---|---|---|
| 2026-03-14-01 | high | code wrong | CONFIRMED | services/billing/refund.go:212; billing.md:48 | partial refunds aren't summed before the limit check |
| 2026-03-14-02 | medium | rule broken | CONFIRMED | services/exports/handler.go:31 | handler skips `authz.Require` (docs/engineering-rules.md, Permissions) |
| 2026-03-14-03 | medium | document wrong | CONFIRMED | docs/runbook/restore.md:22 | `make restore LATEST=1` was renamed to `make restore-latest` |
| 2026-03-14-04 | low | governance gap | CONFIRMED | services/webhooks | no spec |

Maintainer decides: invoices.md says drafts expire after 30 days; the code keeps them (an ADR
note says "revisit"). Docs sync: 1 finding. Checks: lint and test pass.
```
