# writing-audit

Audits what a project has written against its own writing standard: its UI copy, its docs and guides, and what its bots or agents publish. Every claim about the product is checked against the code. It lists each failure with its file and line, the test it fails and the evidence, in a report with ids. It never fixes anything.

- **Invoke:** `/docs:writing-audit [surface …]` when installed from the plugin marketplace, or `/writing-audit` when the skill folder is copied or symlinked into a skills folder. Blank audits every surface in the profile. It runs only when you type it.
- **Produces:** a report at `<reports_dir>/<date>/README.md` (default `docs/reviews/writing/`), a row in that folder's index, optionally one tracker entry pointing at it, one commit (by default, with a profile), and a short summary in chat.
- **Side effects:** writes only the report, the index and the tracker entry. Reads live content with the profile's read-only fetch commands, into a scratch folder it deletes afterwards. Never edits copy, never posts, votes, replies or flags, never fixes code. Commits with the profile's `commit_command` (default `git commit`); never pushes unless the profile says so.

## The standard

The profile names the project's standard (a style guide, a content policy's quality bar, a "no fluff" rule) and the skill uses its tests. Without one, it uses four tests that work for people's and agents' writing alike:

1. **Specific:** the tool, the version, the number, the error. "For a while" where the value is a setting fails.
2. **Says what was tried:** an error says what happened and what to do next; an instruction gives the step.
3. **Claims checked or labelled:** what the copy says the product does is what the code does; a guess is labelled.
4. **Adds something new:** no restating, no filler, nothing that could sit under anything.

## What it does

1. **Profile:** loads `.claude/writing-audit.md`, the standard, and the project's agent instructions; without a profile, discovers the standard, the files surfaces and the sources of truth, asks about live ones, and offers a starter.
2. **Gather:** lists each files surface, fetches each live one read-only into plain text with stable references, and plans the reviewers.
3. **Review:** read-only reviewers in parallel, the plugin's `docs:reviewer` agent (Read, Grep, Glob only), each with its scope and the sources of truth to check claims against ([reference/reviewer-brief.md](reference/reviewer-brief.md)). The lead reads small live surfaces itself.
4. **Merge:** one finding per defect, with every location; one test per finding.
5. **Verify:** the lead checks every claims finding that isn't borderline and every one it calls worst, plus two others per reviewer; marks each verified, plausible or not real.
6. **Causes:** names the cause behind repeated failures and where the fix belongs: a setting rendered instead of typed, a bot's prompt or quality gate, a review checklist line, an agent's self-check.
7. **Report:** the report and index row ([reference/report-format.md](reference/report-format.md)), an optional tracker entry, the commit, and a summary with the worst findings and the fix groups to pick from.

## Cost and when to run it

- **Cost:** about one reviewer per 75 UI files or 1,500 lines of prose, at most `max_reviewers` (default 6); typically 3 to 5 agents and 10 to 20 minutes. Live content adds its fetch time.
- **Run it:**
  - before a launch, or before opening to more users;
  - after a big change to what users read (a redesign, a new guide, a bot's new prompt);
  - when readers report that the copy and the product disagree.
- **Not for:** code bugs (a code review), docs made stale by a change (`docs-sync`), or rewriting copy (the fixes are a separate change).
- **Keeping it from coming back:** the report's causes section says where each fix belongs. Checks at the source (the standard's tests in the review checklist, a test that refuses vague durations, a bot's prompt and gate, an agent's self-check before posting) do more than rerunning the audit; rerun it when those are in, to see whether they work.

### Why it runs only when typed

It spawns several agents, reads a lot, and commits by default (`disable-model-invocation: true`, as the repository's rules ask).

## Profile

Project specifics live at `.claude/writing-audit.md`: the standard and its tests, the surfaces (each `files` or `live`, its audience, globs or a read-only fetch command, what to skip, where a bot's text comes from), the sources of truth for claims, where reports and ids go, the tracker, and how commits are made. See [reference/profile-format.md](reference/profile-format.md) and the fictional [example](reference/example-profile.md).

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository). A fresh session matters most when this conversation wrote the copy, the docs or a bot's prompt being audited: it reads them as meant, not as written. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session. You can tell it to run anyway; the report then notes why it was flagged.

## Sample summary (fictional)

> **Scope:** commit `a41c09e`; the changelog bot's posts fetched 2026-03-04 09:10 UTC (48 posts). Web copy (212 files), the user guide (31 pages), guide plans. Not covered: the legal pages (counsel's drafts).
>
> **The worst (verified):**
> - `wa-2026-03-04-01`: `web/src/routes/plans/+page.svelte:41` and 2 more say "refunded in full"; refunds are pro-rated (`api/src/billing/refund.ts:57`).
> - `wa-2026-03-04-02`: `docs/guide/export.md:18` gives `bookly export --all`; the CLI has no `--all` (`cli/src/commands/export.ts:22`), so the command fails.
> - `wa-2026-03-04-03`: the changelog bot's post `p-8812` says "dark mode is coming soon"; it shipped in 2.4 (`CHANGELOG.md:40`).
>
> **Counts:** 31 findings, 9 borderline. Specific 12, says what was tried 4, claims 11, adds something new 4. Web 17, guide 9, bot 5.
>
> **Causes:**
> - 10 durations typed as words that exist in `api/config/defaults.yaml`: render the settings, and add a test that refuses "a while" in `web/src`. Recommended.
> - The bot's prompt doesn't require version numbers; its gate passes any post over 200 characters. Fix the prompt and the gate together.
> - 4 false claims drifted from the code: add "claims match the code" to the review checklist.
>
> **Didn't hold:** "the free plan limit is wrong" (it's 3, as the page says).
>
> **Report:** `docs/reviews/writing/2026-03-04/README.md`; committed as `9b3e1c4`, not pushed. **Next:** the fixes, as a separate change; then a docs sync.
