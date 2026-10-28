---
{
  "id": "DOC-08-SECURE-DEVELOPMENT-AND-API-CONTROLS",
  "title": "Secure development and API controls",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-02",
    "INT-05",
    "COM-02",
    "GRW-01"
  ],
  "source_refs": [
    "S00",
    "S07",
    "S08",
    "S11",
    "S12",
    "S13",
    "S14",
    "S15",
    "S16",
    "S17",
    "S18",
    "S19",
    "S20",
    "S21",
    "S22"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Secure development and API controls

Validate every trust boundary using versioned schemas: browser input, uploaded/imported data, provider responses, callbacks, events and operator configuration. Reject unknown write properties, cap collection/string/body sizes and separate human error messages from diagnostic context. Parameterized SQL is mandatory; domain invariants cannot be bypassed through batch APIs or alternate transports.

Cookie-authenticated state changes enforce CSRF tokens/origin policy; CORS uses explicit origins, not wildcard credentials. Encode content by output context; sanitize original CMS rich text with an allowlist and test stored script injection. Document rendering runs in an isolated process with no unrestricted network access. Server errors expose stable codes/correlation IDs without stack traces or secrets.

Use approved outbound clients with TLS verification and destination policy. Disable XML external entity processing. Verify callbacks over raw bytes before parsing and enforce deduplication. File scanners fail closed for publication. Dependencies and build artifacts require vulnerability/license/secret checks and signed provenance as described in engineering standards.

SEC-API-01 submits unknown finance/admin fields; SEC-API-02 exercises SQL/XSS/CSRF payloads with no execution; SEC-API-03 poisons provider responses; SEC-API-04 checks content-type confusion and cache deception on protected routes. Security review must test full workflows and manual exceptions; a lint rule alone cannot establish these controls.
