# cloud-first-apply

Writes the guide a person follows to bring up a cloud environment for the first time from its infrastructure as code. For one root (OpenTofu/Terraform, CDK, Pulumi, CloudFormation, Bicep), it produces an ordered checklist: who does each step, where, **in which region** (a callout at every regional step, and "global" said out loud), the exact command or click path, how to check it worked and what to do if it didn't. It checks the root can apply on its own, lists every DNS record with when it goes live, every secret a person types and how, console-only and vendor steps, migrations, and, for projects that park or scale to zero, a consistency check and a timed park drill.

- **Invoke:** `/infrastructure:cloud-first-apply [root or environment]`
- **Produces:** the guide, at the profile's `guide_path` (default `<iac folder>/FIRST-APPLY-<environment>.md`).
- **Cost:** one session, no sub-agents; read-only commands only.
- **Side effects:** none. It never applies, creates resources, changes DNS or handles secret values. It commits the guide only if the profile says so.
- **When to run:** before an environment's first apply, and again when its root changes a lot before that apply.

## Profile

`.claude/cloud-first-apply.md`: the environments, DNS, secrets, a scale-to-zero ("park") mode if there is one, extra steps and costs. Format: [reference/profile-format.md](reference/profile-format.md); a fictional [example](reference/example-profile.md); the guide's shape: [reference/guide-format.md](reference/guide-format.md). Without a profile it discovers what it can and offers to write a starter.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. A fresh session matters most when this conversation wrote the infrastructure code and the guide is for someone else to follow. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Sample output (fictional)

> ### 3. Validate the certificate
> - **Who:** maintainer
> - **Where:** DNS provider → zone `tidepool.example`
> - **Region:** Global (DNS); the certificate itself is in N. Virginia (us-east-1), because the CDN only uses certificates from there.
> - **Do:** add the CNAME from `tofu output certificate_validation` (proxy off, TTL auto).
> - **Check:** `aws acm describe-certificate … --region us-east-1` shows `ISSUED` (usually under 30 minutes).
> - **If not:** a record behind the DNS provider's proxy never validates; turn the proxy off for it.
