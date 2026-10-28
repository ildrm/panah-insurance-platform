---
{
  "id": "DOC-12-PRODUCTION-READINESS-REPORT",
  "title": "Production readiness report",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R14",
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

# Production readiness report

Production readiness: **false**. This is a partial local implementation checkpoint with no independent human release approval or live-provider certification.

| Gate | Actual evidence | Status |
| --- | --- | --- |
| Baseline scope | All 74 parents, 230 children, 24 products and 21 roles retained | Represented; implementation incomplete |
| Reproducible build | Official normalized lock, clean npm install and all-workspace Node 24 production build passed | Verified at recorded source checkpoint |
| Local domain/integration regressions | Recorded Node 24 regression: 70 passed, 0 skipped; wallet/credit/cash distinctions and uncertain carrier outcomes exercised | Component evidence only |
| Browser behavior | Recorded local purchase, context and operations scenarios | Remaining full journey, a11y and mobile/device coverage |
| Dependency advisories | Official npm bulk response reported no advisories for 212 dependency names | Point-in-time check, not security certification |
| Database and objects | Six current recovery tests separate snapshot fidelity from source business integrity; the historical33-table/6-document native pass used an earlier weaker gate | Current demo source gate fails; isolated valid fixtures pass |
| Containers | Six-service Compose configuration parses; migration/seed bootstrap and health dependencies authored | Image/runtime, volume restore and rollback unqualified |
| Performance | Corrected small local smoke: 2,000/2,000 arrivals, 199.31 requests/s, p95 11.88 ms, p99 15.49 ms, zero errors; 7 policies/13 orders/18 users | Production workloads, field Web Vitals and capacity unqualified |
| Observability | Local diagnostic/transaction and health components, partial private operational metrics | SLOs, distributed tracing, dashboards, alert delivery and incident drills incomplete |
| Recovery objectives | Native observed backup 3,966 ms and restore/verify 938 ms for historical small fixture; no observed data-loss experiment | RPO/RTO remain proposed, unmeasured production targets |
| Security/privacy/legal | Local scoped authorization, verified callback and immutable journal protections | Formal review, retention/deletion, real scan/keys/residency and regulatory gates open |
| External operations | Fictional carrier/payment/finance boundaries only | Actual provider contracts and certification absent |
| Native clients | Web/PWA artifacts exist | Native scope undecided |

Recovery exports one read-only repeatable-read snapshot for both table fingerprints and `pg_dump`, then restores into a newly generated `st_restore_...` database. Verification checks all application table/schema hashes, exact journal balances, pending/unknown orders, inbox/outbox/submissions/policies and private document manifests. Tests reject row/PDF tampering and preserve source state. Recovery does not blindly replay outbound mutations. The historical artifact is `.local/backups/2026-10-28T09-32-11-580Z-c796a8a0-e0b9-4810-9103-42ecaad235bf/recovery-report.json`. Later migrations/data require a new measured checkpoint; this artifact is not proof of current production disaster recovery.

Before release, qualify independent failure-domain and encrypted/off-site restores, key-loss recovery, deletion/legal-hold reapplication, restored session/access review, real-provider reconciliation, controlled rollback, representative load and signed operational ownership. Targets in the central performance registry remain targets until measured under their specified workload. See [external blockers](../_meta/external-blockers.md), [remaining implementation](../_meta/implementation-continuation.md) and [executed evidence](../_meta/implementation-evidence.json).

Current local source checkpoint: snapshot fidelity matched across53 tables/36 documents; business integrity is **false**. There are30 historical synthetic commitments without canonical events and submissions from pre-isolation tests. The CLI exits nonzero, preserves the backup, removes its generated restore target and does not repair or delete source records. See [current source gate](evidence/local-recovery-source-gate.json). This finding supersedes any inference of current business-integrity success from the historical weaker-gate drill.
