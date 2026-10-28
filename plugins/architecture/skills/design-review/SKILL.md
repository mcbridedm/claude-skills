---
name: design-review
description: Lightweight review of one design before it's built. Takes a draft ADR, a design doc or a description (and writes the draft ADR first if there is none), picks the 3 to 5 most relevant personas from the project's architecture-review panel by what the design touches (data model, money, auth, abuse, UI, infrastructure), runs them read-only in parallel, merges their verdicts, risks and changes, revises the draft, and records a "Design review" section in the ADR with what was adopted, rejected and still open. Never builds. Use when planning a significant change, before writing code, or when the user asks for a design review, a second opinion on a design or ADR, or "have the panel look at this". Not for reviewing code already written (use a code review) or the whole architecture (architecture-review). Reads .claude/design-review.md; without one, discovers the ADR folder and panel and offers a starter profile.
argument-hint: "[ADR path, design doc path, or a short description]"
---

# Design review

You are the lead architect of the project in the current repository. A design is about to be built. You have a few specialists from the project's architecture-review panel judge it **before any code is written**, then decide what to change, revise the design, and record the review in its decision record.

**Never build in this skill.** No code, migrations, infrastructure or configuration changes. The outputs are the revised design draft (an ADR) with its "Design review" section, and a short report to the maintainer. Building starts only after the review is folded into the design **and** the maintainer has answered its open questions. Say so in the report.

It's cheap compared with a full architecture review: 3 to 5 read-only sub-agents, a few minutes. When you invoke it on your own (planning a significant change), say in one line which design you're reviewing and with whom, then go ahead.

Project specifics come from the project's **profile** (Step P): the panel, the ADR folder and its conventions, the map from design areas to personas, the project's stage, and whether to commit. This file stays general. This skill's own files are shared by many projects: never edit them during a review.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings, the default area map, and defaults.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starting point for a starter profile.
- `${CLAUDE_SKILL_DIR}/reference/design-review-section.md`: the section written into the ADR (Step 5).

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) is expected, not a reason to move.** This skill runs while a design is being written, and the author folds in what's adopted. The reviewers start fresh; keep them that way (signal 4): brief them with the design document only, never your arguments for it. Validate concerns against the code and data, not against your memory of why you chose something.
- **Context load (3):** if the conversation has been compacted, the reasons behind the design may be gone. Write them into the design document first; if it still can't be judged from that document, recommend a fresh session that starts from it.
- **Moving target (5):** the design should be stable while it's reviewed.

## Step P: Load the profile

1. Read `.claude/design-review.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md` for what it may hold.
2. **No profile:** discover defaults, without sub-agents, noting where each came from:
   - **ADR folder:** `docs/adr/`, `docs/decisions/`, `adr/`, `architecture/decisions/`, `doc/adr/`. Read its index (a `README.md` there, or the docs index) and the two most recent records, for the naming, numbering, status line and section headings.
   - **Panel:** the architecture-review profile (`.claude/architecture-review.md`, its "Panel" section) applied to that skill's default roster, or a project skill at `.claude/skills/architecture-review/SKILL.md` with a persona table. Failing both, the default roster in the architecture-review skill's `reference/personas.md`; failing that, the area map's persona names with one-line lenses you write from them.
   - **Stage and principles:** README, CLAUDE.md or AGENTS.md, a principles or conventions file, a roadmap. Pre-launch if nothing suggests real users.
   - **Area map:** the default in `reference/profile-format.md`.

   Tell the user in a few lines what you found, and **offer to write a starter profile** at `.claude/design-review.md` (shaped like `reference/example-profile.md`, `TODO` where you guessed). Write it only if they agree. Either way, run with the discovered values.

## Step 1: Get the design

The design is `$ARGUMENTS` if given, otherwise what the conversation is planning.

- **A draft ADR path:** read it in full. That's the draft.
- **Another design doc** (a spec, an RFC, an issue): read it. Ask whether to review it in place or turn it into a draft ADR first; recommend the ADR when the project keeps ADRs and the design is a decision someone will later ask "why" about.
- **A description in the conversation, no draft:** write the draft ADR first, in the profile's `adr_dir`, following its "ADR conventions": the next number, the naming, the status line (e.g. "Proposed, design review pending"), and the project's sections (default: Context, Decision, Alternatives, Consequences). Keep it as short as the design allows. Don't add it to the ADR index unless the conventions say proposed records get a row.
- **Nothing to go on:** ask for the design in one question: what's changing, why now, and the shape of the solution.

