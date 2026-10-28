---
{
  "id": "DOC-04-CONFIGURATION-AND-FEATURE-CONTROL",
  "title": "Configuration and feature-control consistency",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R05",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "CHN-01",
    "CHN-02",
    "CHN-05",
    "INT-01",
    "INT-07"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S02",
    "S03",
    "S04",
    "S09"
  ],
  "assumption_refs": [
    "A01",
    "A05"
  ],
  "updated": "2026-10-28"
}
---

# Configuration and feature-control consistency

Commercial availability has distinct dimensions: visibility, quote, purchase, assisted sale and servicing. Independent `sales.b2c`, `sales.b2b`, `sales.b2b.corporate`, `sales.b2b.commercial`, `sales.b2b.reseller` and `sales.b2b.b2b2c` controls combine with product/carrier/plan and relationship scopes by intersection. A narrower allow cannot override a global deny. `servicing.enabled` and `partner_delivery.enabled` preserve obligations independently; `security.quarantine` is a separately authorized override. Ordinary commercial administration cannot disable audit, authorization or encryption.

Configuration versions are immutable proposals with author, reviewer, effective UTC instant, scope predicates, dependency validation and rollback target. Preview evaluates representative contexts and reports denied dependencies. Activation records reviewer and reason. At purchase commit, lock the applicable configuration epoch with the order; persist the chosen versions and decision. If disabling wins first, reject new commitment except a still-valid pre-disable reservation explicitly permitted by A05 and its immutable accepted terms; never extend its expiry. If commitment wins first, continue servicing using that commitment. A redirect alone is neither a reservation nor the commit boundary. Money received after closure without a qualifying reservation/commitment enters exception/refund review.

Existing drafts become read-only or assisted according to scope; expired quotes require fresh eligibility. Already committed issuance, claims, installments, refunds and permitted partner delivery continue when new sales stop. Quarantine explicitly records allowed safety/reconciliation actions and customer communication.

Test FLAG-01 all four B2C/B2B combinations; FLAG-02 disable-versus-payment race; FLAG-03 version rollback cannot erase historical snapshots; FLAG-04 B2B shutdown leaves B2C carrier access available. PERF-FLAG is authoritative for cosmetic staleness.
