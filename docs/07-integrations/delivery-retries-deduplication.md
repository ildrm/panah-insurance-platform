---
{
  "id": "DOC-07-DELIVERY-RETRIES-DEDUPLICATION",
  "title": "Delivery, retry and deduplication policy",
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

# Delivery, retry and deduplication policy

Local delivery is at least once. Outbox rows retain event ID, aggregate/version, available time, attempt count and lease owner/expiry. Claim work with transactional row locking; lease expiry permits recovery after process loss. The published/processed marker is recorded only after the required durable acknowledgment. Retention of deduplication keys must exceed the maximum replay window established by the partner contract.

Classify failures before scheduling: mapping error -> correction queue; permanent business rejection -> domain remediation; proven pre-acceptance transient failure -> bounded jittered retry; possible acceptance -> external_outcome_unknown and reconciliation. Retry ceilings/deadlines are configuration versions recorded with attempts, not unbounded loops. Exhausted eligible work enters dead-letter review with original business key and payload hash.

Operator replay is a new audited instruction referencing original event/attempt and evidence. Reuse the stable business key and reject altered payload under the same key. Two-person approval is required for replay that can affect issuance or payout when reconciliation changed the plan. Never clear an unknown state solely to make the retry button available.

DELIVERY-01 crashes between external acknowledgment and local update; DELIVERY-02 expires a lease while a slow worker returns; DELIVERY-03 retries a malformed payload and confirms no network resend until mapping correction; DELIVERY-04 reprocesses a dead letter without duplicate postings. Queue health alone is insufficient evidence of insurer delivery.
