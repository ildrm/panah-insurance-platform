---
{
  "id": "DOC-13-METRICS-AND-KPI-DICTIONARY",
  "title": "Metric and KPI dictionary",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R15",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "GRW-03",
    "GRW-04",
    "GRW-05",
    "GRW-09",
    "DSH-06"
  ],
  "source_refs": [
    "S00"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Metric and KPI dictionary

| Metric | Numerator / denominator and event authority | Important dimensions |
|---|---|---|
| Quote availability | sessions with eligible offer / valid quote sessions | product/channel/provider set; distinguish no eligibility from outage |
| Commitment conversion | distinct purchase commitments / eligible quote sessions | cohort by quote start; credit versus verified payment |
| Issuance completion | confirmed issued policies / committed insured orders | elapsed time and provider; pending cohort shown |
| Paid-unissued | verified captured allocations without issued policy | age, rejected/unknown/pending classes |
| Renewal retention | issued renewals / eligible expiring policies | agreed attribution window and insurer switching |
| Refund completion | verified paid refunds / approved refund requests | remaining unknown and age |
| Seller commission | ledger-confirmed payable/reversed amount | seller scope and settlement as-of |
| Service fulfillment | confirmed fulfilled bookings/items / accepted orders | provider/cancellation/return class |

R15 owns definitions, R12 monetary reconciliation and R01 business interpretation. Every report declares event-time cohort, processing delay, timezone/calendar presentation, dedupe key, exclusions and as-of timestamp. Late issuance updates the original commitment cohort; it is not a new sale.

AN-METRIC-01 duplicate/out-of-order replay preserves totals; AN-METRIC-02 monetary KPIs reconcile to ledger snapshots; AN-METRIC-03 pending/error cases remain visible; AN-METRIC-04 changing a denominator creates a metric version and historical comparison note. No actual conversion, revenue or performance figures are claimed.
