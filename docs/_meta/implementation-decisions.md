---
{
  "id": "DOC-IMPLEMENTATION-DECISIONS",
  "title": "Implementation decisions",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R13",
    "R17",
    "R19"
  ],
  "scope_ids": [
    "ALL"
  ],
  "source_refs": [
    "S00",
    "S27",
    "S28",
    "S29"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Implementation decisions

These are implementation choices and proposed local assumptions. They are not insurer contracts, regulatory approvals or independent human sign-offs. The user authorized implementation; no full-scope deletion or native-scope decision is inferred.

The stack uses one web presentation application with context-specific dashboards and server-side domain authority. PostgreSQL persists financial journals and durable integration state. The fictional REST, SOAP and signed HTTP protocols stay distinct; unsupported real operations fail closed. Only PRD-01, PRD-07 and PRD-24 have synthetic carrier mappings. All 24 product schemas remain represented, including assisted/unsupported product outcomes.

Wallet issuance uses the distinct `purchase.committed.v2` event and `verified_wallet_allocation` funding state. Carrier delivery retains the same stable submit key and cannot manufacture a provider cash receipt. Insurer-confirmed issuance persists before independent private-document retrieval. Historical connection versions and exact historical synthetic secret-reference aliases remain usable for committed work.

- `BIZ-D01` (proposed): Application snapshots correct overescaped decimal-dot patterns in documentation risk schemas, matching the prose decimal fields. Decimal90.50 validation test proves intended behavior; source docs generator needs reconciliation. Source: `docs/_meta/fragments/business-implementation.json`.
- `BIZ-D02` (proposed): AJV strictRequired lint false only for legal then.required outer-object definitions; runtime required checks and strict schema/type/format validation remain active. Source: `docs/_meta/fragments/business-implementation.json`.
- `BIZ-D03` (proposed): Only known exact synthetic PNG/PDF digests become clean_synthetic. Unknown valid bytes remain quarantined; EICAR/bad magic rejected. This is not a general malware-scanning service. Source: `docs/_meta/fragments/business-implementation.json`.
- `BIZ-D04` (proposed): ST_CURSOR_SECRET binds signed cursors across replicas. Without configured secret, cryptographically random per-process local key safely invalidates cursors on restart; production shared-key deployment/rotation evidence pending. Source: `docs/_meta/fragments/business-implementation.json`.
- `CTRL-DEC-01` (recorded component choice): Commercial controls default false, mandatory foundations/servicing true, no live authority can be supplied by public booleans; root fixture explicitly publishes synthetic approvals. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-DEC-02` (recorded component choice): Quarantine reviewAt records review due and never auto-lifts hazardous operation denial. Recovery requires a dedicated incident-scoped rule replacement with remediation reference, separate approval grant; generic rollback cannot change quarantine. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-DEC-03` (recorded component choice): ControlContext is an internal server contract. Scope values and reservation/commitment references must be derived and validated from authorized persisted records by the owning use case; flags never grant object/property authority. Source: `docs/_meta/fragments/controls-implementation.json`.
- `CTRL-DEC-04` (recorded component choice): Rule edits replace active snapshot entries but retain all immutable prior versions. The shared epoch lock serializes application commit and approval. Historical reads reuse the same SQL client to avoid pool acquisition deadlocks. Source: `docs/_meta/fragments/controls-implementation.json`.
- `INT-PROPOSAL-GROUP-WIRE` (proposed-local-only): Preserve documented motor v1 vocabulary and add separately typed fictional SIM-GROUP/RequestGroupQuote extensions for approved aggregate census count; no health PII or real tariffs. Source: `docs/_meta/fragments/integration-implementation.json`.
- `INT-PROPOSAL-PRIVATE-DOCUMENTS` (proposed-local-only): Insurer-confirmed issuance persists before independent document retrieval; private UUID.pdf files use OBJECT_STORAGE_DIR and no public file server. Source: `docs/_meta/fragments/integration-implementation.json`.
- `OPS-D01` (local-implementation-choice): Use read-only exported PostgreSQL snapshot for both fingerprints and pg_dump; restore only into newly generated task-owned database and clean only in-process-created names Source: `docs/_meta/fragments/operations-implementation.json`.
- `OPS-D02` (local-implementation-choice): Permit exact configured service hostnames only from trusted sandbox deployment environment; loopback remains the default and all host ports bind loopback Source: `docs/_meta/fragments/operations-implementation.json`.
- `OPS-D03` (local-implementation-choice): Capture transactionally consistent source data even when the scoped business gate fails. Restore reports snapshotMatched separately from verified/businessIntegrityPassed; invalid-source CLI result is nonzero, the backup is retained and only the generated restore database is removed. Older manifests require a fresh backup before qualifying under this gate. Source: `docs/_meta/fragments/operations-implementation.json`.

Native applications, actual provider contracts, approved infrastructure targets and production release remain unresolved decisions.
