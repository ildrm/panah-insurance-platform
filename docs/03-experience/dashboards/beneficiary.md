---
{
  "id": "DSH-BENEFICIARY",
  "title": "Employee / beneficiary dashboard",
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
    "DSH-03",
    "ORG-04",
    "SVC-01",
    "SVC-05",
    "SVC-06",
    "CHN-05"
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

# Employee / beneficiary dashboard

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-03, ORG-04, SVC-01, SVC-05, SVC-06, CHN-05. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.beneficiary.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.beneficiary.export` and `dashboard.beneficiary.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| employee/beneficiary | Own accepted enrollment/coverage relationship | Read own benefits/certificates, submit own claims and permitted changes | Employer billing, coworkers, other organizations' records |
| dependent/guardian | Specific dependent relationship and purpose | Read eligible dependent cover and permitted intake | Other adult members' private claims without authority |
| benefit administrator assist | Enrollment support scope only | Explain status/request correction | Diagnoses, private personal policies, unconsented impersonation |

Employer enrollment administrators may see membership completion and permitted benefit-class information but cannot use this surface to inspect individual claims or personal purchases. The beneficiary's personal wallet/policies live in a distinct personal context. Terminated employment is not automatically proof that already-effective cover or claim rights ended; check insurer-confirmed entitlement dates.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/benefits` | Own organization relationships, active/pending benefits, actions required | Organization/product; effective date descending | Enrollment/Policy projections | Choose explicit benefit context; personal purchase shown separately |
| `/benefits/:enrollmentId/coverage` | Benefit category, approved limit wording, network, effective dates, status | Category; plan order | Policy/Benefit Plan module | View insurer-confirmed cover and authorized plan documents |
| `/benefits/dependents` | Dependent label, relationship, consent state, enrollment dates, status | Relationship/state; label ascending | Enrollment/Party module | Request add/remove/correct dependent; cannot self-approve acceptance |
| `/benefits/certificates` | Certificate, insured label, master plan, issue/effective dates | Product/state; issuedAt descending | Document/Policy modules | Authorized short-lived download/share |
| `/benefits/claims` | Own claim reference, incident date, stage, action required | Policy/stage; updatedAt descending | Restricted Claims module | Submit evidence, view own decision and review route |
| `/benefits/providers` | Contract network, service category, location, verification time | Category/location; declared relevance | Provider Directory module | View verified contact/assistance details; no unsupported appointment guarantee |
| `/benefits/changes` | Change request, effective date, insurer acknowledgment, status | Type/state; requestedAt descending | Enrollment change projection | Withdraw permitted uncommitted request or provide correction |
| `/benefits/support` | Private support tickets, benefit FAQs, assigned team | Topic/state; updatedAt descending | Support and original Content modules | Ask benefit question with scoped attachments |
| `/benefits/notifications` | Enrollment/claim notices, unread, createdAt | Category/unread; date descending | Notification projection | Open authorized case; no clinical details in external notice |
| `/benefits/settings` | Consent, contact, language/calendar, notification choices | Section navigation | Identity/Consent modules | Manage own preferences and authorized relationships |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Dependent request collects relationship, effective date, identity/evidence and consent under the plan's enrollment rules. Adult dependents submit restricted declarations in their own authorized session. Removal is a request with requested/accepted/effective dates, not an immediate local coverage deletion. Claims ask the employee for policy/incident/evidence; employer approval is not a prerequisite to view private claim progress unless the actual workflow lawfully and contractually requires it, which remains a review blocker.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Own certificates/coverage summaries and own permitted claim history only, up to 20,000 authorized rows per job; never whole-employer roster. Each adult dependent's private data requires a separate valid authority check.

## Availability and servicing behavior

B2B/B2C new-sales disablement preserves existing benefit certificates, claims, installments and support. A new dependent enrollment is classified explicitly as contracted servicing or new sales by the accepted group agreement; do not infer from the page label. Optional personal purchase appears only under the separate B2C rule.

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
| AC-DSH-BENEFICIARY-PERSONAL | Employer context changes while a personal policy tab is open; refetch with the new context and deny unrelated resource retrieval. |
| AC-DSH-BENEFICIARY-DEPARTURE | Employment membership is revoked but policy entitlement remains effective; retain authorized beneficiary servicing without granting employer administration. |
| AC-DSH-BENEFICIARY-DEPENDENT | A minor becomes an adult under the applicable reviewed rule; inherited guardian access cannot silently continue without valid authority. |
| AC-DSH-BENEFICIARY-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-BENEFICIARY-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-BENEFICIARY-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-BENEFICIARY-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
