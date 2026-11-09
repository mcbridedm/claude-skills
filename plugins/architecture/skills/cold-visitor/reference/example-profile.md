---
profile_version: 1
project: tidepool
live_url: https://tidepool.example
default_prompt: "go engage with {target}"
default_mode: read-only
live_full: blocked
model: sonnet
minutes: 20
report_folder: docs/reviews/cold-visits
commit: false
push: false
---

<!-- A fictional example. Tidepool is a made-up booking site for sailing clubs. -->

## Hosts

- read-only: docs.tidepool.example, github.com
- throwaway: localhost, registry.npmjs.org
- live-full: api.tidepool.example

## Canaries

tidepool
harbourmaster-01
okafor

## Run

Start with `make preview`. It prints the URL and uses a throwaway database with mail logged. Stop with `make preview-down`.

## Tracked

`ROADMAP.md`, "Open". Add new defects under "Found by a visit".

## Expected

- Sign-up says "invitation only": closed beta, until the spring opening.
- The clubs list is empty on a fresh instance: seeding is a later step.

## Safety

`live_full` is blocked: the live site takes real payments and has no test accounts yet.
