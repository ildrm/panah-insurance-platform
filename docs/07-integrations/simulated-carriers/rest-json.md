---
{
  "id": "DOC-07-REST-JSON",
  "title": "Fictional REST/JSON carrier",
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

# Fictional REST/JSON carrier

Loopback base `/sim/rest/v1`; synthetic API key header `X-Sim-Key`. `POST /quotes` accepts canonical Money in rial and ISO date-only fields, returning a synthetic quote with contract-controlled validity. `POST /submissions` accepts `Idempotency-Key` and immediately returns an acknowledgment/reference; this is not issued coverage. `GET /submissions/:ref` returns authoritative submission/issuance observations. `GET /policies/:ref/document` returns a synthetic PDF fixture only after issued.

The simulator stores business-key plus payload hash: identical retry returns original reference; changed payload returns 409. A scenario switch can persist acceptance then terminate the socket. Subsequent status lookup resolves the unknown outcome without resubmission. No real insurer name, endpoint, rate or policy format is used.

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

### Endpoints and shapes

Use API key `X-Sim-Key: synthetic-rest-key-v1`; this documented value is deliberately fake. Submit requires `Idempotency-Key: synthetic-order-001-submit-v1`. No trailing slash/query is permitted in these local routes.

| Method/path | Request fixture | Response/status |
|---|---|---|
| POST `/sim/rest/v1/quotes` | [quote request](wire/rest-quote-request.json), QuoteRequest | 200 [quote](wire/rest-quote-response.json); synthetic validity fixed at08:10UTC |
| POST `/sim/rest/v1/submissions` | [submit request](wire/rest-submit-request.json), SubmitRequest | 202 [ack](wire/rest-ack.json); issuance remains pending |
| GET `/sim/rest/v1/submissions/by-client/synthetic-order-001` | client reference in path; no body | first call200 [pending](wire/rest-status-pending.json), second call200 [issued](wire/rest-status-issued.json) |
| GET `/sim/rest/v1/policies/SIM-REST-P-1/document` | path policy reference; no body | after issued200 [document](wire/rest-document-response.json); before issued409 rejection |

[REST schema](wire/rest-wire.schema.json) defines each named type. Issued status requires policy reference, effective interval and document reference; a pending observation cannot contain them. Document body is base64 PDF with size/hash validated against [the synthetic PDF](wire/synthetic-policy.pdf). Same idempotency key/body hash returns original acknowledgment/reference; same key with changed body returns409 `idempotency_conflict` and no new acceptance.

### Deterministic failure scenarios

`timeout_after_acceptance`: store the first submission then reset connection before response; first status returns pending and second issued; application must query before retry. `duplicate_callback`: REST has no callbacks, so repeat the second status response and verify one effect. `malformed_response`: return200 with `premium.amount="NaN"`, invalid under schema; do not offer purchase. `idempotency_not_supported`: alternate manifest disables idempotency, repeated submit creates a distinct provider reference; application must avoid it using status. `throttled`: first safe quote/status call429 with Retry-After1 and rejection accepted=false, second succeeds; mutation throttle occurs before acceptance. `expired_token`: first call401 accepted=false until test credential reference rotates. `partial_outage`: quote calls503 while status/document remain available. `mapping_version_change`: newly reset map-v2 fixture renames premium field; map-v1 parser rejects it and pauses new work; in-flight map-v1 attempts retain map-v1 responses. `definitive_reject`: submit422 [rejection](wire/rest-rejected.json), no provider record. No retry rule converts invalid/malformed or unknown results to a successful quote.

The reset fixture clock is `2026-10-28T08:00:00Z`; each named scenario resets isolated state and counters. Scenario selection is test-harness input, never a live carrier header. Prices/dates and one-day coverage windows are synthetic tests with no commercial meaning. Bodies are UTF-8 and capped at 32768 bytes except document responses, whose decoded PDF cap is 32768 bytes. IDs are 1–64 ASCII letters/digits/underscore/hyphen; amount strings are nonnegative base10 with at most24 digits. Unknown properties fail schema validation.

The [fixture manifest](wire/fixture-manifest.json) identifies each request/response schema and expected validity. `transport-unknown.json` describes a local transport observation: it is **not** a fabricated provider response. No received response after possible acceptance yields canonical `external_outcome_unknown`. A received definitive rejection explicitly states `accepted=false`; it permits remediation only according to its code.

Run `rtk proxy python3 docs/_meta/validation/validate_simulator_contracts.py` to validate synthetic wire artifacts, signatures and calendar pair. This does not start an insurer simulator or certify connectivity.
