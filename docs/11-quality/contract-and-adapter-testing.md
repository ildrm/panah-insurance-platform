---
{
  "id": "DOC-11-QUALITY-CONTRACT-AND-ADAPTER-TESTING",
  "title": "Contract and adapter testing",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# Contract and adapter testing

Validate canonical request/response fixtures against versioned schemas before testing carrier mappings. Run all three [fictional simulator](../07-integrations/simulated-carriers/) contracts: synchronous REST, asynchronous SOAP/polling, signed custom callbacks. Disable XML external entities; reject unsigned/replayed callbacks before state mutation.

Scenarios include duplicate callback, malformed response, timeout-after-acceptance, missing idempotency/status, throttling, token expiry, partial outage and mapping-version change. Distinguish permanent business rejection from mapping error, transient transport failure and unknown external outcome. Assertions inspect durable state, stable business key, event order and recipient-only fields.

Real sandbox certification requires actual documentation, credentials and provider evidence; it is blocked in this task. Contract syntax validity alone does not prove actual provider compatibility. Keep local, sandbox and live-certification statuses separate.
