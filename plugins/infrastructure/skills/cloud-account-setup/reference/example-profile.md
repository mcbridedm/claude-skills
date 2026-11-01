---
profile_version: 1
cloud: aws
company: Tidepool Labs, LLC
domain: tidepool.example
main_region: us-east-2
fallback_region: us-west-2
build_fallback: false
environments: [production, staging]
security_account: false
sso_home_region: us-east-2
password_manager: the company vault in the team password manager
decisions: docs/adr
guide_path: infra/ACCOUNT-SETUP.md
commit: false
---

<!-- Fictional example. Copy to .claude/cloud-account-setup.md and change every value. -->

## Existing

- One standalone account, "tidepool", made by the founder before the company existed: email sending and a backup bucket in us-east-1. Plan: it becomes the management account once its workloads move to the new member accounts; the email-sending limit is requested again in us-east-2.

## Other organizations

- The founder's consulting company has its own organization. Nothing is shared with it.

## Lead times

- Email sending out of the sandbox: a support case, often a day or more. First, so it's ready before launch.

## Hand-over

- Domains and DNS: the registrar and DNS provider accounts.
- Code: the code host organization.
- Packages: the registry organization.
- Payments and email: their accounts.
