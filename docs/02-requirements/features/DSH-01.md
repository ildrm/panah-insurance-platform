---
{
  "id": "SPEC-DSH-01",
  "title": "B2C dashboard",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R04",
  "reviewer_roles": [
    "R03",
    "R11",
    "R13",
    "R17"
  ],
  "scope_ids": [
    "DSH-01"
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
# DSH-01 — B2C dashboard

## 1. Identity, objective and scope

Owner R04; explicit user scope [S00], not proof of provider availability. Objective and retained baseline: Policies, quotes/orders, payments/installments, renewals, insured assets, claims, documents, wallet/loyalty, notifications, support and settings.

This draft is proposed for human review. No live integration, legal approval, commercial rate or measured implementation result is asserted. Synthetic examples are not production rules. Adjacent capabilities stay in scope even when rollout is off.

## 2. Actors and commercial relationships

Channels: b2c. Field/action authority is specialized by the dashboard specifications: [customer](../../03-experience/dashboards/customer.md). Buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier are separately assigned roles. Personal context shows only the signed-in person's permitted party/asset relationships; organization membership does not enlarge personal access.

## 3. Preconditions, entitlements and permission

Private calls require an authenticated active context, `feature.DSH-01.read` or `.write` and the child operation grant, then resource/relationship/property and state checks. Personal context shows only the signed-in person's permitted party/asset relationships; organization membership does not enlarge personal access.

Browser sessions use HttpOnly reference cookies and mutating requests require CSRF token plus Origin validation. Scoped bearer tokens serve authorized API/service clients; they cannot substitute for resource authority. Explicit anonymous discovery/auth operations remain allowlisted and rate-limited. Verified provider callbacks and internal services have distinct audiences. Privileged decisions require step-up and independent checker where the child guard specifies; switching roles cannot make a maker their own checker.

## 4. Feature controls and disablement

Child keys are boolean with effective-time and global/product/plan/carrier/organization/region/channel/customer scope. This feature's enablement is admission-only and defaults off for fresh capability/sale/optional enrollment until evidence exists. Provider live access always requires approved contract authority. New-admission flags NEVER govern provider verification callbacks, already committed delivery, reconciliation or contracted policy/claim/payment servicing. Existing work evaluates `servicing.enabled`, current resource/recipient authority and separate emergency quarantine; `partner_delivery` remains independent of buyer sales mode. Precedence for a new admission is emergency deny, authorization/security/state deny, applicable commercial parent/dependency deny, then allowed enablement. Publish reviewed immutable versions and recheck the authoritative commit boundary. Rollback creates a new version; it does not disable foundations or erase liabilities. Drafts may be read-only while committed work remains durably recoverable.

## 5. Stories, workflows and assisted paths

As an entitled actor, I need the child behaviors below with recoverable progress and accurate status. The `customer-dashboard` application service validates the exact request, records local facts and outbox atomically, and queues external effects. Each child states its unique happy path and failure/manual path. Assisted processing creates an assigned case with source evidence and next action; it cannot assert a carrier or financial outcome without authority.

## 6. Routes, components and UI states

Authored route and field/action authority map:

- `/account` — Enter B2C portfolio/task summary under personal scope; actor: personal customer; [authority specification](../../03-experience/dashboards/customer.md).
- `/account/settings` — Configure permitted preferences and sessions; actor: personal customer; [authority specification](../../03-experience/dashboards/customer.md).

Interactive task is presented on the listed authored route(s); action/field authorization and domain state are checked separately from dashboard entry.

Components expose a permission-filtered list, versioned detail, child form/result and exception timeline. Public exposure is limited to explicitly anonymous operations. Loading has accessible status text; empty explains no authorized matches; partial labels missing providers/rows; error retains permitted edits and correlation ID; forbidden hides record details; read-only/disabled explains the blocked action and available servicing; expired offers refresh/review; success shows durable local versus pending external outcome. Keyboard focus reaches errors/headings, live status is announced, identifiers use bidi isolation and mobile rows retain table labels.

## 7. Field dictionary and authority

Child tables are the input source of truth and include type, bounds, required/conditional behavior, default, synthetic example, classification, normalization and validation key. Nest application/domain checks are authoritative. Product answers additionally require the pinned form schema; codes require the applicable versioned registry. No omitted value implies consent or eligibility. [OpenAPI](../../06-contracts/openapi.yaml) includes exact transport shapes; provider schemas are distinct from persistence records.

## 8. Business rules and variations

Stable child BR identifiers specialize the [business rules](../business-rules.md). Non-overridable invariants include role separation, exact money, immutable transaction-time versions, recipient minimization, durable local commit/outbox, and reconciliation of uncertain external effects. Product/carrier-dependent rates, limits, exclusions, authority and deadlines remain approved-contract inputs. [Product catalog](../../_meta/product-catalog.yaml) records all 24 families; a generic questionnaire or fixture is not proof of family support.

## 9. States, guards and compensation

The table records **feature-local workflow stages**, not a second authoritative persistence state machine. [Canonical state machines](../state-machines.md) own Purchase draft/awaiting_approval/awaiting_payment/committed/cancellation_requested/cancelled and independent payment, issuance, delivery and finance states. Child guard/effect must translate into those canonical transitions; a local stage such as accepted, reviewed or submission_pending is a work-item stage only. GET has no state effect. External timeout may be external_outcome_unknown; compensate by authorized new transition/reversal, not history deletion.

| Requirement | Local workflow stage | Operation / guard |
|---|---|---|
| DSH-01-R001 | `observation only` | `readCustomerPortfolioDashboard`; Render bounded portfolio/order lists and renewal actions with separate issuance/payment states, explain empty/expired/partial rows and retain servicing links when new sales are disabled. |
| DSH-01-R002 | `observation only` | `readCustomerFinanceDashboard`; Display receipts, due installments and separated cash/credit/point balances with source freshness and links to their domain actions; never combine cash and points into one spendable total. |
| DSH-01-R003 | `observation only` | `readCustomerServiceDashboard`; Provide private claim status, authorized document downloads, notification center, ticket history and preference/session controls with field-level masks. |

## 10. Concurrency, idempotency and versioning

Conflicting `CustomerDashboardView` writes use a bounded transaction and optimistic revision/row lock. `If-Match` is the quoted decimal `resourceVersion`; any `expectedVersion` input is an alias and must agree. Scope idempotency to operation, actor/context and canonical body digest: same body returns stored outcome; changed body returns 409. Unique external/source-event references prevent duplicate local effects. Balance/budget/inventory/approval invariants use transactional checks, never cached counters. Provider calls occur outside database locks after commit and retain one stable business key across retries.

## 11. API contracts and errors

Versioned child operations below return authorized read projections or `CommandReceipt`. Local committed/queued is never carrier issuance or payout confirmation. Lists use stable context/filter-bound cursors, default 25 and maximum 100 rows. Errors: 400 malformed input, 401 invalid identity/signature, 403 authority/availability denied, 404 missing/concealed resource, 409 revision/idempotency/conflict, 422 business validation, 429 admission limit with Retry-After, 503 dependency unavailable. Return stable safe code/message/correlation; raw provider text and private fields are forbidden.

| Operation | Method and path | Permission | Acceptance root |
|---|---|---|---|
| `readCustomerPortfolioDashboard` | `GET /v1/customer-dashboard/read-customer-portfolio-dashboard` | `feature.DSH-01.readCustomerPortfolioDashboard` | `AC-DSH-01-R001` |
| `readCustomerFinanceDashboard` | `GET /v1/customer-dashboard/read-customer-finance-dashboard` | `feature.DSH-01.readCustomerFinanceDashboard` | `AC-DSH-01-R002` |
| `readCustomerServiceDashboard` | `GET /v1/customer-dashboard/read-customer-service-dashboard` | `feature.DSH-01.readCustomerServiceDashboard` | `AC-DSH-01-R003` |

## 12. Data ownership, indexes and lifecycle

`customer-dashboard` owns `CustomerDashboardView` and its operation records. Other modules use application contracts/events. Persist context/relationship, revision, local stage, immutable source versions and UTC timestamps; do not duplicate another module's authoritative finance/policy state. Index authorized list predicates `(context_id,state,updated_at,id)`, relationship joins and unique operation/context/idempotency plus provider/external reference where applicable. Verify query plans against scoped synthetic data. Retain immutable decisions/reversals and export only a field-approved audited background projection with authorization rechecked at download. Production retention duration/basis is a qualified-review blocker; synthetic fixtures are safe until approved retention/legal-hold/erasure rules exist.

## 13. Integration and recipient projection

Each child names its external capability or a reason it has none. Discover support per provider/product/channel/version. Translate immutable canonical fields through a reviewed mapping; reject unknown enum/date/unit transforms. Approved egress, TLS/signature verification and secret references are required. Unsupported capability uses the child assisted path; never fabricate a provider result. Only necessary purpose-authorized fields leave the module/platform.

## 14. Events, jobs, retries and reconciliation

Child mutation events include opaque resource/context IDs, aggregate version, schema version, occurredAt, correlation/causation and authorized snapshot reference. No raw medical/bank/secret data is placed in metrics or ordinary logs. Insert outbox with local effect, publish at least once and atomically deduplicate inbox effects. Serialize conflicting work by `CustomerDashboardView`. Retry only classified transient outcomes with provider policy, bounded attempts and owned dead-letter queue. Unknown non-idempotent outcomes require authoritative status/evidence before replay. Read projections emit no domain mutation event.

## 15. Commercial and financial effects

Balance widgets read finance projections and label pending amounts separately; dashboard commands use the owning domain API.

Money is integer-string amount plus currency/unit; conversion/rounding uses the approved transaction-time rule. Toman display does not change canonical rial accounting. A price/coverage change requires fresh acceptance. Synthetic amounts are test values, never approved premiums/fees/benefits.

## 16. Notifications, queues and service ownership

R04 owns decisions; R20 owns assigned customer/partner exceptions, R09 provider failures, R12 finance discrepancies and R11 privacy/security incidents. Workbenches show age, owner, next action and evidence. Notify using reviewed purpose-specific templates, verified contacts, consent/preferences and event/recipient deduplication. Response/escalation rules link to [operational SLOs](../../12-operations/sli-slo-alerts-and-oncall.md); uncontracted external SLAs remain blocked rather than invented.

## 17. Security, privacy and fraud

Personal context shows only the signed-in person's permitted party/asset relationships; organization membership does not enlarge personal access.

Test object/property substitution with two users/two tenants, shared membership, context switch and revoked roles. Reauthorize queued privileged work and export/download use. Restrict partner recipients, verify callback replay protection, scan uploads, neutralize rendered provider text and exclude PII from high-cardinality telemetry. Financial and availability controls cannot weaken authorization.

## 18. Performance, caching and measurement

Use only [central budgets](../../_meta/performance-budgets.yaml): PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS. Child mapping below identifies its critical budget. Include authorization, validation, database commit/outbox in own-service timing; separately attribute external time. Bound pages and database queries, avoid N+1, move exports/provider work outside request transactions and enforce tenant/provider admission limits. Private results never enter shared public caches. Public catalog/content uses explicit versioned invalidation. Measure request/query latency, query count, event-loop/memory, queue age and provider outcome class with opaque correlations; no observed performance is claimed here.

## 19. Analytics and KPIs

Use `customer-dashboard.operation_requested`, `.operation_completed` and `.operation_failed` with operation, coarse channel, result code and consented pseudonymous correlation. Measure eligible completion, denial, retry, abandonment and aged exceptions. Never export raw answers, identity numbers, medical evidence, bank details or raw resource IDs to marketing analytics. Financial metrics reconcile to ledger facts rather than browser clicks.

## 20. Accessibility, localization, calendar and mobile

Target WCAG 2.2 AA with keyboard/screen-reader review plus automated checks. Programmatic labels/error associations, focus management and non-color status are required. A01 proposes Persian-first RTL with English identifiers; bidi-isolate money/references and label units. UTC instants differ from contract-local effective dates and selected Jalali presentation. Provide upload/camera/notification alternatives when device permission is denied. Offline clients cannot establish fresh purchase/coverage/finance authority or cache sensitive responses.

## 21. Configuration, migration and rollout

Deploy compatible reads/schema before writes; backfill in bounded resumable tenant-scoped batches with source counts/digests. Begin with fictional local fixtures, then certified sandbox evidence, then explicitly approved live scope. Preserve historical form/rule/mapping versions for committed work. Rollback stops new admission and restores compatible code/configuration while draining or reconciling committed work; never delete audit/ledger history or blindly replay unknown external effects.

## 22. Child requirements and measurable acceptance

Each child specializes all shared sections above through its exact fields, rule, operation, workflow stage, failure and seven acceptance cases. These are test specifications, not executed application evidence. Shared controls remain normative through the [SRS](../software-requirements-specification.md); they do not replace feature-specific behavior.

### DSH-01-R001 — Policies, quotes/orders, renewals and insured assets

**Rule `BR-DSH-01-R001`:** Render bounded portfolio/order lists and renewal actions with separate issuance/payment states, explain empty/expired/partial rows and retain servicing links when new sales are disabled.

**Actor/resource boundary:** Personal context shows only the signed-in person's permitted party/asset relationships; organization membership does not enlarge personal access. Require `feature.DSH-01.readCustomerPortfolioDashboard` and applicable context/relationship/property grants. The accountable decision owner is R04; R20 owns assigned exceptions.

**Local workflow stage:** `current>current`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** One failing widget cannot hide existing policy downloads; stale quote actions revalidate before checkout.

**Control:** `feature.DSH-01.servicing`; evaluation `existing_servicing_or_continuation`. Do not apply new-admission feature flags. Evaluate servicing.enabled, current resource/recipient authority and separate emergency quarantine. Preserve already committed delivery, policy/claim/payment servicing and reconciliation. Any newly purchased optional addition separately checks its own admission gate.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `status` | `code`; {"type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$"}; Code must also exist in the operation's versioned, authorized registry; regex validation alone is insufficient. | required; no implicit default | `"synthetic-code-v1"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.status.invalid` |
| `cursor` | `cursor`; {"type": "string", "minLength": 1, "maxLength": 512}; Opaque authenticated cursor bound to authorization context, filters and sort; not a raw database offset. | optional; conditional guard still applies; no implicit default | `"opaque-synthetic-cursor"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.cursor.invalid` |
| `locale` | `locale`; {"type": "string", "enum": ["fa-IR", "en"]}; Proposed locale set, not approved jurisdiction selection. | required; no implicit default | `"fa-IR"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.locale.invalid` |

**API:** `GET /v1/customer-dashboard/read-customer-portfolio-dashboard`; operation ID `readCustomerPortfolioDashboard`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Read projection allowlist:** `resourceId:uuid`, `resourceKind:code`, `productCode:productCode`, `status:code`, `paymentStatus:code`, `issuanceStatus:code`, `nextAction:code`, `updatedAt:instant`. Reauthorize properties before serialization. Inapplicable facts in heterogeneous rows are omitted rather than replaced with zero. Private projections are not publicly cached.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `CustomerDashboardView` owned by `customer-dashboard`; `N/A: read projection has no domain mutation event`. **Financial effects:** Balance widgets read finance projections and label pending amounts separately; dashboard commands use the owning domain API. **Performance:** `PERF-READ` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-DSH-01-R001-SUCCESS` | Given a synthetic authorized `CustomerDashboardView` and the declared valid inputs, when `readCustomerPortfolioDashboard` executes, then Render bounded portfolio/order lists and renewal actions with separate issuance/payment states, explain empty/expired/partial rows and retain servicing links when new sales are disabled. Assert the exact local effect/projection and source/version references. |
| `AC-DSH-01-R001-FAILURE` | Given missing or invalid `status` or the operation-specific invalid condition, when `readCustomerPortfolioDashboard` executes, then reject malformed/domain-invalid input without partial mutation. One failing widget cannot hide existing policy downloads; stale quote actions revalidate before checkout. |
| `AC-DSH-01-R001-DENIAL` | Given person A in tenant A and a `CustomerDashboardView` belonging only to person B/tenant B, when A substitutes B's reference in `readCustomerPortfolioDashboard`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-DSH-01-R001-DISABLE` | Given new-admission flags are off, when `readCustomerPortfolioDashboard` handles an already authorized resource or committed obligation, then apply servicing.enabled/current relationship/recipient authority/quarantine, not the new-admission flag. Preserve downloads, claims, receipts and reconciliation as applicable; deny only actual authority/state/security violations. |
| `AC-DSH-01-R001-RACE` | Given `readCustomerPortfolioDashboard` is reading while an authorized mutation updates `CustomerDashboardView`, when the response is built, then return a consistent projection/snapshot and asOf value, with no torn money/coverage facts or unauthorized new fields. Pagination remains bound to its filters/context. GET creates no domain mutation or idempotency reservation. |
| `AC-DSH-01-R001-RECOVERY` | Given the `CustomerDashboardView` projection is rebuilding or temporarily unavailable, when `readCustomerPortfolioDashboard` resumes, then reauthorize current context and return recovered data with freshness, or explicit partial/unavailable status; never reuse another subject's cached projection. |
| `AC-DSH-01-R001-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-DSH-01-R001-UNIT`, `T-DSH-01-R001-PROPERTY`, `T-DSH-01-R001-INTEGRATION`, `T-DSH-01-R001-CONTRACT`, `T-DSH-01-R001-E2E`, `T-DSH-01-R001-SECURITY`, `T-DSH-01-R001-PERF`. Fixtures include valid inputs above, invalid `status`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** One failing widget cannot hide existing policy downloads; stale quote actions revalidate before checkout. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### DSH-01-R002 — Payments/installments and wallet/loyalty

**Rule `BR-DSH-01-R002`:** Display receipts, due installments and separated cash/credit/point balances with source freshness and links to their domain actions; never combine cash and points into one spendable total.

**Actor/resource boundary:** Personal context shows only the signed-in person's permitted party/asset relationships; organization membership does not enlarge personal access. Require `feature.DSH-01.readCustomerFinanceDashboard` and applicable context/relationship/property grants. The accountable decision owner is R04; R20 owns assigned exceptions.

**Local workflow stage:** `current>current`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Unavailable finance data shows unavailable rather than zero; private balances are excluded from shared caches.

**Control:** `feature.DSH-01.servicing`; evaluation `existing_servicing_or_continuation`. Do not apply new-admission feature flags. Evaluate servicing.enabled, current resource/recipient authority and separate emergency quarantine. Preserve already committed delivery, policy/claim/payment servicing and reconciliation. Any newly purchased optional addition separately checks its own admission gate.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `periodStart` | `date`; {"type": "string", "format": "date"}; ISO Gregorian civil date. Effective date carries contract calendar/timezone context; it is not a UTC instant. | required; no implicit default | `"2026-10-28"` | internal; Strict parsing; date and instant differ; UTC event instants; display calendar never changes stored value; `validation.periodStart.invalid` |
| `periodEnd` | `date`; {"type": "string", "format": "date"}; ISO Gregorian civil date. Effective date carries contract calendar/timezone context; it is not a UTC instant. | required; no implicit default | `"2026-10-28"` | internal; Strict parsing; date and instant differ; UTC event instants; display calendar never changes stored value; `validation.periodEnd.invalid` |
| `cursor` | `cursor`; {"type": "string", "minLength": 1, "maxLength": 512}; Opaque authenticated cursor bound to authorization context, filters and sort; not a raw database offset. | optional; conditional guard still applies; no implicit default | `"opaque-synthetic-cursor"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.cursor.invalid` |

**API:** `GET /v1/customer-dashboard/read-customer-finance-dashboard`; operation ID `readCustomerFinanceDashboard`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Read projection allowlist:** `resourceId:uuid`, `resourceKind:code`, `amount:money`, `dueDate:date`, `status:code`, `nonCashPoints:count`, `updatedAt:instant`. Reauthorize properties before serialization. Inapplicable facts in heterogeneous rows are omitted rather than replaced with zero. Private projections are not publicly cached.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `CustomerDashboardView` owned by `customer-dashboard`; `N/A: read projection has no domain mutation event`. **Financial effects:** Balance widgets read finance projections and label pending amounts separately; dashboard commands use the owning domain API. **Performance:** `PERF-READ` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-DSH-01-R002-SUCCESS` | Given a synthetic authorized `CustomerDashboardView` and the declared valid inputs, when `readCustomerFinanceDashboard` executes, then Display receipts, due installments and separated cash/credit/point balances with source freshness and links to their domain actions; never combine cash and points into one spendable total. Assert the exact local effect/projection and source/version references. |
| `AC-DSH-01-R002-FAILURE` | Given missing or invalid `periodStart` or the operation-specific invalid condition, when `readCustomerFinanceDashboard` executes, then reject malformed/domain-invalid input without partial mutation. Unavailable finance data shows unavailable rather than zero; private balances are excluded from shared caches. |
| `AC-DSH-01-R002-DENIAL` | Given person A in tenant A and a `CustomerDashboardView` belonging only to person B/tenant B, when A substitutes B's reference in `readCustomerFinanceDashboard`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-DSH-01-R002-DISABLE` | Given new-admission flags are off, when `readCustomerFinanceDashboard` handles an already authorized resource or committed obligation, then apply servicing.enabled/current relationship/recipient authority/quarantine, not the new-admission flag. Preserve downloads, claims, receipts and reconciliation as applicable; deny only actual authority/state/security violations. |
| `AC-DSH-01-R002-RACE` | Given `readCustomerFinanceDashboard` is reading while an authorized mutation updates `CustomerDashboardView`, when the response is built, then return a consistent projection/snapshot and asOf value, with no torn money/coverage facts or unauthorized new fields. Pagination remains bound to its filters/context. GET creates no domain mutation or idempotency reservation. |
| `AC-DSH-01-R002-RECOVERY` | Given the `CustomerDashboardView` projection is rebuilding or temporarily unavailable, when `readCustomerFinanceDashboard` resumes, then reauthorize current context and return recovered data with freshness, or explicit partial/unavailable status; never reuse another subject's cached projection. |
| `AC-DSH-01-R002-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-DSH-01-R002-UNIT`, `T-DSH-01-R002-PROPERTY`, `T-DSH-01-R002-INTEGRATION`, `T-DSH-01-R002-CONTRACT`, `T-DSH-01-R002-E2E`, `T-DSH-01-R002-SECURITY`, `T-DSH-01-R002-PERF`. Fixtures include valid inputs above, invalid `periodStart`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Unavailable finance data shows unavailable rather than zero; private balances are excluded from shared caches. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### DSH-01-R003 — Claims, documents, notifications, support and settings

**Rule `BR-DSH-01-R003`:** Provide private claim status, authorized document downloads, notification center, ticket history and preference/session controls with field-level masks.

**Actor/resource boundary:** Personal context shows only the signed-in person's permitted party/asset relationships; organization membership does not enlarge personal access. Require `feature.DSH-01.readCustomerServiceDashboard` and applicable context/relationship/property grants. The accountable decision owner is R04; R20 owns assigned exceptions.

**Local workflow stage:** `current>current`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Declining push or marketing consent leaves claims/support/settings usable; a context switch clears all customer widget state.

**Control:** `feature.DSH-01.servicing`; evaluation `existing_servicing_or_continuation`. Do not apply new-admission feature flags. Evaluate servicing.enabled, current resource/recipient authority and separate emergency quarantine. Preserve already committed delivery, policy/claim/payment servicing and reconciliation. Any newly purchased optional addition separately checks its own admission gate.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `section` | `code`; {"type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$"}; Code must also exist in the operation's versioned, authorized registry; regex validation alone is insufficient. | required; no implicit default | `"synthetic-code-v1"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.section.invalid` |
| `cursor` | `cursor`; {"type": "string", "minLength": 1, "maxLength": 512}; Opaque authenticated cursor bound to authorization context, filters and sort; not a raw database offset. | optional; conditional guard still applies; no implicit default | `"opaque-synthetic-cursor"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.cursor.invalid` |

**API:** `GET /v1/customer-dashboard/read-customer-service-dashboard`; operation ID `readCustomerServiceDashboard`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Read projection allowlist:** `resourceId:uuid`, `resourceKind:code`, `publicStatus:code`, `title:text`, `actionRoute:route`, `updatedAt:instant`. Reauthorize properties before serialization. Inapplicable facts in heterogeneous rows are omitted rather than replaced with zero. Private projections are not publicly cached.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `CustomerDashboardView` owned by `customer-dashboard`; `N/A: read projection has no domain mutation event`. **Financial effects:** Balance widgets read finance projections and label pending amounts separately; dashboard commands use the owning domain API. **Performance:** `PERF-READ` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-DSH-01-R003-SUCCESS` | Given a synthetic authorized `CustomerDashboardView` and the declared valid inputs, when `readCustomerServiceDashboard` executes, then Provide private claim status, authorized document downloads, notification center, ticket history and preference/session controls with field-level masks. Assert the exact local effect/projection and source/version references. |
| `AC-DSH-01-R003-FAILURE` | Given missing or invalid `section` or the operation-specific invalid condition, when `readCustomerServiceDashboard` executes, then reject malformed/domain-invalid input without partial mutation. Declining push or marketing consent leaves claims/support/settings usable; a context switch clears all customer widget state. |
| `AC-DSH-01-R003-DENIAL` | Given person A in tenant A and a `CustomerDashboardView` belonging only to person B/tenant B, when A substitutes B's reference in `readCustomerServiceDashboard`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-DSH-01-R003-DISABLE` | Given new-admission flags are off, when `readCustomerServiceDashboard` handles an already authorized resource or committed obligation, then apply servicing.enabled/current relationship/recipient authority/quarantine, not the new-admission flag. Preserve downloads, claims, receipts and reconciliation as applicable; deny only actual authority/state/security violations. |
| `AC-DSH-01-R003-RACE` | Given `readCustomerServiceDashboard` is reading while an authorized mutation updates `CustomerDashboardView`, when the response is built, then return a consistent projection/snapshot and asOf value, with no torn money/coverage facts or unauthorized new fields. Pagination remains bound to its filters/context. GET creates no domain mutation or idempotency reservation. |
| `AC-DSH-01-R003-RECOVERY` | Given the `CustomerDashboardView` projection is rebuilding or temporarily unavailable, when `readCustomerServiceDashboard` resumes, then reauthorize current context and return recovered data with freshness, or explicit partial/unavailable status; never reuse another subject's cached projection. |
| `AC-DSH-01-R003-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-DSH-01-R003-UNIT`, `T-DSH-01-R003-PROPERTY`, `T-DSH-01-R003-INTEGRATION`, `T-DSH-01-R003-CONTRACT`, `T-DSH-01-R003-E2E`, `T-DSH-01-R003-SECURITY`, `T-DSH-01-R003-PERF`. Fixtures include valid inputs above, invalid `section`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Declining push or marketing consent leaves claims/support/settings usable; a context switch clears all customer widget state. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

## 23. Test suites and synthetic fixtures

Per-child UNIT tests field/state guards; PROPERTY permutes duplicates and ordering while preserving invariants; INTEGRATION verifies transaction/outbox and authorization; CONTRACT validates declared adapter/schema behavior; E2E exercises actual screen states; SECURITY checks object/property/context boundaries; PERF runs the referenced workload. No-provider children explain contract-test inapplicability while retaining internal API checks. Fixtures never include real people/credentials. A renderer or structural schema pass is not semantic feature completeness.

## 24. Runbook, dependencies, blockers and done

For a stuck `CustomerDashboardView`, inspect the authorized event/status sequence and assigned queue, classify local validation/auth/configuration/provider/finance cause, preserve evidence, assign the accountable role, reconcile before replay and communicate safe pending/next-step status. Close only on verified outcome and audit; no direct status edits to clear alerts. Dependencies include identity/context, relationship grants, versioned product/configuration, durable database/outbox, declared partner capability, finance for value effects and consented messaging. [Blockers](../../_meta/risks-and-blockers.yaml) record missing authority/contracts/retention and owners. Done requires human role reviews, all acceptance categories, risk-based suite evidence, tenant/cache tests, measured budgets and recovery drills. Application implementation, deployment and live certification are outside this documentation claim.
