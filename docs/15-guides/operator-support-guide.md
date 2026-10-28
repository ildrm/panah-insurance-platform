---
{
  "id": "GUIDE-OPS",
  "title": "Operator and support guide",
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
    "COM-08",
    "COM-09",
    "SVC-09",
    "INT-07"
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

# Operator and support guide

## Claim and understand a case

Open only queues assigned to your role and scope. Claiming a task acquires a versioned lease; if another operator owns it, use the read-only view or authorized transfer. Read independent payment, submission, underwriting, issuance, delivery and settlement states before taking action. A customer payment receipt is evidence for reconciliation, not permission to mark coverage active.

Confirm resource/context, last verified state, source evidence, current version, next permitted action and customer-visible explanation. Notes distinguish restricted internal evidence from customer-visible content. Never include credentials, OTPs or unnecessary personal/medical data. Support assistance requires explicit consent and scope; do not impersonate the customer silently.

## Handle common exceptions

| Case | Allowed response | Prohibited shortcut |
|---|---|---|
| Payment return without verification | Query authoritative payment status and reconcile the existing attempt. | Mark paid from browser parameters or create repeated orders. |
| Paid but unissued | Check committed event/outbox, submission state, underwriting dependencies and carrier evidence. | Mark policy active to clear the queue. |
| Carrier timeout after possible acceptance | Set/retain unknown outcome, query authoritative status or escalate for evidence. | Blindly resend non-idempotent issuance or refund before reconciliation. |
| Duplicate callback | Match inbox/business key and preserve one logical transition. | Apply a second allocation or issue another policy. |
| Evidence rejected/expired | Request the specific correction/retake and preserve version history. | Approve an unsafe upload or reuse expired inspection. |
| Bulk partial failure | Identify accepted/rejected rows and approved partial policy; retry stable row identities. | Report whole-batch success or duplicate valid rows. |
| Provider fulfillment dispute | Track booking/shipping/return evidence and authorized remedy. | Promise an insurance refund or provider payment without authority. |

## Financial and claim decisions

Finance maker proposes a refund/settlement/payout with original allocation, exact currency/unit, reason, verified recipient and evidence. A distinct checker approves within delegated limit; the execution worker performs the provider operation. Unknown payout outcomes require reconciliation. Ledger corrections use reversals/adjustments, never destructive edits or balancing an unrelated account.

Claims handlers see only assigned restricted cases and actual contract authority. Intake, assessment, decision and payment are separate. Employer/seller/payer status does not grant medical access. Escalate coverage interpretation or legal questions to the designated qualified reviewer; do not invent a settlement promise or medical recommendation.

## Escalate and hand over

Escalation includes safe case reference, severity, observed/expected state, masked correlation, evidence location, owner and next permissible action. Alert on oldest unresolved paid/unissued/unknown-outcome work according to operational SLOs; repeated retries are not progress. Handover exports contain safe status/ownership, not attachments or diagnoses. Sales disablement leaves servicing queues available; security quarantine stops only its specified unsafe operations and preserves audit/reconciliation.

Use the [operations dashboard](../03-experience/dashboards/operations.md) and approved runbooks for exact steps. R20 owns queue procedure, R09 partner ambiguity and R12 finance decisions. This draft guide is not live operating authority and contains no claim that recovery tests have passed.
