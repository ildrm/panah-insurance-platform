---
{
  "id": "DSH-ADMIN",
  "title": "Platform administrator dashboard",
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
    "CHN-01",
    "CHN-02",
    "CHN-03",
    "CHN-04",
    "ORG-01",
    "INT-06",
    "GRW-08",
    "GRW-03",
    "AUTO-05",
    "AUTO-06",
    "AUTO-07"
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

# Platform administrator dashboard

## Purpose, authority and context

This dashboard serves the roles below and covers DSH-06, CHN-01, CHN-02, CHN-03, CHN-04, ORG-01, INT-06, GRW-08, GRW-03, AUTO-05, AUTO-06, AUTO-07. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.admin.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.admin.export` and `dashboard.admin.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
| platform configuration maker | Granted configuration domains | Draft/version/preview scoped changes | Approve own change, disable audit/security or inspect all PII |
| configuration checker | Disjoint maker; delegated change authority | Approve/reject effective version and rollback proposal | Self-approval, unreviewed live provider activation |
| tenant administrator | Organization onboarding scope | Review organizations and bounded role grants | Employee health, financial execution, other admin domains |
| catalog/content editor | Assigned product/content domains | Draft forms/rules/content/campaigns | Publish commercial rates without approval or run arbitrary mapping code |
| security administrator | Security/audit scope with step-up MFA | Revoke access, quarantine compromised path, review audit | Erase audit or approve own financial transaction |
| platform super-admin | Exceptional time-bound elevation with reason | Manage delegated roles/recovery under oversight | Default unrestricted medical browsing or unaudited impersonation |

Administration is capability-scoped, not universal data access. Summary widgets use counts/coarse outcomes; opening customer/medical/financial detail requires the relevant role, purpose and resource scope. Super-admin break-glass is time-limited, audited and reviewed; secrets remain unreadable. Sensitive report fields cannot be enabled through a dashboard column setting.

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
| `/admin` | Operational summaries, pending approvals, release blockers | Domain/severity; createdAt ascending | Aggregated admin projections | Open role-permitted workbench; cards do not grant data rights |
| `/admin/features` | Key, type, scope, proposed/effective version, dependencies, rollout, reason | Domain/scope/state; effectiveAt descending | Feature Configuration module | Draft/preview/approve/schedule/rollback; show four B2C/B2B combinations |
| `/admin/organizations` | Legal entity, buyer/supplier/distributor relationships, onboarding, tenant state | Kind/state/region; name ascending | Organization/Partner module | Onboard/verify/delegate; carrier role distinct from corporate buyer |
| `/admin/catalog` | Category/product/plan, form/rule version, availability, review state | Product/carrier/state; updatedAt descending | Catalog/Form/Rule modules | Draft/test/publish approved versions; no historical overwrite |
| `/admin/underwriting` | Case queues, inspection evidence state, assignment and SLA state | Product/role/state; due ascending | Underwriting/Inspection projections | Assign permitted work; case decision belongs to separate role |
| `/admin/orders-policies` | Order, payment/submission/issuance/delivery states, policy reference | State/product/carrier; updatedAt descending | Order/Policy modules | Investigate and request correction; no synthetic activation button |
| `/admin/finance` | Reconciliation, allocations, commissions, refunds, settlements, payouts | Currency/state/partner; oldest unresolved | Finance workbench projection | Route to authorized finance controls; no unrestricted ledger mutation |
| `/admin/claims-support` | Claim/ticket counts, stage, assignment, escalation | Queue/product/severity; due ascending | Claims/Support modules | Assign/escalate; sensitive access requires case role |
| `/admin/corporate` | Contracts, census batches, proposals, approvals, billing exceptions | Organization/state; updatedAt descending | Corporate Sales/Enrollment modules | Review commercial exceptions without individual health disclosure |
| `/admin/commissions` | Contract rule version, accrual/reversal rules, payout exceptions | Distributor/state; effectiveAt descending | Commission module | Propose/approve rule revision; recalculate only controlled adjustments |
| `/admin/marketing` | Campaign/segment/budget, referral/loyalty rules, rewards, CMS revisions | Type/state/channel; schedule ascending | Marketing/Loyalty/CMS modules | Draft/approve/schedule; draws/games/charity mechanics require review |
| `/admin/automotive` | Providers, services, parts catalogs, inventory, trading/referral controls | Provider/capability/state; updatedAt descending | Automotive/Partner modules | Onboard/provider review; trading/auctions/contracts/debt settlement separate gates |
| `/admin/integrations` | Partner capabilities, mapping/auth metadata, sandbox/live, health, unknown outcomes | Operation/partner/environment; exception age | Integration Studio module | Validate/propose/promote mapping; approved endpoints; no secret values/arbitrary code |
| `/admin/reports` | Approved reports, dataset freshness, field policy, export requests | Domain/scope/status; generatedAt descending | Analytics/Export modules | Purpose-scoped export; tenant limits remain enforced |
| `/admin/security-audit` | Access events, privileged reasons, role changes, security incidents | Actor role/action/outcome/time; event time descending | Append-only Audit/Security modules | Review/revoke/quarantine with reason; no audit deletion |
| `/admin/settings` | Menu/widget/action/report definitions, locales, templates, environment metadata | Dashboard/domain/state; updatedAt descending | Experience Configuration module | Version/preview configuration; server permission intersection mandatory |

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

Feature proposal captures key/type/scope/value, dependencies, effective time, reason, expected impact and rollback target; preview compares channel and servicing effects. Rule/form/mapping edits validate schemas and synthetic fixtures before checker review. Endpoint changes include approved destination/egress evidence and secret references, never arbitrary URLs/code execution. Menu/action configuration intersects server entitlements and cannot introduce an unregistered operation. Privileged grants, finance/rate rules, live integrations and material availability changes require maker-checker; emergencies use a separately audited, time-bounded security procedure.

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

Audit/configuration/report exports are asynchronous, purpose-scoped and limited to 20,000 rows per request with approved continuation for larger evidence sets. No global customer/medical dump by default. Export manifests capture field policy and authorization version; downloading after role revocation fails.

## Availability and servicing behavior

Ordinary feature management cannot disable audit, authorization or financial invariants. New-sales modes, servicing, partner delivery and security quarantine are distinct controls. Every proposal preview displays draft/quote/payment-in-progress/committed behavior; committed work continues unless a separately authorized quarantine applies.

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
| AC-DSH-ADMIN-MENU | Admin enables a finance action in a seller menu; server permission intersection still denies it and configuration validation flags the invalid audience. |
| AC-DSH-ADMIN-SELF_APPROVE | Maker attempts to approve own live mapping/rate/flag change; transaction rejects it and audit records denial. |
| AC-DSH-ADMIN-CUTOFF | Feature disable races verified payment commitment; authoritative transaction/version order determines commit versus refund/recovery path and is recorded. |
| AC-DSH-ADMIN-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-ADMIN-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-ADMIN-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-ADMIN-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
