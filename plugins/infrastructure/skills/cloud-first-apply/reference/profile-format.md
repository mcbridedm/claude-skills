# The cloud-first-apply profile

Location: `.claude/cloud-first-apply.md` in the repository. Markdown with YAML front matter. Every setting is optional.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | Format version. | `1` |
| `project` | The project's name. | The repository folder name |
| `tool` | `opentofu`, `terraform`, `cdk`, `pulumi`, `cloudformation`, `bicep`. | Discovered |
| `default_root` | The root used when none is given. | Ask |
| `main_region` | The region most resources live in. | From the provider block |
| `guide_path` | Where the guide is written: a file path, or `README.md#Section`. | `<root's parent>/FIRST-APPLY-<env>.md` |
| `commit` | Commit the guide. | `false` |

## Sections

| Section | What it holds | Default |
|---|---|---|
| `## Environments` | Each environment's root, account, region, and the order they come up in. | Discovered |
| `## DNS` | Who serves the zone, and when each kind of record goes live. | Discovered |
| `## Secrets` | Where secrets live and the project's way of entering them (a script with a hidden prompt, a console). | Discovered |
| `## Park` | The parked mode, if any: how it's switched, what it deletes and keeps, the drill. | None |
| `## Checks` | The project's own validate commands, if they differ from the tool's. | The tool's |
| `## Extra steps` | Anything the code can't show (an email sandbox exit, a support request, a vendor connector). | None |
| `## Costs` | Where the project's cost estimates are. | None |
