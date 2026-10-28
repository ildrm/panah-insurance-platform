---
{
  "id": "GUIDE-CARRIER",
  "title": "Insurer and supplier portal guide",
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
    "DSH-05",
    "INT-06",
    "INT-07",
    "COM-06",
    "COM-09"
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

# Insurer and supplier portal guide

## Select the correct partner role

The portal identifies carrier/supplier organization, product/channel scope and staff role. A carrier is not a corporate buyer. Underwriting, operations, finance and partner administration have different field/action grants; seeing a dashboard does not authorize every case. Supplier fulfillment staff receive only their service orders, not insurance underwriting data.

API-only operation is supported when approved: portal seats are optional, while versioned contracts, authorization, delivery audit and reconciliation still apply. Disabling B2B sales must not disable your authorized B2C carrier traffic. Sandbox and live environments are visibly distinct and use separate configuration/credentials.

## Process submissions and decisions

Open an assigned submission and review canonical application version, permitted risk/evidence and correlation reference. Acknowledge through the contracted operation. Request supplementary evidence with a reason and scope; do not ask for unrelated customer records. Underwriting accept/reject decisions require delegated authority, current case version and evidence references.

Issuance records the verified carrier policy reference, document and effective-date semantics. It must not overwrite payment status or infer activation from a receipt. Callback/polling races are deduplicated by the backend. If a submission times out after possible acceptance, reconcile using an authoritative status/reference before replay; lack of idempotency/status capability may require manual evidence and a separately approved action.

## Propose products or integration changes

Use a draft proposal for plan/form/rate/mapping changes. Supply source/version, capabilities, synthetic contract evidence, effective time and rollback plan. Publication/live activation requires the platform's independent review and real contract/authority evidence. Do not paste credentials into tickets, mapping examples or arbitrary URLs. Credential rotation uses secret references and reviewed endpoint/egress configuration.

Product capability discovery must say which operations are supported: quote/reserve/submit/status/issue/document/endorse/cancel/claim. Unsupported operations show an approved assisted path or unavailable state; the portal cannot manufacture an API capability.

## Claims and settlements

View only assigned claims and fields necessary for your contracted role. Assessment, decision and payout authority are separate. Finance reconciles statement amounts, premium allocations, commissions/refunds and approved settlements. A dispute preserves the original evidence and ledger history; adjustments use controlled entries. Payout and recipient changes obey dual control and authoritative verification.

Exports recheck organization, product/channel and role at generation and download. Diagnostic views mask secrets and unnecessary PII. For an incident, provide correlation, operation, environment, mapping version and observed state through the approved support route. See the [carrier dashboard](../03-experience/dashboards/carrier.md) for exact routes and denials. No real insurer connectivity, certification or authority is claimed by this documentation.
