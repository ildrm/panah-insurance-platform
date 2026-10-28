---
{
  "id": "DOC-07-CAPABILITY-NEGOTIATION",
  "title": "Capability negotiation and assisted alternatives",
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

# Capability negotiation and assisted alternatives

Capability resolution intersects carrier contract, adapter version, environment, product/plan, channel, organization agreement, operational health and feature control. Store the selected capability manifest version with quote/commitment. A carrier remains independent of B2B mode: B2C may require that carrier while corporate sales are disabled.

| Missing capability | Permitted behavior |
|---|---|
| quote | assisted inquiry with approved manual offer; no invented price |
| reserve | skip only when contract permits unreserved commitment; otherwise block sale |
| submit/issue | authorized manual queue with signed acknowledgment evidence, or disable purchase |
| status and idempotency | timeout becomes unknown; verified manual reconciliation required |
| document retrieval | approved secure manual document delivery with provenance |
| endorse/cancel/claim | guidance and support referral; do not claim insurer action occurred |
| portal access | optional API-only carrier service identity with equivalent recipient policy |

A manual route has owner, deadline, data recipients, authority evidence and audit; it cannot manufacture missing authority. Quote comparison labels partial availability and excludes unsupported plan terms from like-for-like rankings. CAPABILITY-01 removes each operation from a simulator manifest and verifies no call occurs; CAPABILITY-02 tests expired certification and stale manifest selection at commit; CAPABILITY-03 confirms claims guidance remains accessible with new-sales off.
