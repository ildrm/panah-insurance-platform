---
{
  "id": "DOC-12-CI-CD-AND-ARTIFACT-SECURITY",
  "title": "CI/CD and artifact security",
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

# CI/CD and artifact security

Proposed pipeline: checkout exact revision; verify dependency lock/integrity; secret/license/vulnerability checks; format/types/import rules; contract/schema/docs drift; unit/property/integration tests; build separate artifacts; create SBOM/provenance; run staging E2E/security/bundle checks; approve risk-specific performance/recovery evidence; promote immutable artifact digest. A pipeline definition is pending implementation; no build run is claimed.

Build workers receive short-lived minimal credentials and cannot access production customer data. Untrusted pull requests cannot read secrets or mutate release environments. Artifact promotion uses verified digest, never mutable tag alone. Database migrations are separate reviewed steps with forward/rollback strategy.

Release evidence includes all commands/results, skipped checks with reasons, source/lock hash, contract compatibility, unresolved vulnerabilities and human approvals. Failed scans or missing artifacts fail the gate. Deployment authorization is a real release decision, not inferred from documentation approval.

OPS-CI-01 modified artifact digest is rejected; OPS-CI-02 untrusted branch cannot obtain secrets; OPS-CI-03 old client/new API contract compatibility is tested; OPS-CI-04 failed docs/schema drift blocks release. Canary rollout is optional only after baseline observability and recovery are proven, not a substitute for certification.
