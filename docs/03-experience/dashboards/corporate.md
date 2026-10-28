---
{
  "id": "DSH-CORPORATE",
  "title": "Corporate buyer dashboard",
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
    "DSH-02",
    "ORG-01",
    "ORG-02",
    "ORG-03",
    "ORG-04",
    "GRW-07",
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

# Corporate buyer dashboard

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-02, ORG-01, ORG-02, ORG-03, ORG-04, GRW-07, SVC-02. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.corporate.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.corporate.export` and `dashboard.corporate.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| corporate viewer | Assigned organization/branch/cost centers | View masked portfolio and approved aggregate reports | Employee diagnoses/claims, other organizations, personal policies |
| enrollment administrator | Assigned roster and allowed nonmedical identity fields | Import, preview, request enrollment changes | Approve own restricted commitment; view private health declarations |
| requester | Assigned budget/cost-center scope | Draft inquiry and purchase request | Commit unapproved spend or approve own request |
| approver/checker | Delegated limit and disjoint maker role | Approve/reject exact proposal/census/budget version with reason | Self-approval, limit bypass, private claims |
| finance payer | Invoice/allocation scope | Pay, reconcile permitted invoices, view balances | Clinical/claim attachments and member medical answers |
| organization admin | Membership/configuration scope | Invite/revoke scoped users, request delegated changes | Grant more authority than own delegation or override platform security |

Roster views expose only employment/enrollment fields needed by the current role. Birth date/identity evidence is masked unless specifically required for enrollment work. Employer reports exclude individual claim records, diagnoses, attachments and unrelated personal policies. Proposed minimum cohort 10 and complementary suppression apply to health aggregates, with query history/dimension controls against subtraction. Payer sees invoice totals/allocation without medical reasons.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/org/:orgId` | Portfolio count, pending approvals, enrollment exceptions, due invoices | Branch/cost center; due date ascending | Portfolio/Approval/Billing projections | Navigate to authoritative item; show active organization banner |
| `/org/:orgId/portfolio` | Policy/master reference, product, carrier, covered population, effective/expiry, status | Product/site/branch/state; expiry ascending | Policy module organization projection | View master terms and allowed certificates; no personal unrelated cover |
| `/org/:orgId/branches` | Branch, department, cost center, parent, active status | Hierarchy/state; name ascending | Organization module | Create/version structure within delegated scope |
| `/org/:orgId/benefits` | Plan/class, contract version, enrollment windows, aggregate eligible/accepted counts | Class/product; effective date descending | Group Benefits module | Propose benefit changes; accepted version read-only |
| `/org/:orgId/census` | Member business ID masked, enrollment relation, class, dates, validation state | Branch/class/row status; stable row ID | Enrollment module masked row projection | Upload, preview, approve allowed batch, request effective-dated changes |
| `/org/:orgId/assets` | Asset/vehicle label, schedule version, location, coverage state | Type/site/state; label ascending | Asset Schedule module | Import/preview/version schedule; underlying ownership checks |
| `/org/:orgId/quotes` | Proposal revision, schedule checksum, carrier, comparable amount, deviations | Product/state; updatedAt descending | Commercial Quote module | Request/compare/return proposal for revision |
| `/org/:orgId/approvals` | Request, maker, budget, amount/unit, version, due date | Assigned scope/state; requestedAt ascending | Approval module authoritative limits | Checker approve/reject exact revision; reason mandatory |
| `/org/:orgId/billing` | Invoice, due date, premium/fees, allocated/remaining, credit exposure | State/cost center; due date ascending | Finance authoritative ledger projection | Pay, allocate approved invoice, dispute; no false cash receipt for credit |
| `/org/:orgId/renewals` | Contract, expiry, census/schedule delta, proposal state | Product/expiry; expiry ascending | Renewal and Enrollment modules | Start negotiation and approve updated population |
| `/org/:orgId/contracts` | Agreement version, parties, term, billing/approval terms, signature state | Type/state; effective date descending | Contract Evidence module | View authorized terms; request renewal; no edit signed evidence |
| `/org/:orgId/reports` | Premium, enrollment and suppressed aggregate claims utilization | Approved dimensions only; fixed report sorting | Analytics restricted projections with as_of | Async export; small-cohort and differencing controls |
| `/org/:orgId/team` | Member, role, branch scope, invitation/session state, last review | Role/state; member label ascending | Identity/Authorization modules | Invite/revoke/review within delegation; privileged grant checker |
| `/org/:orgId/settings` | Notification routing, locale, approved HR connection status | Section navigation | Organization/Notification/Integration modules | Configure allowed preferences; secrets never displayed |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Bulk enrollment accepts schema version, source effective date, idempotency key and clean CSV/XLSX upload reference. Preview shows accepted/rejected counts and row errors before any commit. Explicit partial policy is required; a new file or roster version invalidates approval. Purchase request captures buyer/payer/policyholder, branch/cost-center allocations and requested invoice/credit/prepay terms. Checker confirms exact proposal checksum, budget reservation and delegated limit; requester and checker must differ.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Roster/asset exports are scoped asynchronous jobs up to 20,000 rows per request; larger approved exports partition by stable cursor and reauthorization, never bypass row scope. Claims utilization exports contain suppressed aggregates only. Every job records purpose, fields, organization, authorization version, requester and download expiry.

## Availability and servicing behavior

Corporate, commercial, reseller and B2B2C enrollment entry points have independent B2B subchannel controls. Turning corporate new sales off blocks new commitments after the authoritative cutoff, preserves approved committed obligations, employee certificates, existing billing, claims and negotiated servicing. A B2B sales flag never disables carriers serving B2C.

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
| AC-DSH-CORPORATE-MAKER | Requester is also a nominal approver; same-actor approval is denied even when a menu button was cached. |
| AC-DSH-CORPORATE-COHORT | Filter reduces health report to nine members; suppress cell and complementary totals and reject differencing query sequence. |
| AC-DSH-CORPORATE-IMPORT | HR and manual changes edit the same row version; preview/approval conflict prevents silent overwrite and duplicate enrollment. |
| AC-DSH-CORPORATE-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-CORPORATE-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-CORPORATE-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-CORPORATE-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
