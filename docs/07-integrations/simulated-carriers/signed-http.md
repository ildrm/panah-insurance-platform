---
{
  "id": "DOC-07-SIGNED-HTTP",
  "title": "Fictional signed HTTP callback carrier",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-02",
    "INT-07",
    "INT-09"
  ],
  "source_refs": [
    "S00",
    "S26"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Fictional signed HTTP callback carrier

Loopback endpoint `/sim/signed`; test HMAC-SHA256 signature covers method, path, timestamp, nonce and raw body hash with a synthetic key ID. JSON fields use `premium_toman` integer text and an explicit `effective_jalali` date string plus calendar discriminator. The mapping fixture declares its corresponding Gregorian date; conversion requires a tested calendar implementation and cannot rely on display formatting.

Submit returns a receipt; issuance arrives as a signed callback with event ID, sequence and provider reference. This fixture supports neither idempotency nor authoritative lookup, deliberately forcing manual reconciliation after timeout-after-acceptance. Operators cannot replay without verified fixture evidence. Duplicate/out-of-order callbacks are expected and must not regress issuance.

## Required scenario matrix

1. Normal response: validates canonical mapping and separate acknowledgment/issuance.
2. Duplicate callback/observation: one logical transition and no duplicate posting.
3. Malformed response: schema error, quarantined payload, no successful issuance.
4. Timeout after acceptance: unknown outcome; provider guarantees determine safe resolution.
5. Idempotency not supported: no automatic unsafe repeat.
6. Throttle: bounded admission/backoff for safe operations; preserve durable work.
7. Expired token/key: fail authentication, rotate test reference, never log key.
8. Partial outage: quote may fail while status remains available, or inverse.
9. Mapping version change: old attempts replay with original mapping; new work uses approved version.

These are designed local simulators, not executable services or evidence of real connectivity. The fixture JSON beside this document is synthetic. Implementing/running the simulator is a later application task. Pass evidence must include input/output hashes, observed states and duplicate-effect assertions; no pass is claimed here.

## Concrete wire contract

### Operations and bounded wire types

POST `/sim/signed/v1/quotes` uses [quote request](wire/signed-quote-request.json) and returns200 [quote](wire/signed-quote-response.json). POST `/sim/signed/v1/submissions` uses [submit](wire/signed-submit-request.json) and returns202 [receipt](wire/signed-ack.json). There is no issue command: at virtual tick2 the provider sends [issued callback](wire/signed-callback-issued.json) to POST `/callbacks/sim-signed`; receiver returns202 [callback acknowledgment](wire/signed-callback-ack.json) after durable inbox write. Tick1 pending is [this observation](wire/signed-callback-pending.json). GET `/sim/signed/v1/policies/SIM-SIGNED-P-1/document` returns200 [document](wire/signed-document-response.json) after issued. [Signed schema](wire/signed-wire.schema.json) defines each type.

The baseline manifest supports neither status nor idempotency. GET status returns405 [capability_unsupported](wire/signed-no-status.json), which is not evidence that a submission was absent. Timeout-after-acceptance persists one receipt then loses the response; callbacks are deliberately suppressed in that scenario so the application must hold external_outcome_unknown and require verified manual reconciliation. Repeated submit creates another receipt and is a test failure. Definitive business rejection returns422 [accepted=false](wire/signed-rejected.json) before any write.

### Exact signature algorithm and synthetic vector

Headers are `X-Sim-Key-Id`, `X-Sim-Timestamp`, `X-Sim-Nonce`, `X-Sim-Signature`. Key ID must be `sim-key-v1`; timestamp uses UTC RFC3339 second precision; nonce is1–64 ASCII alphanumeric/hyphen. Compare timestamp to injected clock with maximum absolute skew300 seconds and accept a nonce once per key within the600-second replay store. Real contracts may differ; these are only fictional protocol constants.

Sign UTF-8 bytes of uppercase method, exact path without query, timestamp, nonce, and lowercase hex SHA256 of **raw request body bytes**, joined by LF, with no trailing LF. No JSON reserialization, whitespace trimming, percent-decoding or Unicode normalization occurs before verification. HMAC-SHA256 output is lowercase hex, compared in constant time. GET uses the hash of empty body. Reject unsupported paths/query/algorithms before domain processing. Both submit and callback vectors are in [signed vectors](wire/signed-vectors.json); callback uses its own nonce. The key text is intentionally synthetic.

```text
POST
/sim/signed/v1/submissions
2026-10-28T08:00:00Z
nonce-0001
280553c4e31dbbbd047e1841fb1135e0b6e81fd6ac8b648c1a510a2c4844ca2a
```

Synthetic key: `synthetic-only-key-v1-not-for-live-use`.
Expected signature: `8dc7ec3dac714719c3253f791d4a83f091c79f235e21bd09ac57cdd05524b934`.
Exact body bytes are `bodyUtf8` in the vector; pretty-printed request fixture is semantically equivalent but requires a different signature.

### Currency/calendar conversion and scenarios

[Mapping pair](wire/calendar-money-pair.json) binds canonical120000 rial to provider12000 labeled toman, Gregorian2026-11-01 to Persian1405-08-10, and exclusive end2026-11-02 to1405-08-11. Integer conversion rejects indivisible values; never round a premium silently. The date pair was executed with Node v26.12.0/ICU78.3 `Intl.DateTimeFormat` at UTC noon; validation repeats both dates. [ECMA402](https://tc39.es/ecma402/#sec-intl.datetimeformat) defines the calendar-capable API, while the recorded runtime observation supports this pair. This is date-only mapping, not a timezone/effective-date legal rule.

Duplicate callback scenario sends the same event ID/sequence/body twice with **fresh valid nonces**, so inbox dedupe returns duplicate=true once. An exact nonce replay is rejected401 `nonce_replayed` before applying a second effect. Out-of-order scenario delivers sequence2 issued before sequence1 pending; policy remains issued. Malformed response omits receipt_ref from202 ack and leaves possible acceptance unknown. Throttle returns429 before acceptance, then safe quote/document read succeeds after virtual tick1. Expired-key scenario returns401 expired_signature/accepted=false before mutation. Partial outage disables quotes only; callback ingestion/document remains available. Mapping-v2 changes premium_toman to premium_rial and calendar to gregory; v1 schema rejects it and existing v1 transactions retain v1 mapping. Signature body mutation, altered path and stale timestamp are mandatory negative cases.

The reset fixture clock is `2026-10-28T08:00:00Z`; each named scenario resets isolated state and counters. Scenario selection is test-harness input, never a live carrier header. Prices/dates and one-day coverage windows are synthetic tests with no commercial meaning. Bodies are UTF-8 and capped at 32768 bytes except document responses, whose decoded PDF cap is 32768 bytes. IDs are 1–64 ASCII letters/digits/underscore/hyphen; amount strings are nonnegative base10 with at most24 digits. Unknown properties fail schema validation.

The [fixture manifest](wire/fixture-manifest.json) identifies each request/response schema and expected validity. `transport-unknown.json` describes a local transport observation: it is **not** a fabricated provider response. No received response after possible acceptance yields canonical `external_outcome_unknown`. A received definitive rejection explicitly states `accepted=false`; it permits remediation only according to its code.

Run `rtk proxy python3 docs/_meta/validation/validate_simulator_contracts.py` to validate synthetic wire artifacts, signatures and calendar pair. This does not start an insurer simulator or certify connectivity.