Then, before dispatching:
- Read the code and docs the design touches, enough to point reviewers at them (Step 3) and to check their claims later. Don't review it yet.
- Note `git status --porcelain` and `git rev-parse --short HEAD`: Step 4 compares against them.
- If the draft is unclear on what it decides, tighten that first. Reviewers can't judge a design that doesn't say what it is.

## Step 2: Pick the reviewers

1. **Build the panel:** from the profile's `panel_source` (a persona table in a skill file, an architecture-review profile, or the profile's own "Panel" section), with the profile's lens additions applied.
2. **Match the design to areas** in the profile's "Area map" (or the default): an area matches when the design changes what it covers, by its signals (words, paths, modules) or by your reading of the design. Collect the personas each matched area names.
3. **Choose `reviewers_min` to `reviewers_max`** (default 3 to 5):
   - rank personas by how many matched areas name them, then by how central the area is to the design (the area the design is mostly about first);
   - always include a persona whose area carries the design's worst failure (money lost, data lost or leaked, accounts taken over, abuse at scale);
   - with fewer matches than the minimum, add the profile's `fallback` personas (default: the solution architect, then the domain architect, then QA);
   - never more than the maximum; drop the persona whose concerns overlap most with another pick.
4. **Name the picks** to the user, one line each: the persona and why ("Data: adds two tables and a backfill"). Mention a close call you left out. If the user named reviewers, use theirs.

## Step 3: Dispatch the reviewers

Send one Agent call per reviewer **in a single message** so they run concurrently. Use `subagent_type: "architecture:reviewer"`, this plugin's reviewer agent: its only tools are Read, Grep, Glob, WebFetch and WebSearch, so it can read, search and research but has no shell and can't edit, write or run anything. Anything that needs a command is yours, in Step 4b. (If that agent isn't available, e.g. the skill was copied without its plugin, use the most read-only agent type there is, such as `Plan`, and rely on the brief and Step 4's check.)

Each gets this brief with its persona filled in. Replace the `<...>` placeholders; drop a bracketed line whose condition doesn't hold. Reviewers don't share your conversation, so the design goes **inline**: it's short, and it may not be saved yet.

```
You are the <PERSONA> on a design review for <PROJECT>, <PRODUCT ONE-LINER>.
The repository is at <absolute repo path>.

Your lens: <LENS>
Why you were picked: <ONE LINE FROM STEP 2>

The design under review (<path, or "not yet saved">):
---
<DESIGN TEXT, in full>
---

Relevant code and docs, to read before judging:
<POINTERS: files, modules, ADRs, docs this design touches or depends on, from Step 1 and the
area map's "Read" lines, each with a few words on why>

Judge the design, not the code as it stands. The code tells you what the design must fit
with and what already exists; a gap in today's code is a finding only if this design depends
on it or makes it worse. Cite file paths (with line numbers where useful). You have no shell
and no editing tools: read and search instead of running commands, and return your review in
your reply rather than saving it. If a risk can only be settled by running something (a test,
a query plan, a count), say what to run in its evidence; the lead runs it.

Be proportionate. <STAGE: the profile's `stage`, e.g. "pre-launch, small team">. Judge against
<PROJECT>'s principles<, from PRINCIPLES FILE>: <PRINCIPLES>. A change you ask for that adds
infrastructure, abstraction or process must say what problem it solves now, or at which
scale or milestone it starts to pay off. Severity means real harm in a scenario you can
describe, not in theory.

The project's standing decisions are recorded in <DECIDED SOURCES>. You may point out a risk
they carry; don't recommend reversing one unless the risk has critically escalated, and then
mark it ESCALATED.

You may do light research before you settle a change: web search and fetch, and the
repository's dependencies (installed packages, lockfiles, versions). Check framework
specifics against the versions in use, not memory; check advisories for a dependency behind a
risk you raise; confirm a practice you cite is still current. At most about three outside
lookups, official docs first. Never send repository code, secrets or personal data to an
outside service. Cite what you used.

Return exactly this shape, under about 600 words, no preamble:

## <PERSONA>
**Verdict:** ship / ship with changes / rethink, and one sentence why.
**Risks:** at most 4, worst first. Each: the scenario (what breaks or who gets hurt, when),
severity (critical, high, medium, low), and evidence (file paths, the design's own words, or
a source).
**Changes to the design:** at most 5. Each: the change, why, and effort (S, M, L). Say which
risk it answers.
**Questions for the maintainer:** only real decisions the design can't settle by itself (scope,
money, policy, what users see), each with the option you'd pick and why. None is fine.
**Sources:** links you relied on, one line each.
```

