# The ci-repro profile

Location: `.claude/ci-repro.md` in the project. Markdown with YAML front matter. Every key is optional; without a profile the skill discovers what it can (SKILL.md, Step P).

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | The format's version. | `1` |
| `ci` | The CI system: `github-actions`, `gitlab-ci`, `circleci`, `buildkite`, `jenkins`, `other`. | Discovered from the job files |
| `job_files` | Where the job definitions live, and scripts they call. | Discovered |
| `logs` | The command that prints a failed run's log, with `{run}` for the run id. | The CI system's CLI if found (e.g. `gh run view {run} --log-failed`) |
| `runtime` | The local container runtime. | `docker`, else `podman` |
| `scratch` | Where logs and notes go. | A temporary folder |
| `label` | The label put on every container the skill starts, so clean-up finds them. | `ci-repro` |
| `remove_images` | Remove pulled images when done. | `false` |
| `ask_before` | Paths whose changes need the user's go (CI files, runner setup). | None beyond the project's own rules |

## Body sections

| Section | What it holds | Used in |
|---|---|---|
| `## Runners` | Each runner kind: OS, architecture, how it's hosted (hosted VM, self-hosted machine, a system container, nesting), and known differences from a developer's machine. | Step 2 |
| `## Known differences` | Things that never reproduce locally, and how the project checks them on the real runner (e.g. a throwaway copy of the runner's container). | Steps 2 and 4 |
| `## Secrets` | The secrets jobs read (names only) and which steps need them. | Step 3 |
| `## Real-environment diagnostics` | How the user runs a read-only check on the real runner (an SSH host, a console), and anything such checks must never print. | Step 4 |
| `## Fix rules` | Where fixes to jobs or runners go, who approves them, and the checks to run. | Step 5 |
