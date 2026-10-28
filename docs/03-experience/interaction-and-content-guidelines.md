---
{
  "id": "EXP-INTERACTION",
  "title": "Interaction and content guidelines",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R04",
  "reviewer_roles": [
    "R07",
    "R11",
    "R13",
    "R21"
  ],
  "scope_ids": [
    "INS-02",
    "INS-06",
    "COM-08",
    "GRW-08",
    "GRW-09",
    "DSH-06"
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

# Interaction and content guidelines

## Truthful state language

Use precise verbs: saved, submitted, payment verified, awaiting insurer, issued, effective, delivered, refund requested and refund completed. Never use “insured” or “active” solely after payment. An acknowledgment explains what was durably accepted and what happens next. Unknown carrier outcome is “confirmation is being checked,” with a support reference and no claim of failure. Customer wording is distinct from masked operator diagnostics.

Quote results disclose incomplete carrier participation, failed/timeout carriers and validity. A price labeled indicative cannot lead directly to binding without revalidation. Sponsored ranking is labeled near the ranking control. Discounts and installment offers show eligibility, total payable, financing costs and terms version; loyalty points and promotional credit are not labeled cash.

## Form and recovery behavior

Ask only fields required by the current versioned product/plan. Conditional changes explain which earlier answers/evidence/quotes will become stale before discarding them. Save/resume displays the last server acknowledgment; local typing is not a persisted draft. When a server validation fails, focus an error summary linking to affected fields and preserve nonsensitive values. Medical/identity data is not echoed in logs, analytics or broad error messages.

For version conflicts, show a safe summary of changed fields and require review; do not silently merge declarations, beneficiaries, money or effective dates. Retry buttons reuse the original idempotency key while body is unchanged. Browser back, reload and duplicate callbacks cannot create a second purchase. Expired links request reauthorization and do not expose underlying document titles. A forbidden route has no record-specific hint.

## Copy and communication controls

Original content uses an editorial author/reviewer/version and source confidence. Product wording references approved insurer terms; unavailable commercial/legal facts are marked pending review rather than invented. Help distinguishes guidance from insurer-authorized decisions. Accessibility labels are meaningful in Persian and English, not direct transliterations of code identifiers.

Transactional messages include a safe case reference and authenticated destination. OTP messages never include account details; claim notifications omit diagnoses/beneficiary/bank data. Marketing requires separate consent/preferences and suppression checks; sending a service notice does not grant marketing permission. Rate limits, retries and delivery outcomes follow notification domain controls. Templates are versioned and audited; the preview must show sample synthetic variables only.

## Destructive and privileged actions

Use a confirmation only when it helps the user understand a material consequence: cancellation request, enrollment removal, payout proposal, role grant or configuration publication. State whether the action is a request or a completed external change, and show effective dates and financial implications. Reason is mandatory for privileged changes; maker-checker is required where domain policy specifies. A confirmation dialog does not replace server authorization or independent approval.

AC-EXP-COPY-STATE: test messages against each independent finance/insurance state and ensure no false activation. AC-EXP-COPY-PRIVACY: template/error/analytics snapshots contain no sensitive fixture values. AC-EXP-COPY-RECOVERY: keyboard user corrects a validation failure and version conflict without losing safe inputs or submitting twice. R04/R16 own copy, R02/R12 validate domain meaning and R13 records tests.
