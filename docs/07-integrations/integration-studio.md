---
{
  "id": "DOC-07-INTEGRATION-STUDIO",
  "title": "Integration studio specification",
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

# Integration studio specification

Routes `/admin/integrations`, `/admin/integrations/:connectionId`, `/attempts`, `/mappings`, `/certification`, `/reconciliation` expose separate read, configure, credential-reference, certify and replay permissions. Operators see redacted request IDs, operation, carrier/product/channel, schema/mapping version, attempt age, state, error class and next safe action. Filter by environment, operation, state and age; use cursor pagination. Raw secrets and medical payloads never appear in table/detail previews.

Configuration forms require approved destination, capability manifest, credential reference and owner. Saving produces a proposal; a different reviewer activates live routing or mapping changes. Preview shows affected products/operations, pending attempts and allowed rollback target. Mapping editor permits the safe declarative language only and validates synthetic fixtures before review.

Replay action is disabled for unknown outcomes without authoritative evidence. The detail page offers status lookup, assign owner, attach reconciliation evidence and request review. Pausing new quote/sales work is distinct from quarantining committed transmission. Each mutation records reason and expected version; stale pages receive a conflict with refreshed diff.

STUDIO-01 unauthorized staff cannot discover credentials or export payloads; STUDIO-02 concurrent changes preserve maker-checker; STUDIO-03 malformed mapping blocks activation; STUDIO-04 all views distinguish simulated, sandbox-validated and live-certified connections. Empty/error/partial states show last observation time and responsible team, never a false healthy status.
