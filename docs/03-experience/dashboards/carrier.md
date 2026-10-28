---
{
  "id": "DSH-CARRIER",
  "title": "Carrier / supplier dashboard",
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
    "DSH-05",
    "INT-02",
    "INT-06",
    "INT-07",
    "INT-08",
    "COM-06",
    "COM-09",
    "SVC-07",
    "SVC-08"
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

# Carrier / supplier dashboard

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-05, INT-02, INT-06, INT-07, INT-08, COM-06, COM-09, SVC-07, SVC-08. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.carrier.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.carrier.export` and `dashboard.carrier.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| carrier operations | Own carrier and assigned product/channel scope | Read submissions, request evidence, issue only with authority | Other carriers, unrelated platform transactions, employer private data |
| carrier underwriter | Own assigned risk cases and decision delegation | Record versioned accept/reject/evidence decision | Financial settlement or unassigned health records |
| carrier finance | Own settlement/commission contract scope | Review statements and reconciliation differences | Risk/medical evidence and platform-wide ledger |
| carrier admin | Own staff/delegated configuration | Invite scoped staff, propose product rules | Approve own platform integration mapping or live credential changes |
| supplier operator | Own automotive/other service orders only | Accept/fulfill allowed booking/parts operations | Insurance underwriting, carrier policies or unrelated supplier orders |

Recipient projection is per carrier capability, product, case and staff role. Finance roles see financial references/amounts, underwriters see necessary risk/evidence, and supplier operators see fulfillment contact/address only. Hidden credentials, unrelated employer records and other carriers' quotations are never exposed. Sensitive case/document access is audited.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/partner` | Own incoming workload, issuance exceptions, settlement status | Product/channel/state; due priority | Partner-scoped projections | Navigate to assigned item; organization kind explicit |
| `/partner/submissions` | Submission/business ref, product, receivedAt, state, application version | Product/state/date; receivedAt ascending | Integration Inbox/Submission module | Acknowledge/request permitted evidence; idempotent decision commands |
| `/partner/underwriting` | Case, risk category, assigned reviewer, due date, evidence status | Assignment/product/state; due ascending | Restricted Underwriting module | Accept/reject/request evidence with reason and delegated authority |
| `/partner/issuance` | Order/application ref, accepted version, policy reference, document state | Product/state; updatedAt ascending | Issuance module | Submit signed/verified policy result or manual evidence; no payment-state overwrite |
| `/partner/portfolio` | Own policy reference, product, permitted insured fields, effective dates, status | Product/channel/state; expiry ascending | Carrier Policy projection | Retrieve own contracts and authorized servicing requests |
| `/partner/product-proposals` | Form/plan/rule proposal version, validation, review, effective time | Product/state; proposedAt descending | Catalog/Configuration proposal module | Propose changes; platform review required for publication |
| `/partner/claims` | Own claim reference, assigned case, incident/stage, evidence needed | Product/assignment/stage; updatedAt descending | Restricted Claims module | Assess/decide/pay only within actual contract/delegation |
| `/partner/settlements` | Statement, premium/commission/refund totals, payable, reconciled state | Period/state/currency; period descending | Finance partner projection | Confirm/dispute statement; payout dual-control remains enforced |
| `/partner/api-transactions` | Correlation, operation, mapping version, masked result, latency, delivery status | Operation/state/version; createdAt descending | Integration audit projection | View masked diagnostics; request replay review, not blind resend |
| `/partner/service-orders` | Own booking/parts reference, fulfillment status, permitted contact/address | Type/state/due; due ascending | Automotive Order module | Accept/reject/fulfill own contracted service order |
| `/partner/team` | Staff role, product scope, invitation/review status | Role/state; name ascending | Identity/Authorization module | Grant only bounded partner roles; revoke and review |
| `/partner/settings` | Organization profile, notification routing, credential metadata, API-only mode | Section navigation | Partner Configuration module | Request credential rotation; no plaintext secret retrieval |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Underwriting decision includes case version, authority scope, reason code, evidence references and decision payload under carrier schema. Issuance requires verified carrier reference/document and effective dates; portal staff cannot mark payment verified. Product proposal includes rule/mapping version and synthetic contract results; live publication needs separate platform approver. Replay request records external outcome evidence and operator reason; unsupported idempotency/status capabilities block automatic replay.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Own accepted transaction/statement exports up to 20,000 rows per job with product/channel/role filtering. Medical evidence requires case-specific access and separate export grant, not a generic portfolio download. API-only operation offers the same scoped operations and audit through versioned contracts; portal seats are optional and do not determine backend delivery availability.

## Availability and servicing behavior

Carrier connectivity is separate from B2B sales. Disabling B2B must leave a carrier's authorized B2C submissions operational. Suspended new carrier sales can coexist with policy/claim/settlement servicing. Security quarantine can stop a compromised endpoint and queues the required work durably for reconciliation.

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
| AC-DSH-CARRIER-CARRIER | Carrier A requests Carrier B's submission, document or report cursor; deny without metadata leakage. |
| AC-DSH-CARRIER-API_ONLY | Carrier portal access is disabled while API-only mode is approved; durable authorized submission/status workflows continue. |
| AC-DSH-CARRIER-UNKNOWN | Carrier has no idempotency/status lookup and submit times out after acceptance; portal cannot replay without verified reconciliation evidence. |
| AC-DSH-CARRIER-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-CARRIER-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-CARRIER-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-CARRIER-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
