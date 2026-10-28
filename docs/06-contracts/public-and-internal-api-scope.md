---
{
  "id": "DOC-06-CONTRACTS-PUBLIC-AND-INTERNAL-API-SCOPE",
  "title": "Public and internal api scope",
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

# Public and internal api scope

Public scope includes authorized customer, corporate, employee, seller and carrier views/actions. Administration includes approved configuration, partner connections, finance decisions, audit and operator tasks. Internal scope includes authoritative payment verification, immutable purchase projections and durable worker operations. Carrier callbacks require contract-specific verification; carrier portal identities cannot invoke another carrier's callbacks.

Property projection examples: payer receives payment amount/reference, not insured diagnosis; employer sees enrolled status and approved billing allocation, not private claim evidence; seller sees delegated quote/policy fields, not unrelated account data; carrier receives only its own risk/consent/evidence projection. Platform administrators require explicit purpose/role grants for sensitive content rather than universal payload access.

All public and private shapes are versioned contracts. Persistence IDs, secret references, internal negotiation notes and risk-review flags are omitted unless explicitly permitted. Export, search, notification and background-job APIs obey the same field policy. API-only carrier mode preserves the same operation grants and audit as portal access.
