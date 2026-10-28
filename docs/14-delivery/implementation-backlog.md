---
{
  "id": "DOC-14-DELIVERY-IMPLEMENTATION-BACKLOG",
  "title": "Implementation backlog",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R18",
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

# Implementation backlog

The canonical work-item rows are [traceability](../_meta/traceability.csv): one child requirement per row with planned module, contract operation, acceptance test, budget and release slice. IDs remain stable through scheduling; child refinements append IDs rather than renumbering delivered work.

For each work item implement domain rules/DTO validation/authorization in its assigned Nest module, a typed contract client and allowed screen in Next, migrations/indexes with bounded backfill, synthetic fixtures and failure tests. Default flag remains off until evidence passes. Rollback disables new entry, preserves committed servicing and reverts only compatible app changes; migrations use expand/contract. R13 requires unit/property/integration/contract/E2E/security/performance evidence according to risk.

S0 foundation tasks additionally require strict TS/package lock, boundary lint, schema generation, full documentation validators, immutable configuration and audit, ledger constraints, per-order serialization and receiver inbox/outbox. Build contracts before UI mutation paths. Work item completion requires exact changed files, test commands/results, performance/security gate, migration/flag strategy and reviewer evidence; all are currently planned application work.
