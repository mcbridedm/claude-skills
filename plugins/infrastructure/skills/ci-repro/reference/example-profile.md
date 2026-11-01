---
profile_version: 1
ci: github-actions
job_files:
  - .github/workflows/
  - scripts/ci/
logs: gh run view {run} --log-failed
runtime: docker
label: ci-repro
remove_images: false
ask_before:
  - .github/
  - ops/runners/
---

# ci-repro profile (example: a fictional web app, "Lanternfish")

## Runners

- **Hosted (`ubuntu-latest`):** x86_64 VM, Docker available. The unit tests and the build run here.
- **Self-hosted (`lf-integration`):** an arm64 machine; jobs run in a system container on it, and start their own Docker containers inside that (nested). The integration tests run here.

## Known differences

- A developer's laptop doesn't nest a container runtime inside a system container, so kernel and security-module limits on `lf-integration` don't show locally. Check them in a throwaway copy of the runner's container (`ops/runners/README.md`, "Throwaway copies"), never in the live one.
- The integration network only reaches the internet; nothing on the runner's host.

## Secrets

- `DEPLOY_TOKEN` (deploy job only). `TEST_API_KEY` (the contract tests; a placeholder is fine, they hit a local fake).

## Real-environment diagnostics

- The user runs them with `ssh lf-runner '…'`. Never print process command lines (`ps -ef`, `pgrep -a`) or environments: the runner's registration token passes through both.

## Fix rules

- Workflow and runner changes need the maintainer's go and a lint run (`actionlint`); everything else follows the normal pull request checks.
