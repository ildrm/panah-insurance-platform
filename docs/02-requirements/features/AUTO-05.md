---
{
  "id": "SPEC-AUTO-05",
  "title": "Maintenance marketplace",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R20",
  "reviewer_roles": [
    "R03",
    "R11",
    "R13",
    "R17"
  ],
  "scope_ids": [
    "AUTO-05"
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
# AUTO-05 — Maintenance marketplace

## 1. Identity, objective and scope

Owner R20; explicit user scope [S00], not proof of provider availability. Objective and retained baseline: Provider/location discovery, oil/service/car-wash/inspection/towing/battery/tire-repair bookings, availability, price, cancellation, fulfillment, commissions and complaints.

This draft is proposed for human review. No live integration, legal approval, commercial rate or measured implementation result is asserted. Synthetic examples are not production rules. Adjacent capabilities stay in scope even when rollout is off.

## 2. Actors and commercial relationships

Channels: b2c, corporate, commercial, reseller, b2b2c. Field/action authority is specialized by the dashboard specifications: [customer](../../03-experience/dashboards/customer.md), [corporate](../../03-experience/dashboards/corporate.md), [platform_admin](../../03-experience/dashboards/admin.md), [staff](../../03-experience/dashboards/operations.md). Buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier are separately assigned roles. Providers see only assigned fulfillment data; customers need vehicle authority and location-sharing consent for mobile services.

## 3. Preconditions, entitlements and permission

Private calls require an authenticated active context, `feature.AUTO-05.read` or `.write` and the child operation grant, then resource/relationship/property and state checks. Providers see only assigned fulfillment data; customers need vehicle authority and location-sharing consent for mobile services.

Browser sessions use HttpOnly reference cookies and mutating requests require CSRF token plus Origin validation. Scoped bearer tokens serve authorized API/service clients; they cannot substitute for resource authority. Explicit anonymous discovery/auth operations remain allowlisted and rate-limited. Verified provider callbacks and internal services have distinct audiences. Privileged decisions require step-up and independent checker where the child guard specifies; switching roles cannot make a maker their own checker.

## 4. Feature controls and disablement

Child keys are boolean with effective-time and global/product/plan/carrier/organization/region/channel/customer scope. This feature's enablement is admission-only and defaults off for fresh capability/sale/optional enrollment until evidence exists. Provider live access always requires approved contract authority. New-admission flags NEVER govern provider verification callbacks, already committed delivery, reconciliation or contracted policy/claim/payment servicing. Existing work evaluates `servicing.enabled`, current resource/recipient authority and separate emergency quarantine; `partner_delivery` remains independent of buyer sales mode. Precedence for a new admission is emergency deny, authorization/security/state deny, applicable commercial parent/dependency deny, then allowed enablement. Publish reviewed immutable versions and recheck the authoritative commit boundary. Rollback creates a new version; it does not disable foundations or erase liabilities. Drafts may be read-only while committed work remains durably recoverable.

## 5. Stories, workflows and assisted paths

As an entitled actor, I need the child behaviors below with recoverable progress and accurate status. The `maintenance` application service validates the exact request, records local facts and outbox atomically, and queues external effects. Each child states its unique happy path and failure/manual path. Assisted processing creates an assigned case with source evidence and next action; it cannot assert a carrier or financial outcome without authority.

## 6. Routes, components and UI states

Authored route and field/action authority map:

- `/automotive/services` — Discover permitted providers/locations and book compatible maintenance service/slot; actor: authorized service customer; [authority specification](../../03-experience/screen-and-route-inventory.md).
- `/partner/service-orders` — Accept/fulfill own contracted booking; actor: supplier operator; [authority specification](../../03-experience/dashboards/carrier.md).
- `/ops/fulfillment` — Resolve cancellation, rebooking, commission and complaint handoff; actor: provider operations; [authority specification](../../03-experience/dashboards/operations.md).

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
| AUTO-05-R001 | `observation only` | `searchMaintenanceProviders`; List oil/service/car-wash/inspection/towing/battery/tire-repair providers with approved coverage area, compatibility, disclosed prices and availability freshness. |
| AUTO-05-R002 | `available>reserved` | `bookMaintenanceService`; Atomically reserve capacity, freeze accepted scope/price/address and cancellation terms, and confirm provider acceptance separately from platform payment. |
| AUTO-05-R003 | `confirmed>resolved` | `completeMaintenanceBooking`; Record provider/customer fulfillment evidence, apply the accepted cancellation/refund rule, vest commission only on qualifying completion and open a dispute hold for complaints. |

## 10. Concurrency, idempotency and versioning

Conflicting `ServiceBooking` writes use a bounded transaction and optimistic revision/row lock. `If-Match` is the quoted decimal `resourceVersion`; any `expectedVersion` input is an alias and must agree. Scope idempotency to operation, actor/context and canonical body digest: same body returns stored outcome; changed body returns 409. Unique external/source-event references prevent duplicate local effects. Balance/budget/inventory/approval invariants use transactional checks, never cached counters. Provider calls occur outside database locks after commit and retain one stable business key across retries.

## 11. API contracts and errors

Versioned child operations below return authorized read projections or `CommandReceipt`. Local committed/queued is never carrier issuance or payout confirmation. Lists use stable context/filter-bound cursors, default 25 and maximum 100 rows. Errors: 400 malformed input, 401 invalid identity/signature, 403 authority/availability denied, 404 missing/concealed resource, 409 revision/idempotency/conflict, 422 business validation, 429 admission limit with Retry-After, 503 dependency unavailable. Return stable safe code/message/correlation; raw provider text and private fields are forbidden.

| Operation | Method and path | Permission | Acceptance root |
|---|---|---|---|
| `searchMaintenanceProviders` | `GET /v1/maintenance/search-maintenance-providers` | `feature.AUTO-05.searchMaintenanceProviders` | `AC-AUTO-05-R001` |
| `bookMaintenanceService` | `POST /v1/maintenance/book-maintenance-service` | `feature.AUTO-05.bookMaintenanceService` | `AC-AUTO-05-R002` |
| `completeMaintenanceBooking` | `POST /v1/maintenance/complete-maintenance-booking` | `feature.AUTO-05.completeMaintenanceBooking` | `AC-AUTO-05-R003` |

## 12. Data ownership, indexes and lifecycle

`maintenance` owns `ServiceBooking` and its operation records. Other modules use application contracts/events. Persist context/relationship, revision, local stage, immutable source versions and UTC timestamps; do not duplicate another module's authoritative finance/policy state. Index authorized list predicates `(context_id,state,updated_at,id)`, relationship joins and unique operation/context/idempotency plus provider/external reference where applicable. Verify query plans against scoped synthetic data. Retain immutable decisions/reversals and export only a field-approved audited background projection with authorization rechecked at download. Production retention duration/basis is a qualified-review blocker; synthetic fixtures are safe until approved retention/legal-hold/erasure rules exist.

## 13. Integration and recipient projection

Each child names its external capability or a reason it has none. Discover support per provider/product/channel/version. Translate immutable canonical fields through a reviewed mapping; reject unknown enum/date/unit transforms. Approved egress, TLS/signature verification and secret references are required. Unsupported capability uses the child assisted path; never fabricate a provider result. Only necessary purpose-authorized fields leave the module/platform.

## 14. Events, jobs, retries and reconciliation

Child mutation events include opaque resource/context IDs, aggregate version, schema version, occurredAt, correlation/causation and authorized snapshot reference. No raw medical/bank/secret data is placed in metrics or ordinary logs. Insert outbox with local effect, publish at least once and atomically deduplicate inbox effects. Serialize conflicting work by `ServiceBooking`. Retry only classified transient outcomes with provider policy, bounded attempts and owned dead-letter queue. Unknown non-idempotent outcomes require authoritative status/evidence before replay. Read projections emit no domain mutation event.

## 15. Commercial and financial effects

Service price, fees, cancellation charge and platform commission are distinct; provider settlement follows verified fulfillment and dispute holds.

Money is integer-string amount plus currency/unit; conversion/rounding uses the approved transaction-time rule. Toman display does not change canonical rial accounting. A price/coverage change requires fresh acceptance. Synthetic amounts are test values, never approved premiums/fees/benefits.

## 16. Notifications, queues and service ownership

R20 owns decisions; R20 owns assigned customer/partner exceptions, R09 provider failures, R12 finance discrepancies and R11 privacy/security incidents. Workbenches show age, owner, next action and evidence. Notify using reviewed purpose-specific templates, verified contacts, consent/preferences and event/recipient deduplication. Response/escalation rules link to [operational SLOs](../../12-operations/sli-slo-alerts-and-oncall.md); uncontracted external SLAs remain blocked rather than invented.

## 17. Security, privacy and fraud

Providers see only assigned fulfillment data; customers need vehicle authority and location-sharing consent for mobile services.

Test object/property substitution with two users/two tenants, shared membership, context switch and revoked roles. Reauthorize queued privileged work and export/download use. Restrict partner recipients, verify callback replay protection, scan uploads, neutralize rendered provider text and exclude PII from high-cardinality telemetry. Financial and availability controls cannot weaken authorization.

## 18. Performance, caching and measurement

Use only [central budgets](../../_meta/performance-budgets.yaml): PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS. Child mapping below identifies its critical budget. Include authorization, validation, database commit/outbox in own-service timing; separately attribute external time. Bound pages and database queries, avoid N+1, move exports/provider work outside request transactions and enforce tenant/provider admission limits. Private results never enter shared public caches. Public catalog/content uses explicit versioned invalidation. Measure request/query latency, query count, event-loop/memory, queue age and provider outcome class with opaque correlations; no observed performance is claimed here.

## 19. Analytics and KPIs

Use `maintenance.operation_requested`, `.operation_completed` and `.operation_failed` with operation, coarse channel, result code and consented pseudonymous correlation. Measure eligible completion, denial, retry, abandonment and aged exceptions. Never export raw answers, identity numbers, medical evidence, bank details or raw resource IDs to marketing analytics. Financial metrics reconcile to ledger facts rather than browser clicks.

## 20. Accessibility, localization, calendar and mobile

Target WCAG 2.2 AA with keyboard/screen-reader review plus automated checks. Programmatic labels/error associations, focus management and non-color status are required. A01 proposes Persian-first RTL with English identifiers; bidi-isolate money/references and label units. UTC instants differ from contract-local effective dates and selected Jalali presentation. Provide upload/camera/notification alternatives when device permission is denied. Offline clients cannot establish fresh purchase/coverage/finance authority or cache sensitive responses.

## 21. Configuration, migration and rollout

Deploy compatible reads/schema before writes; backfill in bounded resumable tenant-scoped batches with source counts/digests. Begin with fictional local fixtures, then certified sandbox evidence, then explicitly approved live scope. Preserve historical form/rule/mapping versions for committed work. Rollback stops new admission and restores compatible code/configuration while draining or reconciling committed work; never delete audit/ledger history or blindly replay unknown external effects.

## 22. Child requirements and measurable acceptance

Each child specializes all shared sections above through its exact fields, rule, operation, workflow stage, failure and seven acceptance cases. These are test specifications, not executed application evidence. Shared controls remain normative through the [SRS](../software-requirements-specification.md); they do not replace feature-specific behavior.

### AUTO-05-R001 — Provider/location discovery and service catalog

**Rule `BR-AUTO-05-R001`:** List oil/service/car-wash/inspection/towing/battery/tire-repair providers with approved coverage area, compatibility, disclosed prices and availability freshness.

**Actor/resource boundary:** Providers see only assigned fulfillment data; customers need vehicle authority and location-sharing consent for mobile services. Require `feature.AUTO-05.searchMaintenanceProviders` and applicable context/relationship/property grants. The accountable decision owner is R20; R20 owns assigned exceptions.

**Local workflow stage:** `published>published`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Unverified providers remain unpublished; stale availability is checked before booking.

**Control:** `feature.AUTO-05.enabled`; evaluation `authorized_read`. Existing authorized resource reads ignore new-admission flags. Public discovery may apply visibility configuration; advertised new actions recheck their actual admission gates. No read flag grants resource/property authority.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `serviceKind` | `maintenanceKind`; {"type": "string", "enum": ["oil", "service", "car_wash", "inspection", "towing", "battery", "tire_repair"]}; Provider capability and location restrict availability. | required; no implicit default | `"oil"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.serviceKind.invalid` |
| `regionCode` | `code`; {"type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$"}; Code must also exist in the operation's versioned, authorized registry; regex validation alone is insufficient. | required; no implicit default | `"synthetic-code-v1"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.regionCode.invalid` |
| `vehicleId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.vehicleId.invalid` |
| `cursor` | `cursor`; {"type": "string", "minLength": 1, "maxLength": 512}; Opaque authenticated cursor bound to authorization context, filters and sort; not a raw database offset. | optional; conditional guard still applies; no implicit default | `"opaque-synthetic-cursor"` | internal; No implicit case/character rewriting; exact registered protocol or jurisdiction transform only; `validation.cursor.invalid` |

**API:** `GET /v1/maintenance/search-maintenance-providers`; operation ID `searchMaintenanceProviders`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Read projection allowlist:** `providerId:uuid`, `locationId:uuid`, `serviceKind:maintenanceKind`, `price:money`, `priceVersion:version`, `availabilityUpdatedAt:instant`, `accessibleContact:contact`. Reauthorize properties before serialization. Inapplicable facts in heterogeneous rows are omitted rather than replaced with zero. Private projections are not publicly cached.

**Integration boundary:** automotiveService. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `ServiceBooking` owned by `maintenance`; `N/A: read projection has no domain mutation event`. **Financial effects:** Service price, fees, cancellation charge and platform commission are distinct; provider settlement follows verified fulfillment and dispute holds. **Performance:** `PERF-READ` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-AUTO-05-R001-SUCCESS` | Given a synthetic authorized `ServiceBooking` and the declared valid inputs, when `searchMaintenanceProviders` executes, then List oil/service/car-wash/inspection/towing/battery/tire-repair providers with approved coverage area, compatibility, disclosed prices and availability freshness. Assert the exact local effect/projection and source/version references. |
| `AC-AUTO-05-R001-FAILURE` | Given missing or invalid `serviceKind` or the operation-specific invalid condition, when `searchMaintenanceProviders` executes, then reject malformed/domain-invalid input without partial mutation. Unverified providers remain unpublished; stale availability is checked before booking. |
| `AC-AUTO-05-R001-DENIAL` | Given person A in tenant A and a `ServiceBooking` belonging only to person B/tenant B, when A substitutes B's reference in `searchMaintenanceProviders`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-AUTO-05-R001-DISABLE` | Given new-admission flags are off, when `searchMaintenanceProviders` handles an already authorized resource or committed obligation, then apply servicing.enabled/current relationship/recipient authority/quarantine, not the new-admission flag. Preserve downloads, claims, receipts and reconciliation as applicable; deny only actual authority/state/security violations. |
| `AC-AUTO-05-R001-RACE` | Given `searchMaintenanceProviders` is reading while an authorized mutation updates `ServiceBooking`, when the response is built, then return a consistent projection/snapshot and asOf value, with no torn money/coverage facts or unauthorized new fields. Pagination remains bound to its filters/context. GET creates no domain mutation or idempotency reservation. |
| `AC-AUTO-05-R001-RECOVERY` | Given the `ServiceBooking` projection is rebuilding or temporarily unavailable, when `searchMaintenanceProviders` resumes, then reauthorize current context and return recovered data with freshness, or explicit partial/unavailable status; never reuse another subject's cached projection. |
| `AC-AUTO-05-R001-PROVIDER` | Given `automotiveService` is unavailable, throttled or returns malformed/ambiguous data, when this action dispatches, then preserve durable intent, classify the outcome and use the stated fallback: Unverified providers remain unpublished; stale availability is checked before booking. Non-idempotent unknown effects are not blindly resent. |

**Test IDs:** `T-AUTO-05-R001-UNIT`, `T-AUTO-05-R001-PROPERTY`, `T-AUTO-05-R001-INTEGRATION`, `T-AUTO-05-R001-CONTRACT`, `T-AUTO-05-R001-E2E`, `T-AUTO-05-R001-SECURITY`, `T-AUTO-05-R001-PERF`. Fixtures include valid inputs above, invalid `serviceKind`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Unverified providers remain unpublished; stale availability is checked before booking. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### AUTO-05-R002 — Availability, price and booking

**Rule `BR-AUTO-05-R002`:** Atomically reserve capacity, freeze accepted scope/price/address and cancellation terms, and confirm provider acceptance separately from platform payment.

**Actor/resource boundary:** Providers see only assigned fulfillment data; customers need vehicle authority and location-sharing consent for mobile services. Require `feature.AUTO-05.bookMaintenanceService` and applicable context/relationship/property grants. The accountable decision owner is R20; R20 owns assigned exceptions.

**Local workflow stage:** `available>reserved`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** A slot conflict offers alternatives; timeout-after-booking reconciles before another booking or charge.

**Control:** `feature.AUTO-05.enabled`; evaluation `new_admission_only`. Feature enablement gates only fresh sale/new optional enrollment/admission. Never reapply it to verified callbacks, already committed work, reconciliation or contracted servicing; those use servicing.enabled, current authority and quarantine.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `providerId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.providerId.invalid` |
| `slotId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.slotId.invalid` |
| `vehicleId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.vehicleId.invalid` |
| `priceVersion` | `version`; {"type": "integer", "minimum": 1, "maximum": 2147483647} | required; no implicit default | `1` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.priceVersion.invalid` |

**API:** `POST /v1/maintenance/book-maintenance-service`; operation ID `bookMaintenanceService`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=bookMaintenanceService` and a closed typed result: `bookingId:uuid`, `providerId:uuid`, `slotId:uuid`, `bookingStatus:code`, `acceptedPrice:money`. Exact conditional variants are in `FBookMaintenanceServiceCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** automotiveService. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `ServiceBooking` owned by `maintenance`; `maintenance.book-maintenance-service.recorded.v1`. **Financial effects:** Service price, fees, cancellation charge and platform commission are distinct; provider settlement follows verified fulfillment and dispute holds. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-AUTO-05-R002-SUCCESS` | Given a synthetic authorized `ServiceBooking` and the declared valid inputs, when `bookMaintenanceService` executes, then Atomically reserve capacity, freeze accepted scope/price/address and cancellation terms, and confirm provider acceptance separately from platform payment. Assert the exact local effect/projection and source/version references. |
| `AC-AUTO-05-R002-FAILURE` | Given missing or invalid `providerId` or the operation-specific invalid condition, when `bookMaintenanceService` executes, then reject malformed/domain-invalid input without partial mutation. A slot conflict offers alternatives; timeout-after-booking reconciles before another booking or charge. |
| `AC-AUTO-05-R002-DENIAL` | Given person A in tenant A and a `ServiceBooking` belonging only to person B/tenant B, when A substitutes B's reference in `bookMaintenanceService`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-AUTO-05-R002-DISABLE` | Given the applicable `feature.AUTO-05.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-AUTO-05-R002-RACE` | Given two concurrent `bookMaintenanceService` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-AUTO-05-R002-RECOVERY` | Given a process crash after the local `ServiceBooking` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-AUTO-05-R002-PROVIDER` | Given `automotiveService` is unavailable, throttled or returns malformed/ambiguous data, when this action dispatches, then preserve durable intent, classify the outcome and use the stated fallback: A slot conflict offers alternatives; timeout-after-booking reconciles before another booking or charge. Non-idempotent unknown effects are not blindly resent. |

**Test IDs:** `T-AUTO-05-R002-UNIT`, `T-AUTO-05-R002-PROPERTY`, `T-AUTO-05-R002-INTEGRATION`, `T-AUTO-05-R002-CONTRACT`, `T-AUTO-05-R002-E2E`, `T-AUTO-05-R002-SECURITY`, `T-AUTO-05-R002-PERF`. Fixtures include valid inputs above, invalid `providerId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** A slot conflict offers alternatives; timeout-after-booking reconciles before another booking or charge. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### AUTO-05-R003 — Cancellation, fulfillment, commissions and complaints

**Rule `BR-AUTO-05-R003`:** Record provider/customer fulfillment evidence, apply the accepted cancellation/refund rule, vest commission only on qualifying completion and open a dispute hold for complaints.

**Actor/resource boundary:** Providers see only assigned fulfillment data; customers need vehicle authority and location-sharing consent for mobile services. Require `feature.AUTO-05.completeMaintenanceBooking` and applicable context/relationship/property grants. The accountable decision owner is R20; R20 owns assigned exceptions.

**Local workflow stage:** `confirmed>resolved`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Provider no-show or ambiguous completion stays reviewable; support cannot mark complete merely to release settlement.

**Control:** `feature.AUTO-05.enabled`; evaluation `new_admission_only`. Feature enablement gates only fresh sale/new optional enrollment/admission. Never reapply it to verified callbacks, already committed work, reconciliation or contracted servicing; those use servicing.enabled, current authority and quarantine.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `bookingId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.bookingId.invalid` |
| `outcome` | `bookingOutcome`; {"type": "string", "enum": ["completed", "customer_cancelled", "provider_cancelled", "no_show", "disputed"]}; Financial consequences depend on accepted terms, not this enum alone. | required; no implicit default | `"completed"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.outcome.invalid` |
| `evidenceIds` | `uuidSet`; {"type": "array", "minItems": 0, "maxItems": 100, "uniqueItems": true} | required; no implicit default | `[]` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.evidenceIds.invalid` |
| `reason` | `text`; {"type": "string", "minLength": 1, "maxLength": 200} | required; no implicit default | `"Synthetic review reason"` | internal; Unicode NFC; trim outer whitespace; reject control characters except permitted line breaks; `validation.reason.invalid` |

**API:** `POST /v1/maintenance/complete-maintenance-booking`; operation ID `completeMaintenanceBooking`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=completeMaintenanceBooking` and a closed typed result: `resourceId:uuid`, `resourceVersion:version`, `localWorkflowStage:code`, `decisionRecordId:uuid`, `recordedAt:instant`. Exact conditional variants are in `FCompleteMaintenanceBookingCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** automotiveService. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `ServiceBooking` owned by `maintenance`; `maintenance.complete-maintenance-booking.recorded.v1`. **Financial effects:** Service price, fees, cancellation charge and platform commission are distinct; provider settlement follows verified fulfillment and dispute holds. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-AUTO-05-R003-SUCCESS` | Given a synthetic authorized `ServiceBooking` and the declared valid inputs, when `completeMaintenanceBooking` executes, then Record provider/customer fulfillment evidence, apply the accepted cancellation/refund rule, vest commission only on qualifying completion and open a dispute hold for complaints. Assert the exact local effect/projection and source/version references. |
| `AC-AUTO-05-R003-FAILURE` | Given missing or invalid `bookingId` or the operation-specific invalid condition, when `completeMaintenanceBooking` executes, then reject malformed/domain-invalid input without partial mutation. Provider no-show or ambiguous completion stays reviewable; support cannot mark complete merely to release settlement. |
| `AC-AUTO-05-R003-DENIAL` | Given person A in tenant A and a `ServiceBooking` belonging only to person B/tenant B, when A substitutes B's reference in `completeMaintenanceBooking`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-AUTO-05-R003-DISABLE` | Given the applicable `feature.AUTO-05.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-AUTO-05-R003-RACE` | Given two concurrent `completeMaintenanceBooking` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-AUTO-05-R003-RECOVERY` | Given a process crash after the local `ServiceBooking` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-AUTO-05-R003-PROVIDER` | Given `automotiveService` is unavailable, throttled or returns malformed/ambiguous data, when this action dispatches, then preserve durable intent, classify the outcome and use the stated fallback: Provider no-show or ambiguous completion stays reviewable; support cannot mark complete merely to release settlement. Non-idempotent unknown effects are not blindly resent. |

**Test IDs:** `T-AUTO-05-R003-UNIT`, `T-AUTO-05-R003-PROPERTY`, `T-AUTO-05-R003-INTEGRATION`, `T-AUTO-05-R003-CONTRACT`, `T-AUTO-05-R003-E2E`, `T-AUTO-05-R003-SECURITY`, `T-AUTO-05-R003-PERF`. Fixtures include valid inputs above, invalid `bookingId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Provider no-show or ambiguous completion stays reviewable; support cannot mark complete merely to release settlement. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

## 23. Test suites and synthetic fixtures

Per-child UNIT tests field/state guards; PROPERTY permutes duplicates and ordering while preserving invariants; INTEGRATION verifies transaction/outbox and authorization; CONTRACT validates declared adapter/schema behavior; E2E exercises actual screen states; SECURITY checks object/property/context boundaries; PERF runs the referenced workload. No-provider children explain contract-test inapplicability while retaining internal API checks. Fixtures never include real people/credentials. A renderer or structural schema pass is not semantic feature completeness.

## 24. Runbook, dependencies, blockers and done

For a stuck `ServiceBooking`, inspect the authorized event/status sequence and assigned queue, classify local validation/auth/configuration/provider/finance cause, preserve evidence, assign the accountable role, reconcile before replay and communicate safe pending/next-step status. Close only on verified outcome and audit; no direct status edits to clear alerts. Dependencies include identity/context, relationship grants, versioned product/configuration, durable database/outbox, declared partner capability, finance for value effects and consented messaging. [Blockers](../../_meta/risks-and-blockers.yaml) record missing authority/contracts/retention and owners. Done requires human role reviews, all acceptance categories, risk-based suite evidence, tenant/cache tests, measured budgets and recovery drills. Application implementation, deployment and live certification are outside this documentation claim.
