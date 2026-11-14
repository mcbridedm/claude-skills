# The regional-pricing profile

Location: `.claude/regional-pricing.md` in the repository. Markdown with YAML front matter. The base country, base prices and competitors are asked for when they can't be found; everything else has a default.

## Front matter

| Key | Meaning | Default |
|---|---|---|
| `profile_version` | Format version. | `1` |
| `base_country` | The country whose prices the others follow (ISO 3166 code). | Ask |
| `base_currency` | Its currency (ISO 4217 code). | The base country's |
| `products` | The paid products: each with `id`, `kind` (`monthly`, `yearly`, `weekly`, `lifetime`, `one-time`, `consumable`), `base_price`, and optionally `name`. The ratios between them are taken from these prices. | Discovered from the code, else ask |
| `stores` | Where the products are sold: `app-store`, `google-play`, `web` (with the payment provider), or others. | Discovered from the code |
| `match_stores` | People see the same price on every store in a country; prices come from the strictest store's grid. | `true` when more than one store |
| `countries` | The countries sold in (ISO codes), or `all` for every country the stores sell in. | `all` |
| `competitors` | The closest competitors: each with `name` and a store listing or pricing page URL per store. | From the docs, else ask |
| `anchors` | The mainstream subscriptions that make the index, in order (the first is the value check's anchor). | Spotify Premium Individual, Apple Music individual, YouTube Premium individual, Netflix's cheapest ad-free plan |
| `ppp_source` | `world-bank` (indicator `PA.NUS.PPPC.RF`) or `imf`. | `world-bank` |
| `fx_source` | Where exchange rates come from, on the run's date. | European Central Bank reference rates, a named second source for the rest |
| `floor_share` | The lowest share of the base price any country gets. | `0.333` |
| `review_months` | Months between reviews. | `6` |
| `review_months_volatile` | Months between reviews for high-inflation countries, or after a currency move larger than `currency_move_threshold`. | `3` |
| `currency_move_threshold` | A move against the base currency since the last table that brings a review forward. | `0.15` |
| `regions` | How countries are split among the research agents. | Americas; Europe; Middle East and Africa; Asia-Pacific |
| `output` | Where the table is written; `<date>` is replaced. | `docs/pricing/regional-prices-<date>.md` |
| `output_mode` | `new-file` (one file per run) or `append` (a dated section in one file). | `new-file` |
| `commit` | Commit the table. | `false` |

## Sections

| Section | What it holds | Default |
|---|---|---|
| `## Fixed prices` | Prices the user has already decided, per country and product, with the reason. Kept as they are and checked like the rest. | None |
| `## Live prices` | The prices live today, or where to read them (a store export, a file in the repository), for review mode. | The previous table |
| `## Local norms` | Known local departures from the base ratios (e.g. weekly plans common in a market). | None |
| `## Notes` | Anything else the run should know: a launch order, markets to treat with care. | None |

## Discovery without a profile

- **Products and prices:** product ids in purchase or billing code, store configuration files, a pricing page, payment provider price ids, decision records naming prices.
- **Stores:** store SDKs and payment libraries in the dependencies.
- **Countries:** a launch plan or availability list in the docs.
- **Competitors:** a competitors or market section in the docs.

Say where each value came from, ask for the rest, and offer to write a starter profile from `example-profile.md`.
