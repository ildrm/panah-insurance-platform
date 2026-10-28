---
{
  "id": "DOC-07-PARTNER-ONBOARDING-CERTIFICATION",
  "title": "Partner onboarding and certification",
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

# Partner onboarding and certification

R09 owns technical onboarding; R19 validates authority and R02/R12 validate product/financial interpretation. Required inputs are signed agreement and scope, official endpoint documentation, sandbox access, recipient fields/purpose, rate and eligibility versions, supported operations, identity/authentication methods, unit/calendar semantics, error/status definitions, idempotency and callback guarantees, service contacts and reconciliation process. Missing inputs keep live disabled.

Certification stages: register an isolated sandbox connection; validate schemas/mappings; execute happy/negative/duplicate/timeout/partial outage tests; reconcile synthetic transactions; review privacy/egress/secret rotation; obtain partner evidence; approve specific products/operations/channels; monitor a controlled live rollout only after explicit launch authorization. A passed fictional simulator does not advance a real partner to sandbox-validated.

Evidence package contains contract/version hashes, test cases/results, masked fixtures, unresolved exceptions, signed reviewers, selected adapter/mapping and rollback plan. Expired agreements or incompatible mapping changes reopen certification. API-only partners meet the same requirements as portal partners.

CERT-01 refuses live promotion without every applicable evidence item; CERT-02 a quote-only certification cannot enable submit; CERT-03 certification rollback pauses new traffic while keeping owed servicing/reconciliation tasks; CERT-04 recipient field diff requires privacy review. Human sign-offs and real credentials remain pending, and no request to acquire them is made by this documentation task.
