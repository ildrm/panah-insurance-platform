---
{
  "id": "DOC-08-ABUSE-FRAUD-AND-RATE-LIMITS",
  "title": "Abuse, fraud and resource limits",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-02",
    "INT-05",
    "COM-02",
    "GRW-01"
  ],
  "source_refs": [
    "S00",
    "S07",
    "S08",
    "S11",
    "S12",
    "S13",
    "S14",
    "S15",
    "S16",
    "S17",
    "S18",
    "S19",
    "S20",
    "S21",
    "S22"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Abuse, fraud and resource limits

Protect OTP delivery, quote fan-out, official inquiries, promotion budgets, referral rewards, wallets, bulk exports and privileged mutations independently. Quotas apply by verified subject/context/provider and anonymous network/device risk where justified. A distributed limit must not be bypassed by adding API replicas. Denial returns a stable reason and retry metadata without exposing private account existence.

Promotion reservations decrement a transactional budget; reward confirmation follows an eligible commercial event and reversal follows refund/cancellation rules. Detect self-referral and related-account abuse using minimally necessary signals with review/appeal paths. Loyalty games, prize draws and financial referrals stay commercially disabled pending authority review. A fraud score alone cannot silently change insurer underwriting or confiscate funds.

Inquiry and quote requests require permitted purpose and suppress identical overlapping fan-out. Exports require separate permission and audit, with anomaly alerts for unusual volume. Staff payout/settlement changes require dual control and evidence independent of the submitting staff member. Configured thresholds are versioned and reviewed rather than hidden constants.

SEC-ABUSE-01 concurrently redeems the final coupon/reward allocation; SEC-ABUSE-02 repeats quotes across replicas; SEC-ABUSE-03 simulates OTP bombing without permanent victim lockout; SEC-ABUSE-04 replays a reward event after refund. Investigations retain minimal evidence and disclose safe status; no automated punitive financial action is assumed authorized.
