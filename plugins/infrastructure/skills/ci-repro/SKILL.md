---
name: ci-repro
description: Reproduces a failing CI or workflow job locally before any code changes. Reads the job's definition (GitHub Actions, GitLab CI, CircleCI, Buildkite, a Jenkinsfile, a Makefile target CI calls), rebuilds its environment in a throwaway container (the same image by digest, the same flags and setup steps, the failing commit's files, no real secrets), runs the failing step with the debug output the CI log didn't keep, and narrows the cause by changing one difference at a time. When the cause only shows on the real runner, writes the smallest read-only diagnostic for the user to run there. Fixes are tried in the replica first; the real CI run is the last proof. Never pushes, reruns CI or copies secrets. Reads .claude/ci-repro.md for project specifics, or discovers them. Use when a CI job or scheduled workflow fails and the log doesn't say why, "it works on my machine", or "reproduce the CI failure".
argument-hint: "[run URL or id, or workflow and job name]"
disable-model-invocation: true
---

# CI repro

You find out why a CI or workflow job fails by rebuilding its environment where you can see inside it, before anyone changes code on a guess. The product is a root cause with evidence (the line of output that shows it), and a fix tried where the failure happened. **You never push, rerun or dispatch CI, change CI settings, or copy real secrets into the replica.** You may pull images, start and remove throwaway containers, and run the project's code inside them. Anything on the real runner or environment is the user's to run, read-only, unless they say otherwise.

Project specifics come from the project's **profile** (Step P). This file stays general: CI systems, runtimes and tools named here are examples or defaults.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in example, also the starter profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Anchoring (4):** weighs most. A conversation that has already named the cause ("it's the sandbox", "it's a flaky network") will build a replica that confirms it. If one is on the table, say it, and treat it as one hypothesis among the differences in Step 2.
- **Context load (3):** build logs and setup output are long; save them to files and read the parts you need.
- **Readiness (6):** a local container runtime (Docker, Podman) or the job's runtime, the CI system's CLI or log access, and enough disk for the image.
- **Moving target (5):** a newer commit or a rerun may already have changed the failure; pin the run you're reproducing. Authorship (2) weighs little: this skill investigates, it doesn't judge the author's work.

## Step P: Load the profile

1. Read `.claude/ci-repro.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md`.
2. **No profile:** discover, without sub-agents, noting where each value came from:
   - **CI system and job files:** `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/config.yml`, `.buildkite/`, `Jenkinsfile`, `azure-pipelines.yml`, and any script or `Makefile` target they call.
   - **Log access:** the CI system's CLI (e.g. `gh run view --log-failed`, `glab ci trace`) or its web page.
   - **Runners:** hosted or self-hosted, OS and CPU architecture, and anything the docs say about them (nested containers, a VM or system container they run in).
   - **Local runtime:** `docker` or `podman` on PATH, and the machine's architecture.
   - **Secrets the jobs read:** names only, from the job files.
   Tell the user what you found and **offer to write a starter profile** from `reference/example-profile.md`. Write it only if they agree.

## Step 1: Pin the failure

1. Identify the run: the URL or id from the argument, or the newest failed run of the named workflow. Record the commit, the job, the runner, and when it ran.
2. Save the failed job's log to a scratch folder and find the first real error: the failing step, the command, its exit code, the last lines before it. Note what the log doesn't say (a child process whose output wasn't kept, a "failed" status with no message).
3. Check whether it fails every time (earlier runs of the same job, other commits). A failure that comes and goes changes Step 4: run it several times.

Say in two or three lines what failed and what's missing from the log before building anything.

## Step 2: Read the job and list the differences

From the job definition (and any script it calls), write down how the job builds its environment:
- **Where it runs:** the runner's OS, architecture and kind; a container image (by tag or digest); a service container.
- **How the container starts:** its user, privileges, security options, mounts (a Docker socket, caches), network mode, host aliases, environment variables, working directory.
- **What the setup installs,** with versions: the language runtime, package managers, system packages, tools.
- **How the code arrives:** a checkout, an archive, a cache restore, and at which commit.
- **The failing command,** exactly as the job runs it, with its arguments and environment.

Then list the **differences between the job and a local replica**, in two groups:
- **Reproducible:** everything you can set the same way locally.
- **Not reproducible here:** secrets, the runner's kernel and how it's hosted (a VM, a system container, nested virtualization, security modules), its network and egress rules, a different CPU architecture you can only emulate, hosted services. Each is a candidate cause if the replica passes.

## Step 3: Build the replica

1. **Same image, by digest** where the job pins one (pull it; if the local architecture differs, say so and use the image's matching variant or emulation, noting it as a difference).
2. **Same flags**, minus anything that would hand the container your credentials: never mount your home folder, SSH or cloud config, or the user's tokens. Give it a throwaway name and a label so it's easy to find and remove.
3. **The failing commit's files**, not your working tree (e.g. `git archive <commit> | <runtime> exec -i <name> tar -x -C <dir>`), unless you're testing a fix.
4. **The same setup steps and versions**, run inside the container as the job runs them.
5. **Secrets:** pass none. If the failing step needs one, stop before it and say which. A placeholder is fine only where the code path never sends it anywhere.
6. **Users and permissions:** run as the job's user. If that user can't reach something the job could (a socket's group), match the job's setup, not by widening permissions.

## Step 4: Reproduce, then narrow

1. Run the failing command as the job does. Save its output.
2. If it fails the same way, **get the output the CI log didn't keep:** the tool's debug or verbose mode (e.g. `--debug`, `-v`, `DEBUG=*`), a child process's stderr redirected to a file, the tool's own log folder. That line is usually the root cause.
3. **Narrow it:** change one difference at a time (a flag, an environment variable, the user, the working directory, a version) until the failure appears or goes away. Record every try in a table: what changed, what happened.
4. **If the replica passes,** the cause is in the "not reproducible here" group. Write the smallest **diagnostic for the real environment**: read-only commands, each printing a labelled result, ideally run in a throwaway copy of that environment so the real one stays clean. Never print full process command lines or the environment (they carry secrets). Hand it to the user to run, read the output with them, and go back to step 3 with what it shows.

## Step 5: Fix and confirm

1. Write the fix (in the project's code, the job definition, or the runner's setup), following the project's own rules for those files. Changes to CI files or runner setup need the user's go if the project says so.
2. **Try it in the replica first:** copy the changed files in and run the failing command again. Then the project's normal checks.
3. If the failure can only be seen on the real runner, say so, and say what the next real run will prove.
4. Where the CI log hid the cause, offer to make the job keep that output from now on (a child's stderr in the job's artifacts, a debug flag on failure), so the next failure says why.

## Clean up

Remove the containers you started (by their label), and the scratch folder unless the user wants it. Leave pulled images unless the profile says to remove them. Never touch containers you didn't start.

## Hand off

Reply with:

```
CI repro: <workflow / job>, run <id> at <commit>
Failure: <step and error, one line>
Root cause: <one or two lines>, evidence: <the output line, and where it came from>
Tries:
| Change | Result |
|---|---|
Fix: <what changed, where> (tried in the replica: <yes, passed | no, why>)
Not seen yet: <what only the real run can show>
Leftovers: <containers removed | kept on purpose>
```

Commit nothing unless the user asks; the fix goes through the project's usual checks and commit process. Never push or rerun CI: give the user the commands.
