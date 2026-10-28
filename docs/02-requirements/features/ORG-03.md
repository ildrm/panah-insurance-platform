---
{
  "id": "SPEC-ORG-03",
  "title": "Corporate approvals and billing",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R12",
  "reviewer_roles": [
    "R03",
    "R11",
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-03"
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
# ORG-03 — Corporate approvals and billing

## 1. Identity, objective and scope

Owner R12; explicit user scope [S00], not proof of provider availability. Objective and retained baseline: Requester/approver/payer/policyholder separation, maker-checker, delegated limits, budgets, invoices, credit/prepay terms and purchase approvals.

This draft is proposed for human review. No live integration, legal approval, commercial rate or measured implementation result is asserted. Synthetic examples are not production rules. Adjacent capabilities stay in scope even when rollout is off.

## 2. Actors and commercial relationships

Channels: corporate, commercial, reseller, b2b2c. Field/action authority is specialized by the dashboard specifications: [corporate](../../03-experience/dashboards/corporate.md), [beneficiary](../../03-experience/dashboards/beneficiary.md), [seller](../../03-experience/dashboards/seller.md), [platform_admin](../../03-experience/dashboards/admin.md), [staff](../../03-experience/dashboards/operations.md). Buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier are separately assigned roles. Requester, approver, payer and policyholder are distinct roles; makers cannot check their own sensitive request and delegated limits are resource/currency-specific.

## 3. Preconditions, entitlements and permission

Private calls require an authenticated active context, `feature.ORG-03.read` or `.write` and the child operation grant, then resource/relationship/property and state checks. Requester, approver, payer and policyholder are distinct roles; makers cannot check their own sensitive request and delegated limits are resource/currency-specific.

Browser sessions use HttpOnly reference cookies and mutating requests require CSRF token plus Origin validation. Scoped bearer tokens serve authorized API/service clients; they cannot substitute for resource authority. Explicit anonymous discovery/auth operations remain allowlisted and rate-limited. Verified provider callbacks and internal services have distinct audiences. Privileged decisions require step-up and independent checker where the child guard specifies; switching roles cannot make a maker their own checker.

## 4. Feature controls and disablement

Child keys are boolean with effective-time and global/product/plan/carrier/organization/region/channel/customer scope. This feature's enablement is admission-only and defaults off for fresh capability/sale/optional enrollment until evidence exists. Provider live access always requires approved contract authority. New-admission flags NEVER govern provider verification callbacks, already committed delivery, reconciliation or contracted policy/claim/payment servicing. Existing work evaluates `servicing.enabled`, current resource/recipient authority and separate emergency quarantine; `partner_delivery` remains independent of buyer sales mode. Precedence for a new admission is emergency deny, authorization/security/state deny, applicable commercial parent/dependency deny, then allowed enablement. Publish reviewed immutable versions and recheck the authoritative commit boundary. Rollback creates a new version; it does not disable foundations or erase liabilities. Drafts may be read-only while committed work remains durably recoverable.

## 5. Stories, workflows and assisted paths

As an entitled actor, I need the child behaviors below with recoverable progress and accurate status. The `corporate-finance` application service validates the exact request, records local facts and outbox atomically, and queues external effects. Each child states its unique happy path and failure/manual path. Assisted processing creates an assigned case with source evidence and next action; it cannot assert a carrier or financial outcome without authority.

## 6. Routes, components and UI states

Authored route and field/action authority map:

- `/org/:orgId/approvals` — Separate request/check/commit with exact version, limits and budgets; actor: requester; approver/checker; [authority specification](../../03-experience/dashboards/corporate.md).
- `/org/:orgId/billing` — Review invoices, approved credit/prepay and allocations; actor: finance payer; [authority specification](../../03-experience/dashboards/corporate.md).
- `/ops/refunds-settlements` — Handle authorized finance exceptions with segregation of duties; actor: finance maker/checker; [authority specification](../../03-experience/dashboards/operations.md).

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
| ORG-03-R001 | `absent>pending` | `requestCorporatePurchaseApproval`; Freeze proposal/risk/amount versions, resolve required independent approvers and display exact liability/policyholder relationships before review. |
| ORG-03-R002 | `pending>approved` | `approveCorporateBudget`; Atomically enforce currency-specific approval authority and remaining budget across concurrent requests, record decision/step-up evidence and reserve funds or credit capacity. |
| ORG-03-R003 | `approved>committed` | `commitCorporateInvoiceCredit`; Revalidate approved invoice/credit agreement and available limit or verified prepayment; atomically commit order snapshot, liability allocation and purchase.committed outbox with commitmentKind approved_credit/approved_invoice for approved receivables or verified_payment for verified prepayment. |

## 10. Concurrency, idempotency and versioning

Conflicting `PurchaseApproval` writes use a bounded transaction and optimistic revision/row lock. `If-Match` is the quoted decimal `resourceVersion`; any `expectedVersion` input is an alias and must agree. Scope idempotency to operation, actor/context and canonical body digest: same body returns stored outcome; changed body returns 409. Unique external/source-event references prevent duplicate local effects. Balance/budget/inventory/approval invariants use transactional checks, never cached counters. Provider calls occur outside database locks after commit and retain one stable business key across retries.

## 11. API contracts and errors

Versioned child operations below return authorized read projections or `CommandReceipt`. Local committed/queued is never carrier issuance or payout confirmation. Lists use stable context/filter-bound cursors, default 25 and maximum 100 rows. Errors: 400 malformed input, 401 invalid identity/signature, 403 authority/availability denied, 404 missing/concealed resource, 409 revision/idempotency/conflict, 422 business validation, 429 admission limit with Retry-After, 503 dependency unavailable. Return stable safe code/message/correlation; raw provider text and private fields are forbidden.

| Operation | Method and path | Permission | Acceptance root |
|---|---|---|---|
| `requestCorporatePurchaseApproval` | `POST /v1/corporate-finance/request-corporate-purchase-approval` | `feature.ORG-03.requestCorporatePurchaseApproval` | `AC-ORG-03-R001` |
| `approveCorporateBudget` | `POST /v1/corporate-finance/approve-corporate-budget` | `feature.ORG-03.approveCorporateBudget` | `AC-ORG-03-R002` |
| `commitCorporateInvoiceCredit` | `POST /v1/corporate-finance/commit-corporate-invoice-credit` | `feature.ORG-03.commitCorporateInvoiceCredit` | `AC-ORG-03-R003` |

## 12. Data ownership, indexes and lifecycle

`corporate-finance` owns `PurchaseApproval` and its operation records. Other modules use application contracts/events. Persist context/relationship, revision, local stage, immutable source versions and UTC timestamps; do not duplicate another module's authoritative finance/policy state. Index authorized list predicates `(context_id,state,updated_at,id)`, relationship joins and unique operation/context/idempotency plus provider/external reference where applicable. Verify query plans against scoped synthetic data. Retain immutable decisions/reversals and export only a field-approved audited background projection with authorization rechecked at download. Production retention duration/basis is a qualified-review blocker; synthetic fixtures are safe until approved retention/legal-hold/erasure rules exist.

## 13. Integration and recipient projection

Each child names its external capability or a reason it has none. Discover support per provider/product/channel/version. Translate immutable canonical fields through a reviewed mapping; reject unknown enum/date/unit transforms. Approved egress, TLS/signature verification and secret references are required. Unsupported capability uses the child assisted path; never fabricate a provider result. Only necessary purpose-authorized fields leave the module/platform.

## 14. Events, jobs, retries and reconciliation

Child mutation events include opaque resource/context IDs, aggregate version, schema version, occurredAt, correlation/causation and authorized snapshot reference. No raw medical/bank/secret data is placed in metrics or ordinary logs. Insert outbox with local effect, publish at least once and atomically deduplicate inbox effects. Serialize conflicting work by `PurchaseApproval`. Retry only classified transient outcomes with provider policy, bounded attempts and owned dead-letter queue. Unknown non-idempotent outcomes require authoritative status/evidence before replay. Read projections emit no domain mutation event.

## 15. Commercial and financial effects

Approved invoice/credit commitment records receivable/liability obligations without claiming cash receipt; prepay requires verified available funds.

Money is integer-string amount plus currency/unit; conversion/rounding uses the approved transaction-time rule. Toman display does not change canonical rial accounting. A price/coverage change requires fresh acceptance. Synthetic amounts are test values, never approved premiums/fees/benefits.

## 16. Notifications, queues and service ownership

R12 owns decisions; R20 owns assigned customer/partner exceptions, R09 provider failures, R12 finance discrepancies and R11 privacy/security incidents. Workbenches show age, owner, next action and evidence. Notify using reviewed purpose-specific templates, verified contacts, consent/preferences and event/recipient deduplication. Response/escalation rules link to [operational SLOs](../../12-operations/sli-slo-alerts-and-oncall.md); uncontracted external SLAs remain blocked rather than invented.

## 17. Security, privacy and fraud

Requester, approver, payer and policyholder are distinct roles; makers cannot check their own sensitive request and delegated limits are resource/currency-specific.

Test object/property substitution with two users/two tenants, shared membership, context switch and revoked roles. Reauthorize queued privileged work and export/download use. Restrict partner recipients, verify callback replay protection, scan uploads, neutralize rendered provider text and exclude PII from high-cardinality telemetry. Financial and availability controls cannot weaken authorization.

## 18. Performance, caching and measurement

Use only [central budgets](../../_meta/performance-budgets.yaml): PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS. Child mapping below identifies its critical budget. Include authorization, validation, database commit/outbox in own-service timing; separately attribute external time. Bound pages and database queries, avoid N+1, move exports/provider work outside request transactions and enforce tenant/provider admission limits. Private results never enter shared public caches. Public catalog/content uses explicit versioned invalidation. Measure request/query latency, query count, event-loop/memory, queue age and provider outcome class with opaque correlations; no observed performance is claimed here.

## 19. Analytics and KPIs

Use `corporate-finance.operation_requested`, `.operation_completed` and `.operation_failed` with operation, coarse channel, result code and consented pseudonymous correlation. Measure eligible completion, denial, retry, abandonment and aged exceptions. Never export raw answers, identity numbers, medical evidence, bank details or raw resource IDs to marketing analytics. Financial metrics reconcile to ledger facts rather than browser clicks.

## 20. Accessibility, localization, calendar and mobile

Target WCAG 2.2 AA with keyboard/screen-reader review plus automated checks. Programmatic labels/error associations, focus management and non-color status are required. A01 proposes Persian-first RTL with English identifiers; bidi-isolate money/references and label units. UTC instants differ from contract-local effective dates and selected Jalali presentation. Provide upload/camera/notification alternatives when device permission is denied. Offline clients cannot establish fresh purchase/coverage/finance authority or cache sensitive responses.

## 21. Configuration, migration and rollout

Deploy compatible reads/schema before writes; backfill in bounded resumable tenant-scoped batches with source counts/digests. Begin with fictional local fixtures, then certified sandbox evidence, then explicitly approved live scope. Preserve historical form/rule/mapping versions for committed work. Rollback stops new admission and restores compatible code/configuration while draining or reconciling committed work; never delete audit/ledger history or blindly replay unknown external effects.

## 22. Child requirements and measurable acceptance

Each child specializes all shared sections above through its exact fields, rule, operation, workflow stage, failure and seven acceptance cases. These are test specifications, not executed application evidence. Shared controls remain normative through the [SRS](../software-requirements-specification.md); they do not replace feature-specific behavior.

### ORG-03-R001 — Requester/approver/payer/policyholder separation

**Rule `BR-ORG-03-R001`:** Freeze proposal/risk/amount versions, resolve required independent approvers and display exact liability/policyholder relationships before review.

**Actor/resource boundary:** Requester, approver, payer and policyholder are distinct roles; makers cannot check their own sensitive request and delegated limits are resource/currency-specific. Require `feature.ORG-03.requestCorporatePurchaseApproval` and applicable context/relationship/property grants. The accountable decision owner is R12; R20 owns assigned exceptions.

**Local workflow stage:** `absent>pending`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** A changed quote or member census invalidates approval; self-approval fails even if the requester holds another role.

**Control:** `feature.ORG-03.enabled`; evaluation `new_admission_only`. Feature enablement gates only fresh sale/new optional enrollment/admission. Never reapply it to verified callbacks, already committed work, reconciliation or contracted servicing; those use servicing.enabled, current authority and quarantine.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `proposalId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.proposalId.invalid` |
| `partyRoles` | `partyRoles`; {"type": "array", "minItems": 1, "maxItems": 100}; Required role cardinalities and authority are validated against the product/channel contract; subject identity alone grants no authority. | required; no implicit default | `[{"partyId": "00000000-0000-4000-8000-000000000001", "partyType": "person", "role": "buyer", "authorityEvidenceId": "00000000-0000-4000-8000-000000000001"}]` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.partyRoles.invalid` |
| `costCenterId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.costCenterId.invalid` |
| `amount` | `positiveMoney`; Money: signed integer amount string (up to 24 digits), ISO currency code, explicit minor/rial unit; positivity and refundable/available bounds are operation-specific domain rules; Exact positive amount in explicit currency/unit; available balance/limit and approved contract bounds still apply. | required; no implicit default | `{"amount": "1000000", "currency": "IRR", "unit": "rial"}` | financial; Integer amount string, explicit currency/unit; reject floats and unlabeled toman; `validation.amount.invalid` |

**API:** `POST /v1/corporate-finance/request-corporate-purchase-approval`; operation ID `requestCorporatePurchaseApproval`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=requestCorporatePurchaseApproval` and a closed typed result: `resourceId:uuid`, `resourceVersion:version`, `localWorkflowStage:code`, `decisionRecordId:uuid`, `recordedAt:instant`. Exact conditional variants are in `FRequestCorporatePurchaseApprovalCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `PurchaseApproval` owned by `corporate-finance`; `corporate-finance.request-corporate-purchase-approval.recorded.v1`. **Financial effects:** Approved invoice/credit commitment records receivable/liability obligations without claiming cash receipt; prepay requires verified available funds. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-ORG-03-R001-SUCCESS` | Given a synthetic authorized `PurchaseApproval` and the declared valid inputs, when `requestCorporatePurchaseApproval` executes, then Freeze proposal/risk/amount versions, resolve required independent approvers and display exact liability/policyholder relationships before review. Assert the exact local effect/projection and source/version references. |
| `AC-ORG-03-R001-FAILURE` | Given missing or invalid `proposalId` or the operation-specific invalid condition, when `requestCorporatePurchaseApproval` executes, then reject malformed/domain-invalid input without partial mutation. A changed quote or member census invalidates approval; self-approval fails even if the requester holds another role. |
| `AC-ORG-03-R001-DENIAL` | Given person A in tenant A and a `PurchaseApproval` belonging only to person B/tenant B, when A substitutes B's reference in `requestCorporatePurchaseApproval`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-ORG-03-R001-DISABLE` | Given the applicable `feature.ORG-03.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-ORG-03-R001-RACE` | Given two concurrent `requestCorporatePurchaseApproval` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-ORG-03-R001-RECOVERY` | Given a process crash after the local `PurchaseApproval` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-ORG-03-R001-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-ORG-03-R001-UNIT`, `T-ORG-03-R001-PROPERTY`, `T-ORG-03-R001-INTEGRATION`, `T-ORG-03-R001-CONTRACT`, `T-ORG-03-R001-E2E`, `T-ORG-03-R001-SECURITY`, `T-ORG-03-R001-PERF`. Fixtures include valid inputs above, invalid `proposalId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** A changed quote or member census invalidates approval; self-approval fails even if the requester holds another role. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### ORG-03-R002 — Maker-checker, delegated limits and budgets

**Rule `BR-ORG-03-R002`:** Atomically enforce currency-specific approval authority and remaining budget across concurrent requests, record decision/step-up evidence and reserve funds or credit capacity.

**Actor/resource boundary:** Requester, approver, payer and policyholder are distinct roles; makers cannot check their own sensitive request and delegated limits are resource/currency-specific. Require `feature.ORG-03.approveCorporateBudget` and applicable context/relationship/property grants. The accountable decision owner is R12; R20 owns assigned exceptions.

**Local workflow stage:** `pending>approved`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Two approvals cannot exceed the remaining budget/credit line; stale delegations and conflicting revisions are denied.

**Control:** `feature.ORG-03.enabled`; evaluation `new_admission_only`. Feature enablement gates only fresh sale/new optional enrollment/admission. Never reapply it to verified callbacks, already committed work, reconciliation or contracted servicing; those use servicing.enabled, current authority and quarantine.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `approvalId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.approvalId.invalid` |
| `decision` | `decision`; {"type": "string", "enum": ["approve", "reject", "request_evidence"]}; Not all decisions are allowed in every state; actor and transition guard are mandatory. | required; no implicit default | `"approve"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.decision.invalid` |
| `reason` | `text`; {"type": "string", "minLength": 1, "maxLength": 200} | required; no implicit default | `"Synthetic review reason"` | internal; Unicode NFC; trim outer whitespace; reject control characters except permitted line breaks; `validation.reason.invalid` |
| `delegationId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.delegationId.invalid` |

**API:** `POST /v1/corporate-finance/approve-corporate-budget`; operation ID `approveCorporateBudget`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=approveCorporateBudget` and a closed typed result: `approvalId:uuid`, `reservedBudgetId:uuid`, `approvedAmount:money`, `validUntil:instant`. Exact conditional variants are in `FApproveCorporateBudgetCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `PurchaseApproval` owned by `corporate-finance`; `corporate-finance.approve-corporate-budget.recorded.v1`. **Financial effects:** Approved invoice/credit commitment records receivable/liability obligations without claiming cash receipt; prepay requires verified available funds. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-ORG-03-R002-SUCCESS` | Given a synthetic authorized `PurchaseApproval` and the declared valid inputs, when `approveCorporateBudget` executes, then Atomically enforce currency-specific approval authority and remaining budget across concurrent requests, record decision/step-up evidence and reserve funds or credit capacity. Assert the exact local effect/projection and source/version references. |
| `AC-ORG-03-R002-FAILURE` | Given missing or invalid `approvalId` or the operation-specific invalid condition, when `approveCorporateBudget` executes, then reject malformed/domain-invalid input without partial mutation. Two approvals cannot exceed the remaining budget/credit line; stale delegations and conflicting revisions are denied. |
| `AC-ORG-03-R002-DENIAL` | Given person A in tenant A and a `PurchaseApproval` belonging only to person B/tenant B, when A substitutes B's reference in `approveCorporateBudget`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-ORG-03-R002-DISABLE` | Given the applicable `feature.ORG-03.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-ORG-03-R002-RACE` | Given two concurrent `approveCorporateBudget` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-ORG-03-R002-RECOVERY` | Given a process crash after the local `PurchaseApproval` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-ORG-03-R002-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-ORG-03-R002-UNIT`, `T-ORG-03-R002-PROPERTY`, `T-ORG-03-R002-INTEGRATION`, `T-ORG-03-R002-CONTRACT`, `T-ORG-03-R002-E2E`, `T-ORG-03-R002-SECURITY`, `T-ORG-03-R002-PERF`. Fixtures include valid inputs above, invalid `approvalId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Two approvals cannot exceed the remaining budget/credit line; stale delegations and conflicting revisions are denied. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### ORG-03-R003 — Invoices, credit/prepay terms and commercial commitment

**Rule `BR-ORG-03-R003`:** Revalidate approved invoice/credit agreement and available limit or verified prepayment; atomically commit order snapshot, liability allocation and purchase.committed outbox with commitmentKind approved_credit/approved_invoice for approved receivables or verified_payment for verified prepayment.

**Actor/resource boundary:** Requester, approver, payer and policyholder are distinct roles; makers cannot check their own sensitive request and delegated limits are resource/currency-specific. Require `feature.ORG-03.commitCorporateInvoiceCredit` and applicable context/relationship/property grants. The accountable decision owner is R12; R20 owns assigned exceptions.

**Local workflow stage:** `approved>committed`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** No invoice/credit authority means disabled commitment; never emit payment.verified for a receivable or merely approved invoice.

**Control:** `feature.ORG-03.enabled`; evaluation `authoritative_commit_boundary`. Recheck current admission/permission/state under the canonical commitment transaction. Verification of received funds is never blocked. Only the expressly documented valid pre-disable reservation exception can finish its original accepted terms; otherwise verified-but-uncommitted money enters refund/review.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `approvalId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.approvalId.invalid` |
| `billingMode` | `billingMode`; {"type": "string", "enum": ["invoice_credit", "prepaid"]}; invoice_credit is not verified cash receipt. | required; no implicit default | `"invoice_credit"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.billingMode.invalid` |
| `termsVersion` | `version`; {"type": "integer", "minimum": 1, "maximum": 2147483647} | required; no implicit default | `1` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.termsVersion.invalid` |
| `orderId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.orderId.invalid` |

**API:** `POST /v1/corporate-finance/commit-corporate-invoice-credit`; operation ID `commitCorporateInvoiceCredit`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=commitCorporateInvoiceCredit` and a closed typed result: `orderId:uuid`, `commitmentId:uuid`, `commitmentKind:code`, `committedAt:instant`. Exact conditional variants are in `FCommitCorporateInvoiceCreditCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `PurchaseApproval` owned by `corporate-finance`; `corporate-finance.commit-corporate-invoice-credit.recorded.v1`. **Financial effects:** Approved invoice/credit commitment records receivable/liability obligations without claiming cash receipt; prepay requires verified available funds. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-ORG-03-R003-SUCCESS` | Given a synthetic authorized `PurchaseApproval` and the declared valid inputs, when `commitCorporateInvoiceCredit` executes, then Revalidate approved invoice/credit agreement and available limit or verified prepayment; atomically commit order snapshot, liability allocation and purchase.committed outbox with commitmentKind approved_credit/approved_invoice for approved receivables or verified_payment for verified prepayment. Assert the exact local effect/projection and source/version references. |
| `AC-ORG-03-R003-FAILURE` | Given missing or invalid `approvalId` or the operation-specific invalid condition, when `commitCorporateInvoiceCredit` executes, then reject malformed/domain-invalid input without partial mutation. No invoice/credit authority means disabled commitment; never emit payment.verified for a receivable or merely approved invoice. |
| `AC-ORG-03-R003-DENIAL` | Given person A in tenant A and a `PurchaseApproval` belonging only to person B/tenant B, when A substitutes B's reference in `commitCorporateInvoiceCredit`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-ORG-03-R003-DISABLE` | Given the applicable `feature.ORG-03.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-ORG-03-R003-RACE` | Given two concurrent `commitCorporateInvoiceCredit` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-ORG-03-R003-RECOVERY` | Given a process crash after the local `PurchaseApproval` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-ORG-03-R003-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-ORG-03-R003-UNIT`, `T-ORG-03-R003-PROPERTY`, `T-ORG-03-R003-INTEGRATION`, `T-ORG-03-R003-CONTRACT`, `T-ORG-03-R003-E2E`, `T-ORG-03-R003-SECURITY`, `T-ORG-03-R003-PERF`. Fixtures include valid inputs above, invalid `approvalId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** No invoice/credit authority means disabled commitment; never emit payment.verified for a receivable or merely approved invoice. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

## 23. Test suites and synthetic fixtures

Per-child UNIT tests field/state guards; PROPERTY permutes duplicates and ordering while preserving invariants; INTEGRATION verifies transaction/outbox and authorization; CONTRACT validates declared adapter/schema behavior; E2E exercises actual screen states; SECURITY checks object/property/context boundaries; PERF runs the referenced workload. No-provider children explain contract-test inapplicability while retaining internal API checks. Fixtures never include real people/credentials. A renderer or structural schema pass is not semantic feature completeness.

## 24. Runbook, dependencies, blockers and done

For a stuck `PurchaseApproval`, inspect the authorized event/status sequence and assigned queue, classify local validation/auth/configuration/provider/finance cause, preserve evidence, assign the accountable role, reconcile before replay and communicate safe pending/next-step status. Close only on verified outcome and audit; no direct status edits to clear alerts. Dependencies include identity/context, relationship grants, versioned product/configuration, durable database/outbox, declared partner capability, finance for value effects and consented messaging. [Blockers](../../_meta/risks-and-blockers.yaml) record missing authority/contracts/retention and owners. Done requires human role reviews, all acceptance categories, risk-based suite evidence, tenant/cache tests, measured budgets and recovery drills. Application implementation, deployment and live certification are outside this documentation claim.
