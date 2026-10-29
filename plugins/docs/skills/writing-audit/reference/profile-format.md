# Profile format: writing-audit

A project's profile lives at `.claude/writing-audit.md`: YAML front matter for settings, then Markdown sections, the most important being the surfaces. Every setting has a default, so a profile only needs what differs. A filled-in example is in [example-profile.md](example-profile.md).

## Front matter

```yaml
---
profile_version: 1
standard: docs/writing-standard.md   # the project's own writing standard; default: discovered, else the default tests
tests:                               # optional: the standard's tests, if it doesn't list them itself
  - id: 1
    name: specific
    means: "names the tool, the version, the number, the error"
reports_dir: docs/reviews/writing    # one folder per run: <reports_dir>/<YYYY-MM-DD>/README.md
id_prefix: wa                        # finding ids: <id_prefix>-<YYYY-MM-DD>-NN
tracker: "ROADMAP.md \"Next\""       # optional: where one entry pointing at the report goes
max_reviewers: 6
commit: true
commit_command: "make check-docs && git commit"   # default: what CLAUDE.md or AGENTS.md says, else git commit
push: false
---
```

| Key | Default |
|---|---|
| `standard` | discovered (see Discovery); none found: the default tests below |
| `tests` | the standard's own list; else the default tests |
| `reports_dir` | `docs/reviews/writing` |
| `id_prefix` | `wa` |
| `tracker` | none |
| `max_reviewers` | 6 |
| `commit` | true with a profile; without one, only if the user says so |
| `commit_command` | from CLAUDE.md or AGENTS.md if they say how commits are made, else `git commit` |
| `push` | false |

## The default tests

When a project has no written standard, or one without a list of tests, use these four. They work for people's and agents' writing alike.

| Id | Test | Fails when | In UI copy and docs, this means |
|---|---|---|---|
| 1 | **Specific** | It's vague where a reader needs a detail: no tool, version, number, error, limit or time. | "for a while", "a few minutes", "some limits apply" where the value exists as a setting. |
| 2 | **Says what was tried** | It doesn't show its work: what was run, what happened. | An error or empty state that doesn't say what happened or what to do next; an instruction that gestures at a step instead of giving it. A tip with no example or evidence of having been tried. |
| 3 | **Claims checked or labelled** | It states as fact something that's false, or that nobody checked, without saying so. | Copy that describes the product's behaviour wrongly; a command that doesn't work; a vendor's number stated as ours; a promise ("soon") about something already built or never planned. |
| 4 | **Adds something new** | It's filler: restates the heading or the line above, could sit under anything, puffery. | A paragraph repeated on the same page; "powerful", "seamless"; takeaways that restate the title. |

Map a project's own standard onto its tests by its own words; keep its names in the report.

## Sections

### `## Surfaces`

One `###` subsection per surface: a body of writing that's read the same way. Each lists, as bullets:

- **kind:** `files` (in the repository) or `live` (published somewhere the repository doesn't hold: a site's posts, a bot's output, a feed).
- **audience:** `readers` (the public or users) or `maintainers` (notes, outlines, plans), which are held to a lower bar.
- **files:** globs, for `files`. The copy in UI code counts: strings in templates and components, message catalogues, error maps.
- **skip:** globs or a description of what not to read: tests, generated output, pages that only render a document covered elsewhere.
- **fetch:** for `live`, a read-only command that prints the content (JSON or text) to stdout, run by the lead. It loads any credentials itself (e.g. sources an env file inside the command); never put a secret in the profile. Say how it pages.
- **since** and **limit:** for `live`, how far back to read (default 30 days) and at most how many items (default 200).
- **writer:** for `live`, where its text comes from, if the repository holds it (a prompt file, a template, a quality gate): Step 5 points fixes there.
- **notes:** anything a reviewer needs (which strings are labels, which pages are drafts).

### `## Sources of truth`

Where claims about the product are checked, as bullets: code folders, the settings or config files that hold limits and times, design docs, the CLI's command code, API schemas. Reviewers check claims against these, with `path:line`.

### `## Notes`

Anything else: a known exception ("the legal pages are counsel's drafts; skip them"), terms the project uses on purpose, a style rule the standard doesn't state.

## Sizing

- About one reviewer per 75 UI files or 1,500 lines of prose. A big component library and the pages that use it can share a reviewer when together they're under that.
- Live content under about 600 lines: the lead reads it while the reviewers run. Over that, a reviewer per surface.
- Never more than `max_reviewers`. Over that, run in two waves, the reader-facing surfaces first.

## Discovery

Without a profile, look for these, without sub-agents, and say what you found:

1. **The standard:** a writing or style guide (`docs/*style*`, `docs/*writing*`, `*voice*`, `STYLE.md`), a quality bar in a content policy or contributing guide, a section of CLAUDE.md or AGENTS.md on writing. None: the default tests.
2. **Files surfaces:** the UI's source (`src/routes`, `src/pages`, `app/`, `components/`, `templates/`, `views/`), message catalogues (`locales/`, `i18n/`, `*.po`, `messages/*.json`), user docs (`docs/`, `guide/`, `site/`), the README, CLI help text. Split reader-facing from maintainers' notes by what each file says it's for.
3. **Live surfaces:** can't be discovered. Ask whether the project runs bots or agents that publish, or accounts that post for it, and how to read their output (an API, a feed, an export). Offer to add each as a `live` surface.
4. **Sources of truth:** the settings or config files (`config/`, `*.yaml`, `.env.example`), the API's or CLI's source folders, design docs or specs, an OpenAPI file.
5. **Reports:** an existing reviews folder (`docs/reviews/`) for `reports_dir`; a roadmap or TODO file for `tracker`; how commits are made, from CLAUDE.md or AGENTS.md.

Offer a starter profile from [example-profile.md](example-profile.md) with what you found filled in.
