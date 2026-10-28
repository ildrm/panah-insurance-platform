---
{
  "id": "DOC-12-BACKUP-RESTORE-AND-DISASTER-RECOVERY",
  "title": "Backup, restore and disaster recovery",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R14",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-05",
    "COM-09",
    "INT-07",
    "INT-09"
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

# Backup, restore and disaster recovery

Production requires approved recovery point/time objectives by dataset and obligation, encrypted backups, key recovery, object-store version recovery and tested database restore. PERF-OPS in the [central registry](../_meta/performance-budgets.yaml) supplies proposed database/object RPO/RTO targets; [operational defaults](operational-policy-defaults.json) defines ownership and verification. R14/R12/R19 approval, actual region and measured evidence remain pending; no production-qualified backup system exists yet. An executable isolated local backup/restore implementation and drill now exist; see [current readiness](production-readiness-report.md) for actual evidence and limits. Replication is not a substitute for an independently recoverable backup.

Restore drill: select a synthetic recovery point and artifact/schema versions; restore into isolated network; validate integrity/constraints and ledger balance; reconcile outbox/inbox/job leases; apply pending deletion/retention actions; compare object hashes and policy document references; validate authorization; resume simulated partners with stable business keys; reconcile unknown outcomes before allowing replay. Record actual data loss window and recovery duration.

Do not replay all outbound commands indiscriminately after restore. A restored database may predate an external acceptance; provider reconciliation is mandatory for affected issuance/payout attempts. Quarantine uncertain operations and preserve evidence until resolved. Recovery access uses dual control and audited temporary privileges.

OPS-DR-01 restores without access to the original host; OPS-DR-02 missing key fails clearly; OPS-DR-03 no double payout/issuance after reconciliation; OPS-DR-04 erased subject data is not reopened. Production readiness needs measured successful drills and owner sign-off, not merely backup-job success logs.
