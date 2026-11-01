# ci-repro

Reproduces a failing CI or workflow job in a throwaway local replica, finds the cause from output the CI log didn't keep, and tries the fix there before the next real run.

- **Invoke:** `/infrastructure:ci-repro [run URL or id, or workflow and job]` when installed as a plugin, or `/ci-repro` when copied into a skills folder.
- **Produces:** a reply with the failure, the root cause and the line of output that shows it, a table of what was tried, the fix and where it was tried, and what only the real run can show. When the cause only shows on the real runner, a short read-only diagnostic for the user to run there. It commits nothing unless asked.
- **Side effects:** pulls the job's images, and starts and removes throwaway containers (labelled, so clean-up finds them) that run the project's code. Never pushes, reruns or dispatches CI, changes CI settings, or copies real secrets.
- **Cost:** no sub-agents. Minutes to an hour, mostly the job's own setup (image pull, dependency install) run once or twice.
- **When to run it:** a CI job or scheduled workflow fails and its log doesn't say why; a job fails on the runner but passes locally; before changing code to fix a failure you haven't seen happen. Not for a failure whose log already names the cause (fix that directly), or for flaky tests across many runs (a flake report fits better).

## Context check

Step C weighs anchoring most: a conversation that has already named the cause builds a replica that confirms it.

## Project profile

Optional. Put project specifics in `.claude/ci-repro.md`; see [reference/profile-format.md](reference/profile-format.md) and the [example](reference/example-profile.md). Without one, the skill discovers the CI system, the job files, log access and the local container runtime, and offers to write a starter profile.

## Sample output

A fictional run:

```
CI repro: integration / api-contract, run 88412 at 4be1c0d
Failure: "start mock server" step, exit 1, "server failed to connect", nothing else logged
Root cause: the server, started in the job's working folder, refused to load:
  that folder holds an empty package.json the test harness writes there.
  Evidence: the server's stderr, captured in the replica: "Invalid package config <workdir>/package.json"
Tries:
| Change | Result |
|---|---|
| Replica as the job runs it | fails the same way |
| Server's stderr to a file | shows the package.json error |
| Server started in its own folder | connects |
Fix: the harness starts the server in a folder of its own and keeps its stderr in the job's artifacts
  (tried in the replica: yes, passed)
Not seen yet: the self-hosted runner's run; the next scheduled run shows it
Leftovers: containers removed
```
