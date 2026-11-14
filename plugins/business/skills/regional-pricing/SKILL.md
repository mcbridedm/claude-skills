---
name: regional-pricing
description: Recommends a local price per country for each paid product of an app or service (monthly and yearly subscriptions, one-time or lifetime purchases, in-app purchases), so no country is priced by a store's exchange-rate conversion and no price looks cheap. Builds a digital price index from mainstream subscriptions priced per country, cross-checks it against purchasing power and the closest competitors, rounds to each market's natural price ending, applies a floor, checks each store's rules, and writes a dated table with every number sourced. Recommends only; never changes live prices. Reads .claude/regional-pricing.md for the base prices, products, competitors, stores and countries, or asks. Use before a first launch in several countries, when adding countries or products, at a scheduled price review, or when asked "what should we charge in Japan", "regional pricing", "PPP pricing", "localize our prices".
argument-hint: "[review] [country …] [product …]"
disable-model-invocation: true
---

# Regional pricing

You recommend a local price, in local currency, for each paid product in each country the product is sold in. The aim: every price reads as excellent value next to what people there already pay for digital services, and none looks cheap. You research public prices, compute, and write a dated table with a source and date for every number. **You never change a live price.** Prices are a money decision: the user approves them and enters them in the stores (or approves an automated entry they run). You may read store consoles' public help pages, never sign in to a store or payment account.

Project specifics come from the project's **profile** (Step P). This file stays general: stores, anchors, endings and defaults are examples the profile can override.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/reference/method.md`: the index, the purchasing-power ratio, rounding, the floor and the value check, with a worked example.
- `${CLAUDE_SKILL_DIR}/reference/price-endings.md`: natural price endings per market, as guidance to verify.
- `${CLAUDE_SKILL_DIR}/reference/store-rules.md`: what to check fresh in each store's rules on every run.
- `${CLAUDE_SKILL_DIR}/reference/output-format.md`: the table and the sections around it.
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings and defaults.
- `${CLAUDE_SKILL_DIR}/reference/example-profile.md`: a filled-in fictional example, also the starter profile.

## Step C: Context check (first, before anything costly)

Before Step P's heavier work, and before any agent, write or command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Anchoring (4) weighs most:** if the conversation already named prices ("India should be ₹99", "keep it at a dollar everywhere"), the research would bend towards them. Record any price the user has decided in the profile's `## Fixed prices` and run from the record.
- **Context load (3):** a run reads many web pages across dozens of countries. Don't start it in a long or compacted conversation.
- **Readiness (6):** web search and fetch must work; without them nothing can be sourced, so stop.
- **Sequence (7):** if the base prices themselves are still being decided, settle them first; every country's price follows from them.

## Step P: Load the profile

1. Read `.claude/regional-pricing.md` at the repository root (`git rev-parse --show-toplevel`) if it exists, and `reference/profile-format.md`.
2. **No profile:** discover, without sub-agents, noting where each value came from:
   - **Products and base prices:** store product configuration in the code (product ids, a purchases or billing module, a pricing page, a Stripe price list), docs or decision records that name prices.
   - **Stores:** which store SDKs or payment libraries the code uses (App Store, Google Play, a web checkout).
   - **Countries:** a launch plan, a list of countries in the docs, store availability notes. If none: every country the stores sell in.
   - **Competitors:** a competitors or market section in the docs.
   - Ask for what you can't find: the base country, base prices and competitors are never guessed. Tell the user what you found and **offer to write a starter profile** from `reference/example-profile.md`. Write it only if they agree.
3. Read the previous table at `output`, if any. In `review` mode it's required.

## Step 1: Pick the mode and scope

- **Full** (default): every country sold in, every product.
- **Review** (`review` in `$ARGUMENTS`, or the profile's cadence is due): the previous table is the starting point; refresh anchors, exchange rates and competitors, and recommend a change only where Step 8's rule says so.
- **Add:** countries or products named in `$ARGUMENTS` only, priced consistently with the existing table.

Write the run's date at the top of everything. Exchange rates are taken once, on that date, from one source (the profile's `fx_source`, default the European Central Bank's reference rates, with a second source for currencies it doesn't cover), and used throughout.

## Step 2: Research, in parallel by region

