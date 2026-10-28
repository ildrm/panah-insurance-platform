---
{
  "id": "DOC-10-BACKEND-STANDARDS",
  "title": "Backend engineering standards",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R08",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-09",
    "INT-10"
  ],
  "source_refs": [
    "S00",
    "S01",
    "S04"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Backend engineering standards

Each operation declares an owner, input/output schema, authorization action, resource/field policy, idempotency semantics, transaction boundary and durable side effects. Guards verify session and broad permissions; the use case authorizes the loaded resource and relevant fields. Do not trust tenant IDs, prices, approval status or carrier state supplied by the client.

Repositories expose operations matching required atomic invariants and use parameterized SQL. Lock ordering is deterministic; expected-version conflicts return a stable conflict response. Events and audit commit with state. External calls run after commit via durable work where obligations require it. Worker handlers use the same application policy, not ad hoc state updates.

Errors distinguish validation, forbidden, unavailable capability, business rejection, conflict, rate limit, transient dependency failure and unknown external outcome. Logs redact sensitive values and use bounded operation labels. Propagate deadlines/cancellation only where abort is safe; committed work remains durable despite browser disconnect.

BE-01 direct API calls cannot bypass hidden UI actions; BE-02 duplicates and races preserve ledger/approval constraints; BE-03 provider timeout after acceptance enters unknown; BE-04 failed audit/outbox insert rolls back the governed mutation. Dependency injection is deterministic and no runtime administrator code evaluation is permitted.
