---
{
  "id": "DOC-05-RETENTION-PRIVACY-AND-RECORD-LIFECYCLE",
  "title": "Retention and record lifecycle",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R10",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "COM-09",
    "ORG-04",
    "SVC-06"
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

# Retention and record lifecycle

Classify each entity as public, internal, identity, financial, health or security evidence. Record purpose, recipient, consent/legal-basis evidence, retention trigger, proposed period, deletion method, legal-hold authority and backup treatment. Exact statutory/contract retention periods remain unapproved; R19/R12/R02 must supply authoritative evidence before production. Do not set an invented legal period from an assumed country.

Pending approval, production collection is disabled; local synthetic records may be reset. In production design, deletion requests first authenticate the requester and resolve affected relationships. Erasure is scoped: redact unnecessary contact/profile data where permitted, retain required transaction evidence under a documented reason, and record the decision. An employer cannot request deletion of an employee's personal-policy history.

Object lifecycle mirrors metadata and retention holds. Search indexes, caches, exports and analytical copies receive deletion/redaction events with completion evidence. Encrypted backups follow an approved expiry schedule and restoration replays outstanding deletions before reopening access. Audit logs avoid raw sensitive payloads to reduce retention conflicts.

RET-01 verifies a synthetic subject removal across active stores, exports and caches; RET-02 legal hold prevents deletion only for the authorized scope; RET-03 restored backup cannot resurrect erased data into user access. Open inputs are a launch blocker, not a reason to retain all personal data indefinitely without policy.
