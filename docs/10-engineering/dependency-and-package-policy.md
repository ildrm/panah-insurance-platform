---
{
  "id": "DOC-10-DEPENDENCY-AND-PACKAGE-POLICY",
  "title": "Dependency and package policy",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Dependency and package policy

Add dependencies only with a specific use, maintained primary source, license compatibility, transitive cost/security review and owner. Prefer platform/library capabilities already selected; multiple ORMs, validation systems or state libraries need a documented boundary and measured benefit. Pin exact versions and lock transitive resolution at implementation bootstrap.

CI scans for known vulnerabilities, exposed secrets, unsupported versions and license conflicts. Findings are triaged by exploitability/reachability and asset impact, with owner/deadline and compensating controls. Do not silence a scanner globally or claim absence of vulnerabilities because a tool failed. High-risk reachable issues block release until fixed or explicitly reviewed under governance.

Review package install scripts, binary provenance and registry source; build in isolated environments with least-privilege credentials. Produce an SBOM and artifact provenance tied to the commit/lockfile. Runtime containers exclude test secrets and unnecessary build tools. Third-party browser scripts require privacy and bundle review.

DEP-01 clean lockfile install verifies integrity; DEP-02 malicious or unapproved registry/package change fails policy; DEP-03 dependency upgrade passes contract/cache/migration tests; DEP-04 SBOM matches deployed artifacts. The official npm bulk advisory check for exact locked versions is recorded in [dependency evidence](evidence/dependency-advisories.json). It reported no advisories at that time; a complete security/license/provenance assessment remains pending.
