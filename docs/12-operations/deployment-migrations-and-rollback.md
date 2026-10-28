---
{
  "id": "DOC-12-DEPLOYMENT-MIGRATIONS-AND-ROLLBACK",
  "title": "Deployment, migration and rollback runbook",
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

# Deployment, migration and rollback runbook

1. Confirm approved artifact digest, compatible schema/contract window, live capability authority and current backup/restore evidence. Record release owner and stop conditions.
2. Apply additive schema changes separately; measure locks and foreground impact. Do not run destructive migrations with application traffic without an approved plan.
3. Deploy readers/workers that support old/new records. Pause only affected new-sales capability if required; preserve owed servicing and reconciliation.
4. Run synthetic smoke journeys, inspect error/latency/queue/paid-unissued indicators and verify authorization/private cache behavior across replicas.
5. On stop condition, route traffic to the previous compatible artifact and disable the new capability version. Keep committed records/outbox intact; do not reverse schema blindly.
6. Reconcile in-flight attempts and resume controlled work. Record exact versions, affected orders, decisions and follow-up.

Rollback of presentation code never reverses captured payment or insurer issuance. Data compensation is an explicit authorized business operation. Backfills have durable checkpoints and separate cancellation. OPS-ROLL-01 rehearses failure after each rollout step; OPS-ROLL-02 old workers process retained event versions; OPS-ROLL-03 flags return to prior state without changing historical snapshots. Recovery timings are measured and compared with the approved registry/recovery plan, not invented here.
