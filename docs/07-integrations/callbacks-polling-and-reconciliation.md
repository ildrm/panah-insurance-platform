---
{
  "id": "DOC-07-CALLBACKS-POLLING-AND-RECONCILIATION",
  "title": "Callbacks, polling and reconciliation",
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

# Callbacks, polling and reconciliation

Callback ingress authenticates raw bytes, enforces destination-specific schema/size and writes an inbox record before acknowledging receipt. Acknowledgment means accepted for processing, not policy issuance. Unverified callbacks receive no domain effect. Worker processing locks the order/submission version and records provider event identity plus observed status. Poll results use the same transition function, preventing competing update logic.

Duplicate observations are inert. Older processing status cannot regress issued or verified states. A later authoritative contradictory outcome creates an exception with both evidence records; operators do not edit history. Unknown submission resolution requires authoritative found/absent evidence or a provider idempotent lookup whose semantics are documented. An eventually consistent not-found result is not proof of absence until the contract's visibility boundary is satisfied.

Reconciliation compares commitments, attempts, provider references, policies and monetary allocation. Persist cursor/checkpoint, query range, provider version, evidence hash and discrepancy ownership. If neither status nor idempotency exists, pause replay and seek verified partner evidence through an authorized channel; no unattended resend or refund can assume the insurer did nothing.

RECON-01 races callback and poll; RECON-02 delays status visibility; RECON-03 supplies a callback after a refund request and requires manual resolution; RECON-04 duplicates callbacks out of order. Metrics distinguish oldest unknown outcome, paid-unissued age and reconciliation age; no PII labels.
