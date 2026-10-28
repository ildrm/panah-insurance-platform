---
{
  "id": "DOC-06-CONTRACTS-CANONICAL-MODELS",
  "title": "Canonical models",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ALL"
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

# Canonical models

[PurchaseSnapshot](schemas/PurchaseSnapshot.schema.json) separates buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier. `contextId` identifies the administrative context; it does not grant permission. Product/channel/carrier references and immutable risk/form/price/wording/consent/mapping/config versions make a purchase reproducible.

Direct commitment requires nonempty verified receipt references and amount/currency agreement with accepted allocations. Approved credit/invoice requires an independent approval and reserved commercial limit and must not carry a fabricated payment receipt. These cross-field and accounting invariants are checked by application/property tests, in addition to schema validation. Amounts are signed integer strings with explicit currency/unit; expected charge amounts must be positive under domain rules.

Events contain immutable reference IDs, versions and minimal routing facts; consumers fetch only an authorized versioned recipient projection. This avoids publishing health payloads or current mutable entity snapshots to unrelated recipients. The projection service must reject a recipient with no entitlement. Raw carrier schemas and credentials never become public canonical fields.
