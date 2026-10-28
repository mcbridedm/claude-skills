---
name: cloud-first-apply
description: Turns an infrastructure-as-code root (OpenTofu/Terraform, CDK, Pulumi, CloudFormation, Bicep) into a step-by-step first-apply guide for a new cloud environment - who does each step, where, in which region (with a region callout at every regional step and "global" said out loud), the exact command, how to check it worked and what can go wrong. Checks the root can apply on its own (no hidden dependency on another environment), lists every DNS record and when it goes live, every secret a person must enter, console-only and third-party steps, and, if the project parks or scales to zero, that the parked state is consistent and what it keeps and deletes. Never applies anything. Reads .claude/cloud-first-apply.md for project specifics, or discovers them. Use when the user asks for a first-apply plan, a deployment checklist, a go-live runbook, or "how do I bring this environment up".
argument-hint: "[root or environment, e.g. deploy/terraform/prod]"
disable-model-invocation: true
---

# Cloud first apply

You write the guide a person follows to bring up a cloud environment for the first time from the project's infrastructure as code. The guide is the product: ordered, specific, checkable. **You never apply, deploy, create cloud resources, change DNS or touch secrets.** You may run read-only commands (format, validate, init without a backend, a plan with mocked providers if the tool supports it) and read the cloud provider's public docs.

Project specifics come from the project's **profile** (Step P). This file stays general: tools, clouds and providers named here are examples or defaults.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/guide-format.md`: the shape of the guide and of each step.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starter profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2):** if this conversation wrote the infrastructure code, it may skip steps it "knows" are done. Recommend a fresh session when the guide is for someone else to follow.
- **Context load (3):** the inventory reads every resource in the root.
- **Moving target (5) and readiness (6):** no apply, deploy or infrastructure change in flight; the tools and read-only credentials the checks need are present.

## Step P: Load the profile

1. Read `.claude/cloud-first-apply.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md`.
2. **No profile:** discover, without sub-agents, noting where each value came from:
   - **IaC tool and roots:** `*.tf` with a `backend` or `cloud` block (OpenTofu or Terraform: `.terraform-version`, `.opentofu-version`, CI that runs `tofu` or `terraform`), `cdk.json`, `Pulumi.yaml`, `template.yaml`/`*.cfn.yaml`, `*.bicep`. Each environment's root.
   - **Cloud and regions:** provider blocks and their `region`, aliases, defaults; which services are global for that cloud.
   - **DNS:** who serves the zone (a DNS provider's resources, or docs naming one) and which records the root outputs.
   - **Secrets:** secret resources created empty for a person to fill, variables marked sensitive, docs that say "set X by hand".
   - **CI/CD:** workflows that deploy, and the variables and secrets they read.
   - **Park or scale-to-zero:** a parked mode, schedules that scale down, scripts named park/unpark/stop/start.
   - **Where guides go:** the IaC folder's README, or `docs/`.
   Tell the user what you found and **offer to write a starter profile** from `reference/example-profile.md`. Write it only if they agree. Either way, list the values used in the guide's "Profile used".

## Step 1: Pick the root

The root or environment named in `$ARGUMENTS`, else the profile's default, else ask. One guide per environment.

## Step 2: Read-only checks

Run the tool's own checks without credentials or state: format, validate, an init without the backend (OpenTofu/Terraform: `fmt -check`, `init -backend=false`, `validate`; CDK: `synth`; Pulumi: `preview` only if it can run offline). Note version pins of the tool and providers, the state backend and whether it must exist before the first apply (a state bucket, a lock table), and any provider that needs credentials just to plan. Record failures as blockers at the top of the guide.

## Step 3: Inventory

List what the root creates, grouped by service, each with its **region** (or **global**) and whether it costs money while idle. Name the account or subscription it lands in. Flag anything created outside the profile's main region (backup copies, global edge services' certificates in a fixed region, KMS keys).

## Step 4: Can it apply on its own?

Find every reference to something this root doesn't create: remote state, data sources looking things up by name or tag, shared resources owned by another environment, parameters another environment writes. For each: does it exist before the first apply? If not, the guide either orders the other step first or the root needs a change (say so as a blocker; don't edit it).

## Step 5: The steps a person must do

Collect, from the code, outputs, READMEs and the provider's docs:
- **Account and access:** sign-in, the CLI profile, the region check, permissions the applier needs.
- **Bootstrap:** state storage, service quotas, service-linked roles, sandbox exits (e.g. email sending), budgets.
- **Certificates and their validation records** (and how long validation takes).
- **Images or artifacts** that must exist before services start.
- **Secrets** to enter, each with where and how to type it without it landing in shell history, git or logs.
- **DNS records**, each with its type, name, target, proxy or TTL settings, and **when** it goes live (validation now; mail any time; app hostnames when ready; the apex at go-live). Lower TTLs ahead of any cutover.
- **Third-party connectors** (alerting, monitoring, CI variables and secrets).
- **Migrations and first data** (run before traffic).
- **Turning things on** (pipelines, schedules), last.

## Step 6: Park and scale to zero (if the project has it)

If the profile names a parked mode: list what parking deletes, stops or keeps; check that the parked configuration is consistent (e.g. a plan of the parked state against the parked config shows no changes, if it can be planned offline); note what restarts on its own (some databases restart after a set number of days stopped) and how the project guards against it; and add a **park drill** to the guide (dry run, park, the consistency check, unpark, timed), plus "don't let the automatic park fire before the drill passes".

## Step 7: Write the guide

Follow `reference/guide-format.md`: a short summary, blockers, the profile used, then numbered steps in apply order. **Every step that touches a regional service says the region in a callout** ("check the top right says N. Virginia (us-east-1)"), and every global one says it's global, so a console opened in the wrong region doesn't trip anyone. Each step: who (maintainer / operator / agent), where (console path, CLI, DNS provider), the exact command or click path, how to check it worked, and what to do if it didn't. End with the smoke test, a rollback or teardown note, and the cost while running and while parked if the project has estimates.

Save it where the profile says (default `<iac folder>/FIRST-APPLY-<environment>.md`), or update the profile's named README section.

## Hand off

Reply with the guide's path, the blockers, and the steps that need the user (secrets, DNS, consoles). Commit only if the profile's `commit` setting is on (default off). Never push.
