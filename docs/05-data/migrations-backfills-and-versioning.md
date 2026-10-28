---
{
  "id": "DOC-05-MIGRATIONS-BACKFILLS-AND-VERSIONING",
  "title": "Migrations, backfills and historical versions",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
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

# Migrations, backfills and historical versions

Use expand/backfill/validate/contract. Add compatible columns/tables first; deploy readers that understand old/new forms; run bounded resumable backfill with checkpoints and row version guards; reconcile counts and hashes; switch writers; remove old paths only after rollback window and consumer evidence. No destructive rewrite of financial or policy history is allowed as cleanup.

Every migration has owner, expected locks, estimated data volume, affected indexes, down/forward recovery strategy, validation query and flag dependency. Rehearse on synthetic full-scale data. Large index creation is separated from ordinary transactional schema steps. Stop a backfill if it consumes the foreground pool budget; resume from durable progress without replaying already verified rows.

Transaction snapshots retain form, rate, consent, coverage, mapping and product versions. A corrected mapping produces a new version and may require explicit reconciliation; historical external requests retain their original version reference. Backfills never reinterpret an old premium using today's rate table.

MIG-01 old API workers coexist with new readers without schema errors; MIG-02 crash/restart yields exact row coverage and no double side effects; MIG-03 rollback reverts traffic while preserving new compatible data. Package/database versions remain unselected pending implementation evidence; this is a migration specification, not executed migration code.
