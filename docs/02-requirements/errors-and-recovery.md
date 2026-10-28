---
{
  "id": "DOC-02-REQUIREMENTS-ERRORS-AND-RECOVERY",
  "title": "Errors and recovery",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R03",
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

# Errors and recovery

| Code | HTTP | Client recovery | Operator action |
|---|---|---|---|
| validation_failed | 422 | Correct named fields; keep safe draft | Review schema/rule version if repeated |
| unauthenticated | 401 | Reauthenticate; re-fetch private context | Investigate session failure without exposing OTP |
| resource_not_found | 404 | Return to permitted list | Never confirm inaccessible object's existence |
| forbidden_action | 403 | Explain role-limited action | Reasoned access review, no silent elevation |
| mode_disabled | 409 | Preserve draft/read-only; show servicing link | Inspect authoritative flag revision |
| quote_expired | 409 | Obtain fresh offers and reconfirm total | Cannot override price without carrier authority |
| version_conflict | 409 | Re-fetch permitted version and compare changes | Inspect concurrent actor history |
| idempotency_conflict | 409 | Stop retrying changed body under same key | Compare request digests, no raw PII logs |
| provider_rejected | 422 | Explain safe business reason; alternative offer | R02/R20 inspect documented rejection |
| provider_unavailable | 503 | Show partial state or queued request | R09 check circuit/provider health |
| external_outcome_unknown | 202 | Show pending verification, prohibit duplicate purchase/payout | Reconcile authoritative outcome before replay/refund |
| rate_limited | 429 | Respect Retry-After with jitter | Investigate tenant fairness or abuse |

Use a correlation ID and localized message key; never send stack traces, SQL, credential fragments or raw carrier payloads. Error retries require operation-specific idempotency, deadline and state guard. Recovery paths reauthorize current access, but committed servicing retains historical commercial eligibility unless security quarantine intervenes.
