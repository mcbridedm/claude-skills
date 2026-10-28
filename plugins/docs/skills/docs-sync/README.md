# docs-sync

"Update everything." Brings a project's documentation and other non-code artifacts back in line with what the code and the project state actually are: such as roadmap and status files, design docs, ADR notes, guides, runbooks and generated docs, plus a service catalog, settings comments or legal drafts where a project keeps them. It scopes to what changed since the last sync, audits in parallel, validates every finding before editing, fixes, runs the checks, and leaves a marker for next time.

- **Invoke:** `/docs:docs-sync [scope] [audit-only]` when installed from the plugin marketplace, or `/docs-sync` when the skill folder is copied or symlinked into a skills folder. It runs only when you type it.
- **Scope:**
  - blank: since the last sync (the profile's marker, e.g. `docs/.last-docs-sync`);
  - `<ref>..<ref>`, `since <ref>`, `since yesterday` or `since 2026-03-02`;
  - `all`: a full audit of every group, for a first run.

  Add `audit-only` to get the validated findings without any edits.
- **Produces:** corrected docs, dated notes in ledgers, regenerated files, the marker, one commit (by default), and a short report in chat.
- **Side effects:** edits only the files in the profile's document groups, the marker, and (with your OK) the profile. Asks before editing protected paths. Never edits external systems, never fixes code, never archives or splits files on its own. Commits by default; never pushes unless the profile says so.

## What it does

1. **Profile:** loads `.claude/docs-sync.md` and the project's agent instructions; without a profile, discovers the docs and offers a starter.
2. **Scope:** resolves the range; asks when there's no marker; recommends committing code first.
3. **Map:** classifies the changes (API, schema, settings, infra, alarms, legal-relevant data, ...), matches each group's triggers, and greps the docs for claims about the changed areas: renamed paths, removed settings, changed numbers, grown lists.
4. **Audit:** one read-only agent per triggered group, in parallel: the plugin's `docs:reviewer` agent, Read, Grep and Glob only, no shell, editing or web, so read-only is enforced by its tool list. It reads a diff the lead saved. Each reports file:line, the wrong text, the evidence, and the corrected text. External systems are checked read-only by the lead.
5. **Validate:** the lead checks every finding against the code, counts (never personal data) and quick checks, and marks it confirmed, partly true, not real or unverified. Only confirmed and partly true findings are fixed.
6. **Fix:** always by the lead. On large runs, read-only fix drafters (one per group, never two on a file) may return exact replacements first; the lead checks and applies them. Ledgers get dated notes, generated files are regenerated, protected paths wait for your OK.
7. **Verify:** runs the project's checks; separates its own failures from pre-existing ones.
8. **Size watch and profile upkeep:** flags docs that are too big or growing fast, with a suggestion to archive or split; proposes profile additions for docs no group covers.
9. **Report:** files changed per group, findings by verdict, what needs you, the new marker, the commit.

## Cost and when to run it

- **Cost:** 3 to 6 read-only auditors (fewer for a small range), plus fix drafters only on large runs; 10 to 30 minutes on a busy monorepo. A full `all` audit costs more. It isn't cheap enough to run on every commit, which is why Claude doesn't start it on its own.
- **Run it:**
  - after a working session, especially one with several agents, in a new session (the one that did the work shouldn't check its own docs);
  - before restarting or handing over to a new session, so it starts from true docs;
  - before an architecture or code review, so reviewers aren't misled.
- **Not for:** writing docs for a new feature from scratch, or reviewing code (use a code review).

### Why it runs only when typed

The repository's rule is `disable-model-invocation: true` for skills that spawn agents, commit or cost a lot. This one does all three: several agents, edits across many files, and a commit by default. You decide when the docs are synced.

## Profile

Project specifics live at `.claude/docs-sync.md`: the document groups (each with its kind, files and what each is the source of truth for, triggers, checks and rules), change kinds, protected paths, checks, the marker, size thresholds, archiving conventions, and whether to commit and push. Group kinds are `docs`, `ledger` (append-only), `generated` (regenerated, never hand-edited) and `external` (checked only). See [reference/profile-format.md](reference/profile-format.md) and the fictional [example](reference/example-profile.md). The brief auditors get is in [reference/auditor-brief.md](reference/auditor-brief.md).

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. A fresh session matters most when this conversation made the changes being synced: it would see each document as already updated, because it remembers updating it. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample report (fictional)

> **Scope:** `a41c09e..f7d2210` on main, 23 commits, 2026-03-04 to 2026-03-06.
>
> **Files changed:**
> - Project state: `ROADMAP.md` (ticked 3 items with commits; "Next" lost two items that shipped).
> - Design: `docs/specs/bookings.md` (cancellation window is 48 h, not 24 h; new `waitlist` route; "Last verified" updated), `docs/specs/README.md` (row for the new `payments` spec).
> - Decisions: `docs/adr/0012-payments-provider.md` (dated note: refunds now go through the provider's API).
> - Operations: `docs/runbook/alerts.md` (section for the new `waitlist-backlog` alert).
> - API reference: regenerated `api/openapi.json` and `web/src/api/types.ts`.
>
> **Findings:** 14 confirmed, 2 partly true, 3 not real, 1 unverified.
> - Not real: "README install steps are wrong" (they work: ran `make setup --dry-run`); "privacy policy misses booking notes" (it covers them under "Messages"); "runbook 4 names a removed script" (renamed, and the runbook already uses the new name).
> - Unverified: the alerting tool routes `waitlist-backlog` nowhere; I couldn't read it without a token.
>
> **Needs you:**
> - `deploy/README.md` says the database is 14 GB; `deploy/db.tf` now sets 20 GB. Fix the README? I'd say yes, it's a plain fact. (`deploy/**` needs your OK.)
> - Route the `waitlist-backlog` alert to the on-call schedule in the alerting tool.
> - The privacy draft gains "waitlist email address, kept 30 days": worth a look from counsel.
>
> **Size watch:** `ROADMAP.md` is 52 KB (+11 KB): move finished items to `docs/roadmap/done-2026.md`?
> **Profile:** `docs/pricing.md` holds plan limits and no group covers it; add it to "Project state"?
> **Checks:** lint and 412 tests pass.
> **Marker:** `docs/.last-docs-sync` now `f7d2210`; committed as `9b3e1c4`, not pushed.
