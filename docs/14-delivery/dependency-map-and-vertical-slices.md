---
{
  "id": "DOC-14-DELIVERY-DEPENDENCY-MAP-AND-VERTICAL-SLICES",
  "title": "Dependency map and vertical slices",
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

# Dependency map and vertical slices

```mermaid
flowchart LR
  S0[Identity, tenancy, flags, contracts, audit] --> S1[Catalog and quote]
  S1 --> S2[Payment, ledger, delivery, issuance]
  S0 --> S3[Corporate and seller controls]
  S2 --> S3
  S2 --> S4[Servicing and claims]
  S3 --> S4
  S0 --> S5[Growth and reporting]
  S2 --> S5
  S2 --> S6[Automotive providers and commerce]
  S6 --> S7[Separately gated trading and referrals]
```

S0 includes testable privilege revocation and all four sales-mode combinations. S1 demonstrates progressive offers with one provider unavailable. S2 must survive payment callback duplication and crash-after-commit, and retain unknown insurer outcomes. S3 tests employer/employee privacy and maker-checker credit semantics. S4 adds product-specific endorsements, renewal and claims with authority restrictions. S5 cannot expose transactional data through analytics. S6 distinguishes bookings/stock/receipts from insurance issuance. S7 requires separate regulatory/provider decisions; native applications remain an independent scope decision.

Every slice includes a vertical path through presentation, Nest use case, owned persistence, tests, telemetry and operator recovery. No stage is considered done by adding routes alone. Deferred products remain in registry and backlog.
