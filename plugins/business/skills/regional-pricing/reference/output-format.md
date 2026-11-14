# The output

One Markdown file per run, at the profile's `output` (default `docs/pricing/regional-prices-<date>.md`), or a dated section appended to it when `output_mode: append`. It is a recommendation for the user to approve, so it says so at the top.

## Shape

```markdown
# Regional prices, <date>

Recommendation only: nothing here is live until the user approves and enters it.
Mode: <full | review | add>. Base: <country>, <currency>. Exchange rates: <source>, <date>.
Next review: <date> (<reason: the cadence, or a high-inflation or currency-move country>).

## Products and base prices

| Product | Base price | Ratio kept |
|---|---|---|

## Prices by country

| Country | Currency | Tier | Store default | Index | PPP ratio (year) | <product 1> | <product 2> | … | × base | % Spotify | % competitor | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Floors applied

## How sure we are

## Are the base prices right?

## Judgement calls

## Store rules checked

## Changes since the last table      (review mode)

## Sources
```

## Columns

- **Country, currency:** every country sold in, one row each, sorted by tier then name.
- **Tier:** the tier from Step 6 (a share of the base, e.g. "100%", "60%", "floor").
- **Store default:** what the store would charge for the base monthly price if nothing were set (its automatic conversion or template), so the user sees what the table changes. Blank if the store doesn't publish it.
- **Index, PPP ratio:** to two decimals; the PPP ratio with its year.
- **One column per product:** the recommended local price, at its natural ending, as the user will see it (tax included where the country's prices include it). A blank cell means it couldn't be sourced; never fill it with a guess.
- **× base:** the monthly product's price ÷ its base price, at the run's rates.
- **% Spotify, % competitor:** the value check (`method.md`, section 7). Name the anchor in the header if it isn't Spotify.
- **Reason:** one line: "index", "floor", "matched to competitor", "local norm: yearly plans rare", "fixed by the user", "PPP only: no anchors".

## Sections

- **Floors applied:** each country where the floor set the price, with its index target and the floor.
- **How sure we are:** per country or per tier: high (three or more official anchors, the PPP ratio within a third of the index, competitors found), medium, or low (aggregators only, one anchor, a large disagreement, no competitor data), with what would raise it.
- **Are the base prices right?** The base prices against the competitors' base-country prices and the anchors. If the base looks high or low, say so and by how much; every country follows from it.
- **Judgement calls:** decisions for the user, each with your recommendation and one line of why (a floor country, a market where the competitor is far cheaper, a product ratio to change locally, free availability where the store can't sell).
- **Store rules checked:** each rule the table relies on, with its help page and date (`store-rules.md`), and how to enter the prices in each store.
- **Changes since the last table** (review mode): per country, the live price, the new recommendation, the full price steps between them, and whether to change it; plus the notice and consent note for any rise.
- **Sources:** every number's URL and the date read, grouped by country, with official or aggregator marked, and the exchange rates used.
