---
{
  "id": "DOC-07-NOTIFICATION-HR-LOGISTICS-CONTRACTS",
  "title": "Notification, HR and logistics boundaries",
  "status": "proposed",
  "version": "1.0.0",
  "owner_role": "R09",
  "reviewer_roles": [
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INT-01",
    "INT-02",
    "INT-03",
    "INT-04",
    "INT-05",
    "INT-06",
    "INT-07",
    "INT-08",
    "INT-09",
    "INT-10"
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

# Notification, HR and logistics boundaries

Notification contract: template version, locale, recipient token, purpose/consent reference, dedupe key and minimal variables; response is provider message reference and accepted status, not delivered. Verified delivery events update status. OTP and transaction notices are separate from marketing preference, but actual legal basis requires review. Rate limits and quiet-hours policy cannot block security-critical recovery without an approved alternative.

HR contract: organization-scoped service identity, source employee key, change/version ID, effective date, validated allowed fields and deletion semantics. Never import diagnoses or claims into employer synchronization. Preview and maker-checker apply to coverage/billing changes. Conflicts preserve both source and reviewed values for resolution.

Logistics contract: shipment/item reference, minimal address/contact, dispatch/receipt evidence, carrier tracking status and return reason. A delivered parcel does not independently prove active coverage. Returns/refunds reconcile against item and payment allocations rather than altering policy status indiscriminately.

BOUNDARY-01 duplicate notifications do not double-send; BOUNDARY-02 HR replay does not duplicate dependents; BOUNDARY-03 changed membership revokes export/access; BOUNDARY-04 forged delivery webhook cannot complete shipment; BOUNDARY-05 provider outage queues owed notifications while UI shows pending. Each provider intake records approved endpoints, signing/auth, privacy purpose, retention, rate limits and support escalation before activation.
