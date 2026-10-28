# headless-job

Turns a recurring Claude Code task into a job that runs on its own schedule, outside any chat session.

**Why:** a task run from a session (a session cron, `/loop`) re-reads the whole conversation every time it fires, ends when the session ends, and runs with the session's broad permissions. As a headless job it costs only its own small context, survives restarts and reboots, and is authorized once, narrowly, in its own files. A cheap shell guard means most runs don't start Claude at all.

**What it does:**
1. **Judges** whether the task can run headless: what it needs, whether it can be authorized narrowly, whether there's a cheap guard, and what needs a person. Some tasks can't, for example one that reads a site only through your signed-in browser, and it says so.
2. **Writes the job**: `prompt.md`, the `tools` it may use (everything else is refused), a `guard`, a `model` and a spend cap, and a launchd (macOS) or systemd (Linux) schedule.
3. **Hands you the install command.** It never installs schedules itself.

## Invoke

```
/setup:headless-job check open PRs every hour and summarise anything new
```

## The job folder

```
jobs/
  bin/run            runs one job: guard → claude -p (scoped tools, model, budget) → log → notify on OWNER: lines
  bin/install        installs the schedules (launchd on macOS, systemd user timers on Linux); you run it
  <name>/
    prompt.md        what to do, what's out of bounds, the reply shape
    tools            one --allowedTools rule per line
    guard            cheap check; exit 1 = nothing to do (optional)
    model, budget    default sonnet, USD 2 per run
    workdir          where to run (optional)
  launchd/  systemd/ the schedules
```

- **Logs:** `~/Library/Logs/claude-jobs/` (macOS) or `~/.local/state/claude-jobs/` (Linux).
- **Pause:** `touch ~/.claude/jobs-state/paused-<name>` (or `paused` for all).
- **Needs a person:** a reply line starting `OWNER:` raises a desktop notification.

## Cost

Low: one session, no sub-agents. The job's own runs cost what its prompt and model cost, and nothing when the guard says there's no work.

## Context check

Readiness weighs most: the task must be clear, and any credentials it needs must already be on the machine (a job never stores secrets in its own files).
