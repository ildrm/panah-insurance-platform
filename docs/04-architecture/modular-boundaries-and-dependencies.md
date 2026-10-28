---
{
  "id": "DOC-04-MODULAR-BOUNDARIES-AND-DEPENDENCIES",
  "title": "Module ownership and allowed dependencies",
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
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Module ownership and allowed dependencies

| Module | Owns | Permitted collaboration |
|---|---|---|
| identity | persons, sessions, memberships, roles | exports subject/context authorization contracts |
| catalog | products, forms, plans, availability | exports immutable version snapshots |
| quoting | applications, quote sessions, offers | catalog/identity ports and connector quote port |
| commerce | orders, approvals, commitments | quoting snapshots; finance verification/credit ports |
| finance | payment attempts, allocations, ledger, refunds, settlement | narrow order-reference port; payment adapter |
| policy | underwriting, inspections, submissions, policies, endorsements | committed events; carrier capability ports |
| claims | claims, assessment, authority checks | policy coverage snapshot; approved finance payout port |
| organization | census, cost centers, budgets, HR imports | identity membership and policy enrollment ports |
| growth | content, campaigns, referral, loyalty | permitted commercial events; finance credit port |
| automotive | obligations, bookings, parts, transaction referrals | independent provider contracts and finance allocations |
| integration | partner configurations, mapping versions, attempts, inbox/outbox transport | canonical schemas; no domain-state ownership |
| reporting/support | projections, tickets, permitted exports | recipient-scoped events and read contracts |

Only owning modules mutate their tables. Import domain/application interfaces through explicit public exports, never another module's persistence folder. Transport DTOs do not become domain entities. SQL adapters implement use-case-specific repositories; no generic repository hierarchy is required. Simple catalog reads remain services; aggregates protect balances, approvals, policy transitions and commitment invariants. CI rejects cycles and forbidden imports. Architecture exceptions state owner, expiration, measured reason and migration plan.
