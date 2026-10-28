---
{
  "id": "DOC-10-FRONTEND-STANDARDS",
  "title": "Frontend engineering standards",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Frontend engineering standards

Use server rendering for public content and authorized page data, with small client boundaries for interactive forms/tables/uploads. A typed client calls Nest; no frontend code becomes an alternate domain engine. Forms use versioned field schemas and server validation errors keyed by stable field IDs. Preserve input during recoverable failures and distinguish saved draft from committed purchase.

Declare each route's public/private cache policy, loading/empty/error/forbidden/disabled/expired/partial/success states and data source. Context switch aborts pending requests and clears state; late responses with mismatched context are discarded. Optimistic UI is permitted only for reversible presentation, never for verified payment, issued coverage or approved payout.

Use semantic controls, labels, focus management and keyboard navigation. Logical CSS properties support RTL/LTR; IDs/money/date strings use appropriate bidirectional isolation. Date picker presentation cannot alter canonical effective dates. Upload controls support interruption/retry without duplicating files or bypassing scan state.

FE-01 tests navigation and errors with keyboard/screen reader; FE-02 verifies private headers/router clearing; FE-03 fails a payment/quote dependency without false success; FE-04 checks initial/journey bundles against central budgets. Native applications remain a separate scope decision; PWA installation does not fulfill native iOS/Android delivery.
