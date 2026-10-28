# The review profile

The profile holds everything about one project that the shared skill needs. It lives in the reviewed repository, so it's versioned with the code it describes, and Step 0 of each review keeps it current.

## Location and name

**`.claude/architecture-review.md`** at the repository root. One fixed path, so the skill never has to search.

Why there:
- **It configures a Claude Code tool,** and `.claude/` is where a repository keeps Claude Code configuration (skills, settings). Someone looking for "how is this review set up" looks there.
- **It can't live in the review folder,** because it says where the review folder is. Keeping it outside also means moving the reviews doesn't move the profile.
- **It isn't loaded into every session.** Claude Code loads `CLAUDE.md` files automatically, not other Markdown in `.claude/`, so the profile costs nothing until a review runs.
- **Named after the skill,** so a repository can hold profiles for several skills side by side (`.claude/<skill-name>.md`).

## Format

Markdown with YAML front matter:
- **Front matter** for short, structured settings: paths, ids, the stage, the tiers, commit behaviour.
- **Body sections** (`##` headings with the exact names below) for prose the skill pastes or follows: the product, the reading list, the principles, the lenses.

Every setting and section is optional. A missing one uses the skill's default, given in the tables below. Write prose the way the review should read it: it is pasted into reviewers' briefs and into the context document, so be specific and name files.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | Format version of this file. | `1` |
| `project` | The project's name, as reviewers should call it. | The repository folder name |
| `stage` | `pre-launch` or `live`. Chooses the calibration text, the blocker label and the timing words. | Discovered (Step P) |
| `review_dir` | Where runs are saved, relative to the repository root. | `docs/reviews/architecture` |
| `index` | The index of all runs. | `docs/reviews/README.md` |
| `run_layout` | `folder` (one folder per run with `README.md`, `context.md`, `panel.md`) or `file` (one file per run with appendices). | `folder` |
| `history_file` | A review that came before this skill. The first run treats it as the previous review and tracks its numbered items. | None |
| `adr_dir` | Folder of decision records. | Discovered (`docs/adr/`, `docs/decisions/`, ...) |
| `principles_file` | The file the principles come from, named in the brief. | None |
| `tiers` | Scale tiers or milestones, in order. Every scale concern names one. | `today's usage / 10x / 100x` |
| `tier_noun` | What the brief calls a tier ("usage tier", "scale milestone"). | `scale tier` |
| `blocker_label` | The yes/no field on every risk. | `launch blocker` pre-launch, `release blocker` live |
| `timing_milestone` | The timing word between "now" and the tiers. | `before launch` pre-launch, `next release` live |
| `action_items.file` | Where adopted items are recorded. | None (the run's README only) |
| `action_items.section` | The heading in that file for blocker and pre-release items. | None |
| `action_items.later` | Where items with a tier trigger go. | The file's roadmap or next-steps section, or the ADR they affect |
| `action_items.id_format` | Id for each action item. `YYYY-MM-DD` is the run's date, `NN` a two-digit sequence. | `AR-YYYY-MM-DD-NN` |
| `commit` | Whether invoking the skill means "commit the review". | `true` |
| `push` | Whether to push after committing. | `false` |
| `commit_message` | The commit subject. | `Architecture review YYYY-MM-DD` |

## Body sections

| Section | What it holds | Used in |
|---|---|---|
| `## Product` | A line starting `One-liner:` (pasted into the brief after the project's name, e.g. "a team invoicing app for small agencies"), then a paragraph on what the product is, who it serves and its core domain model. | Brief; context §1 |
| `## Reading list` | The files to read, in order, each with a note on how (in full, the headline tables, recent ones only) and what to look for. | Step 1 |
| `## Code to confirm claims` | The files and folders that let the coordinator check what the docs say: entry points, wiring, one module end to end, access control, clients, Dockerfiles, CI, infrastructure. | Step 1 |
| `## Principles` | The yardstick, as one paragraph to paste into the brief ("YAGNI and simplicity first; ..."), plus anything the coordinator should note when reading the principles file. | Brief; Step 1 |
| `## Calibration` | The stage paragraph pasted into the brief, replacing the default, and a `Team:` line (e.g. "The product is pre-launch, with a small team."). | Brief |
| `## Key frameworks` | The frameworks reviewers check against the versions in use. | Brief |
| `## Context document` | Additions to the context document's sections, keyed by section number and name. An entry may restate the whole section with the project's specifics. | Step 1 |
| `## Decided sources` | Where the maintainer's standing decisions are recorded, and questions waiting on outside advice. | Step 0; context §8 |
| `## Shared checks` | Commands to run once, each with what to report. Replaces the defaults. Read-only commands only. | Step 1; context §9 |
| `## Panel` | Changes to the default roster and lenses (below). | Step 2 |
| `## Synthesis themes` | Example themes for grouping findings. | Step 4 |
| `## Action items` | Rules for recording items beyond the front matter (groups, ticking, cost checks). | Step 7 |
| `## Commit` | Lint commands and anything else about committing. | Step 7 |

### The Panel section

Start from the default roster in `personas.md`. Then, one `###` heading per persona you change, using the default name (so the change survives renames):

```markdown
### 5. Security Architect
Lens (replace): Can any credential be stolen ...

### 8. Frontend/Web Architect
Lens (add): Is the design system's dark mode tested?

### 7. AI/ML Architect
Drop: no AI features, and none planned.

### 12. Product Strategy Architect
Rename: Product Architect

### 14. Payments Architect (new)
Lens: Are refunds, retries and reconciliation correct ...
```

- **`Lens (replace):`** the persona's whole lens. Use it when the project's questions are better than the general ones.
- **`Lens (add):`** questions appended to the default lens.
- **`Drop:`** with a reason. The reason goes in `panel.md`'s header.
- **`Rename:`** a new name for the persona.
- **New persona:** a heading with `(new)` and a `Lens:` line; it's added at the end, in heading order.

Adding, dropping or renaming personas changes the panel's shape, so during a review Step 0 only proposes it. The maintainer edits the Panel section.

## Without a profile

The skill discovers values from the repository (SKILL.md, Step P), runs with them, records them in `context.md` under "Profile used", and offers to write a starter profile here, shaped like `example-profile.md`, with `TODO` where it guessed.
