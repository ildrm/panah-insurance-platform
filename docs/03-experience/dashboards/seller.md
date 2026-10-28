---
{
  "id": "DSH-SELLER",
  "title": "Reseller / agent dashboard",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R04",
  "reviewer_roles": [
    "R01",
    "R07",
    "R11",
    "R13",
    "R20",
    "R21"
  ],
  "scope_ids": [
    "DSH-04",
    "GRW-06",
    "GRW-04",
    "GRW-02",
    "INS-12",
    "COM-09",
    "SVC-02"
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

# Reseller / agent dashboard

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-04, GRW-06, GRW-04, GRW-02, INS-12, COM-09, SVC-02. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.seller.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.seller.export` and `dashboard.seller.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| seller | Active contract and assigned customer mandate | Manage own leads/quotes/assisted sales and permitted renewals | Customer medical details outside mandate, other sellers' customers |
| team manager | Delegated team/territory scope | Assign leads, view scoped pipeline and aggregate performance | Unassigned teams and protected claim/health data |
| seller finance | Own contract/commission scope | View statements, request allowed payout | Edit commission calculation, approve own payout |
| seller administrator | Own team membership/configuration | Invite/revoke scoped members, training management | Expand distributor contract authority or approve platform grants |

Contact details are masked until assigned purpose permits retrieval; access is audited. Customer documents/health details are excluded unless a narrow, explicit mandate and contract allow them. Commission statement can expose basis/adjustment needed for dispute without disclosing another seller's rate or payer bank details.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/seller` | Lead funnel, tasks, pending commissions, renewal actions | Team/product; due date ascending | CRM/Commission/Renewal projections | Navigate to assigned task |
| `/seller/onboarding` | Contract version, required documents, review stage, training | State; updatedAt descending | Partner Onboarding module | Submit evidence; contract approval by authorized platform staff |
| `/seller/leads` | Lead reference, consented contact masked, product, owner, stage | Owner/source/product/stage; updatedAt descending | CRM module | Create, assign, call-back task with consent; no unsolicited data enrichment |
| `/seller/customers` | Mandated customer label, allowed products, mandate expiry | Team/product; name ascending | Relationship module | Request/renew authority; open only permitted portfolio |
| `/seller/quotes` | Quote/proposal, customer, carrier, revision, validity, stage | Customer/state/product; updatedAt descending | Quote/Assisted Sales module | Draft/compare/revise; customer's acceptance recorded separately |
| `/seller/orders` | Order, distribution reference, amount, independent states | State/carrier/product; createdAt descending | Order projection with seller mask | Follow up evidence/status within mandate |
| `/seller/portfolio` | Policy reference masked, product, expiry, permitted insured label | Product/expiry; expiry ascending | Policy delegated projection | Download only authorized documents; no blanket claim access |
| `/seller/renewals` | Assigned policy, due date, consent state, renewal attribution | Due/product/owner; due ascending | Renewal/Attribution modules | Create renewal lead/quote after permission check |
| `/seller/team` | Member, role, assigned scope, invitation/training state | Role/state; label ascending | Organization/Authorization modules | Delegate within seller contract; revoke and audit |
| `/seller/commissions` | Transaction, basis, pending/confirmed/reversed, amount/unit | State/product/period; postedAt descending | Commission and Ledger modules | View calculation inputs permitted by contract; dispute statement |
| `/seller/wallet` | Distinct commission/cash/promo balances and holds | Balance type/date; postedAt descending | Ledger authoritative projection | Request verified eligible withdrawal; cannot approve own payout |
| `/seller/training` | Module, required version, completion, expiry | Required/completion; priority | Training/CMS module | Complete acknowledgment; no fabricated certification |
| `/seller/reports` | Sales/renewal/conversion/commission aggregates with as_of | Team/product/period; metric descending | Analytics scoped projection | Async export of authorized pipeline/financial statement |
| `/seller/settings` | Profile, attribution codes, notices, sessions, payout-recipient status | Section navigation | Identity/Referral/Finance modules | Update permitted preferences; bank changes require verification |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Lead form records source, consent/purpose, product, contact channel and assigned owner; duplicates merge only with authorized review and history. Assisted quote records customer mandate, proposal revision, insurer negotiation evidence and actual customer declaration acceptance. Seller cannot accept undisclosed terms for the customer. Payout request selects withdrawable confirmed commission, verified recipient and reason/reference; checker and payment execution are platform finance responsibilities.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Own/team-scoped CRM and statement exports up to 20,000 rows per job; consent/mandate evaluated both at job generation and download. No unrestricted customer phone list or medical data export. Formula-like spreadsheet cells are escaped for safe export.

## Availability and servicing behavior

Reseller new-sales control blocks new assisted purchases independently of direct B2C and corporate sales. Existing distributed policies, permitted renewals classified by channel, commission servicing, reversals and payout disputes remain available under their specific controls. Revoked seller contract removes actions even if flags remain on.

Dashboard/menu/widget/action/report configuration is versioned, audience-scoped and intersects permissions, entitlements, feature availability and domain state. Published menus reference registered routes/actions. Preview tests intended and denied roles across all four B2C/B2B combinations; rollback returns to an earlier configuration version without restoring revoked permissions. New-sales, servicing, partner delivery and security quarantine decisions are visible separately in operator diagnostics.

## Interaction state contract

| State | Required behavior |
|---|---|
| Loading | Skeleton preserves headings/labels; announce loading politely; do not show another context's cached rows. |
| Empty | Explain whether no records or no eligible results; offer only currently authorized next action. |
| Error | Stable safe error code and retry/correction; retain safe filters/drafts and correlation reference. |
| Forbidden | Generic access message; no hidden resource fields, count, title or existence hint. |
| Read-only | Show permitted history/documents; explain expired delegation, state or scope that prevents mutation. |
| Disabled | Explain unavailable capability and preserved servicing; no misleading empty table. |
| Partial | Show completed/pending/failed items and retry eligibility; totals label coverage and as_of. |
| Expired | Expired quote/link/session/approval blocks its action; offer reauthorization/requote as appropriate. |
| Success | State exactly what committed; distinguish request accepted, paid, issued, delivered and settled. |

RTL uses CSS logical properties and logical focus order; numbers, email, UUID and external references use explicit bidirectional isolation. Tables remain keyboard navigable without focus traps; actions have descriptive accessible names and confirmations identify amount/currency/resource. Dates show the chosen calendar and relevant timezone/effective-date meaning. Screen-reader announcements avoid repeatedly reading entire live tables. Mobile upload asks permissions when needed and supports retry without duplicate records; sensitive content is not cached offline.

## Performance, security and telemetry

Apply PERF-READ/PERF-WRITE to bounded API requests and PERF-WEB/PERF-JS to this dashboard in the [budget registry](../../_meta/performance-budgets.yaml). Query one bounded projection per visible panel; collapse/lazy-load secondary panels and avoid one API request per table cell. Export/report/bulk work never runs on the initial render path. Private pages and data use no shared public cache. Cache keys, if specifically permitted for nonsensitive projections, include complete subject/authorization context and are invalidated on role/organization/relationship change; a tenant key alone is insufficient.

Telemetry includes dashboard/route template, action class, outcome, latency and projection age with no raw identifiers or risk values in labels. Record authorization denials, context switches, export requests, privileged reasons and approval identities in the appropriate audit stream. Analytics measures task completion and recovery, not employee diagnoses or customer contact details. Test under multi-user/multi-tenant load, one stale replica, role revocation and provider outage. Measured evidence is pending implementation.

## Acceptance and operational readiness

| Acceptance ID | Scenario and expected outcome |
|---|---|
| AC-DSH-SELLER-MANDATE | A seller mandate expires after a quote was loaded; purchase/export fails on server recheck and cached customer details are cleared. |
| AC-DSH-SELLER-COMMISSION | A policy refund reverses qualifying commission; wallet cannot withdraw the reversed amount during a concurrent payout request. |
| AC-DSH-SELLER-ATTRIBUTION | Customer switches from referral link to assisted seller; attribution follows the recorded rule/version and cannot be overwritten by an untrusted query parameter. |
| AC-DSH-SELLER-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-SELLER-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-SELLER-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-SELLER-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
