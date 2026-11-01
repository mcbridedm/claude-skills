# The baseline

The pattern every plan follows and every check compares against. AWS terms first; the table at the end maps them to other clouds. The profile can turn the optional parts on and off; the rest is the pattern.

## One organization per company

- An organization belongs to one company: the one that would be sold or handed over with the project. Two companies, two organizations, even when one person runs both; one company's administrators can always reach every account in its organization, and its management account pays every member's bill.
- Nothing crosses between organizations: no shared state bucket, encryption keys, logging account, network, roles that trust the other organization, container registry or DNS zone.

## The management account

- Billing, single sign-on (IAM Identity Center), organization-wide policies and the budget. **No workloads**: nothing the project runs lives here.
- Root email: a role address on the project's domain that forwards (e.g. `aws@<domain>`), never a person's own mailbox, so it can be handed over.
- Root: MFA on, the password and MFA in the company's password manager, used only for the few tasks that need root.
- The legal name and address on the account are the company's; payment is the company's card or invoicing.

## Member accounts

- One per environment the profile lists (e.g. production, staging, preview). Optional, when the profile asks: a security or audit account that holds the organization's trail and findings; a shared-services account only if the project genuinely shares something between its own environments.
- Each has its own root email on the project's domain (`aws+<env>@<domain>` where the mail host supports plus-addressing, else one forwarding address each).
- The main region holds the account's resources; global services stay global. Note the services that must live in a fixed region whatever the main region is (on AWS: certificates and the web firewall for CloudFront in us-east-1).

## Sign-in

- Single sign-on users, one per person, with MFA; permission sets per job (admin, read-only, billing). Access to an account is a permission-set assignment, so removing a person removes it everywhere.
- No IAM users or long-lived keys for people. Machines use roles: CI through OIDC federation, workloads through their service's role.
- Identity Center has a home region; pick it once (usually the main region) and record it, since moving it means setting it up again.

## Guardrails

- **Service control policies:**
  - regions limited to the main and fallback regions, plus what global services need;
  - root use denied in member accounts;
  - the audit trail and its bucket protected from change;
  - leaving the organization denied.
- **Budgets:** one per account with alerts to the company's role address; a total on the management account.
- **Audit:** an organization trail of management events in every region, kept for at least a year, in the security account if there is one; threat detection (GuardDuty) on in every account and region used.
- **Tags:** a cost-allocation tag for project and environment, so the bill splits cleanly.

## Hand-over checklist

Tick each, or mark it open with what's missing:

- [ ] The organization holds only this company's projects.
- [ ] The management account's legal name, address, payment and root email are the company's; the root password and MFA are in the company's password manager.
- [ ] Every member account's root email is a role address on the project's domain.
- [ ] People sign in only through single sign-on; no IAM users or access keys belong to a person.
- [ ] Nothing is shared with another organization (state, keys, logs, networks, roles, registries, DNS).
- [ ] The infrastructure code builds every account's resources; anything made by hand is listed with a reason.
- [ ] The domains, DNS provider, code host, package registries and third-party vendors the project uses are in the company's name (a list, with each one's owner).
- [ ] The guide and the decisions are in the repository, so a new team can rebuild it.

## The fallback region (documented, not built)

Unless the profile says to build it, write down:

- **Which region,** and why (distance from the main one, the same services and prices, a different failure history).
- **What's already there:** copies that already live in it (backups replicated across regions, encryption keys that work in both).
- **What the code must take as a variable** so the environment can be applied there: the region, region-specific names, the fixed-region exceptions.
- **The steps and how long they take:** restore data, apply, switch DNS, re-request email-sending limits and quotas, rotate anything tied to the old region.
- **Who decides** to fail over, and how the decision is recorded.
- **When to revisit:** an uptime target that one region can't meet, a customer contract, or a real outage.

## The shape of each guide step

```
### <n>. <What>
- **Who:** owner / operator / agent
- **Where:** console path, or the CLI command
- **Region:** "check the top right says <Region name> (<code>)", or "Global: the region doesn't matter here"
- **Do:** the exact clicks or command
- **Check:** how to see it worked
- **If not:** the usual cause and what to do
```

## Other clouds

| AWS | Google Cloud | Azure |
|---|---|---|
| Organization | Organization (needs a Cloud Identity or Workspace domain) | Tenant and its root management group |
| Management account | The organization node and its billing account | A management group, and the billing account |
| Member account | Project, grouped in folders per environment | Subscription, under management groups |
| IAM Identity Center | Cloud Identity / Workforce identity | Entra ID |
| Service control policy | Organization policy | Azure Policy |
| Organization trail, GuardDuty | Audit Logs, Security Command Center | Activity Log, Defender for Cloud |
| Budgets | Billing budgets | Cost Management budgets |
