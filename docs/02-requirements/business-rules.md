---
{
  "id": "DOC-02-REQUIREMENTS-BUSINESS-RULES",
  "title": "Business rules and non-overridable invariants",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
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

# Business rules and non-overridable invariants

| Rule | Invariant and test oracle |
|---|---|
| BR-CORE-01 | Identity, tenant, channel, insurer and commercial relationship are distinct; disabling B2B leaves B2C carriers eligible. |
| BR-CORE-02 | Explicit buyer/payer/requester/approver/policyholder/insured/beneficiary/distributor/carrier roles; no one customerId substitutes for them. |
| BR-CORE-03 | Flags cannot grant authorization; authorize resource and projected property at each trust boundary. |
| BR-CORE-04 | Employer cannot read unrelated personal policy or individual health claim; carrier sees only its own permitted recipient data. |
| BR-CORE-05 | Direct commitment requires verified money and commercial acceptance; credit/invoice commitment requires valid independent approval and reserved limit, not fictitious receipt. |
| BR-CORE-06 | Payment/application transition, audit and outbox insert commit atomically; external delivery is at-least-once. |
| BR-CORE-07 | Stable business idempotency survives transport retries. Unknown carrier/payout outcome blocks blind replay and incompatible refund. |
| BR-CORE-08 | Payment success cannot activate coverage; insurer-confirmed policy and effective dates determine coverage display. |
| BR-CORE-09 | Append-only balanced ledger per currency; refunds/chargebacks reverse linked allocations within remaining refundable balance. |
| BR-CORE-10 | Historical forms, prices, rules, consents, mappings and policy versions remain immutable references. |
| BR-CORE-11 | Sales shutdown does not cancel prior commitments or authorized servicing; security quarantine is separately privileged and audited. |
| BR-CORE-12 | Partner endpoints/auth are approved contracts; no administrator arbitrary code, unsafe XML, SSRF or unchecked callback replay. |
| BR-CORE-13 | Locks/version guards protect budgets, approval limits, coupons, wallet, claim and settlement transitions. |
| BR-CORE-14 | External authority missing means live operation off, not a guessed product rule. |
| BR-CORE-15 | Sensitive data is minimized at recipient projections and telemetry; private responses never enter shared public caches. |
| BR-CORE-16 | New purchase checks current control revision at its durable linearization point; old worker delivery uses the committed commercial snapshot plus current security quarantine. |

Capability-specific BR-<parent>-Rnnn rules remain in each feature specification. Shared financial rules are normative in [ledger and money](../05-data/ledger-and-money.md), authorization in [tenancy](../04-architecture/tenancy-identity-authorization.md), and flag precedence in [configuration](../04-architecture/configuration-and-feature-control.md). Rule changes require versioned migration and historical replay tests.
