---
{
  "id": "DOC-11-QUALITY-RISK-BASED-TEST-STRATEGY",
  "title": "Risk based test strategy",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Risk based test strategy

Prioritize monetary integrity, tenant/health-data isolation, authorization revocation, irreversible insurer operations and servicing continuity. Risk is impact × likelihood × detectability; R13 records justification rather than treating line coverage as correctness. Critical invariants require property/integration tests and adversarial failure cases; low-impact content changes use focused checks.

Test layers: pure domain rules with injected clocks/IDs; PostgreSQL transactions and constraints; provider contract simulators; browser journeys across seven dashboards; manual accessible interaction; load/soak/recovery; certified sandbox then approved live smoke tests. Never promote synthetic coverage to real connectivity. Release evidence binds commit, fixture digest, environment and exact dependency lock.

Exit requires stable child acceptance mapping, all critical tests passing, no unresolved material data/money defect and operational ownership. Deferred noncritical findings require explicit risk disposition. Unknown external authority blocks only the affected real operation, but must remain visible in readiness.
