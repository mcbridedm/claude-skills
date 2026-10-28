---
name: user-panel-review
description: Outside-in review of the current project by a panel of simulated users - a newcomer, a regular and a bad actor trying to abuse it, plus, when the product has an API, CLI, SDK or MCP server, people who run agents and AI agents using it on their own. Each persona sees only what a real user would see (the running app, public docs, the CLI, API or MCP server), never the source code, walks real journeys and reports where they got stuck or what they got away with. The lead then checks every finding against the code. The counterpart of architecture-review, which reads the code from the inside. Personas, journeys and how to run the app come from a profile in the reviewed repo (.claude/user-panel-review.md); without one, the skill discovers defaults and offers to write a starter profile. Use when the user asks for a user panel, a usability or onboarding review, an outside-in or red-team review, or how the product feels to new users or agents.
argument-hint: "[optional focus, e.g. 'onboarding' or 'agents' or 'abuse']"
disable-model-invocation: true
---

# User panel review

You lead a panel of simulated users of the project in the current repository. Each panelist uses the product the way one kind of real user would, from the outside, and reports what happened. Then you check what they found against the code and decide what to act on.

**Outside-in is the point.** Panelists get only what a real user of their kind gets: the running app, public documents, the CLI, API, SDK or MCP server as published, and error messages. They never read the source, the decision records or internal docs. A problem they hit is a real user's problem even when the code "handles it". An attack that works for them works for anyone.

Project specifics come from the project's **profile** (Step P): what the product is, how to run it, the personas, the journeys, what each persona may see, where reports go and where action items go. This file stays general.

This review spawns one sub-agent per persona (three by default, six with the agent personas) and needs the app running, so it costs time and tokens. Run it only when the user asks. If the user gave a focus (`$ARGUMENTS`), every panelist weights it.

**This is a review, not a change.** Panelists may create accounts and content **only on the local or throwaway instance the profile names**, never on a shared, staging or production one, and never on a third-party service. Don't edit code. The outputs are the review artifacts (Step 5) and action items (Step 6). This skill's own files are shared by many projects: never edit them during a review.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's sections and defaults.
- `${CLAUDE_SKILL_DIR}/reference/personas.md`: the default roster, and how to write a persona.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starting point for a starter profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) weighs heavily** for the steps done here: verifying findings against the code, deciding and writing the review. If this conversation built the features the panel will use, recommend a fresh session. The panelists start fresh either way.
- **Context load (3):** every panelist's report comes back here.
- **Moving target (5):** the app under test must not change during the run. Wait for deploys, merges and agents in flight.

## Step P: Load the profile

1. Read `.claude/user-panel-review.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md` for what it may hold.
2. **No profile:** discover defaults from the repository, without sub-agents, noting where each came from:
   - **Product and users:** README, CLAUDE.md or AGENTS.md, any onboarding, docs or help pages. Who uses it: people, developers, other programs or AI agents?
   - **How to run it locally:** README commands, `package.json` scripts, `Makefile`, `docker-compose.yml`, `Procfile`. A throwaway database or seed command if there is one.
   - **Surfaces:** a web app, an API (an OpenAPI file), a CLI, an SDK, an MCP server, discovery files (e.g. `/llms.txt`, `/.well-known/*`).
   - **Personas:** the three people personas in `reference/personas.md` (newcomer, regular, bad actor). Add the three agent personas only if you found an agent-facing surface: a public API or OpenAPI file, a CLI, an SDK, an MCP server, or discovery files.
   - **Bad-actor hats:** by the kind of product, from the table in `reference/personas.md` (community, commerce, SaaS or API); the prompt injector too when the agent personas are on.
   - **Journeys:** sign-up, first use, the core loop, settings, recovery, leaving; for agents, discovery, auth, the core API calls, errors and limits.
   - **Where reports go:** `docs/reviews/users/` if `docs/reviews/` exists; otherwise `reviews/users/`.

   Tell the user what you found and **offer to write a starter profile**. Write it only if they agree. Either way, record the values used in the run's README under "Profile used".

## Step 0: Start the app and check the panel's view

1. Note `git status --porcelain` and `git rev-parse --short HEAD`.
2. Start the app with the profile's run commands, on the throwaway instance it names. Wait until it answers. If it won't start, stop and tell the user: a panel without the app is a doc review, not this.
3. Check each surface a persona needs answers (the web URL, the API, the CLI built, the MCP server starting). Note any that don't, and drop or adjust the personas that depend on them.
4. Gather each persona's **allowed view**: the URLs, public files and commands the profile allows it, plus what's public by nature (pages, discovery files, `--help` output). Copy public documents into the run folder (`<RUN_DIR>/public/`) so panelists read exactly what users read.
5. Read the previous user-panel reviews if there are any: their open findings are what this run re-tests first.

