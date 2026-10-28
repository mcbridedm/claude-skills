# Auditor, fix drafter and fix placer briefs: docs-sync

Fill in the `<...>` placeholders. Drop a bracketed line whose condition doesn't hold. Agents don't share your conversation: everything they need is in the brief or in a file it points to. The auditor and fix drafter briefs go to the `docs:reviewer` agent; the fix placer brief goes to the `docs:checker` agent, on a cheaper model (see `checker-escalation.md`). Both agents can only read and search: no shell, no editing. Every file is written by the lead.

## Auditor brief (Step 3)

```
You are auditing one group of documents in <PROJECT>, at <absolute repo path>, for a docs sync.
The code and project state changed; your job is to find where these documents now say
something untrue, or leave out something they are meant to hold.

Group: <GROUP NAME> (kind: <docs | ledger>)
Rules for this group: <the group's rules, e.g. "ledger: never rewrite an entry; propose a
dated note or a new entry">
Project rules about docs: <from CLAUDE.md / AGENTS.md / the profile's "Rules", or "see <path>">

Files in the group, and what each is the source of truth for:
<- path: what it holds>

What changed (<base short>..<head short>, <n> commits):
<the change summary from Step 2: changed areas, change kinds, renamed and deleted paths, in a
few lines>
The diff, for detail: <diff_dir>/<group>.diff (git diff <base> <head> for the matched paths)

Triggered items, and why:
<- path (or path section): the matching change>

Claims elsewhere that may be affected (from a grep):
<- path:line: the claim>

How to check claims in this group: <the group's checks; for example "settings keys against
config/settings.toml", "routes against the OpenAPI document">

<For a full audit ("all"): audit every file in the group, not only triggered items.>

Read the documents and the code or state they describe. For each problem, check it against
the code at <head short>: cite what proves it. Report only what is wrong or missing, not
style or wording you'd prefer. A fact that belongs in another document (by the "source of
truth" lines) is a finding only if this file contradicts it; suggest a link instead of a copy.
If you notice a bug in the code itself, list it under "Code issues" in a line; don't chase it.

You have no shell and no editing tools: read and search only, and return everything in your
reply. Where a claim can only be settled by running something (a command's --help, a
generator, a count), say what to run and what result settles it, in the evidence; the lead
runs it. Never read or quote personal data or secrets; if a check needs data, say which
count would settle it.

Return exactly this shape, no preamble:

## <GROUP NAME>
### Findings
One block per finding, worst first:
- **<id: G-NN>** `<path>:<line>`
  - **Wrong:** the text as it stands (quoted, short), or "missing: <what>"
  - **Evidence:** file:line in the code, the doc that is the source of truth, or the command
    the lead should run and the result that would settle it
  - **Fix:** the corrected text, ready to paste (for a ledger: the dated note or new entry)
  - **Confidence:** high / medium / low
### Code issues
<one line each, or "none">
### Not checked
<what you couldn't check and why, or "none">
```

## Fix drafter brief (Step 5, large runs only, and for escalated fix placer units)

```
You are drafting validated documentation fixes in <PROJECT>, at <absolute repo path>. You
don't edit anything: you return exact replacements, and the lead applies them.

Your files: <list>. Draft changes for these only.

Group: <GROUP NAME> (kind: <docs | ledger>). Rules: <the group's rules>.
Writing style: <the project's style rule, or "match the surrounding text">.

Fixes, each already validated by the lead:
<- path:line: the change; the exact corrected text where given>

For each fix, read the file and draft it exactly where given; where only the intent is
given, write it in the file's own style and format. Include updates to "last verified" or
"last updated" lines (<today>, <head short>) where the file has them. For a ledger, draft
dated notes or entries; never a rewrite of what is recorded. Don't draft anything else you
notice: list it at the end instead.

Reply with, per file:
### <path>
- fix <id>:
  old: <the exact current text, copied from the file, long enough to occur only once>
  new: <the replacement text>
Then: anything you couldn't draft and why; anything else you noticed.
```

## Fix placer brief (Step 5, large runs only; mechanical)

Only for files whose every fix has exact corrected text the lead already validated. Anything that needs new wording goes to a fix drafter instead.

```
You are placing validated documentation fixes in <PROJECT>, at <absolute repo path>. This is a
mechanical task: every replacement text below is final. You find where each one goes and
return exact old/new pairs; you don't edit anything, and the lead applies them.

Your files: <list>. Work on these only.

Fixes, each with its final text:
<- fix <id>, path:line: the text to replace (quoted, short) -> the exact new text>
<"Last verified" or "last updated" lines to set, where the file has them: <today>, <head short>>

For each fix:
- read the file and find the text to replace near the line given;
- copy the current text exactly, character for character, long enough to occur only once in
  the file;
- build the new text from the copied text with only the fix's change made, so any text
  around it that you copied for uniqueness carries over unchanged.
If a fix can't be placed without a choice the brief doesn't make (the text isn't there, it
occurs more than once and no longer copy makes it unique, the new text doesn't fit the
sentence it lands in, or it would need wording of your own), don't choose: write
"NEEDS-JUDGEMENT: <why>" for that fix and go on. Don't fix anything else you notice: list
it at the end.

Reply with, per file, every fix you were given, in this exact shape:
### <path>
- fix <id>:
  old: <the exact current text>
  new: <the replacement text>
- fix <id>: NEEDS-JUDGEMENT: <why>
Then: "Noticed:" and anything else you saw, or "none".
```

## Finding ids

`<group initial>-NN` inside a group (e.g. `O-03` for Operations), so the report can refer to them. They aren't stored anywhere else.