Split the countries into regions (for example the Americas; Europe; the Middle East and Africa; Asia-Pacific). For each region, start one `business:researcher` agent (read-only: web search and fetch, no shell, no editing) at the same time. If that agent isn't available, use a general-purpose agent with the same brief and the instruction to change nothing. Each brief gives the region's countries and asks for, per country:
- **Anchors:** the local monthly price of each anchor subscription in the profile (default: Spotify Premium Individual, Apple Music individual, YouTube Premium individual, Netflix's cheapest plan without ads, or its cheapest plan where none is ad-free). The seller's own country page first; an aggregator only where none exists, flagged.
- **Competitors:** each competitor's local prices on each of the profile's stores, per comparable product (monthly, yearly, lifetime).
- **Purchasing power:** the World Bank's price level ratio of PPP conversion factor to market exchange rate (indicator `PA.NUS.PPPC.RF`) for the latest year, or the IMF's implied PPP conversion rate divided by the market rate, with the year.
- **Store notes:** the store's suggested or auto-converted price for the base price in that country, if public; whether the store sells there.
- Every number with its URL, the date read, official or aggregator, and tax included or not. Blank where not found, with what was tried.

Keep the agents read-only; they return text and you write every file. Spot-check at least one number per agent yourself before using its results; if a spot check fails, re-check that agent's numbers.

## Step 3: The index and the cross-checks

For each country, following `reference/method.md`:
1. **Digital price index:** convert each anchor's local price to the base currency at the run's rates, divide by the same anchor's base-country price, and take the median of the ratios. Two or more anchors are needed; with one, mark the index low confidence.
2. **Purchasing-power ratio** with its year. Where it and the index differ by more than a third, say which you trust and why (an anchor priced for a different market position, a stale PPP year, a currency that moved since).
3. **Competitor ratios:** each competitor's local price ÷ its base-country price.

## Step 4: Recommend each price

Per country and product, following `reference/method.md`:
1. **Target** = base price × index, in local currency.
2. **Round** to the market's natural price ending at or just below the target (`reference/price-endings.md`, checked against the anchors' and competitors' own local prices this run). Where the stores should match, use the stricter store's price grid (`reference/store-rules.md`).
3. **Floor:** never below `floor_share` of the base price (default one third). Where the index would go below, the floor applies: flag it. Below about a third, a subscription sits beside one-off ad-removal purchases and reads as cheap, not as good value.
4. **Ratios between products:** keep the base market's ratios (yearly to monthly, lifetime to yearly) unless local norms argue otherwise; say so where you depart.
5. **Value check:** the monthly price as a share of local Spotify (or the first anchor) and of the competitor's comparable tier. A price above the competitor's needs a reason; one far below everything local may be leaving value on the table.
6. **Fixed prices** from the profile are kept as they are, and checked like the rest.

## Step 5: Store rules, fresh every run

Check each store in the profile against `reference/store-rules.md`: price limits per currency, which countries' prices include tax, countries where the store can't sell paid products (recommend free availability there, and say what users there get), whether the store offers price templates or automatic local pricing (and how it compares with your table), and the other store's price grid where prices should match across stores. Cite the help page and its date for each rule you rely on. Rules change; never carry one over from memory or from a previous run without checking it.

## Step 6: Tiers

Where countries cluster (similar index, similar anchors), group them into tiers, so the table is reviewable and future countries slot in. Every country sold in still gets its own local price at its own natural ending; a tier is a share of the base, not a single price.

## Step 7: Write the table

Write the output in the shape of `reference/output-format.md` to the profile's `output` (default `docs/pricing/regional-prices-<date>.md`): the dated table per country, how sure we are, whether the base prices look right against competitors, the judgement calls for the user, and the sources. **Never invent a price:** a cell you couldn't source stays blank, and the text says so. Keep the previous table; the new one is a new dated file, or a dated section if the profile says `output_mode: append`.

## Step 8: Next review

Say in the table, and in the reply, when the next review is due: every `review_months` (default 6), or every 3 months for a country with high inflation or whose currency moved more than 15% against the base since the last table. In a review, recommend changing a price only when the new recommendation is at least one full price step (the next natural ending) away from the live one. Note, every time a price would go up: raising a subscription's price for existing subscribers needs the store's notice period, and in some stores and countries their consent, or they lapse; so it is better to start at the right price than to start low and raise it.

## Hand off

Reply with the table's path, the countries that hit the floor, the low-confidence countries, the judgement calls (each with your recommendation and why), and the steps the user takes to apply the prices in each store. Commit the table only if the profile's `commit` is on (default off). Never push. Never enter, change or schedule a price in a store or payment system, even if asked mid-run: say what to enter and where, and leave it to the user, or to an automated entry they run and approve.
