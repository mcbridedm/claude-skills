# Store rules to check every run

Stores change their pricing rules, price grids, tax handling and country lists. **Check each item below on the store's own help pages on every run**, cite the page and the date you read it, and never carry a rule over from memory or a previous run unchecked. These are questions to answer, not answers.

## For every store in the profile

| Check | Why it matters | Where to look |
|---|---|---|
| **Price limits per currency** (minimum and maximum) | A floor price under the store's minimum, or a lifetime price over its maximum, can't be entered. | The store's help page on setting prices or price ranges per currency. |
| **Price grid** (any price, or fixed price points) | Some stores allow only fixed points per currency; the natural ending must be one of them. | The store's price point list or its price picker's export. |
| **Tax** (which countries' prices include tax; who collects and remits it) | Decides whether the table's consumer price is entered as is, or before tax. | The store's tax and pricing help; for a web checkout, the payment provider's tax settings or merchant of record. |
| **Countries it can't sell in** (paid apps, subscriptions or in-app purchases unavailable, or merchant payouts not supported) | Every country sold in needs a price; where paid products can't be sold, recommend making the app available free there, and say what users get without the paid products. | The store's list of locations where paid products and merchants are supported. |
| **Templates or automatic local pricing** (pricing templates, a base country with automatic equalization, adaptive pricing at checkout) | Decides how the table is entered, and shows what each country gets if nothing is entered. Compare its result with the table; it's the "store default" column. | The store's help on price templates, base country or storefront, or adaptive or localized pricing. |
| **Automatic adjustments** (does the store re-price other countries when exchange rates or taxes change, and does a manually set price opt out of that) | A manually set price may stay put while the store's defaults move, or the reverse; the review cadence depends on it. | The store's help on price adjustments for taxes and exchange rates. |
| **Raising a subscription's price for existing subscribers** (the notice period, when consent is needed, which countries add rules) | A rise without consent where it's required lapses subscribers. Keep or "grandfather" existing subscribers at their price if the store allows it. | The store's help on subscription price increases. |
| **Lowering a price** (do existing subscribers move to the lower price automatically) | A cut can reduce revenue from existing subscribers immediately. | The same page. |
| **Introductory offers and free trials** (per-country offer prices) | Offers are priced per country too; flag where one would go below the floor. | The store's help on introductory offers. |

## Matching prices across stores

Where the profile's `match_stores` is on, people should see the same price on every store in a country. Pick each price from the strictest store's grid first (usually the one with fixed price points), then enter the same amount in the others, checking each one accepts it. Where no common price exists, say which store gets the nearer point and why.

## Examples of stores and where their rules live

Only examples; the profile names the stores in use.

- **App Store:** App Store Connect Help, the pages on setting a price, price points per storefront, subscription pricing and price increases, and tax categories.
- **Google Play:** Play Console Help, the pages on setting prices, price ranges and currencies, pricing templates, subscription price changes, and where paid apps and merchants are supported.
- **Web checkout** (Stripe, Paddle, Lemon Squeezy, and others): the provider's docs on multi-currency prices, automatic or adaptive local pricing, tax collection, and whether it acts as merchant of record.
