---
{
  "id": "DOC-07-AUTOMOTIVE-PROVIDER-CONTRACT-TEMPLATE",
  "title": "Automotive provider boundary contracts",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-02",
    "INT-03",
    "INT-04",
    "INT-05",
    "INT-06",
    "INT-07",
    "INT-08",
    "INT-09",
    "INT-10"
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

# Automotive provider boundary contracts

Maintain independent capability manifests for official inquiries/payments, maintenance bookings, parts fulfillment and vehicle transactions. A provider supporting toll inquiry does not gain plate history, debt settlement or auction authority. Missing authority disables each affected operation separately while preserving existing receipts/servicing.

Inquiry input contains permitted subject identifiers, purpose/authorization reference and freshness requirement. Output includes source, observedAt, official versus advisory status, itemized obligations and provider reference. Payment input binds obligation version, fee disclosure, payer and stable business key; success requires official receipt/settlement verification. Booking contracts define slot reservation expiry, fulfillment status, cancellation/no-show evidence and complaint owner. Parts contracts define compatibility provenance, stock reservation, shipment items, returns inspection and seller settlement.

Vehicle trading/referral contracts separately identify valuation, listing, history, auction, sale-contract and secure-transaction operations. Displaying a valuation or referral is never proof of legal transfer or debt discharge. Regulated/direct transaction operations remain blocked until authority is documented.

AUTO-CONTRACT-01 stale obligation is re-queried before payment; AUTO-CONTRACT-02 concurrent buyers cannot reserve one part/slot twice; AUTO-CONTRACT-03 timeout after debt payment becomes unknown; AUTO-CONTRACT-04 trade feature disablement does not disable policy servicing. All amounts and provider identities in fixtures are synthetic.
