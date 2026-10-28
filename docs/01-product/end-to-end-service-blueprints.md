---
{
  "id": "DOC-01-PRODUCT-END-TO-END-SERVICE-BLUEPRINTS",
  "title": "End-to-end service blueprints",
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

# End-to-end service blueprints

| Journey stage | Frontstage | Backstage | Failure owner |
|---|---|---|---|
| Eligibility | Explain required fields and unavailable offers | Versioned product rules, consented official inquiries | R02/R20 |
| Quotes | Show progressive offers, coverage differences and deadlines | Bounded carrier fan-out, provenance and normalization | R09 |
| Commitment | Show payer, insured, total and declaration version | Revalidation, payment verification or credit approval, atomic outbox | R12/R08 |
| Issuance | Separate paid/processing/issued/effective statuses | Durable delivery, dedupe, insurer status reconciliation | R09/R20 |
| Delivery | Authorized document access and tracked dispatch | Scanned documents, recipient projection and expiring links | R20 |
| Servicing | Renew, amend, claim or dispute by entitlement | Contract-specific workflow and financial reversals | R02/R12/R20 |

Corporate purchase adds maker-checker, census preview, effective dates and invoice/credit terms. Reseller assistance adds customer delegation and commission attribution. Beneficiary changes require relationship proof without exposing medical details to employer finance. The [workflow directory](../02-requirements/workflows/) contains sequence diagrams, transaction boundaries and compensations.

Human tasks have an owner, due time, reason, state and escalation. A manual path is not permission to bypass authority. Operators must reconcile ambiguous carrier outcomes before replay or refund.
