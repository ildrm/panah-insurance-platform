---
{
  "id": "DOC-12-ENVIRONMENTS-AND-INFRASTRUCTURE",
  "title": "Environments and infrastructure",
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

# Environments and infrastructure

Separate local synthetic, shared test, partner sandbox, staging and live environments with independent identities, databases, object stores, endpoints and secrets. Only local documentation exists today. A configuration label cannot confer live authority; provider environment and approved destinations must match.

Propose private managed database/object storage and independently scaled API/workers behind TLS ingress. Region/vendor/residency and recovery location remain unselected. R14/R19 require contractual/legal evidence before selecting them. Infrastructure definitions must be reproducible and reviewed, with access logs, backup encryption and secret rotation.

Environment promotion carries immutable artifact/contract/migration hashes and capability certification; it never copies real personal data into test. Sandbox tests use permitted synthetic accounts. A test reset refuses live environment and unknown identity. Production service identities use least privilege and no shared human administrator keys.

OPS-ENV-01 confirms network isolation/egress policy; OPS-ENV-02 detects cross-environment credential use; OPS-ENV-03 rebuilds the environment from reviewed definitions; OPS-ENV-04 verifies no production data in fixtures. Capacity configuration references central budgets and workloads. Procurement, cloud access and actual deployment remain outside this task.
