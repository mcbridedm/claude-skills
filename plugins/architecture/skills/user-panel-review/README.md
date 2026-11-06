# user-panel-review

An outside-in review by simulated users. Three personas by default (a curious newcomer, a regular, and a bad actor whose hats fit the kind of product) each use the running product the way a real user of their kind would. They see only what that user sees: never the source code. They report where they got stuck and what they got away with. Then the lead checks every finding against the code and writes a review with findings grouped by journey.

When the product has a surface agents can use (a public API or OpenAPI file, a CLI, an SDK, an MCP server, or discovery files such as `/llms.txt`), three agent personas join: an agent builder, an autonomous AI agent at first contact, and a power agent.

When the app can't be run for the review (no simulator, emulator, device, browser or local instance, or the run is told not to use one), the panel runs as a **screenshot walk**: each persona walks the app's latest verification screenshots in journey order, as if using it, reading the app's words from the images and, where the project has them, its words files (string or localisation resources) and design docs. A step no screenshot shows is marked "not shown", never guessed, and the review lists those gaps. The bad actor lists the attacks the screens invite, marked not tried, and the lead checks them in the code. Findings are still verified against the code, and the review says up front that it ran from screenshots, from which set, and which journeys were fully shown, partly shown or not shown. See [reference/screenshot-walk.md](reference/screenshot-walk.md).

It's the counterpart of [architecture-review](../architecture-review/README.md): that one reads the code from the inside, this one uses the product from the outside.

- **Invoke:** `/architecture:user-panel-review [focus] [screenshots]` (focus examples: `onboarding`, `agents`, `abuse`). `screenshots` forces a screenshot walk; without it, the walk runs only when the app can't be run. The profile's `run_mode` (`auto`, `run`, `screenshots`) sets the default.
- **Produces:** `<report folder>/YYYY-MM-DD[-focus]/README.md` (summary, findings by journey, abuse attempts and what stopped them, corrected findings, re-tested findings from the last run) and `panel.md` (every persona's report, verbatim), plus a row in the reviews index and optional action items. A screenshot walk adds `walk.md` (each journey's steps and the image for each), a mode block at the top of the README and a "Not shown" section.
- **Cost:** one sub-agent per persona (three by default, six with the agent personas), run in parallel, plus the app running locally on a throwaway instance, or, for a screenshot walk, a recent set of verification screenshots (reading images costs tokens; panelists read one image per step and only the variants their persona needs). Expensive: run on demand, for example after large user-facing changes or before opening to more users.
- **Side effects:** panelists create accounts and content on the local throwaway instance only. Nothing is committed or pushed unless the profile says so.

## Profile

Project specifics live at `.claude/user-panel-review.md` in the reviewed repository: how to run a throwaway instance, the surfaces, where verification screenshots live and how they're named (`screenshot_folder`, `## Screenshot walk`), what each persona may see, the personas and journeys, and where reports and action items go. See [reference/profile-format.md](reference/profile-format.md) and the fictional [example](reference/example-profile.md). The default roster and how to write a persona are in [reference/personas.md](reference/personas.md). Without a profile, the skill discovers defaults and offers to write a starter.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. A fresh session matters most when this conversation built the features under test: verifying the panel's findings happens here. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

A team invoicing app with a public API, so the agent personas joined.

> **Summary.** Four of six personas did what they came for. The newcomer gave up at the first invoice: the "Send" button stays grey until a tax setting is chosen, and nothing says so (CONFIRMED, high, 2 witnesses). The autonomous agent created invoices from the OpenAPI file alone, but a 429 gave no `Retry-After`, so it retried at once and was locked out for an hour (CONFIRMED, medium). The bad actor's card testing failed: the pay page allowed three declined cards per invoice, then asked for a new link (defence held). Changing the invoice id in a receipt URL showed another studio's receipt (PLAUSIBLE, high).
