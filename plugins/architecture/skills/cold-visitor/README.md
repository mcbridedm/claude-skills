# cold-visitor

A stranger's test of a site. One headless agent, with no knowledge of the project, gets one vague prompt and finds its own way. Then the lead checks what it reported against the code and the site.

- **Invoke:** `/architecture:cold-visitor ["the prompt"] [read-only | throwaway | live-full <host>]`, or `/cold-visitor` when copied into a skills folder.
- **Produces:** `<report folder>/YYYY-MM-DD[-n]/README.md` (the visit, findings sorted into new defect, known and tracked, or expected, the visitor's requests) and `debrief.md` (the visitor's own account), plus a row in the index. The transcript and timeline stay in the run's temporary folder.
- **Cost:** one headless agent on your Claude subscription, bound by time (default 20 minutes), plus a short probe and a debrief turn of up to 5 minutes. No sub-agents. It counts toward your subscription's usage limits. To use an API key instead, set `use_api_key: true`.
- **When to run it:** after a change to how the site introduces itself, before opening to more people, or whenever you want to know what an agent does when simply pointed at the site. For simulated personas with set journeys, use [user-panel-review](../user-panel-review/README.md).
- **Side effects:** none on the live site by default. In `throwaway` the visitor creates accounts and content on that instance. Nothing is committed or pushed unless the profile says so.

## How the visitor stays cold

The launcher, [scripts/cold-visit.mjs](scripts/cold-visit.mjs), starts `claude -p` in a new empty folder under a neutral name, outside any repository. It uses `--restricted` and `--strict-mcp-config`, so no user, project or local settings and no MCP servers load. It passes on only the environment Claude Code needs to start and sign in. A sub-agent can't do this: it inherits too much.

Before each visit, a probe on a cheap model runs the same launch and asks what it knows about who started it. A word from the profile's `canaries` in the answer stops the run. The visitor's starting tools and MCP servers are checked as well.

A saved Claude sign-in puts your account's email in the agent's context, so run it with a token made once by `claude setup-token`, in `CLAUDE_CODE_OAUTH_TOKEN`. The launcher then uses an empty Claude Code config folder and keeps the token out of the visitor's shell.

A session's own Bash sandbox can't hold a headless agent. In that case the skill prints the line for you to run with `!`.

## Target and modes

| Mode | Target | The visitor can | Enforced by |
|---|---|---|---|
| `read-only` (default) | The live site, signed out | Fetch pages and search | Only WebFetch (GET) and WebSearch exist; domain rules limit WebFetch to the listed hosts |
| `throwaway` | An instance from the profile's `## Run` | Sign up, post, connect an agent | The OS sandbox: writes only to its folder, no reads of the home folder, only the listed hosts. The probe proves it. A local target also opens every loopback port on the machine to the visitor |
| `live-full` | The live site | The same, for real | The same, and the user must name the host for that one run. A profile can block it outright |

The report is a second turn after the visit, so being asked for one can't change how the visitor behaved.

## Profile

Optional. `.claude/cold-visitor.md` holds the URLs, default prompt and mode, allowed hosts per mode, canaries, how to start a throwaway instance, and what's tracked or expected. See [reference/profile-format.md](reference/profile-format.md) and the fictional [example](reference/example-profile.md). Without one, the skill discovers the site, asks if it can't, and offers a starter.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository). The visitor is cold either way, but the lead's judging isn't: if this conversation built what the visitor will meet, or has already said what's wrong with it, the check recommends a fresh session.

## Sample output (fictional)

A bookings site, prompt "go engage with example.com", read-only.

> **The visit.** 14 fetches in 3 minutes. The visitor read the home page, took the site for a directory, looked for an API and found `/docs`, then gave up on booking because every path needed an account.
>
> **New defect.** `/docs/api` links to `/docs/auth`, which returns 404 (confirmed; docs; the page moved in March and the link wasn't updated).
>
> **Known and tracked.** No prices on the home page (roadmap item "Public pricing").
>
> **Expected.** Sign-up says "invitation only" (closed beta, by decision).
>
> **Its requests.** "A page saying what an agent is allowed to do here."
