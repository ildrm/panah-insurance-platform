---
{
  "id": "DOC-11-QUALITY-ACCEPTANCE-SCENARIOS-CRITICAL-INVARIANTS",
  "title": "Critical acceptance scenarios",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Critical acceptance scenarios

## AC-CORE-FLAG
Given a committed paid order before B2C is disabled, when delivery worker consumes its event later, then issuance continues unless a separate security quarantine applies; a new direct commitment fails, personal policy access/installments remain and control revisions are audited.

## AC-CORE-UNKNOWN
Given carrier submission may have succeeded and carrier supports neither idempotency nor authoritative status, when timeout occurs, then state is external_outcome_unknown, paid/unissued remains visible, automatic replay stops and verified reconciliation is required before resubmission/refund.

## AC-CORE-TENANT
Given one user belongs to two employers and owns personal health insurance, when switching employer context and exporting, then only the active employer's permitted nonmedical projection is present; previous context data and private policies are absent.

## AC-CORE-CREDIT
Given an approved invoice-backed purchase, when commitment is recorded, then receivable and credit reservation exist without a cash receipt; later invoice payment creates no duplicate issuance event.

## AC-CORE-ATOMIC
Given injected crash before purchase/outbox transaction commits, neither is visible; given crash after commit, durable recovery dispatches the obligation using the original business identity. Duplicate delivery may occur but cannot duplicate business effect.

## AC-CORE-REFUND
Given verified funds and two concurrent refund requests, lock/constraint enforcement ensures total approved and confirmed refunds never exceeds refundable funds; uncertain payout blocks replay and bank change invalidates previous approval.

These are acceptance designs awaiting application execution. Stable feature and product cases live in their own specs; no passed result is implied.
