---
{
  "id": "DOC-05-LEDGER-AND-MONEY",
  "title": "Ledger and precise monetary units",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R12",
  "reviewer_roles": [
    "R10",
    "R11",
    "R13"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
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

# Ledger and precise monetary units

Canonical money is `{amount:"120000",currency:"IRR",unit:"rial"}` where this market assumption applies. Amounts cross JSON as base-10 integer strings; use bigint or reviewed fixed precision, never binary floating point. Toman is a labeled display transform of rial under A01; conversion occurs at an explicit boundary and cannot silently change payment units. Currency-specific scale and rounding modes are versioned configuration, not inferred from a symbol.

Each ledger transaction has immutable business key, currency/unit, postings and evidence references. Signed postings sum to zero per currency/unit. Accounts distinguish payment clearing, insurer premium payable, fees, commission payable, customer refundable liability, cash wallet and promotional credits. Promotional/nonwithdrawable value cannot fund cash withdrawal; loyalty points use a separate non-money ledger. Balance projections are reconstructible and updated atomically with postings.

Synthetic example: verified 120000 rial creates debit payment clearing 120000 and credit customer allocation liability 120000. Allocation moves liability to premium/fee accounts using an approved breakdown; numbers are test data, not prices or accounting/legal approval. A refund reverses eligible allocations and creates a provider refund request; it is not final cash-out until verified. Fees, tax, financing cost and commission remain distinct lines.

FIN-01 property tests preserve balanced postings after retries/reversal; FIN-02 concurrent refund total never exceeds captured refundable allocation; FIN-03 approved credit creates receivable evidence without cash entries; FIN-04 source reconciliation compares provider/ledger/order totals and exposes mismatches. Qualified accounting review of account mapping is pending.
