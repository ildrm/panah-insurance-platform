---
{
  "id": "DOC-07-AUTHENTICATION-AND-SECRETS",
  "title": "Partner authentication and secret handling",
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

# Partner authentication and secret handling

Connections reference secret identifiers, never credential values. Production secret material is obtained only through approved partner onboarding; none is present in these docs. Adapter authentication may use API key, OAuth/token, signed request, client certificate or mTLS only as the actual contract specifies. Synthetic simulators define their own test mechanisms without implying real insurer support.

A credential has environment, destination, operation scope, owner, version, activation/expiry and rotation evidence. Rotation supports overlap only if the partner supports it; test new credentials in sandbox, activate a version, observe failures and revoke old material. Expired tokens may refresh through a single coordinated refresh operation, but a submission with unknown acceptance cannot be repeated merely because a token was refreshed.

Request signing uses contract-defined canonical bytes, method/path, timestamp/nonce and key identifier. Verify callback signature over raw bytes before parsing; reject unsupported algorithms, replayed IDs and invalid timestamp windows. Certificate trust and hostname validation remain enabled. Logs contain key IDs and failure classes only.

SECRET-01 rotates without exposing values or losing in-flight operation correlation; SECRET-02 rejects wrong environment/audience; SECRET-03 duplicate callback cannot duplicate ledger or issuance changes; SECRET-04 expired-token quote safely refreshes once while an ambiguous submit remains reconciliation-only. Exact algorithms and windows for live partners are missing-contract blockers.
