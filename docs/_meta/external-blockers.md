---
{
  "id": "DOC-IMPLEMENTATION-EXTERNAL-BLOCKERS",
  "title": "External implementation blockers",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R19",
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

# External implementation blockers

These missing external authorities block their affected real operations. Safe local implementation and synthetic testing can continue. No actual provider acceptance or human approval is fabricated.

| Blocker | Owner roles | Affected scope | Safe current behavior | Required evidence |
| --- | --- | --- | --- | --- |
| Insurer contracts, rates, underwriting and servicing APIs | R02/R09/R19/R20 | INS, COM-06, SVC, INT | Three fictional transports; other real operations disabled | Signed commercial/technical authority, approved mappings and certification |
| Payment, financing, credit, settlement and claims payout authority | R12/R19 | COM-03/04/09, GRW-02, SVC-03/08, ORG-03, AUTO-03 | Synthetic verified financial operations, exact local journals; no live fund movement | Provider contracts, reconciliation and dual-control approval |
| Official identity, vehicle, history and government inquiries | R09/R11/R19 | INS-04, COM-02, AUTO-02 | Explicit unsupported or synthetic/manual boundaries | Permitted data access, purpose, provenance and retention rules |
| Insurance, trading, adjacent finance and rewards permissions | R01/R12/R19 | AUTO-07, ECO-01, GRW-03/04 and regulated offerings | Real regulated action disabled | Jurisdiction/licensing review and approved commercial terms |
| Privacy, residency, medical data, retention and arbitrary-file malware scanning | R10/R11/R19 | ORG-04, COM-02, claims, support and private documents | Minimal scoped projections and quarantined unknown files | Approved scanner, lawful basis, deletion/legal-hold and residency decisions |
| Production infrastructure, secrets, recovery and on-call ownership | R06/R10/R11/R14/R18 | All production operations | Local native verification and Compose syntax only | Approved targets, deployed encrypted/off-site backups, measured DR/capacity and incident drills |
| Native client scope and app distribution | R01/R04/R18/R21 | GRW-10, AUTO-08 and device experiences | Web/PWA artifacts; native decision remains undecided | Explicit scope decision and platform-specific acceptance where selected |

Missing external input is not a reason to delete capability IDs or mark an unimplemented feature complete. Every full requirement remains in the [checkpoint](implementation-status.json).
