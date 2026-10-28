---
{
  "id": "DOC-08-SECRETS-ENCRYPTION-AND-AUDIT",
  "title": "Secrets, encryption and audit",
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

# Secrets, encryption and audit

Use environment-scoped service identities and secret references. Never put real keys in source, fixtures, URLs, user-visible errors or ordinary logs. Encrypt database/object storage/backups with separately managed keys and audit privileged decrypt/access paths. Exact cryptographic services and rotation periods depend on approved infrastructure and partner contracts; weak defaults are not filled in to unblock live use.

Audit events capture actor and effective identity, selected context, action/resource, reason, authority/configuration versions, before/after state hashes, evidence references, timestamp and correlation ID. Redact payloads while preserving enough evidence to explain decisions. Financial/privileged audit is append-only, unsampled and access-separated; corrections append a new record. Operators cannot erase their own actions through business UI.

Audit write failure blocks new privileged/financial mutations requiring that evidence; it must not silently discard committed work. Durable audit/outbox recording belongs to the same transaction where applicable. Export/read of highly sensitive evidence is itself audited. Periodic integrity checks reconcile event sequences and storage permissions.

SEC-AUDIT-01 tries unauthorized audit mutation; SEC-AUDIT-02 tests key rotation/restore without leaking values; SEC-AUDIT-03 scans log/error/export fixtures for credentials and medical payloads; SEC-AUDIT-04 crashes after financial commit and verifies durable audit. Production secret stores, backup keys and access reviewers remain unconfigured external dependencies.
