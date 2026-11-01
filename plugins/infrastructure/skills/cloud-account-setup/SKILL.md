---
name: cloud-account-setup
description: Plans a new cloud organization and its accounts the same way every time, or checks an existing one against that pattern. Writes the guide a person follows (an AWS Organization with a billing-only management account, single sign-on, one member account per environment in the chosen region, a budget, guardrail policies and audit logging; or the same shape on another cloud), with the region said at every regional step, plus a hand-over checklist (everything owned by the company that owns the project, nothing shared with other projects) and a documented, not built, fallback region. Never creates accounts or changes anything in the cloud. Reads .claude/cloud-account-setup.md for the company, domains, regions and environments, or discovers them. Use when setting up a cloud organization or account for a project, adding an environment, moving a project to another region or organization, preparing a project to be sold or handed over, or asking "is our cloud account set up right".
argument-hint: "[plan | check] [environment]"
disable-model-invocation: true
---

# Cloud account setup

You plan how a project's cloud organization and accounts are laid out, and write the guide a person follows to create them, or you check an existing layout against the same pattern. The pattern is in `${CLAUDE_SKILL_DIR}/reference/baseline.md`; the project's own names, company, domains, regions and environments come from its profile. **You never create, close, move or change accounts, policies, users or billing.** Creating accounts, typing root passwords, adding MFA and payment details are the person's steps; you write them. You may run read-only commands (with read-only credentials the person already has) and read the provider's public docs.

Project specifics come from the project's **profile** (Step P). This file stays general: AWS is the worked default; other clouds are covered by the mapping in the baseline.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/baseline.md`: the pattern, the hand-over checklist and the fallback-region plan.
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starter profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Anchoring (4):** if the conversation already settled the layout ("one account is enough", "share the logging account"), the plan would copy it. The decisions that matter here are the owner's, so record them in the project first and plan from the record.
- **Authorship (2), for `check`:** a session that set the accounts up reads them as it meant them.
- **Readiness (6):** for `check`, read-only sign-in to the organization; without it, say what couldn't be checked.
- **Moving target (5):** no account creation, region move or apply in flight.

## Step P: Load the profile

1. Read `.claude/cloud-account-setup.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md`.
2. **No profile:** discover, without sub-agents, noting where each value came from:
   - **Cloud and regions:** provider blocks and their regions in the infrastructure code; docs naming a region.
   - **Environments:** the infrastructure roots (`envs/*`, stacks, workspaces) and what deploys where.
   - **Owner:** the company that owns the project (README, legal docs, a vendors or accounts list). Ask if it isn't written down; never guess it.
   - **Domains:** the project's domain, for the accounts' root email addresses.
   - **What exists:** docs that name accounts, account ids, an organization, single sign-on, budgets.
   - **Where decisions go:** the ADR folder, a decisions file, the infrastructure README.
   Tell the user what you found and **offer to write a starter profile** from `reference/example-profile.md`. Write it only if they agree.

## Step 1: Pick the mode

`plan` (default): the layout and the guide to create it, or to change an existing layout to it. `check`: compare what exists with the pattern and the profile, and list the gaps. An environment named in `$ARGUMENTS` limits either to that environment's account.

## Step 2: The layout

From the baseline and the profile, write down:
- **The organization** and who owns it: the company in the profile. One organization per company that may be sold or handed over on its own; never shared with another company's projects.
- **The management account:** billing, single sign-on and organization-wide policies only; nothing runs in it. Its root email on the project's own domain, a role address that forwards (not a person's mailbox), MFA on root, the root password and MFA in the company's password manager.
- **Member accounts:** one per environment in the profile (and the baseline's optional ones only where the profile asks), each in the main region, each with its own root email (plus-addressing or one address per account, on the project's domain).
- **Sign-in:** single sign-on users and permission sets; no long-lived users or keys for people; root unused after setup.
- **Guardrails:** the baseline's policies (regions allowed, root locked, the audit trail protected), a budget with alerts per account, audit logging across the organization.
- **Fallback region:** documented, not built, as the baseline describes, unless the profile says to build it.
- **What exists now** and what changes: accounts to invite, create, move or close, and in what order.

Record the layout where the profile's `decisions` setting says (an ADR draft by default) and stop for the owner's approval before writing the guide, unless the profile says the owner already approved it.

## Step 3: Check (mode `check`)

With read-only credentials, compare the organization with the layout: the accounts and their emails and regions, single sign-on, policies attached, budgets, the audit trail, the hand-over checklist. Each gap: what's wrong, why it matters (cost, security, hand-over), the fix as a step for the person. Say what couldn't be checked and why. Change nothing.

## Step 4: Write the guide

Ordered steps a person follows, in the shape of each step in the baseline: who, where (console path or CLI), **the region in a callout at every regional step and "global" said out loud at every global one** (organizations, identity, billing and DNS are global on most clouds; single sign-on is enabled in one region, and its home region matters), exactly what to click or type, how to check it worked, what to do if it didn't. Secrets and MFA are typed by the person into the password manager the profile names, never pasted into chat or files. Put steps with a lead time first (an email-sending limit increase, a support case, quota requests). End with the hand-over checklist ticked or marked open, and the fallback-region plan.

Save it where the profile's `guide_path` says (default `<infrastructure folder>/ACCOUNT-SETUP.md`).

## Hand off

Reply with the guide's path, the decisions the owner still has to make, the steps only the person can do (account creation, root passwords, MFA, payment, support cases), and the open hand-over items. Commit only if the profile's `commit` setting is on (default off). Never push. If the project's infrastructure code assumes the old layout (a region, account ids), list what it must change and leave the change to the project's own process.
