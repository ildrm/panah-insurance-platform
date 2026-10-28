---
{
  "id": "DOC-12-ACCESS-AND-SECRET-ROTATION",
  "title": "Access review and secret rotation runbook",
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

# Access review and secret rotation runbook

Inventory privileged humans, service identities, credential references and approved destinations. Assign owner and expiry/review schedule. Join/move/leave events update membership and policy epochs; revoke sessions, outstanding export/download access and delegated grants. Do not infer that removing a menu revokes API access.

Rotation procedure: validate authorization and affected operations; create new secret version in the approved store; test in sandbox with synthetic data; activate supported overlap or planned cutover; monitor authentication failures/queue age; revoke old version; record key IDs and evidence without values. Partner contracts determine overlap and signing/certificate behavior. Unknown submissions remain unknown through rotation.

Emergency compromise: quarantine affected credential/destination, preserve obligations, revoke relevant sessions, coordinate R11 incident response, reconcile operations accepted during the risk window and obtain approval before reopening. Audit reviewers must be independent of the access requestor where possible.

OPS-ACCESS-01 revoked staff cannot use stale sessions/exports; OPS-ACCESS-02 wrong environment secret is denied; OPS-ACCESS-03 rotation preserves pending work and logs no secret; OPS-ACCESS-04 break-glass expires and is reviewed. Actual identity provider/secret service and human reviewer schedule are pending infrastructure decisions.
