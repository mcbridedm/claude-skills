# The "Design review" section

Written into the ADR at Step 5, under the heading the profile's `review_section` names (default `## Design review`), after the ADR's own sections. Plain Markdown, in the style of the project's other ADRs. If the record is reviewed again, add a second dated section rather than rewriting the first.

```markdown
## Design review

- **Date:** YYYY-MM-DD, at commit `abc1234`.
- **Reviewers:** Data (two new tables and a backfill), Security (a new webhook endpoint),
  Product Strategy (changes what a paying customer sees). Left out: Cloud, since nothing new
  is hosted.
- **Verdicts:** Data: ship with changes. Security: ship with changes. Product Strategy: ship.

### Raised

| # | Raised by | Risk or change | Severity | Validated | Outcome |
|---|---|---|---|---|---|
| 1 | Data, Security | Webhook retries create duplicate rows: key them on the provider's event id | high | Confirmed: no unique key on `event_id` (`payments/schema.ts:31`) | Adopted |
| 2 | Data | Backfill locks `orders` on a large table | medium | Partly: `orders` has 40 rows today, but grows with sales | Adapted: batches of 1,000, run by the job, not the migration |
| 3 | Security | Sign webhook bodies with a second secret | low | Not real: the provider already signs them, and we verify (`payments/webhook.ts:40`) | Rejected |

### Disagreements

- **A queue for webhooks.** Data wanted one now; Product said the volume (tens a day) doesn't
  need it. Settled: no queue; the handler is idempotent (item 1), so a retry is safe. Revisit
  past a thousand a day.

### Corrected

- Security said refunds bypass the access check. They don't: `access/policy.ts:88` covers
  them. Dropped.

### Open questions

1. **Show a pending state to the customer, or hide the order until paid?** Recommendation:
   show it, so a slow payment doesn't look like a lost order. (Maintainer, YYYY-MM-DD: show it.)
```

Rules:
- **Every raised item is validated** (Step 4b): confirmed, partly true, not real or unverified, with the evidence in a few words (file:line, a count, a test). Never quote personal data.
- **Every raised item has an outcome**: adopted, adapted (say how), or rejected (say why, with the evidence or principle).
- **Name who raised what,** so a later reader can see which lens caught it.
- **Open questions carry a recommendation.** When the maintainer answers, append the answer and the date in place; don't delete the question.
- Leave out empty subsections ("Disagreements", "Corrected") rather than writing "none".
