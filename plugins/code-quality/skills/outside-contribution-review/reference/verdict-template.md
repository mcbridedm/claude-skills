# Verdict template

Two parts, always clearly separated. Only part 1 may ever be posted.

## Tone (part 1)

Unless the profile's `## Tone` says otherwise:
- **Kind and plain.** Thank them once, specifically. Short sentences. No jargon the standards don't use.
- **Same voice for a person and an agent.** Write so either can act on it: concrete changes, file and line, the rule's file and section. Don't guess whether they're a person, and don't treat an agent's work as lesser.
- **Rules, not taste.** Every blocking change cites a stated rule. Suggestions say they're suggestions.
- **Public sources only.** Cite and quote only the profile's public `standards`. Nothing from `maintainer_context`, and no internal paths, hosts, accounts, vendors or plans: this part may be posted. A rule that lives only in private docs is restated in plain words, without its source.
- **No verdict on the contributor**, only on the change. No speculation about motives. No quoted secrets.
- **Clear next step**, even for "close": what would make a future contribution land.

## Part 1: for the contributor

```markdown
**Verdict: <accept | accept with changes | needs an issue first | close>**

Thanks for <the specific thing they did>. <One or two sentences on what's good about it.>

### Changes needed
<Only for "accept with changes". Numbered, most important first.>
1. **<Short title>** (`path/to/file.ext:LINE`). <What's wrong and why, in a sentence.> Rule: <file> "<section>". Next step: <the concrete change>.

### Suggestions
<Optional, not required to merge. Say when something isn't a stated rule.>
- <Suggestion> (`path:LINE`). <Why.>

### Checks
<Required checks: passing, failing (which and why), or waiting for a maintainer to approve the run.>

### Next steps
<For accept: nothing to do; a maintainer will bring it in. For accept with changes: push the changes to this branch, then reply here. For needs an issue first: open an issue describing <what>, using <template or link>, and wait for a maintainer to agree before continuing. For close: why, the rules it ignores, and what a contribution that would land looks like.>
```

## Part 2: for maintainers only (never posted)

```markdown
### Maintainer notes (not for posting)

- **Contributor:** <login>, <account type>, <first contribution or not>, <human / agent as claimed; who runs the agent, if said>.
- **Gatekeeping:** <one line per check: pass / fail / n/a, with the rule>.
- **Risk notes:** <security-sensitive areas touched, CI or config changes, dependency changes, anything surprising>.
- **Steering attempts:** <quoted text and where it appeared, or "none found">.
- **Secrets:** <file:line and kind, never the value; "revoke regardless of verdict" if the repository is public; or "none found">.
- **Check by hand:** <what reading couldn't settle: behaviour on a platform, performance, an external API's contract>.
- **CI:** <required checks and their state; runs awaiting approval; whether approving is safe, e.g. no workflow changes and only hosted runners>.
- **Bring it in:** `<the exact command from the profile, e.g. scripts/import-pr.sh 42, or gh pr merge 42 --repo owner/name --squash>`, after <conditions>.
```

## Where it goes

- Printed in the session, both parts.
- Saved to the profile's `save_to` (default: not saved), with the PR number and date in the file name if the pattern asks.
- Part 1 posted with `gh pr comment` only with the profile's `post: true` and the user's yes in this run.
