---
{
  "id": "DOC-12-BUSINESS-CONTINUITY-AND-MANUAL-OPERATIONS",
  "title": "Business continuity and manual operations",
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

# Business continuity and manual operations

Manual work is an authorized fallback with evidence, not a bypass of domain rules. A case records affected order/policy, capability, missing automation, staff scope, customer communication, approved recipient data and expected reconciliation. Manual quotes require insurer-approved terms/version; manual issuance requires confirmed insurer reference/effective dates. Staff cannot mark coverage active from a payment receipt.

During outages, pause new sales for affected capabilities when safe commitment cannot be guaranteed, preserve policy downloads/claims/owed installments where possible, and keep durable pending work visible. Security quarantine may restrict access separately with an incident owner. B2B shutdown must not disconnect carriers needed by B2C.

Operations queues distinguish evidence requests, underwriting review, inspection retake, paid-unissued, ambiguous submission, refund/payout unknown, enrollment errors and provider fulfillment disputes. Assign by permission and skill, with escalation and handoff notes. Sensitive case details are projected by role.

OPS-BC-01 operates a simulated carrier outage without losing an accepted purchase; OPS-BC-02 manual evidence is independently checked before transition; OPS-BC-03 restored automation reconciles manual work and does not repeat it. Contractual service deadlines and staffing schedules remain pending inputs; workflow due times must be configured from approved contracts before live launch.
