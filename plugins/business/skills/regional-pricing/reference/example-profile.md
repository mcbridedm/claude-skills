---
profile_version: 1
base_country: US
base_currency: USD
products:
  - { id: pro_monthly, name: Pro monthly, kind: monthly, base_price: 4.99 }
  - { id: pro_yearly, name: Pro yearly, kind: yearly, base_price: 34.99 }
  - { id: pro_lifetime, name: Pro lifetime, kind: lifetime, base_price: 79.99 }
stores: [app-store, google-play]
match_stores: true
countries: all
competitors:
  - name: Competitor A
    app-store: https://apps.apple.com/us/app/competitor-a/id0000000000
    google-play: https://play.google.com/store/apps/details?id=com.example.competitora
  - name: Competitor B
    web: https://competitor-b.example/pricing
anchors:
  - Spotify Premium Individual
  - Apple Music individual
  - YouTube Premium individual
  - Netflix cheapest ad-free plan
ppp_source: world-bank
floor_share: 0.333
review_months: 6
review_months_volatile: 3
currency_move_threshold: 0.15
output: docs/pricing/regional-prices-<date>.md
output_mode: new-file
commit: false
---

<!-- Fictional example. Copy to .claude/regional-pricing.md and change every value. -->

## Fixed prices

- Canada, Pro monthly: 5.99 CAD, decided at launch to sit one step under Competitor A's 6.99 CAD. Check it like the rest.

## Live prices

- Read from `docs/pricing/` (the newest table), corrected by any change noted in the changelog since.

## Local norms

- None known yet.

## Notes

- Launch first in the countries the app is already translated into; the rest follow within three months.
