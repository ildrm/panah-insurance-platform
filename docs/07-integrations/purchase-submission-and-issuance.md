---
{
  "id": "DOC-07-PURCHASE-SUBMISSION-AND-ISSUANCE",
  "title": "Purchase submission and issuance",
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
    "A01",
    "A05"
  ],
  "updated": "2026-10-28"
}
---

# Purchase submission and issuance

`purchase.committed.v1` is created only in the authoritative transaction. For direct purchases the verifier checks provider, merchant reference, captured amount/currency and acceptance eligibility. For approved credit the credit reservation, requester/checker separation, terms version and receivable are durable. The payload distinguishes these paths; neither browser redirect nor invoice creation by itself commits a purchase.

The policy module consumes the event idempotently, validates the stored recipient projection and capability versions, creates a pending submission and durable `carrier.submission.requested.v1`. The worker persists an attempt with stable business key before network I/O. Acknowledgment moves submission to acknowledged; asynchronous issuance remains pending. Only confirmed policy reference, effective dates and permitted documentation produce `policy.issued.v1` and the policy's future/active projection.

A carrier business rejection records rejected submission and reason, leaves verified money visible and opens remediation. Unknown acceptance records external_outcome_unknown with no blind replay. Turning off new sales does not discard committed events; an explicit quarantine may pause sending while preserving obligation and reconciliation.

ISSUE-01 commits then crashes before dispatch and eventually sends; ISSUE-02 duplicate event creates one submission; ISSUE-03 callback arrives before request returns and converges; ISSUE-04 B2B credit submission does not display paid cash; ISSUE-05 payment verified after quote/control invalidation without a qualifying A05 reservation creates a payment exception and refund review, not false coverage.
