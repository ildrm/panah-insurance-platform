---
{
  "id": "DOC-11-QUALITY-E2E-DASHBOARD-AND-CHANNEL-MATRIX",
  "title": "E2e dashboard and channel matrix",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R13",
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

# E2e dashboard and channel matrix

Execute customer, corporate buyer, employee, seller, carrier, admin and staff workflows with B2C/B2B On/On, On/Off, Off/On and Off/Off. For B2B-on test each corporate/commercial/reseller/B2B2C subchannel individually and in mixed settings. Employee servicing remains independently available; insurer transport does not depend on the B2B buyer flag.

Exercise direct sale, negotiated group/credit approval, seller delegation, dependent enrollment, underwriting, asynchronous issuance, policy access, claims and finance exceptions. Assert disabled menu and direct API behavior; hidden navigation is not authorization. Every dashboard tests loading, empty, error, forbidden, read-only, disabled, partial, expired and success states.

Switch organization during a loaded table/detail/export, revoke role on another replica and return via browser back. No previous-context private response may remain visible after the transition. Bulk actions reauthorize each object and report per-row outcome without leaking inaccessible IDs.
