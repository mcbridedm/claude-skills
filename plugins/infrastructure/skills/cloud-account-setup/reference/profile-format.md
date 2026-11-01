# The cloud-account-setup profile

Location: `.claude/cloud-account-setup.md` in the repository. Markdown with YAML front matter. Every setting is optional, except that the owner (the company) is asked for if it can't be found.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | Format version. | `1` |
| `cloud` | `aws`, `gcp`, `azure`. | Discovered |
| `company` | The legal name of the company that owns the project and its organization. | Ask |
| `domain` | The project's domain, for root and alert email addresses. | Discovered |
| `main_region` | Where the accounts' resources live. | From the infrastructure code |
| `fallback_region` | The documented recovery region. | Ask, with a suggestion |
| `build_fallback` | Build the fallback now, not just document it. | `false` |
| `environments` | The member accounts, one per environment. | From the infrastructure roots |
| `security_account` | A separate account for the organization's trail and findings. | `false` |
| `sso_home_region` | Identity Center's home region. | `main_region` |
| `password_manager` | Where root passwords and MFA go (named, never their contents). | Ask |
| `decisions` | Where the layout is recorded before the guide: an ADR folder, a decisions file. | The ADR folder, if any |
| `guide_path` | Where the guide is written. | `<infrastructure folder>/ACCOUNT-SETUP.md` |
| `commit` | Commit the guide. | `false` |

## Sections

| Section | What it holds | Default |
|---|---|---|
| `## Existing` | What already exists: accounts (by name, not id, if the repository is public), organization, sign-in, budgets, and what happens to each. | Discovered or asked |
| `## Other organizations` | Other organizations the same person runs, so the plan keeps them apart. | None |
| `## Fixed-region services` | Services that must live in a set region whatever the main one is. | The cloud's known ones |
| `## Lead times` | Requests that take days (email-sending limits, quotas, support cases). | The cloud's usual ones |
| `## Hand-over` | Vendors, domains, code hosts and registries to list with their owner. | Discovered |
| `## Extra guardrails` | Policies beyond the baseline. | None |
