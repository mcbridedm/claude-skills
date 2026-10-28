# design-review

A lightweight review of one design before it's built. The lead picks the 3 to 5 personas from the project's architecture-review panel that matter most for what the design touches, runs them read-only in parallel, merges what they say, revises the design, and records the review in its decision record (ADR). It never builds.

- **Invoke:** `/architecture:design-review [ADR path | design doc path | description]` when installed from the plugin marketplace, or `/design-review` when the skill folder is copied or symlinked into a skills folder. Claude may also start it on its own when it plans a significant change (see below).
- **Produces:** a draft or revised ADR with a "Design review" section (date, reviewers and why, each verdict and what they raised, what was adopted, adapted or rejected and why, disagreements, open questions), and a short report in chat with the decisions the maintainer needs to make, each with a recommendation.
- **Side effects:** writes or edits the one ADR (and its history file or index row if the project's conventions say so). Commits only if the profile sets `commit: true`; never pushes unless the profile says so. Never changes code, migrations or infrastructure.

## What it does

1. **Step P, profile:** loads `.claude/design-review.md`, or discovers the ADR folder, its conventions and the architecture-review panel.
2. **Step 1, the design:** reads the draft ADR or design doc; with only a description, writes a draft ADR first in the project's format; with nothing, asks.
3. **Step 2, picks:** matches the design to areas (data model, money, sign-in, abuse surface, UI, infrastructure, ...) in the profile's area map, and picks 3 to 5 personas, one line each on why.
4. **Step 3, reviewers:** one read-only agent per pick, in parallel, with a fixed brief: persona and lens, the design inline, pointers to the relevant code and docs, "judge the design, not the code as it stands", the project's stage for proportionality, light research limits, and a fixed return shape (verdict ship / ship with changes / rethink; risks with scenario, severity and evidence; changes with why and effort; questions for the maintainer) in about 600 words.
5. **Step 4, merge:** checks the reviewers changed nothing, verifies the claims a decision rests on, deduplicates, and notes where reviewers disagree and why.
6. **Step 5, decide:** adopts, adapts or rejects each change, revises the draft, and writes the "Design review" section.
7. **Step 6, report:** what changed in the design, and only the real decisions, each with a recommendation (one at a time if the profile says so). Building starts only after these are answered.

## Cost and when to run it

- **Cheap:** 3 to 5 read-only sub-agents and a few minutes, against 13 agents and tens of minutes for [architecture-review](../architecture-review/README.md).
- **Run it:** before building anything significant or hard to reverse: a new data model, money, sign-in or access, a new abuse surface, a new service or vendor, a change to a public API.
- **Not for:** code already written (use a code review or [commit-range-review](../../../code-quality/skills/commit-range-review/README.md)), the whole system (architecture-review), or small changes a single reviewer would wave through.

### Why Claude may invoke it on its own

The repository's rule is to set `disable-model-invocation: true` for skills that spawn agents, commit, push or cost a lot. This one is left model-invocable on purpose: its value is being run at the moment Claude plans a significant change, before code exists, and it's cheap, read-only apart from one ADR, and doesn't commit by default. When Claude starts it on its own, it says which design it's reviewing and with whom before dispatching.

## Profile

Project specifics live at `.claude/design-review.md`: where the panel comes from (usually the project's architecture-review skill or profile), the ADR folder and conventions, the area-to-persona map, the stage, how many reviewers, whether to ask questions one at a time, and whether to commit. See [reference/profile-format.md](reference/profile-format.md) (with the default area map) and the fictional [example](reference/example-profile.md). The section written into the ADR is described in [reference/design-review-section.md](reference/design-review-section.md). Without a profile, the skill discovers defaults and offers to write a starter.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. Running in the session that wrote the design is expected; it mainly checks the design document holds the reasoning (after a compaction it may not) and that reviewers are briefed from the document only. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

In chat:

> **Design:** `docs/decisions/0031-client-deposits.md`. **Reviewers:** Security (a new payment flow and webhook), Data (a deposits table and a backfill of open invoices), Product Strategy (clients see a new state on invoices). Left out: Cloud, nothing new is hosted.
>
> **What changed in the design:**
> - Deposits are keyed on the provider's payment id, so a retried webhook can't record one twice (Security, Data).
> - The backfill runs in batches from a job, not inside the migration (Data).
> - An invoice shows "deposit paid" rather than a reduced total, so clients aren't confused when the balance arrives (Product).
>
> **Rejected:** a separate deposits ledger service (Data). One table and the existing payments module are enough at 300 teams.
>
> **Decision for you (1 of 2):** refund deposits automatically when an invoice is voided, or leave it to the agency? I'd refund automatically: agencies forget, and the client paid us, not them.
>
> Building starts once both are answered and the ADR is accepted.
