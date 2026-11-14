# regional-pricing

Recommends a local price per country for each paid product of an app or service (monthly and yearly subscriptions, one-time or lifetime purchases, in-app purchases), so no country is priced by a store's exchange-rate conversion, and every price reads as excellent value without looking cheap. It builds a digital price index from mainstream subscriptions priced per country (Spotify, Apple Music, YouTube Premium, Netflix by default), cross-checks it against purchasing power and the closest competitors' local prices, rounds to each market's natural price ending, keeps a floor, checks each store's current rules, and writes a dated table with a source and date for every number. It never invents a price: what it couldn't source stays blank.

- **Invoke:** `/business:regional-pricing [review] [country …] [product …]`
- **Produces:** a dated table at the profile's `output` (default `docs/pricing/regional-prices-<date>.md`): per country the currency, the store's default, the index, the purchasing-power ratio, the recommended price per product, the share of the base price, the share of local Spotify and of the competitor's price, and a one-line reason; then the floors applied, how sure it is, whether the base prices look right, the judgement calls, the store rules it relied on and every source.
- **Modes:** full (every country and product, the default); `review` (refresh the numbers and recommend a change only where a price moved a full price step); add (only the countries or products named).
- **Cost:** medium to high: one read-only research agent per region (four by default) running in parallel, each reading many web pages, then the lead's checks and arithmetic. Tens of minutes for every country.
- **Side effects:** writes the table, and the starter profile only if you agree. Commits only if the profile says so; never pushes. **It never enters, changes or schedules a price in a store or payment system.** Prices are a money decision: you approve them and enter them.
- **When to run:**
  - before a first launch in several countries;
  - when adding countries or paid products;
  - at the scheduled review (every 6 months by default; every 3 for high-inflation countries or after a currency move of more than 15%);
  - when asking "what should we charge in Japan", "regional pricing", "PPP pricing", "localize our prices".
- **Not for:** choosing the base price from scratch (it says whether the base looks right against competitors, but expects one), or tax and legal advice.

## How it decides

1. **Index:** for each country, the median of local ÷ base-country prices of the anchor subscriptions, in the base currency at the day's exchange rates. Official pages first; aggregators only where none exists, dated and flagged.
2. **Cross-checks:** the World Bank's price level ratio (PPP conversion factor ÷ market exchange rate) with its year, and the competitors' local prices.
3. **Target** = base price × index, rounded to the market's natural ending at or just below it (whole tens of yen, rupees ending in 9, ,90 in Brazil, and so on, verified each run).
4. **Floor:** never below a share of the base price (one third by default); below it a subscription sits beside one-off ad-removal purchases and reads as cheap.
5. **Ratios:** the base market's yearly-to-monthly and lifetime-to-yearly ratios are kept, unless a local norm argues otherwise.
6. **Store rules,** checked fresh every run: price limits, tax-inclusive countries, countries where paid products can't be sold (free availability recommended there), templates or automatic local pricing, and the other store's price grid when prices should match.
7. **Tiers** where countries cluster; every country sold in gets its own price.

Details and a worked example: [reference/method.md](reference/method.md). Endings: [reference/price-endings.md](reference/price-endings.md). Store checks: [reference/store-rules.md](reference/store-rules.md). Output: [reference/output-format.md](reference/output-format.md).

## Profile

`.claude/regional-pricing.md`: the base country and prices, the products, the stores, the countries, the competitors, the anchors, the floor, the review cadence and where the table goes. Format: [reference/profile-format.md](reference/profile-format.md); a fictional [example](reference/example-profile.md). Without a profile it discovers products, prices and stores from the code and docs, asks for the base country, base prices and competitors (never guessed), and offers to write a starter.

## Context check

It starts by checking whether this conversation is the right place to run it (Step C, [reference/context-check.md](reference/context-check.md), shared by every skill in this repository): is it fresh, did it write the work being judged, is it long or compacted, has it already drawn conclusions, is anything still changing the target, is everything the skill needs present, and should another skill run first. For this skill, prices already named in the conversation would anchor the research, so they go into the profile's fixed prices first; and web search and fetch must work. If the conversation isn't the right place, it stops before spending anything and says what to type in a new session, or what to wait for. You can tell it to run anyway; its output then notes why it was flagged.

## Limits

- Public prices change without notice, and aggregators lag; every number is as of its date.
- Purchasing-power data trails by a year or two.
- The anchors are big consumer subscriptions; a niche professional tool may price differently from them everywhere. Say so in the profile's notes, and lean more on competitors.
- Store rules and price grids change; the skill checks them each run, but the help pages are the authority.

## Sample output (fictional)

> | Country | Currency | Tier | Store default | Index | PPP ratio (year) | Monthly | Yearly | Lifetime | × base | % Spotify | % competitor | Reason |
> |---|---|---|---|---|---|---|---|---|---|---|---|---|
> | Country A | LCU | 55% | 99,90 | 0.55 | 0.49 (2025) | 54,90 | 379,90 | 859,90 | 0.55 | 43% | 92% | index |
> | Country B | MCU | floor | 64.99 | 0.27 | 0.31 (2025) | 199 | 1,399 | 3,199 | 0.34 | 61% | 105% | floor: index target 159 |
>
> **Judgement call:** Country B is at the floor and 5% above Competitor A. Recommendation: keep the floor; one step lower would put the subscription at the price of a one-off ad-removal purchase there.
