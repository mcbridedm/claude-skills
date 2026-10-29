# Verifying by surface

Used by Step 1 when the profile has no `verify`, or for a surface it doesn't cover. Prefer, in order: a throwaway instance the project already scripts (the one its browser or integration tests start), then its dev servers, then nothing (say so). Never production, never real accounts or real credentials.

## Finding the instance

Look for, in this order:
- a project skill or script that runs the app for checking (`.claude/skills/*/SKILL.md` mentioning run, verify or stack; `scripts/`, `Makefile`, `package.json` scripts named like `stack`, `serve`, `preview`, `start:test`);
- the end-to-end test setup (e.g. a Playwright `globalSetup`, a docker compose file for tests): it usually starts a clean database and the servers with test settings;
- the dev command in the README (`npm run dev`, `docker compose up`, `cargo run`), against a local database.

Start long-running servers in the background and wait for a ready line or a health check, not a fixed sleep. Note the URLs and the log files.

## Web

- Use a browser tool (e.g. Claude in Chrome, or Playwright from the shell for a screenshot and the page text).
- Sign in as a test account the instance provides or creates; prefer a sign-in link or code read from the instance's log mailer over typing passwords.
- Do what a person would: click, type, submit. Look with a screenshot and the page text; read the console for errors.
- Where the project has rules about forms without JavaScript, keyboard access or contrast, check the part the change touched.

## HTTP API

- `curl -s -w '\n%{http_code}\n'` against the instance, with a test token, for the success case and the refusal case (no token, another account's token).
- Check the status code and the body's shape, not only that it answered.

## CLI

- Point it at the instance (an environment variable or flag for the API URL and a test token) and run the changed command, including its `--help` when that changed.

## Jobs and workers

- Run the job once with the instance's settings (the project's job runner or entry point), then look at what it changed through the API or the UI, and at its log.

## Library or SDK

- Write a throwaway script in a temporary folder that imports the built package the way a user would, and calls the changed function. Delete it afterwards.

## Logs

After driving it, search the instance's logs for `error`, `warn` and unhandled exceptions. A server error during the check fails it even if the screen looked right.
