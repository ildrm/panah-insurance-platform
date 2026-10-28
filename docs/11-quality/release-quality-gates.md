---
{
  "id": "DOC-11-QUALITY-RELEASE-QUALITY-GATES",
  "title": "Release quality gates",
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

# Release quality gates

G0 documentation: baseline preserved; substantive requirements and contracts reviewed; all schema/link/reference checks pass or precise missing validation recorded. G1 local: strict TypeScript/lint/import rules; unit/property/integration/contract tests; no app implementation exists yet. G2 sandbox: actual provider certification, security-negative matrix and representative performance workload. G3 recovery: restore, migration rollback, queue recovery and unknown-outcome incident rehearsal. G4 production: authorized contracts/licensing, human risk sign-offs, staffed on-call and rollback plan.

No gate can be passed by plans or generated text alone. A pending insurer agreement blocks affected live operations; a missing money or authorization invariant blocks release across affected channels. Feature flags restrict exposure but cannot compensate for absent server authorization.

R18 records owner, evidence digest, test environment/version, reviewer and decision for each gate. Quality waivers require explicit approver authority and expiration; no waiver may fabricate external authority or redefine a successful payment as coverage.
