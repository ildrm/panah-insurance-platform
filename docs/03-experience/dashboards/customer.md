---
{
  "id": "DSH-CUSTOMER",
  "title": "B2C customer dashboard",
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
    "DSH-01",
    "INS-03",
    "INS-10",
    "SVC-01",
    "SVC-02",
    "SVC-03",
    "SVC-06",
    "GRW-02",
    "GRW-03",
    "AUTO-01",
    "GRW-04",
    "AUTO-02",
    "AUTO-03",
    "AUTO-04",
    "AUTO-08"
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

# B2C customer dashboard

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-01, INS-03, INS-10, SVC-01, SVC-02, SVC-03, SVC-06, GRW-02, GRW-03, AUTO-01, GRW-04, AUTO-02, AUTO-03, AUTO-04, AUTO-08. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.customer.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.customer.export` and `dashboard.customer.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| personal customer | Own parties/assets/policies; explicit guardian mandate where valid | View own records, edit drafts, initiate permitted purchase/service requests | Other persons, employer portfolios, carrier operations |
| authorized guardian/delegate | Only granted subject/purpose until mandate expiry | Specified enrollment/claim actions; no implied financial withdrawal | Adult dependent health or beneficiary detail without separate authority |
| support-assisted session | Explicit consent, purpose, duration and scope; visible session banner | Guide/read authorized fields; mutation only within separate operation grant | OTP, credentials, hidden medical evidence, silent impersonation |

Customer sees full own permitted risk data; receipt-only payers see payable/receipt fields but not another insured's health or beneficiary details. Policy sharing does not confer access to claims or wallet. Guardian access ends when authority expires or changes; all document reads re-evaluate it.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/account` | Summary: policy count, pending orders, next installment, renewal actions | Status and product; due date ascending | Policy/Order/Installment projections with as_of | Open item; no mutation from KPI card |
| `/account/policies` | Policy reference masked, product, insured label, carrier, effective/expiry dates, state | State/product/carrier; expiry then opaque ID | Policy module authoritative read | Download/share own permitted document; sharing scoped/expiring |
| `/account/quotes` | Quote reference, product, carrier count, amount/unit, validUntil, state | Product/state; updatedAt descending | Quote module; expiry evaluated on read | Resume, compare, delete draft under version check |
| `/account/orders` | Order reference, product, payable, payment/submission/issuance/delivery states | State family/product; createdAt descending | Order timeline plus independent state projections | Continue payment or submit requested evidence; no activation inference |
| `/account/payments` | Receipt reference, amount/unit, allocation, provider verification state | Type/state/date; verifiedAt descending | Finance module authoritative read | Open receipt; request allowed refund; no direct ledger edit |
| `/account/installments` | Contract, due date, principal/fee breakdown, paid/balance, arrears state | Due/state; due date ascending | Installment schedule and ledger read | Pay allowed due amount; submit dispute |
| `/account/renewals` | Expiring policy, expiry, eligible action, application status | Product/expiry; expiry ascending | Renewal module with current policy version | Start fresh renewal or assisted inquiry |
| `/account/people-and-assets` | Authorized people, dependents, addresses, vehicles, property/devices | Subject type; user label ascending | Party and Asset modules | Create/edit relation-scoped record; revoke sharing; ownership changes reviewed |
| `/account/claims` | Claim reference, insured policy, incident date, stage, action required | Policy/stage; updatedAt descending | Claims projection with medical field mask | Create intake, upload evidence, view permitted decision/review rights |
| `/account/documents` | Document category, policy/order, version, issue date, availability | Category/resource; issuedAt descending | Document module clean-scan authorized view | Short-lived download; no public raw storage URL |
| `/account/wallet-and-rewards` | Separate cash/refund/commission/promo balances; points, mission progress, badges, rewards, approved draw/charity eligibility and expiry | Balance/reward type/state; ledger date descending | Ledger/Loyalty modules with rule versions and no combined cash total | Redeem permitted credit/reward; enter separately approved mechanics; request eligible verified withdrawal |
| `/account/garage` | Vehicle label, policy/obligation deadlines, official inquiry category/provider/provenance/as_of, payable/receipt/pending settlement and service bookings | Vehicle/inquiry category/result state; due date ascending | Garage/Automotive Inquiry/Payment modules with source evidence | Request only authorized supported inquiry, review exact fee and pay eligible obligation, open booking; trading/referral separately gated |
| `/account/support` | Ticket reference, topic, stage, assigned team, last response | Topic/state; updatedAt descending | Support module | Create ticket, consent-limited assistance, complaint escalation |
| `/account/notifications` | Template subject, category, unread, createdAt | Unread/category; createdAt descending | Notification delivery projection | Mark read; open authorized resource |
| `/account/settings` | Profile, sessions, authentication, communication preferences, active mandates | Section navigation; not a bulk table | Identity and Consent modules | Revoke session/mandate; edit preferences; recovery requires verified flow |
| `/account/referrals` | Own code/link, qualifying event category, pending/confirmed/reversed reward, budget/expiry disclosure | Reward state/campaign; createdAt descending | Referral/Attribution module with permitted reward projection | Copy own link, view reward basis, dispute attribution; no invitee purchase/health details |
| `/account/vehicle-alerts` | Authorized vehicle, obligation category, preference, SMS subscription term/fee/expiry, renewal state | Vehicle/category/subscription state; next due ascending | Automotive Alert/Subscription and Notification modules | Set preferences, explicitly accept paid subscription/renewal, cancel future renewal; existing receipts preserved |
| `/account/vehicle-utilities` | Authorized document wallet, road-condition provider/source/as_of, technical-report availability and limitations | Vehicle/utility/provider; as_of descending | Garage/Document/Automotive Utility modules | Open authorized document or request contracted utility; no unverified official-status claim |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Quote resumption uses application version and requotes expired offers. Claim intake asks policy, incident date/time/place, claimant relationship and required evidence; medical fields stay restricted. Refund requests select receipt/allocation, amount and reason but do not execute a refund. Withdrawal verifies permitted balance and bank recipient under finance controls; promotional points never become withdrawable cash by UI conversion. Referral rewards display only own qualification and state, not an invitee's private purchase. Loyalty missions/rewards show pending/confirmed/reversed accrual and terms; games, prize draws and charitable redemption are separately disabled until required review, not unlocked by a general loyalty flag. Paid vehicle-alert subscription review shows fee/unit, delivery channel, term, expiry and renewal consent separately from general reminders; duplicate subscription/payment commands use the same business key. Vehicle utility requests display provider provenance/freshness and require the same vehicle authority as the garage.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Policy/payment history export up to 20,000 authorized rows per job; health claims require separate purpose-scoped export and exclude third-party evidence. A customer cannot export another adult's data through a family summary. Downloads reauthorize the same personal context.

## Availability and servicing behavior

With B2C new sales off, remove new quote/purchase actions with a clear message, preserve committed order follow-up, policy documents, installments, refunds, claims and support. Optional personal purchases from beneficiary context also obey B2C. Garage/automotive features retain their own independent flags.

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
| AC-DSH-CUSTOMER-RELATION | A payer opens an insured's medical attachment without medical authority; deny while keeping the payer receipt visible. |
| AC-DSH-CUSTOMER-STATUS | A verified payment has submission pending; summary and timeline say paid/pending issuance and never active policy. |
| AC-DSH-CUSTOMER-BALANCE | A promotional balance exists with zero withdrawable cash; withdrawal is unavailable and the API cannot transfer promotional value as cash. |
| AC-DSH-CUSTOMER-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-CUSTOMER-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-CUSTOMER-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-CUSTOMER-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
