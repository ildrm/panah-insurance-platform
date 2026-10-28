---
{
  "id": "DOC-01-PRODUCT-B2C-B2B-B2B2C",
  "title": "B2C, B2B and B2B2C modes",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R01",
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

# B2C, B2B and B2B2C modes

| B2C new sales | B2B new sales | New purchase behavior | Existing servicing |
|---|---|---|---|
| On | On | Direct plus individually enabled B2B subchannels | Available by permission and contract |
| On | Off | Direct only; carrier participation unaffected | Corporate and employee servicing continues |
| Off | On | Enabled corporate/commercial/reseller/B2B2C only | Personal policy access and installments continue |
| Off | Off | No new purchase commitments | Previously committed issuance, claims, refunds and delivery continue |

Subchannel flags are corporate, commercial, reseller and B2B2C. The B2B master is necessary but not sufficient for new purchases in each. Beneficiary servicing is an independent entitlement. Personal employee purchases require B2C authorization and cannot be billed silently to the employer.

Discovery, quote, purchase, assisted sale, servicing and partner delivery are separately evaluated. Drafts and quotes are retained read-only when purchase becomes unavailable. Payment in progress uses a durable payment reservation: callback records truthful receipt even after disablement, then commits only under the documented reservation policy or queues refund review. Never silently lose a verified payment. A pre-disable committed purchase remains eligible for issuance unless a distinct security quarantine blocks it.

Authoritative mode/permission versions are checked inside the purchase transaction. See [feature controls](../04-architecture/configuration-and-feature-control.md) and [workflow](../02-requirements/workflows/feature-disable-during-checkout.md).
