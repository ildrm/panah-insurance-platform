---
{
  "id": "DOC-01-PRODUCT-PERSONAS-AND-JOBS-TO-BE-DONE",
  "title": "Personas and jobs to be done",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R01",
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

# Personas and jobs to be done

| Persona | Job | Boundary |
|---|---|---|
| Individual buyer | Compare, purchase, renew and retrieve policy | Own or explicitly delegated subjects |
| Payer | Fund a specific order | Payment receipt does not grant insured medical access |
| Corporate requester | Prepare census/asset purchase | Branch/cost-center scope |
| Corporate approver | Approve terms within limit | Cannot approve own request |
| Corporate finance | Pay invoice and reconcile | Financial projection excludes medical evidence |
| Employee/beneficiary | See coverage, enroll dependents, file private claims | Membership does not expose personal policies to employer |
| Seller/agency | Assist consented customers and receive commissions | Contract and customer delegation scopes |
| Carrier staff | Underwrite and issue own submissions | Own carrier and operation grants |
| Support/claims operations | Resolve assigned exceptions | Time-limited reasoned access, no implied finance authority |
| Administrator | Govern configuration and access | Privileged actions audited; finance dual control |

Buyer, requester, approver, payer, policyholder, insured, beneficiary, distributor and carrier are separate foreign-key relationships. An invitation establishes a membership only after acceptance and verification. Context switching changes active organization, reloads authorization and clears private client state.
