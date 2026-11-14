# The method

How each number in the table is made. Every input carries its source URL and the date it was read; every output says which inputs it used.

## Exchange rates

Take all rates once, on the run's date, from one source: the profile's `fx_source` (default: the European Central Bank's euro reference rates, crossed to the base currency), with a named second source only for currencies the first doesn't cover. Record the rate per currency in the table's sources. Never mix rates from different days in one run.

## 1. The digital price index

The index says how much people in a country pay for mainstream digital subscriptions compared with the base country, after currency conversion. It is the main input, because it reflects what the big subscription companies have already learned about each market's willingness to pay for exactly this kind of product.

For each country *c* and each anchor *a* (default: Spotify Premium Individual, Apple Music individual, YouTube Premium individual, Netflix's cheapest ad-free plan, or its cheapest plan where none is ad-free):

```
ratio(c, a) = local_price(c, a) converted to the base currency
              ÷ local_price(base country, a)

index(c)    = median over anchors of ratio(c, a)
```

- **Median, not mean:** one anchor priced oddly (a launch promotion, a market where it's bundled with a phone plan) doesn't move it.
- **Like with like:** the same plan and billing period everywhere; the full price, not an introductory offer, a student or family plan, or a bundle. A substitute plan is noted in the cell.
- **Official pages first:** the seller's own country page. An aggregator only where no official page exists, flagged and dated; an index built only from aggregators is low confidence.
- **Two anchors at least.** With one, the index is low confidence. With none, there's no index: use the purchasing-power ratio, say so, and mark the country low confidence.
- **Tax:** anchors' prices are what consumers see, so they include tax where the country's prices normally do. The target that follows is therefore a consumer price as shown in that country, and is entered in each store the way its rules say (`store-rules.md`).

## 2. The purchasing-power cross-check

```
ppp_ratio(c) = PPP conversion factor (local currency per international $)
               ÷ market exchange rate (local currency per US $)
```

The World Bank's indicator `PA.NUS.PPPC.RF` gives this ratio directly ("price level ratio of PPP conversion factor (GDP) to market exchange rate"); the IMF's implied PPP conversion rate divided by the market rate is the fallback. Record the year: PPP data lags by a year or two. When the base country isn't the US, divide by the base country's ratio.

It is a cross-check, not the price: it measures prices of everything (rent, food, services), while the index measures what people pay for digital subscriptions, which travel across borders more easily. Where the two differ by more than a third, say which you trust and why (an anchor positioned differently in that market, a stale PPP year, a currency that moved since).

## 3. Competitor ratios

For each competitor and comparable product, its local price ÷ its base-country price, per store. A competitor that doesn't price regionally (the store's conversion everywhere) is noted; its ratio says little about the market.

## 4. Target and rounding

```
target(c, p) = base_price(p) × index(c), converted to the local currency
```

Round to the market's natural price ending **at or just below** the target (`price-endings.md`, checked this run against the anchors' and competitors' own local prices). If prices should match across stores, choose from the stricter store's grid of allowed prices. Don't round up past the target to reach a "nicer" number; the next step down is the safe side for a first price, and Step 8's review can move it up a step.

## 5. The floor

```
floor(c, p) = floor_share × base_price(p), converted to the local currency
```

Default `floor_share`: 1/3. Below about a third of the base price, a subscription lands beside the one-off "remove ads" purchases of free apps, and reads as cheap rather than as good value. Where `target < floor`, recommend the floor rounded **up** to the nearest natural ending, and flag the country. Countries at the floor are the ones most worth a judgement call.

## 6. Ratios between products

Compute the base market's ratios (yearly ÷ monthly, lifetime ÷ yearly, each in-app purchase ÷ monthly) and keep them in every country: price the monthly product first, then derive the others from it and round each. Depart only for a local norm you can source (yearly plans rare in a market, weekly plans common, one-time purchases strongly preferred), and say so.

## 7. The value check

Per country, for the monthly product (or the cheapest recurring one):

```
%spotify(c)    = recommended(c) ÷ local price of the first anchor (default Spotify Premium Individual)
%competitor(c) = recommended(c) ÷ the competitor's comparable local price
```

There is no fixed right answer. Read them together:
- A price well above the competitor's needs a reason (more features, a better reputation in that market); otherwise lower it a step.
- A price far below every local anchor and competitor may be leaving value on the table; say so as a judgement call.
- The same share of local Spotify in neighbouring countries with similar indices is a sign of consistency.

## 8. Reviews

A recommendation changes a live price only when it has moved at least one full price step (the next natural ending up or down) from the live price. Smaller moves are noise from exchange rates. Every rise for an existing subscription carries the note on the store's notice and consent rules (`store-rules.md`).

## Worked example (fictional)

A $4.99/month subscription, $34.99/year (7.0 × monthly) and $79.99 lifetime (2.286 × yearly). Country A uses the fictional currency LCU, at 20 LCU to the US dollar on the run's date. Its prices end in ,90; from 100 upwards, in 9,90.

| Anchor | US price | Country A price | In USD | Ratio |
|---|---|---|---|---|
| Anchor 1 | $11.99 | 129 LCU | $6.45 | 0.538 |
| Anchor 2 | $10.99 | 119 LCU | $5.95 | 0.541 |
| Anchor 3 | $13.99 | 159 LCU | $7.95 | 0.568 |
| Anchor 4 | $7.99 | 99 LCU | $4.95 | 0.620 |

- **Index:** the median of 0.538, 0.541, 0.568 and 0.620 is 0.554.
- **PPP ratio:** 9.8 LCU per international $ ÷ 20 = 0.49 (year 2025). Within a third of the index: consistent.
- **Monthly:** $4.99 × 0.554 = $2.76 = 55.3 LCU → **54,90 LCU** (0.55 × base). Floor: $4.99 ÷ 3 = 33.3 LCU, not reached.
- **Yearly:** 54,90 × 7.0 = 384.3 → **379,90 LCU**.
- **Lifetime:** 379,90 × 2.286 = 868.5 → **859,90 LCU**.
- **Value check:** 54,90 is 43% of local Anchor 1 (129 LCU); the competitor's monthly plan is 59,90 LCU, so 92% of it.
