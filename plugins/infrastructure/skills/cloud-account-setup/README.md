# cloud-account-setup

Plans a project's cloud organization and accounts the same way every time, and writes the guide a person follows to create them, or checks an existing setup against the same pattern. The pattern: one organization per company, a management account for billing and sign-in only, one member account per environment in the chosen region, single sign-on with no personal keys, guardrail policies, budgets and audit logging. Two things are written into every plan: a hand-over checklist (everything owned by the company, nothing shared with other projects, so the project can be sold or handed over), and a fallback region that's documented, not built. AWS is the worked default; the baseline maps it to Google Cloud and Azure.

- **Invoke:** `/infrastructure:cloud-account-setup [plan | check] [environment]`
- **Produces:**
  - `plan`: the layout, recorded where the project keeps decisions (an ADR draft by default) for the owner's approval, then the guide at the profile's `guide_path` (default `<infrastructure folder>/ACCOUNT-SETUP.md`).
  - `check`: the gaps between what exists and the pattern, each with a fix.
- **Cost:** one session, no sub-agents; read-only commands only.
- **Side effects:** none in the cloud. It never creates, closes or moves accounts, or changes policies, users or billing; account creation, root passwords, MFA and payment are the person's steps. It commits the guide only if the profile says so.
- **When to run:**
  - before creating a project's cloud accounts;
  - when adding an environment, or moving a project to another region or organization;
  - before a sale or hand-over;
  - now and then as a `check`.
- **Pairs with:** `cloud-first-apply`, which writes the guide for the first apply of each environment once its account exists.

## Profile

`.claude/cloud-account-setup.md`: the company, domain, regions, environments, what exists today, other organizations to keep apart, lead times and the hand-over list. Format: [reference/profile-format.md](reference/profile-format.md); a fictional [example](reference/example-profile.md); the pattern itself: [reference/baseline.md](reference/baseline.md). Without a profile it discovers what it can, asks for the company, and offers to write a starter.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. For this skill, layout decisions made earlier in the conversation should be recorded in the project before it plans, and a `check` wants read-only sign-in to the organization. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

> ### 4. Turn on IAM Identity Center
> - **Who:** owner
> - **Where:** management account → IAM Identity Center → Enable
> - **Region:** check the top right says Ohio (us-east-2) before enabling: this becomes Identity Center's home region, and moving it later means setting it up again.
> - **Do:** enable with the organization; create your user with MFA; assign the `AdministratorAccess` permission set to the `production` and `staging` accounts.
> - **Check:** the sign-in portal URL lists both accounts.
> - **If not:** an account missing from the list wasn't assigned a permission set.
