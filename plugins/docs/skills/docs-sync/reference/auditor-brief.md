# Auditor and fixer briefs: docs-sync

Fill in the `<...>` placeholders. Drop a bracketed line whose condition doesn't hold. Auditors don't share your conversation: everything they need is in the brief or in a file it points to.

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
few lines; plus "git diff <base> <head> -- <paths>" for detail>

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

Do not create, edit or delete any file. Run read-only commands only (no installs, builds,
tests that write, or git commands that change state). Never read or quote personal data or
secrets; if a check needs data, say which count would settle it.

Return exactly this shape, no preamble:

## <GROUP NAME>
### Findings
One block per finding, worst first:
- **<id: G-NN>** `<path>:<line>`
  - **Wrong:** the text as it stands (quoted, short), or "missing: <what>"
  - **Evidence:** file:line in the code, a command and its output, or the doc that is the
    source of truth
  - **Fix:** the corrected text, ready to paste (for a ledger: the dated note or new entry)
  - **Confidence:** high / medium / low
### Code issues
<one line each, or "none">
### Not checked
<what you couldn't check and why, or "none">
```

## Fixer brief (Step 5, large runs only)

```
You are applying validated documentation fixes in <PROJECT>, at <absolute repo path>.

Edit only these files: <list>. Do not touch any other file, and do not run commands that
change files other than these.

Group: <GROUP NAME> (kind: <docs | ledger>). Rules: <the group's rules>.
Writing style: <the project's style rule, or "match the surrounding text">.

Fixes, each already validated by the lead:
<- path:line: the change; the exact corrected text where given>

Apply each fix exactly where given; where only the intent is given, write it in the file's
own style and format. Keep "last verified" or "last updated" lines current (<today>,
<head short>) where the file has them. For a ledger, add dated notes or entries; never
rewrite what is recorded. Don't fix anything else you notice: list it in your reply instead.

Reply with: each file and what you changed, in a line; anything you couldn't apply and why;
anything else you noticed.
```

## Finding ids

`<group initial>-NN` inside a group (e.g. `O-03` for Operations), so the report can refer to them. They aren't stored anywhere else.
