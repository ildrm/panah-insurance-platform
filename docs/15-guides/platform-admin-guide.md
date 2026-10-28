---
{
  "id": "GUIDE-ADMIN",
  "title": "Platform administrator guide",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
  "reviewer_roles": [
    "R04",
    "R11",
    "R13",
    "R20"
  ],
  "scope_ids": [
    "DSH-06",
    "CHN-04",
    "ORG-02",
    "INT-06"
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

# Platform administrator guide

## Enter with a bounded privileged role

Use the privileged sign-in and required MFA. Confirm the domain and scope you administer. Super-admin is exceptional time-bound elevation, not a routine license to browse medical/financial data. Every material change needs reason and audit; protected operations may require an independent checker. Role switching does not make the same human eligible to approve their own proposal.

## Change availability safely

1. Open feature management and create a proposal with key/type, scope, value, effective time, dependency changes, reason and rollback target.
2. Preview all four B2C/B2B combinations and relevant corporate/commercial/reseller/B2B2C subchannels. Check discovery, quotation, purchase, assisted sale, servicing and partner delivery separately.
3. Inspect draft, existing quote, payment-in-progress and committed-order behavior. A new-sales shutdown must preserve contracted servicing and required committed delivery.
4. Run schema/dependency/permission and race tests, then obtain the required checker. Publish the approved version at its effective time and monitor audit/queue effects.
5. Roll back through a new audited configuration version if needed. Rollback does not undo completed purchases, restore revoked access or rewrite financial history.

Audit/security foundations cannot be disabled by ordinary commercial flags. A security quarantine is a distinct incident action with bounded scope, reason, operator ownership and recovery criteria.

## Manage catalog, organizations and integrations

Keep product/forms/rates/underwriting/mappings immutable once referenced by a transaction. Draft a new version, validate synthetic fixtures and obtain required domain/commercial review. Missing real carrier agreements, rates or authority keeps live operations disabled. Organization onboarding models buyer/supplier/distributor relationships separately; a carrier organization must not be treated as a B2B buyer by default.

Integration studio accepts reviewed schema mappings and secret references. Approved endpoints/egress, authentication rotation, capability discovery and sandbox/live separation are mandatory. It does not execute arbitrary administrator-supplied code. Unknown carrier outcomes must remain visible for reconciliation; a replay button is not a substitute for evidence.

## Configure experiences and commercial programs

Menus, widgets, actions and reports reference registered routes/operations and intersect server permissions. Preview both permitted and denied roles, including cross-context data. A hidden field is not protected unless the API projection also omits it. Content/campaign/loyalty/referral proposals need their domain controls; games, prize draws, charitable redemption and financial referrals remain separately review-gated.

Automotive providers, parts commerce, trading, auctions, contracts and debt settlement have distinct capabilities and authority requirements. Do not enable a whole vehicle-trading bundle because one provider supports valuation.

## Review and investigate

Use scoped reports and append-only audit. Exports require purpose, field policy and current permission; avoid global customer dumps. Operational cases belong in the [staff workbench](../03-experience/dashboards/operations.md), where assignment and decision authority are explicit. See the [admin specification](../03-experience/dashboards/admin.md) for the full workbench map. Human approval, live certification and release evidence remain pending.
