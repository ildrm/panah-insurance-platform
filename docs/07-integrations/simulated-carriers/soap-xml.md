---
{
  "id": "DOC-07-SOAP-XML",
  "title": "Fictional SOAP/XML carrier",
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

# Fictional SOAP/XML carrier

Loopback endpoint `/sim/soap/v1`; SOAP action is allowlisted and XML external entities/DTD/network access are forbidden. `RequestQuote`, `SubmitApplication`, `GetSubmissionStatus` and `GetPolicyDocument` are distinct operations. A synthetic certificate reference is resolved from the local test secret store. XML uses `PremiumRial` integer text and `EffectiveGregorianDate` date-only; decimal commas and ambiguous dates are rejected.

`SubmitApplication` returns an acceptance ticket, then issuance becomes available through polling. This fictional provider does not support idempotency, but authoritative lookup by unique client application reference exists after a documented simulator visibility boundary. A timeout immediately after acceptance becomes unknown; polling precedes any retry. Repeated submit calls create duplicates by design so the application test can prove it prevents them.

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

### XML operations and transport

SOAP1.1 HTTP POST `/sim/soap/v1`, Content-Type `text/xml; charset=utf-8`, SOAPAction exactly `urn:fictional:carrier:soap:v1:<operation>`. Synthetic client certificate ID `sim-soap-cert-v1` is a harness identity, not real certificate material. Only one Envelope/Body/payload is accepted; DTD/entity declarations, external schema imports, unknown elements and extra bodies are rejected. [Payload XSD](wire/soap-payloads.xsd) bounds identifiers, decimal text and document size; fixtures include complete SOAP envelopes. The validator extracts exactly one payload and validates against XSD with network access disabled.

| Operation | Request | Response |
|---|---|---|
| RequestQuote | [request](wire/soap-quote-request.xml) | HTTP200 [quote](wire/soap-quote-response.xml) |
| SubmitApplication | [request](wire/soap-submit-request.xml) | HTTP200 [acknowledgment](wire/soap-ack.xml); not issuance |
| GetSubmissionStatus | [request](wire/soap-status-request.xml) | HTTP200 first [not-found](wire/soap-status-poll-1.xml), second [pending](wire/soap-status-poll-2.xml), third [issued](wire/soap-status-poll-3.xml) |
| GetPolicyDocument | [request](wire/soap-document-request.xml) | HTTP200 [document](wire/soap-document-response.xml) only after issued |
| Definitive business rejection | same submit request in reject scenario | HTTP200 [Reject](wire/soap-rejected.xml), Accepted=false; never infer success from HTTP200 |

### Exact visibility boundary and duplicate risk

Successful submit is persisted immediately, but first status poll deliberately returns `not_found, Authoritative=false`. **The second status poll is the simulator's visibility boundary** and returns pending with the same ticket; third returns issued. Poll ordinals are per client reference after reset, including lookup after a lost submit response. Each poll advances virtual time one second; no wall-clock sleeps are required. An actually absent reference returns not_found with Authoritative=true only from poll2 onward. Application never resubmits after poll1. For the timeout-after-acceptance scenario, original submit occurs exactly once and polls2/3 resolve it.

No idempotency is supported. A repeated SubmitApplication creates another ticket, and lookup then returns Reject `duplicate_reference` for manual reconciliation; the test fails if the application sends this duplicate. XSD1.0 cannot encode all cross-field implications: runtime semantic validation requires ticket for pending, full policy interval/document for issued, and no policy fields for not_found.

### Other deterministic scenarios

Malformed response replaces PremiumRial with `NaN` and must fail XSD. Throttle returns HTTP429 with Retry-After1 and Reject throttled/Accepted=false before any write; second safe attempt succeeds. Expired certificate returns HTTP401 without acceptance until synthetic identity rotates. Partial outage returns HTTP503 only for RequestQuote; status/document remain healthy. Mapping change replaces the namespace with `urn:fictional:carrier:soap:v2`, which v1 must reject; in-flight v1 remains available. Duplicate observation repeats issued poll3 unchanged. Transport timeout after persistence sends no XML response and is classified using [transport unknown](wire/transport-unknown.json), never a synthetic rejection.

The reset fixture clock is `2026-10-28T08:00:00Z`; each named scenario resets isolated state and counters. Scenario selection is test-harness input, never a live carrier header. Prices/dates and one-day coverage windows are synthetic tests with no commercial meaning. Bodies are UTF-8 and capped at 32768 bytes except document responses, whose decoded PDF cap is 32768 bytes. IDs are 1–64 ASCII letters/digits/underscore/hyphen; amount strings are nonnegative base10 with at most24 digits. Unknown properties fail schema validation.

The [fixture manifest](wire/fixture-manifest.json) identifies each request/response schema and expected validity. `transport-unknown.json` describes a local transport observation: it is **not** a fabricated provider response. No received response after possible acceptance yields canonical `external_outcome_unknown`. A received definitive rejection explicitly states `accepted=false`; it permits remediation only according to its code.

Run `rtk proxy python3 docs/_meta/validation/validate_simulator_contracts.py` to validate synthetic wire artifacts, signatures and calendar pair. This does not start an insurer simulator or certify connectivity.