If a reviewer fails or returns something off-format, re-run that one once. If it fails again, say so in the report and continue with the rest; never write its review yourself.

## Step 4: Collect and merge

1. **Check nothing changed:** compare `git status --porcelain` with Step 1 (a backstop: the reviewer agent can't write, but a fallback agent type can). If a reviewer created or changed a file, revert only that, and say so.
2. **Merge:** deduplicate risks and changes across reviewers (one entry, with every reviewer who raised it). Keep each reviewer's verdict.
3. **Disagreements:** where reviewers conflict (one wants a queue, another says YAGNI; one says ship, another says rethink), note both positions and the reason behind each. You decide in Step 5.

## Step 4b: Validate every concern

Reviewers read; you can also run things. A reviewer can be confidently wrong, about the code, the data or what a branch already does. **Before a concern changes the design or becomes a question for the maintainer, validate it yourself:**
- read the cited lines (and the lines around them; check the claim, not just the citation);
- check the data where it decides the matter, with **counts and shapes only, never personal data** (e.g. "how many waitlist rows exist", not the rows);
- run a quick test, a query plan (`EXPLAIN`), or the relevant check, in a throwaway environment, never against production;
- if a build of this design is already in progress (a branch), check the branch too: it may already handle the concern, or have the bug.

Mark each merged concern **confirmed**, **partly true** (say which part), **not real** (with the evidence) or **unverified** (say why it couldn't be checked, and treat it as a risk to state, not a fact). Only confirmed and partly true concerns drive changes; unverified ones can become an open question only if they matter enough. Keep the evidence (file:line, the query and its count, the test) for the ADR record and the report.

## Step 5: Decide and revise

As the lead, decide each validated change: **adopt**, **adapt** (adopt a smaller or different version, and say how), or **reject** with the reason (over-built for the stage, conflicts with a principle or a recorded decision, the risk is already covered and where, not worth the effort). Resolve each disagreement explicitly. Questions the design can't settle become **open questions** for the maintainer, with your recommendation.

Then:
1. **Revise the draft** so it says what will now be built: fold adopted changes into the Decision, add rejected options to Alternatives where they're real alternatives, and add to Consequences what the review surfaced. Keep the status as proposed while open questions remain.
2. **Record the review** in the ADR: a section named by the profile's `review_section` (default "Design review"), shaped as in `reference/design-review-section.md`: date, commit, reviewers and why each, each one's verdict and what they raised, what was adopted and adapted, what was rejected and why, disagreements and how they were settled, and the open questions. If the profile's ADR conventions keep long records in a separate history file, put the full section there and a short summary with a link in the ADR.
3. If the overall verdict is **rethink**, don't patch the draft into a different design on your own. Record the review, and put the rethink to the maintainer as the first open question, with what you'd do instead.

## Step 6: Report to the maintainer

Reply in chat, short:
- **The design** (path) and the reviewers, one line.
- **What the validation found:** a short table of the concerns, each confirmed, partly true, not real or unverified, with the evidence in a few words. Say plainly which ones didn't hold.
- **What changed in the design** because of the review, a few bullets. Fixes that are plainly right (correctness, security, the project's own rules) are adopted without asking; say so.
- **Rejected,** one line each, only where the maintainer might disagree.
- **Decisions for the maintainer:** only the real ones, each with your recommendation and one line of why. If the profile sets `ask_one_at_a_time: true`, ask only the first and wait; ask the next after the answer, and fold each answer into the ADR as it comes.
- **Next:** "Building starts once these are answered and the ADR is accepted." If there are no open questions, say the design is ready for the maintainer's acceptance, not that it's accepted.

When the maintainer answers, update the ADR's open questions with the answer and the date, and change the status only as the project's conventions say (e.g. "Accepted by the maintainer, date").

## Hand off

- **Commit:** only if the profile sets `commit: true`. Then commit just the ADR (and its history file or index row, if this run touched them) in one commit with the profile's `commit_message` (default `Design review: <ADR title>`), ending with the repo's usual attribution line. Stage only those files. Default: don't commit; leave the files for the user or the session that integrates the work.
- **Push:** only if the profile sets `push: true`. Default: never.
- **Building** is outside this skill, always. If a build of this design was already started before the review (it shouldn't be), ask it to pause and commit its work in progress, and brief it with the reviewed design only after the maintainer's open questions are answered.
