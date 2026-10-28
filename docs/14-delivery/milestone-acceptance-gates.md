---
{
  "id": "DOC-14-DELIVERY-MILESTONE-ACCEPTANCE-GATES",
  "title": "Milestone acceptance gates",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R18",
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

# Milestone acceptance gates

M0: docs structurally valid and substantive gaps explicitly closed; R17/R03 own evidence. M1: identity/tenancy/flags plus synthetic quote journey; R11 checks isolation and R06 measures first/partial results. M2: verified payment to issued policy through simulator crashes/unknown outcomes; R12/R09 verify financial and delivery invariants. M3: corporate credit, reseller and beneficiary flows; R02/R20 validate operations and health privacy. M4: servicing, claims, growth, automotive and all product-family variants with contracts/authority as applicable.

Every milestone has separate documentation-ready, local-test-ready, sandbox-certified and production-enabled status. Do not label a feature live because its mock endpoint returns success. Scope completeness includes disabled features and native-app uncertainty.

Release requires security/accessibility review, restore and rollback evidence, representative performance results and staffed incident ownership. No such application evidence exists in this documentation task. R18 records human decisions in the approval register when supplied.
