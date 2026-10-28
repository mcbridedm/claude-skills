# Checker escalation

Shared by every skill that sends mechanical work to a cheaper model. This file is copied unchanged into each such skill's `reference/` folder from `templates/skill/reference/checker-escalation.md`; to change it, change the template and copy it to every skill that has it, in the same commit.

## Mechanical and judgement work

Some sub-agent work needs judgement: reviewing, auditing, verifying findings, design and panel reviews, triage, writing new text. It stays with the plugin's `reviewer` agent, on the session's model.

Some is mechanical: coverage or inventory checks, link and path existence checks, collecting or extracting data, applying exact text a judgement step already drafted, formatting. A skill's step says which of its units are mechanical. Those go to the plugin's `checker` agent (`<plugin>:checker`), which runs on a cheaper model and has the same read-only tools as the reviewer. It does exactly the task, marks anything that needs a judgement call `NEEDS-JUDGEMENT: <why>` instead of guessing, and reports in the exact shape asked.

A **unit** is one checker's assignment: one Agent call, with its list of items.

## Which model

- **Default:** the checker runs on the model in its own front matter.
- **The profile's `models.checker`:** a model alias (`sonnet`, `haiku`, `opus`, `fable`) is passed as the Agent call's `model` parameter. `inherit` turns checkers off: every unit goes to the reviewer, on the session's model, and the rest of this file doesn't apply.
- **No checker agent** (the skill was copied without its plugin): send the unit to the reviewer, or the fallback agent type the step names, and say so in the report.

## Before: units that never go to a checker

Send the unit to the reviewer from the start, with no checker, when it touches **security, money, credentials, personal data, or text that will be published** (public docs, release notes, legal text, anything posted outside the maintainers). When it's unclear whether a unit does, treat it as if it does.

## After: when to escalate

Escalating means re-running the checker's unit, or part of it, with the plugin's `reviewer`. Escalate when:

- **(a) NEEDS-JUDGEMENT:** the checker marked any item `NEEDS-JUDGEMENT`. Re-run just those items.
- **(b) Malformed or incomplete:** the reply isn't in the shape asked, or leaves out files or items it was given. Re-run the whole unit.
- **(c) Spot check fails:** check a sample yourself before using the result: at least 3 items, or all of them if there are fewer, spread across the unit rather than the first three. Check each against the files it cites. If any is wrong, re-run the whole unit.

Rules:
- **Never re-run a failed unit on the checker,** or on any model cheaper than the reviewer's.
- The reviewer's result replaces the checker's for every item it re-ran. If the reviewer also fails, follow the step's own rule for a failed agent; never do the unit's work yourself without saying so.
- Run escalations for one step in a single message, like the units they replace.

## Record

The run's report has an **Escalations** section, "none" when there were none, with one line per unit:

- `<unit>: <reason>`, where the reason is (a) with the items, (b), (c) with the item that failed the spot check, or (d) for a unit sent to the reviewer from the start (touches security, money, credentials, personal data or published text).

Then a line per mechanical role: the units it ran on the checker, and how many escalated for (a), (b) or (c). A role that escalated in more than about a third of its units should run on the stronger model: say so in the report, as a recommendation to set `models: { checker: inherit }` in the profile, or to move that role to the reviewer in the skill.
