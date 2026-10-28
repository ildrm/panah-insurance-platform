---
{
  "id": "DOC-08-PRIVACY-DATA-CLASSIFICATION-AND-CONSENT",
  "title": "Privacy classification and consent",
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

# Privacy classification and consent

Public content may reach CDN/search indexing after editorial approval. Internal operational metadata stays in authenticated systems. Identity/financial data needs recipient-scoped access and encrypted storage/transport. Health evidence has the narrowest projection: claimant, explicitly authorized insurer/assessor and justified staff; employer membership is insufficient. Credentials/OTP material never enters ordinary logs, analytics or exports.

Each collection field declares purpose, required/optional status, recipient categories, retention reference and source. Consent records contain subject/capacity, notice version, purpose, choice, timestamp and channel; terms acceptance is separate from optional marketing. Refusing optional tracking cannot prevent contracted policy access. A dependent's record requires relationship/capacity evidence, not simply a shared surname.

Recipient minimization occurs before provider mapping. Employer reports use the centrally proposed minimum-cohort policy plus complementary suppression and filter restrictions; approve privacy risk before release. Pseudonymized events remain controlled data, not automatically anonymous.

SEC-PRIV-01 inventories fields through forms/API/events/files/logs; SEC-PRIV-02 rejects medical data in employer exports; SEC-PRIV-03 withdrawal changes future optional processing while preserving documented transaction obligations; SEC-PRIV-04 purpose mismatch denies reuse of saved documents. Actual jurisdiction, legal basis and retention periods require qualified review; no compliance claim is made. [Lifecycle rules](../05-data/retention-privacy-and-record-lifecycle.md) define deletion/hold behavior.
