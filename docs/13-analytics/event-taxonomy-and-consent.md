---
{
  "id": "DOC-13-EVENT-TAXONOMY-AND-CONSENT",
  "title": "Analytics event taxonomy and consent",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R15",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "GRW-03",
    "GRW-04",
    "GRW-05",
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

# Analytics event taxonomy and consent

Analytical events are distinct from authoritative domain events. Proposed taxonomy includes catalog.viewed, questionnaire.started/saved, quote.requested/result_viewed, comparison.filtered, checkout.reviewed, purchase.committed, policy.issued, renewal.started, support.opened, referral.qualified/reversed and fulfillment.completed. A UI purchase click never counts as a verified commercial commitment.

Envelope contains event ID/name/version, occurredAt, receivedAt, opaque consent-aware actor/session reference, selected channel/context class, product family, campaign reference and source build. Exclude names, phone, national identifiers, claim diagnoses, document URLs, bank details, OTP and credentials. Permit bounded enums only; free text and raw form values are forbidden.

Optional analytics obeys recorded consent/purpose and does not prevent policy access when declined. Domain/audit events needed for obligations have separate policy review and are not sent to marketing destinations by default. Withdrawal stops future optional collection and follows approved deletion rules.

AN-EVENT-01 event schemas reject forbidden fields; AN-EVENT-02 duplicate IDs deduplicate; AN-EVENT-03 consent withdrawal stops optional emission; AN-EVENT-04 source context cannot include unrelated employer/personal data. Events are proposals with no live tracking configured. Metric definitions and freshness are separately versioned.
