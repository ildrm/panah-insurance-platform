---
{
  "id": "DOC-05-DATA-DICTIONARY",
  "title": "Core data dictionary",
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

# Core data dictionary

| Field or entity | Type and constraints | Meaning and sensitivity |
|---|---|---|
| id, tenantId, subjectId | UUID; server generated; foreign keys | opaque identifiers; internal, never authorization by possession |
| contextKind | personal/organization/seller/carrier/platform | selected authority context; required on protected commands |
| version | integer 0..2147483647; compare on mutation | optimistic concurrency token; stale request returns conflict |
| occurredAt | timestamp with UTC offset, normalized UTC | actual event instant; never local calendar string |
| effectiveDate | date plus calendar/timezone semantics | coverage contract date, distinct from timestamp |
| Money | amount decimal-digit string; currency/unit enum | precise command value; positive charges and signed postings have separate guards |
| applicationParty | role, personId or organizationId, evidenceRef | explicit capacity and consent; sensitive identity |
| commitment | orderId unique, kind, snapshotRefs, decisionVersion | proof of accepted sale; credit kind does not mean captured cash |
| paymentAttempt | provider, merchantRef unique, amount, verifiedAt | authoritative verification evidence, not browser-return status |
| submission | orderId, businessKey unique, mappingVersion, state | partner workflow; outcome unknown is not rejected |
| policy | carrierId, carrierPolicyRef, effectiveFrom/To, state | activated only on confirmed carrier terms |
| file | storageKey, ownerContext, hash, mediaType, scanState | storage locator never public; classification and access policy required |
| audit | actor, scope, action, before/after hashes, reason, eventRef | append-only privilege/financial evidence, redacted payload |

Default strings use NFC normalization; legal names retain original text and separate normalized search form. Identifier formats are provider/jurisdiction-contract dependent. Do not use guessed national-ID or plate checks as evidence of identity. All write schemas reject unknown fields; DTOs expose explicit projections rather than serializing database records.
