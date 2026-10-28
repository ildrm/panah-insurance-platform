---
{
  "id": "DOC-07-PAYMENT-PROVIDER-CONTRACT-TEMPLATE",
  "title": "Payment provider boundary contract",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-02",
    "INT-03",
    "INT-04",
    "INT-05",
    "INT-06",
    "INT-07",
    "INT-08",
    "INT-09",
    "INT-10"
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

# Payment provider boundary contract

The payment port supports createIntent, verify, status, refund and reconcile only where contracted. Intent input includes merchant reference, Money, order reference and approved return URL; response supplies provider reference and permitted redirect. A return URL result is informational. Verification must establish merchant/provider identity, original reference, amount/currency, final capture status and verification evidence before any receipt/commitment.

Callbacks require contract-defined authentication, replay protection and durable inbox. Duplicate callbacks or concurrent status polls converge through unique provider transaction reference and locked payment version. A conflicting amount/currency enters exception with no automatic order fulfillment. Refunds have stable original-payment-scoped business keys, independently approved amount, remaining refundable constraint and verified settlement status. Timeout after refund acceptance remains unknown.

Provider intake must supply official endpoints, authentication/rotation, capture semantics, partial payment/refund rules, fees, settlement timing, authoritative status window, idempotency guarantee, reconciliation file format and dispute process. No live charge, payout or provider credential is authorized here.

PAY-CONTRACT-01 spoofed callback cannot verify; PAY-CONTRACT-02 same reference for two orders is rejected; PAY-CONTRACT-03 120000-rial fixture verified as 12000-toman only when the contract explicitly transforms units; PAY-CONTRACT-04 duplicate refund request never doubles payout; PAY-CONTRACT-05 captured-but-uncommitted funds remain visible for review.
