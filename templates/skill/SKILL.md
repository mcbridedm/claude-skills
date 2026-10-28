---
name: skill-name
description: One or two sentences that say what the skill does and when to use it, with the words a user would actually type ("review", "audit", "release notes"). Put the main use case first. Say what it needs from the repository, if anything (e.g. "reads .claude/skill-name.md for project specifics").
argument-hint: "[optional argument]"
# Keep this for skills that are expensive, spawn agents, commit, or have other side effects:
disable-model-invocation: true
---

# Skill title

One paragraph: the role Claude takes, what the skill produces, and its limits (what it must not change).

Project specifics come from the project's profile at `.claude/skill-name.md` (Step P). This file stays general: no project names, paths, vendors or tools unless they're examples or defaults.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- <Which signals weigh most for this skill, and why. A skill that judges work weighs authorship (2) and anchoring (4) heavily; one that reads a lot weighs context load (3); one that commits weighs moving target (5) and sequence (7).>

## Step P: Load the profile

1. Read `.claude/skill-name.md` at the repository root if it exists.
2. Otherwise, discover sensible defaults from the repository (README, CLAUDE.md or AGENTS.md, manifests, CI config), tell the user what you found, and offer to write a starter profile.

## Step 1: ...

## Step 2: ...

## Hand off

What to reply with, what to commit (if anything), and where the outputs are.
