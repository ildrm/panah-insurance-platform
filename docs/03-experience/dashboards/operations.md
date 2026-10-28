---
{
  "id": "DSH-OPERATIONS",
  "title": "Operational staff workbench",
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
    "DSH-06",
    "COM-06",
    "COM-08",
    "COM-09",
    "SVC-07",
    "SVC-08",
    "SVC-09",
    "INT-07",
    "AUTO-05",
    "AUTO-06",
    "COM-07",
    "SVC-04"
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

# Operational staff workbench

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-06, COM-06, COM-08, COM-09, SVC-07, SVC-08, SVC-09, INT-07, AUTO-05, AUTO-06, COM-07, SVC-04. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.operations.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.operations.export` and `dashboard.operations.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| support agent | Assigned tickets and explicit assistance consent | Triage, respond, request documents, escalate | Policy activation, underwriting decision, refunds, health browsing outside case |
| underwriting/inspection operator | Assigned cases and product authority | Review evidence/retakes or record delegated decision | Finance execution and unassigned restricted claims |
| issuance operator | Assigned committed submissions | Reconcile verified status, request safe replay approval | Blind resend after unknown outcome or mark active from payment |
| finance maker/checker | Separate delegated roles and amount limits | Propose/approve refunds, settlements and payouts | Self-approval, destructive ledger edits, unverified recipients |
| claims handler/assessor | Assigned claims and actual contract authority | Intake/assess/request evidence/decide as delegated | Uncontracted settlement authority and employer disclosure |
| provider operations | Assigned automotive bookings/parts orders | Resolve fulfillment/returns/disputes | Insurance risk decision and unrelated provider information |
| policy servicing/delivery operator | Assigned policy changes/delivery and recipient scope | Request evidence, transmit/reconcile authorized changes, redeliver permitted documents | Invent coverage changes, refund authority or access to unrelated policy evidence |
| assigned integration operator | Assigned partner/product/environment and masked diagnostic scope | Classify delivery/mapping exceptions, inspect evidence and propose permitted replay | Read plaintext secrets, approve own live endpoint/mapping change or replay unknown non-idempotent outcome |
| assigned bulk-processing operator | Assigned organization/source import/export jobs and field scope | Inspect row errors and preview, safely retry stable identities, route partial approval to authorized checker | Approve a roster/financial commitment without separate delegated grant or export hidden fields |

Task assignment plus role and purpose are all required. A support agent sees safe status and masked identity; medical evidence is restricted to the assigned claims/underwriting role. Customer impersonation is replaced by explicit consent-based assistance. Search results apply tenant/resource filters before counts and facets, so denied records do not leak through result totals.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/ops` | Assigned queue counts, oldest age, due work, blocked cases | Queue/priority/assignee; due ascending | Operational projections with as_of | Claim permitted task; no generic all-customer search |
| `/ops/underwriting` | Case, product, evidence completeness, due date, version | Assignment/product/state; due ascending | Underwriting module | Request evidence/decide only within delegated scope |
| `/ops/inspections` | Booking, checklist, secure evidence status, retake reason, expiry | Provider/area/state; appointment ascending | Inspection module | Assign/reschedule/review/retake with recorded reason |
| `/ops/issuance` | Committed order, last attempt, acknowledgment, policy evidence, ambiguity state | Carrier/state/age; oldest first | Submission/Issuance module | Verify status; prepare replay with reconciliation evidence |
| `/ops/reconciliation` | Payment/order/ledger/provider refs, unmatched amount, age, owner | Provider/type/state; oldest first | Reconciliation module authoritative diff | Match supported evidence, raise adjustment proposal, escalate unknown |
| `/ops/refunds-settlements` | Proposal, recipient verified status, amount/unit, maker, checker, state | Type/currency/state; requestedAt ascending | Finance module | Maker propose; distinct checker approve; execution worker handles payout |
| `/ops/claims` | Claim, policy, assignment, stage, required evidence, review deadline | Product/stage/assignee; due ascending | Restricted Claims module | Assess, request evidence, record delegated decision/review; pay only authorized |
| `/ops/support` | Ticket, consent scope, topic, priority, owner, SLA state | Topic/state/priority; due ascending | Support module | Respond, transfer, escalate complaint; attachments access-scoped |
| `/ops/import-export` | Batch, source/schema, row counts, errors, approval, progress | Organization/type/state; createdAt descending | Bulk Processing module | Inspect errors, approve permitted partial policy, retry same identity safely |
| `/ops/fulfillment` | Booking/parts order, provider, promised slot, shipping/return state | Provider/type/state; due ascending | Automotive Fulfillment module | Resolve cancellation, retime with consent, track return/refund handoff |
| `/ops/partner-exceptions` | Partner/operation, capability/mapping version, failure class, next permitted action | Failure/partner/age; oldest first | Integration module masked diagnostics | Classify/escalate; rotation/replay requires separate grants |
| `/ops/knowledge` | Approved procedure version, product/carrier, last verified date | Product/topic; relevance | Original CMS/runbook projection | Read approved script; propose correction for review |
| `/ops/notifications` | Assigned case notices, shift handover, unread state | Queue/unread; createdAt descending | Notification module | Acknowledge and open authorized case |
| `/ops/settings` | Queue subscriptions, accessibility, language, active sessions | Section navigation | Identity/Operational Preferences | Set preferences within assigned queues; cannot self-assign privileged role |
| `/ops/policy-delivery` | Policy/order, authorized recipient, document version, link/SMS/email/courier method, delivery state, last attempt | Method/carrier/state/assignee; oldest pending first | Policy Delivery/Document/Logistics modules | Reauthorize recipient, retry eligible delivery with stable key, reconcile courier result; never expose public raw policy files |
| `/ops/policy-changes` | Policy, endorsement/cancellation request type, requested/approved/effective dates, carrier acknowledgment, financial adjustment state | Type/carrier/state/assignee; requestedAt ascending | Policy Servicing/Integration/Finance projections | Validate authority and evidence, transmit approved change, reconcile acknowledgment; no local coverage cancellation from request alone |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Every decision form shows current version, independent financial/insurance states, source evidence and allowed next actions. Claiming a task uses a lease/version check; another operator receives a conflict and read-only view. Case notes separate customer-visible explanation from restricted internal evidence and prohibit credentials/unnecessary PII. Refund/settlement proposal records original allocation, exact amount/unit, reason, verified recipient and supporting reconciliation; a different checker approves. Unknown external outcomes require positive reconciliation evidence, not a timeout screenshot alone. Delivery retry names recipient, channel and document version and rechecks authority; courier failures retain delivery pending without changing issuance. Endorsement/cancellation review keeps requested/approved/effective dates separate, requires carrier authority and links any approved financial adjustment to its own finance workflow.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Queue handover exports include case IDs, safe status, owner and next action, not attachments/medical details. Financial reconciliations and audit evidence require separate permissions, reason and up to 20,000 rows per job. Download rechecks current scope and revocation.

## Availability and servicing behavior

Sales shutdown keeps operational servicing queues active. Provider/partner outage adds backpressure and pending status; it does not convert uncertain work into failed/cancelled business state. Security quarantine stops specified unsafe actions while preserving audit, reconciliation and customer-support access.

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
| AC-DSH-OPERATIONS-LEASE | Two staff claim the same case version; exactly one lease is granted and only authorized current owner can mutate it. |
| AC-DSH-OPERATIONS-REPLAY | Paid/unissued case has unknown carrier outcome; replay action remains blocked until verified evidence satisfies adapter capability policy. |
| AC-DSH-OPERATIONS-DUAL | Refund maker attempts checker action after switching roles in the same identity; same-actor segregation is still enforced. |
| AC-DSH-OPERATIONS-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-OPERATIONS-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-OPERATIONS-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-OPERATIONS-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
