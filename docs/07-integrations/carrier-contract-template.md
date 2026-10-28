---
{
  "id": "DOC-07-CARRIER-CONTRACT-TEMPLATE",
  "title": "Carrier contract intake template",
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

# Carrier contract intake template

Complete one versioned record per real carrier. Required fields: legal contracting party, authority evidence, permitted products/channels, agreement dates, commercial owner, official API documentation URL/version, environment endpoints, destination approvals, technical contacts and escalation method. Unknown fields remain explicitly missing and prevent live activation.

Operation table must state quote/reserve/submit/status/issue/document/endorse/cancel/claim availability, synchronous/asynchronous sequence, schemas, idempotency guarantees, eventual-consistency windows, timeout semantics, rate limits, retry policy and manual alternatives. Record auth/rotation, callback verification and replay defense, document transport, request signing, currency/unit and calendar/effective-date rules. Include canonical-to-carrier field map with required recipient data and prohibited fields.

Commercial annex references validated eligibility/rating tables, fees/tax/commissions, quote validity, inspections, underwriting authority, refund/cancellation rules, claims authority, settlement schedule and accounting evidence. Never fill these with illustrative prices as if real. Privacy annex identifies purposes, permitted recipients, retention/deletion, incident notification and approved regions for qualified review.

Acceptance CONTRACT-CARRIER-01: R02/R09/R11/R12/R19 review the actual documents and attach evidence; discrepancies become blockers by operation, not a blanket claim of connectivity. Template is complete as an intake instrument; no real carrier contract is supplied.
