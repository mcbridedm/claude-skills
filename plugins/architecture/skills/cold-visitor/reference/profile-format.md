# Profile format

The profile lives at `.claude/cold-visitor.md` in the project: YAML front matter for settings, then Markdown sections. Everything is optional; the default applies when it's missing. The visitor never sees the profile.

## Front matter

```yaml
---
profile_version: 1
project: example
live_url: https://example.com     # the live site; default: discovered, or asked
default_prompt: "go engage with {target}"   # {target}: the bare host live, the URL on a throwaway
default_mode: read-only           # read-only or throwaway; never live-full
live_full: blocked                # allowed, or blocked (default); give the reason in ## Safety
model: sonnet                     # the visitor's model
minutes: 20                       # time limit for the visit
use_api_key: false                # true: use ANTHROPIC_API_KEY, not the signed-in Claude subscription
report_folder: docs/reviews/cold-visits   # default
index_file: docs/reviews/cold-visits/README.md   # default: <report_folder>/README.md
commit: false                     # default false
push: false                       # never true unless the maintainer says so
---
```

## Sections

| Section | What it holds | Default |
|---|---|---|
| `## Hosts` | One line per mode: `read-only:`, `throwaway:`, `live-full:`, each a comma-separated list. The target's own host is always added. `WebFetch` matches a name exactly; `*.example.com` covers subdomains but not `example.com`. | The target's host only |
| `## Canaries` | Words a cold agent couldn't know: the project's name, the owner's name, internal host names. One per line. | The repository folder's name, and the local user name |
| `## Run` | How to start a throwaway instance, find its URL and stop it. | Discovered from the README and scripts; without one, `throwaway` isn't available |
| `## Tracked` | Where known problems are written down, and whether new defects are added there. | None: every real finding is new |
| `## Expected` | What's true for now or by design, with why. Used only in Step 3, never shown to the visitor. | None |
| `## Safety` | Anything the visitor must never touch, and why `live_full` is blocked. | None |

## Discovery

Without a profile: the live URL from the README, package manifests or deployment config (ask if there isn't one); a throwaway instance from the README and scripts; report folder `docs/reviews/cold-visits`, or `reviews/cold-visits` if there's no `docs/`.
