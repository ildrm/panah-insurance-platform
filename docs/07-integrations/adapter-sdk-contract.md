---
{
  "id": "DOC-07-ADAPTER-SDK-CONTRACT",
  "title": "Carrier adapter contract",
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

# Carrier adapter contract

An adapter implements a versioned `CarrierAdapter` port, not a domain service. Input is a recipient-projected canonical request with `requestId`, stable `businessKey`, `operation`, `schemaVersion`, `mappingVersion`, immutable snapshot references and deadline. Context supplies an allowlisted HTTP client, secret resolver, clock, logger with redaction and cancellation signal. No adapter receives database administrator access.

Operations: `capabilities`, `quote`, `reserve`, `submit`, `status`, `issue`, `retrieveDocument`, `endorse`, `cancel`, `claim`. Each returns a discriminated outcome: success with typed response/reference; permanent business rejection with safe code; mapping/schema failure; retryable transport failure known to precede acceptance; or ambiguous outcome. The last must record whether bytes may have been accepted and what reconciliation methods exist. Never map every non-2xx response to retryable.

Capabilities declare per-operation product/channel support, synchronous/asynchronous acknowledgment, provider idempotency semantics/key lifetime, authoritative status scope, callback verification, request/response limits and supported schema versions. Unsupported returns `capability_unsupported` before sending any data; the application offers an approved assisted path or denies it.

Adapter contract tests inject deterministic clocks and synthetic credentials, compare golden transformed payloads, reject unknown enum/currency/calendar values, verify bounded serialization and ensure secrets never reach logs. SDK-01 repeats the same business key and payload; SDK-02 changes payload under the same key and expects conflict; SDK-03 timeout-after-acceptance enters unknown without blind retry.