## Step 1: Brief and run the panel

Send all panelist Agent calls **in a single message** so they run concurrently. Use a general-purpose sub-agent: panelists need a shell to use the CLI and the API, and a browser tool if one is available. Each gets this brief with its persona filled in; replace the `<...>` placeholders. Panelists don't share your conversation.

```
You are <PERSONA NAME>: <PERSONA DESCRIPTION, from the profile>.
You're using <PRODUCT>, described to you only as its public pages describe it.

You see only what a real user like you sees:
- <ALLOWED VIEW: URLs, public files in <RUN_DIR>/public/, commands you may run>
You must not read the project's source code, decision records, tests or internal docs, even
though they're on this machine. If you catch yourself needing them, that's a finding: write
down what you needed and why.

Use only this instance: <INSTANCE URL / COMMANDS>. Never a shared, staging or production one,
and never any outside service. Create whatever accounts and content your journeys need, here only.
Don't change files in the repository.

Your journeys (do them for real, in order, as this persona would):
<JOURNEYS for this persona, from the profile>
<FOCUS, if any>
<OPEN FINDINGS from the last review that touch your journeys: re-test them>

For each journey, write down as you go:
- what you tried, what you expected and what happened (exact messages, status codes, URLs);
- where you got stuck, confused, or had to guess, and how long it took;
- what you'd have needed to know, and where you looked for it.
<IF ADVERSARIAL: For each attack, give concrete steps, the result, and what a defender would
see. Try to beat the limits and rules you can see from the outside. Stop at proving it works:
no mass content, nothing aimed at anyone outside this instance.>

Report in this shape, under 1,500 words:
## <PERSONA NAME>
### Verdict (2-3 sentences: could you do what you came for?)
### Journeys (one short paragraph each: done / done with trouble / failed)
### Findings (each: severity high/medium/low, journey, what happened, the evidence, what
would have helped; at most 10, worst first)
### What worked well (up to 5)
```

If a panelist fails or returns something off-format, re-run that one once. If it fails again, note the gap rather than writing its section yourself.

## Step 2: Collect

Save every report verbatim, in panel order, to `<RUN_DIR>/panel.md`, with a header giving the date, the commit, the focus, and any persona that failed or was dropped. Then compare `git status --porcelain` with Step 0: revert only files a panelist created or changed in the repository, and say so in the header. Stop the app if you started it.

## Step 3: Verify against the code

Now you may read the code. Panelists report symptoms; you find causes.

- **Verify each finding.** Reproduce it, or find the code path that explains it. Mark it CONFIRMED (reproduced or explained), PLAUSIBLE (consistent with the code, not reproduced), or drop it with the reason under **Corrected findings**.
- **For every attack that worked,** find why the defence didn't hold. For every attack that failed, note which defence stopped it: that's evidence the defence works.
- **Separate the layers:** a finding may be the product (a missing step), the words (a message that doesn't say what to do), or the docs (the answer exists but a user can't find it). Say which.
- **Group by journey**, not by persona. One confusing step that three personas hit is one finding with three witnesses.
- **Respect decided things:** if a finding only disagrees with a recorded decision (the profile's "Decided sources"), note it as feedback on that decision, not a defect.

## Step 4: Decide

As the lead: which findings to act on now, which to track, which to leave. Rank by what blocks users or lets abuse through first, then by how many personas hit it. For each adopted finding, a concrete change (wording, a step, a check), its size, and who it's for.

## Step 5: Write the review

In `<RUN_DIR>` (the profile's report folder, `YYYY-MM-DD[-focus]/`):
- `panel.md`: the reports (Step 2).
- `README.md`:
  - **Summary:** the run in five lines: who could do what they came for, the worst findings, what changed since the last run.
  - **Profile used** (or "the profile at `<commit>`").
  - **By journey:** each journey with its findings (CONFIRMED / PLAUSIBLE, severity, witnesses, layer, the fix).
  - **Abuse:** each attack tried, whether it worked, and the defence that held or didn't.
  - **Corrected findings.**
  - **Since the last review:** open findings re-tested, now fixed or still open.
  - **Proposed changes to the skill or profile**, if any (Step 0 or the run showed a gap).
- Add a row to the reviews index (the profile's index file, default `<report folder>/README.md`).

## Step 6: Action items

Add each adopted finding where the profile's "Action items" says (default: only the review's README), with an id in the profile's format (default `UP-YYYY-MM-DD-NN`). Launch-blocking ones go where the profile keeps launch blockers.

## Hand off

Commit the review folder and action items only if the profile's `commit` setting is on (default: off; leave them for the user). Reply in chat with the summary, the top findings, any attack that worked, and the review's path. Never push unless the profile says to.
