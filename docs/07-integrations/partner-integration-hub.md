---
{
  "id": "DOC-07-PARTNER-INTEGRATION-HUB",
  "title": "Partner integration hub",
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

# Partner integration hub

The hub owns registered destinations, capability manifests, adapter/mapping versions, credential references, operation availability, delivery attempts, callbacks and reconciliation evidence. It does not own premiums, policy activation or ledger rules. Partner configuration separates sandbox from live; environment credentials and endpoint references cannot be copied through a UI export.

Each connection has status proposed, sandbox, certification_pending, live, degraded or suspended. These are connection lifecycle states, not purchase states. Promotion requires partner agreement, permitted data projection, protocol documentation, fixture tests, security review and operational escalation contact. Live remains disabled until those inputs exist. Product/channel availability is negotiated per operation, so a provider may quote motor products without supporting claims or endorsements.

The integration studio shows operation health, age of oldest pending/unknown delivery, last certified schema version and safe actions. Operators can pause new work, inspect redacted errors, request status lookup or submit evidence for replay approval. A status page never exposes raw health/identity payloads or secrets.

HUB-01 attempts a live endpoint with sandbox identity and is denied; HUB-02 disables one provider's quote operation while permitting committed submission/servicing; HUB-03 changes a mapping only for new eligible work and preserves old attempts. [Capability negotiation](capability-negotiation.md) and [onboarding](partner-onboarding-certification.md) specify promotion evidence.
