# Personas

The default roster has two parts: three people personas that every run uses, and three agent personas that join only when the product has a surface agents can use. A profile can keep, drop, rename or replace any of them, and add its own.

## People (always)

| # | Persona | Who they are | Typical journeys |
|---|---|---|---|
| 1 | **Curious newcomer** | A person who has just heard of the product and knows little about the field. Reads the landing page and help before anything else; gives up when stuck. | First visit, learning what it's for, sign-up and confirmation, a first real use, understanding any limits on new accounts |
| 2 | **Regular** | A person who uses it most days, and helps run a corner of it (an admin of their team, a moderator, a store manager). | The core loop, notifications, settings, handling something going wrong (a dispute, a refund, a report), recovery (lost password or device) |
| 3 | **Bad actor** | Someone trying to abuse the product, a person or a script. Takes one or more hats per run, chosen by the kind of product (below); the profile can pick others. | Beating sign-up checks, limits and permission rules; making abuse look legitimate; reaching other users' data or money; coming back after a ban |

## Agents (added when there's an agent-facing surface)

Step P adds these when discovery finds a surface an agent can use on its own: a public API (an OpenAPI file), a CLI, an SDK, an MCP server, or discovery files such as `/llms.txt` or `/.well-known/*`. Without one, the run uses the three people personas only. A profile can add or drop them either way.

| # | Persona | Who they are | Typical journeys |
|---|---|---|---|
| 4 | **Agent builder** | A developer connecting an AI agent or integration they run (through the API, CLI, SDK or MCP server) and answering for it. | Getting credentials for it, connecting it, its first actions, telling who's responsible for what it does, revoking it |
| 5 | **Autonomous agent, first contact** | An AI agent with no human help, which found the product through its public docs or discovery files. Reads only machine-facing docs and error messages. | Discovery, registration and auth, the core API calls, recovering from errors and limits on its own |
| 6 | **Power agent** | An AI agent working at volume over time. | Rate limits and retries, credential expiry and rotation, pagination, idempotency, policy or API changes reaching it |

## Bad-actor hats by product type

Step P picks the hats from what the product is. A product of more than one kind takes hats from each. When the agent personas are on, the bad actor also gets the prompt injector: text aimed at other users' AI agents.

| Product type | Hats |
|---|---|
| Community or content (posts, comments, ratings) | spammer, vote or rating ring, sock-puppet farm, harasser |
| Commerce or payments (a shop, a marketplace, invoices paid by card) | card tester, review ring, refund abuser, promo or referral farmer |
| SaaS or API (accounts, workspaces, a public API) | scraper, credential stuffer, quota abuser, someone reaching another tenant's data |
| Anything with reputation, rewards or limits | someone gaming that rule |

## Writing a persona

A good persona says:
- **who** they are and what they came to do, in one or two sentences;
- **what they know** going in (nothing, the docs, the API only);
- **what they may see** (the allowed view: pages, files, commands);
- **their journeys**, in the order they'd do them;
- for bad actors, **the hats** and what counts as "it worked".

Split a persona when two kinds of user would take very different paths through the same journey (a newcomer and a regular both sign in, but only one needs to learn what a team role is). Don't split by every combination: six focused personas find more than twelve thin ones.
