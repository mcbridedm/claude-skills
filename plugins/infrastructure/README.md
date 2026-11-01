# infrastructure plugin

Skills about infrastructure as code, cloud environments and CI.

| Skill | Invoke | What it does |
|---|---|---|
| [cloud-first-apply](skills/cloud-first-apply/README.md) | `/infrastructure:cloud-first-apply [root]` | A step-by-step first-apply guide for an IaC root: region callouts at every step, cross-environment checks, DNS records and when they go live, secrets, vendor steps, and a scale-to-zero ('park') drill, if the project has one. Never applies. Configured by `.claude/cloud-first-apply.md`. |
| [ci-repro](skills/ci-repro/README.md) | `/infrastructure:ci-repro [run]` | Reproduces a failing CI or workflow job in a throwaway local replica of its environment, finds the cause from output the CI log didn't keep, narrows it one difference at a time, and tries the fix there; writes a read-only diagnostic for the real runner when the cause only shows there. Never pushes, reruns CI or copies secrets. Configured by `.claude/ci-repro.md`. |

Install: see the [repository README](../../README.md#install).
