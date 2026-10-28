---
{
  "id": "DOC-14-DELIVERY-INTEGRATION-AND-COMMERCIAL-BLOCKERS",
  "title": "Integration and commercial blockers",
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

# Integration and commercial blockers

[Risks and blockers](../_meta/risks-and-blockers.yaml) contains the missing inputs, owner, affected scope, safe default and launch consequence. At minimum: jurisdiction/licensing/residency; carrier agreements/rates/schemas; payment/refund authority; credit/financing terms; claims delegation; official inquiry rights; automotive/logistics contracts; regulated rewards/trading/referrals; infrastructure and capacity budgets; native scope.

R09 may implement fictional/local boundaries and contract tests without credentials. Only executed agreements and actual provider sandbox evidence can move a connection from simulated to sandbox-validated; live certification is separate. Secret values never enter documentation, examples or logs.

Unknown outcomes require provider reconciliation mechanisms; if neither status nor idempotency exists, the commercial/operating agreement must define manual evidence and remediation. An integration without this procedure cannot be production-enabled even if happy-path transport works.
