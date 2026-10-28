---
{
  "id": "DOC-06-CONTRACTS-API-CONVENTIONS",
  "title": "Api conventions",
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

# Api conventions

The proposed API uses OpenAPI 3.1.0 with JSON Schema 2020-12. `/v1` denotes public version, `/admin/v1` privileged administration and `/internal/v1` service-only operations; a path prefix never replaces authentication. Method/path, operationId, permission metadata, input/output schema, status/error and idempotency are defined in [OpenAPI](openapi.yaml). APIs run in Nest; Next consumes typed clients and never reads domain tables directly.

JSON is UTF-8. Reject unknown command fields and unsupported versions. Bound request/response size by central budgets; uploads use scoped object-storage grants. Mutation responses acknowledge persisted commands or committed resources, never unpersisted intention. Durable commands return commandId/status URL, and unknown outcome remains explicit. Resource reads reauthorize relationship and property projection; private responses use no-store. Public editorial/catalog responses have separately declared cache headers.

Input DTO, domain aggregate and persistence row are separate contracts. Internal schemas must not be serialized as public DTOs. Examples are synthetic and `.invalid` servers are intentionally unreachable. Contract validation and source generation must run before implementation client generation.
