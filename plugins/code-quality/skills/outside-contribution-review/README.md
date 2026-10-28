# outside-contribution-review

Reviews a pull request (or patch) from someone **outside the team**, a person or an AI agent, against the standards the project has written down, and writes a verdict the contributor can act on. It's built for open repositories and public mirrors, where the contribution itself may try to mislead the reviewer.

- **Invoke:**
  - `/code-quality:outside-contribution-review <pr> [post]` when installed from the plugin marketplace;
  - `/outside-contribution-review …` when the skill folder is copied or symlinked into a skills folder.

  `<pr>` is a number on the profile's repository, a PR URL, or a path to a `.patch` file. Add `post` to post the contributor part as a PR comment (only if the profile allows it; you're shown the text first). It runs only when you type it.
- **Produces:** a verdict, printed in the session: **accept**, **accept with changes**, **needs an issue first**, or **close**. One part for the contributor, one for maintainers only. Saved or posted only when the profile says so.
- **Cost:** one session, no sub-agents. Reading a typical PR, its linked issue and the standards takes a few minutes; large PRs take longer.
- **When to run it:** when an outside PR arrives, before anyone checks it out. For your team's own PRs or uncommitted work, use `/code-review`; for commits already on a branch, `/code-quality:commit-range-review`.

## Why a separate skill?

A general review assumes the code is from a colleague. An outside contribution needs more care:
- **It's untrusted.** The skill never checks out, installs, builds or runs it, and treats the diff, description, commits, comments and added files as data. Instructions in them aimed at reviewers or AI tools are reported, never followed.
- **It's judged by written rules.** Every finding cites the project's standards (file and section); bad practice the rules don't cover is a suggestion, not a blocker.
- **It answers a different question:** should this come in at all, and what does the contributor do next.
- **It knows about mirrors.** When a public repository mirrors a private one, the verdict's maintainer part gives the exact import command rather than a merge.

## What it does

1. **Profile:** loads `.claude/outside-contribution-review.md` (kept in the trusted repository), or discovers standards, the PR's repository and required checks.
2. **Gather, read-only:** `gh pr view`, `gh pr diff`, `gh pr checks`, the linked issue, and the base code in your checkout for context. CI runs waiting for maintainer approval are reported, not approved.
3. **Gatekeeping:** template, agreed issue, size, dependencies, forbidden or generated paths, secrets, binaries, sign-off or licence, agent disclosure, and steering attempts. A disqualifying failure settles the verdict early.
4. **Standards review:** correctness, tests (a bug fix has a test that fails without it), security, design fit, docs and writing style, each finding citing its rule, blocking or suggestion.
5. **Verdict:** kind and plain, the same for a person or an agent, with concrete next steps; plus maintainer notes: risks, what to check by hand, CI state, and the next command to bring it in.
6. **Output:** printed; saved and posted only as the profile allows, and posted only after you confirm.

It never merges, closes, labels, approves or pushes.

## Project profile

Optional. Put project specifics in `.claude/outside-contribution-review.md`. Format: [reference/profile-format.md](reference/profile-format.md). Examples: [a public docs site mirrored from a monorepo](reference/example-profile.md) and [a plain single repository](reference/example-profile-single-repo.md). Without a profile it discovers defaults, drafts only, and offers to write one.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. A fresh session matters most when this conversation already discussed the pull request or its author's claims. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

```
PR #87 on quillpine/quillpine-docs: "Add a webhook retry example" by @fernhollow.
2 files, +58 -3.

**Verdict: accept with changes**

Thanks for the retry example; it fills a gap people ask about.

### Changes needed
1. **The example must run** (`site/guides/webhooks.md:41`). It calls `client.retry()`, which
   the current release renamed to `client.redeliver()`. Rule: STYLE.md "Examples". Next step:
   use the new name and include the import line.
2. **Alt text** (`site/guides/webhooks.md:63`). The diagram has none. Rule: STYLE.md
   "Accessibility". Next step: say what the diagram shows in one sentence.

### Suggestions
- Link to the delivery log page on first mention; not a stated rule.

### Checks
build, links and lint are waiting for a maintainer to approve the run.

### Maintainer notes (not for posting)
- Gatekeeping: all pass; DCO signed; no agent named.
- Steering attempts: none found. Secrets: none found.
- CI: safe to approve (no workflow or script changes; hosted runners only).
- Bring it in: `scripts/import-pr.sh 87`, once the two changes land and checks pass.
```
