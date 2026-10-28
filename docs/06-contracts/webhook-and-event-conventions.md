---
{
  "id": "DOC-06-CONTRACTS-WEBHOOK-AND-EVENT-CONVENTIONS",
  "title": "Webhook and event conventions",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R08",
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

# Webhook and event conventions

[AsyncAPI](asyncapi.yaml) pins syntax3.0.0 and logical channels. Publish durable outbox in the same transaction as business state. Receiver inbox key `(source,eventId)` deduplicates; aggregateVersion and per-order serialization handle duplicate/reordered observations. At-least-once external delivery is expected; no exactly-once guarantee is made.

Webhook verification consumes original bounded bytes, validates approved provider signature/mTLS mechanism, timestamp/nonce replay window and destination binding, then schema/mapping. Store a redacted evidence hash and inbox record before acknowledgment. Actual signature algorithm/canonicalization/time window is contract-specific and absent until provider onboarding. Do not substitute a guessed signature recipe for a real contract.

Polling and callback observations resolve the same aggregate through one transition service. A late pending update cannot regress issued status. Timeout-after-send becomes external_outcome_unknown unless authoritative evidence proves rejection. Leases/retries are internal transport states; a worker crash must not change insurance authority or replay a non-idempotent payout.
