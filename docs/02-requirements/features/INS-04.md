---
{
  "id": "SPEC-INS-04",
  "title": "Official insurance inquiries",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R02",
  "reviewer_roles": [
    "R03",
    "R11",
    "R13",
    "R17"
  ],
  "scope_ids": [
    "INS-04"
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
# INS-04 — Official insurance inquiries

## 1. Identity, objective and scope

Owner R02; explicit user scope [S00], not proof of provider availability. Objective and retained baseline: Permitted plate/owner and policy-history inquiries, no-claim records, provenance, freshness, eligibility, failure handling and manual correction.

This draft is proposed for human review. No live integration, legal approval, commercial rate or measured implementation result is asserted. Synthetic examples are not production rules. Adjacent capabilities stay in scope even when rollout is off.

## 2. Actors and commercial relationships

Channels: b2c, corporate, commercial, reseller, b2b2c. Field/action authority is specialized by the dashboard specifications: [customer](../../03-experience/dashboards/customer.md), [corporate](../../03-experience/dashboards/corporate.md), [beneficiary](../../03-experience/dashboards/beneficiary.md), [seller](../../03-experience/dashboards/seller.md), [carrier](../../03-experience/dashboards/carrier.md), [staff](../../03-experience/dashboards/operations.md). Buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier are separately assigned roles. Official inquiry access requires an approved provider contract, permitted purpose and verified subject authorization; raw provider output is restricted to operators with need-to-know.

## 3. Preconditions, entitlements and permission

Private calls require an authenticated active context, `feature.INS-04.read` or `.write` and the child operation grant, then resource/relationship/property and state checks. Official inquiry access requires an approved provider contract, permitted purpose and verified subject authorization; raw provider output is restricted to operators with need-to-know.

Browser sessions use HttpOnly reference cookies and mutating requests require CSRF token plus Origin validation. Scoped bearer tokens serve authorized API/service clients; they cannot substitute for resource authority. Explicit anonymous discovery/auth operations remain allowlisted and rate-limited. Verified provider callbacks and internal services have distinct audiences. Privileged decisions require step-up and independent checker where the child guard specifies; switching roles cannot make a maker their own checker.

## 4. Feature controls and disablement

Child keys are boolean with effective-time and global/product/plan/carrier/organization/region/channel/customer scope. This feature's enablement is admission-only and defaults off for fresh capability/sale/optional enrollment until evidence exists. Provider live access always requires approved contract authority. New-admission flags NEVER govern provider verification callbacks, already committed delivery, reconciliation or contracted policy/claim/payment servicing. Existing work evaluates `servicing.enabled`, current resource/recipient authority and separate emergency quarantine; `partner_delivery` remains independent of buyer sales mode. Precedence for a new admission is emergency deny, authorization/security/state deny, applicable commercial parent/dependency deny, then allowed enablement. Publish reviewed immutable versions and recheck the authoritative commit boundary. Rollback creates a new version; it does not disable foundations or erase liabilities. Drafts may be read-only while committed work remains durably recoverable.

## 5. Stories, workflows and assisted paths

As an entitled actor, I need the child behaviors below with recoverable progress and accurate status. The `inquiries` application service validates the exact request, records local facts and outbox atomically, and queues external effects. Each child states its unique happy path and failure/manual path. Assisted processing creates an assigned case with source evidence and next action; it cannot assert a carrier or financial outcome without authority.

## 6. Routes, components and UI states

Authored route and field/action authority map:

- `/applications/:id` — Request permitted insurance history/owner inquiry and review provenance/manual correction; actor: authorized applicant/customer; [authority specification](../../03-experience/screen-and-route-inventory.md).
- `/ops/underwriting` — Resolve inquiry failure or conflicting evidence without replacing provenance; actor: underwriting/inspection operator; [authority specification](../../03-experience/dashboards/operations.md).

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
| INS-04-R001 | `absent>pending` | `requestInsuranceHistory`; Check subject authority and provider capability before sending only the approved owner/plate projection; persist request, purpose and provider mapping version before dispatch. |
| INS-04-R002 | `observation only` | `readInsuranceInquiry`; Return source, obtainedAt, validUntil, result confidence and exact no-claim record version. Apply a freshness requirement from the carrier contract when a quote uses the record. |
| INS-04-R003 | `failed>review_pending` | `correctInsuranceInquiry`; Keep the original response immutable, create a separately labeled correction proposal, and require an authorized reviewer before its use. Distinguish provider error from customer challenge. |

## 10. Concurrency, idempotency and versioning

Conflicting `InsuranceInquiry` writes use a bounded transaction and optimistic revision/row lock. `If-Match` is the quoted decimal `resourceVersion`; any `expectedVersion` input is an alias and must agree. Scope idempotency to operation, actor/context and canonical body digest: same body returns stored outcome; changed body returns 409. Unique external/source-event references prevent duplicate local effects. Balance/budget/inventory/approval invariants use transactional checks, never cached counters. Provider calls occur outside database locks after commit and retain one stable business key across retries.

## 11. API contracts and errors

Versioned child operations below return authorized read projections or `CommandReceipt`. Local committed/queued is never carrier issuance or payout confirmation. Lists use stable context/filter-bound cursors, default 25 and maximum 100 rows. Errors: 400 malformed input, 401 invalid identity/signature, 403 authority/availability denied, 404 missing/concealed resource, 409 revision/idempotency/conflict, 422 business validation, 429 admission limit with Retry-After, 503 dependency unavailable. Return stable safe code/message/correlation; raw provider text and private fields are forbidden.

| Operation | Method and path | Permission | Acceptance root |
|---|---|---|---|
| `requestInsuranceHistory` | `POST /v1/inquiries/request-insurance-history` | `feature.INS-04.requestInsuranceHistory` | `AC-INS-04-R001` |
| `readInsuranceInquiry` | `GET /v1/inquiries/read-insurance-inquiry` | `feature.INS-04.readInsuranceInquiry` | `AC-INS-04-R002` |
| `correctInsuranceInquiry` | `POST /v1/inquiries/correct-insurance-inquiry` | `feature.INS-04.correctInsuranceInquiry` | `AC-INS-04-R003` |

## 12. Data ownership, indexes and lifecycle

`inquiries` owns `InsuranceInquiry` and its operation records. Other modules use application contracts/events. Persist context/relationship, revision, local stage, immutable source versions and UTC timestamps; do not duplicate another module's authoritative finance/policy state. Index authorized list predicates `(context_id,state,updated_at,id)`, relationship joins and unique operation/context/idempotency plus provider/external reference where applicable. Verify query plans against scoped synthetic data. Retain immutable decisions/reversals and export only a field-approved audited background projection with authorization rechecked at download. Production retention duration/basis is a qualified-review blocker; synthetic fixtures are safe until approved retention/legal-hold/erasure rules exist.

## 13. Integration and recipient projection

Each child names its external capability or a reason it has none. Discover support per provider/product/channel/version. Translate immutable canonical fields through a reviewed mapping; reject unknown enum/date/unit transforms. Approved egress, TLS/signature verification and secret references are required. Unsupported capability uses the child assisted path; never fabricate a provider result. Only necessary purpose-authorized fields leave the module/platform.

## 14. Events, jobs, retries and reconciliation

Child mutation events include opaque resource/context IDs, aggregate version, schema version, occurredAt, correlation/causation and authorized snapshot reference. No raw medical/bank/secret data is placed in metrics or ordinary logs. Insert outbox with local effect, publish at least once and atomically deduplicate inbox effects. Serialize conflicting work by `InsuranceInquiry`. Retry only classified transient outcomes with provider policy, bounded attempts and owned dead-letter queue. Unknown non-idempotent outcomes require authoritative status/evidence before replay. Read projections emit no domain mutation event.

## 15. Commercial and financial effects

Provider inquiry fees, if contracted, are disclosed before charge; missing fee terms keep paid inquiries disabled.

Money is integer-string amount plus currency/unit; conversion/rounding uses the approved transaction-time rule. Toman display does not change canonical rial accounting. A price/coverage change requires fresh acceptance. Synthetic amounts are test values, never approved premiums/fees/benefits.

## 16. Notifications, queues and service ownership

R02 owns decisions; R20 owns assigned customer/partner exceptions, R09 provider failures, R12 finance discrepancies and R11 privacy/security incidents. Workbenches show age, owner, next action and evidence. Notify using reviewed purpose-specific templates, verified contacts, consent/preferences and event/recipient deduplication. Response/escalation rules link to [operational SLOs](../../12-operations/sli-slo-alerts-and-oncall.md); uncontracted external SLAs remain blocked rather than invented.

## 17. Security, privacy and fraud

Official inquiry access requires an approved provider contract, permitted purpose and verified subject authorization; raw provider output is restricted to operators with need-to-know.

Test object/property substitution with two users/two tenants, shared membership, context switch and revoked roles. Reauthorize queued privileged work and export/download use. Restrict partner recipients, verify callback replay protection, scan uploads, neutralize rendered provider text and exclude PII from high-cardinality telemetry. Financial and availability controls cannot weaken authorization.

## 18. Performance, caching and measurement

Use only [central budgets](../../_meta/performance-budgets.yaml): PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS. Child mapping below identifies its critical budget. Include authorization, validation, database commit/outbox in own-service timing; separately attribute external time. Bound pages and database queries, avoid N+1, move exports/provider work outside request transactions and enforce tenant/provider admission limits. Private results never enter shared public caches. Public catalog/content uses explicit versioned invalidation. Measure request/query latency, query count, event-loop/memory, queue age and provider outcome class with opaque correlations; no observed performance is claimed here.

## 19. Analytics and KPIs

Use `inquiries.operation_requested`, `.operation_completed` and `.operation_failed` with operation, coarse channel, result code and consented pseudonymous correlation. Measure eligible completion, denial, retry, abandonment and aged exceptions. Never export raw answers, identity numbers, medical evidence, bank details or raw resource IDs to marketing analytics. Financial metrics reconcile to ledger facts rather than browser clicks.

## 20. Accessibility, localization, calendar and mobile

Target WCAG 2.2 AA with keyboard/screen-reader review plus automated checks. Programmatic labels/error associations, focus management and non-color status are required. A01 proposes Persian-first RTL with English identifiers; bidi-isolate money/references and label units. UTC instants differ from contract-local effective dates and selected Jalali presentation. Provide upload/camera/notification alternatives when device permission is denied. Offline clients cannot establish fresh purchase/coverage/finance authority or cache sensitive responses.

## 21. Configuration, migration and rollout

Deploy compatible reads/schema before writes; backfill in bounded resumable tenant-scoped batches with source counts/digests. Begin with fictional local fixtures, then certified sandbox evidence, then explicitly approved live scope. Preserve historical form/rule/mapping versions for committed work. Rollback stops new admission and restores compatible code/configuration while draining or reconciling committed work; never delete audit/ledger history or blindly replay unknown external effects.

## 22. Child requirements and measurable acceptance

Each child specializes all shared sections above through its exact fields, rule, operation, workflow stage, failure and seven acceptance cases. These are test specifications, not executed application evidence. Shared controls remain normative through the [SRS](../software-requirements-specification.md); they do not replace feature-specific behavior.

### INS-04-R001 — Permitted plate/owner and policy-history inquiry

**Rule `BR-INS-04-R001`:** Check subject authority and provider capability before sending only the approved owner/plate projection; persist request, purpose and provider mapping version before dispatch.

**Actor/resource boundary:** Official inquiry access requires an approved provider contract, permitted purpose and verified subject authorization; raw provider output is restricted to operators with need-to-know. Require `feature.INS-04.requestInsuranceHistory` and applicable context/relationship/property grants. The accountable decision owner is R02; R20 owns assigned exceptions.

**Local workflow stage:** `absent>pending`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Unsupported provider returns capability_unavailable and offers evidence-based manual entry, never fabricated official data.

**Control:** `feature.INS-04.enabled`; evaluation `new_admission_only`. Feature enablement gates only fresh sale/new optional enrollment/admission. Never reapply it to verified callbacks, already committed work, reconciliation or contracted servicing; those use servicing.enabled, current authority and quarantine.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `subjectId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.subjectId.invalid` |
| `inquiryKind` | `inquiryKind`; {"type": "string", "enum": ["plate_owner", "policy_history", "no_claim"]}; Enabled only with approved official inquiry capability. | required; no implicit default | `"plate_owner"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.inquiryKind.invalid` |
| `consentId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.consentId.invalid` |

**API:** `POST /v1/inquiries/request-insurance-history`; operation ID `requestInsuranceHistory`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=requestInsuranceHistory` and a closed typed result: `inquiryId:uuid`, `status:code`, `sourceCode:code`, `obtainedAt:instant`, `validUntil:instant`, `noClaimRecordVersion:version`. Exact conditional variants are in `FRequestInsuranceHistoryCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** insuranceInquiry. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `InsuranceInquiry` owned by `inquiries`; `inquiries.request-insurance-history.recorded.v1`. **Financial effects:** Provider inquiry fees, if contracted, are disclosed before charge; missing fee terms keep paid inquiries disabled. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-INS-04-R001-SUCCESS` | Given a synthetic authorized `InsuranceInquiry` and the declared valid inputs, when `requestInsuranceHistory` executes, then Check subject authority and provider capability before sending only the approved owner/plate projection; persist request, purpose and provider mapping version before dispatch. Assert the exact local effect/projection and source/version references. |
| `AC-INS-04-R001-FAILURE` | Given missing or invalid `subjectId` or the operation-specific invalid condition, when `requestInsuranceHistory` executes, then reject malformed/domain-invalid input without partial mutation. Unsupported provider returns capability_unavailable and offers evidence-based manual entry, never fabricated official data. |
| `AC-INS-04-R001-DENIAL` | Given person A in tenant A and a `InsuranceInquiry` belonging only to person B/tenant B, when A substitutes B's reference in `requestInsuranceHistory`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-INS-04-R001-DISABLE` | Given the applicable `feature.INS-04.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-INS-04-R001-RACE` | Given two concurrent `requestInsuranceHistory` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-INS-04-R001-RECOVERY` | Given a process crash after the local `InsuranceInquiry` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-INS-04-R001-PROVIDER` | Given `insuranceInquiry` is unavailable, throttled or returns malformed/ambiguous data, when this action dispatches, then preserve durable intent, classify the outcome and use the stated fallback: Unsupported provider returns capability_unavailable and offers evidence-based manual entry, never fabricated official data. Non-idempotent unknown effects are not blindly resent. |

**Test IDs:** `T-INS-04-R001-UNIT`, `T-INS-04-R001-PROPERTY`, `T-INS-04-R001-INTEGRATION`, `T-INS-04-R001-CONTRACT`, `T-INS-04-R001-E2E`, `T-INS-04-R001-SECURITY`, `T-INS-04-R001-PERF`. Fixtures include valid inputs above, invalid `subjectId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Unsupported provider returns capability_unavailable and offers evidence-based manual entry, never fabricated official data. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### INS-04-R002 — No-claim records, provenance, freshness and eligibility

**Rule `BR-INS-04-R002`:** Return source, obtainedAt, validUntil, result confidence and exact no-claim record version. Apply a freshness requirement from the carrier contract when a quote uses the record.

**Actor/resource boundary:** Official inquiry access requires an approved provider contract, permitted purpose and verified subject authorization; raw provider output is restricted to operators with need-to-know. Require `feature.INS-04.readInsuranceInquiry` and applicable context/relationship/property grants. The accountable decision owner is R02; R20 owns assigned exceptions.

**Local workflow stage:** `resolved>resolved`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** A stale or unverified record cannot establish eligibility; show refresh or review required.

**Control:** `feature.INS-04.enabled`; evaluation `authorized_read`. Existing authorized resource reads ignore new-admission flags. Public discovery may apply visibility configuration; advertised new actions recheck their actual admission gates. No read flag grants resource/property authority.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `inquiryId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.inquiryId.invalid` |
| `applicationId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.applicationId.invalid` |

**API:** `GET /v1/inquiries/read-insurance-inquiry`; operation ID `readInsuranceInquiry`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Read projection allowlist:** `inquiryId:uuid`, `sourceCode:code`, `obtainedAt:instant`, `validUntil:instant`, `confidence:code`, `noClaimRecordVersion:version`, `eligibilityStatus:code`. Reauthorize properties before serialization. Inapplicable facts in heterogeneous rows are omitted rather than replaced with zero. Private projections are not publicly cached.

**Integration boundary:** insuranceInquiry. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `InsuranceInquiry` owned by `inquiries`; `N/A: read projection has no domain mutation event`. **Financial effects:** Provider inquiry fees, if contracted, are disclosed before charge; missing fee terms keep paid inquiries disabled. **Performance:** `PERF-READ` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-INS-04-R002-SUCCESS` | Given a synthetic authorized `InsuranceInquiry` and the declared valid inputs, when `readInsuranceInquiry` executes, then Return source, obtainedAt, validUntil, result confidence and exact no-claim record version. Apply a freshness requirement from the carrier contract when a quote uses the record. Assert the exact local effect/projection and source/version references. |
| `AC-INS-04-R002-FAILURE` | Given missing or invalid `inquiryId` or the operation-specific invalid condition, when `readInsuranceInquiry` executes, then reject malformed/domain-invalid input without partial mutation. A stale or unverified record cannot establish eligibility; show refresh or review required. |
| `AC-INS-04-R002-DENIAL` | Given person A in tenant A and a `InsuranceInquiry` belonging only to person B/tenant B, when A substitutes B's reference in `readInsuranceInquiry`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-INS-04-R002-DISABLE` | Given new-admission flags are off, when `readInsuranceInquiry` handles an already authorized resource or committed obligation, then apply servicing.enabled/current relationship/recipient authority/quarantine, not the new-admission flag. Preserve downloads, claims, receipts and reconciliation as applicable; deny only actual authority/state/security violations. |
| `AC-INS-04-R002-RACE` | Given `readInsuranceInquiry` is reading while an authorized mutation updates `InsuranceInquiry`, when the response is built, then return a consistent projection/snapshot and asOf value, with no torn money/coverage facts or unauthorized new fields. Pagination remains bound to its filters/context. GET creates no domain mutation or idempotency reservation. |
| `AC-INS-04-R002-RECOVERY` | Given the `InsuranceInquiry` projection is rebuilding or temporarily unavailable, when `readInsuranceInquiry` resumes, then reauthorize current context and return recovered data with freshness, or explicit partial/unavailable status; never reuse another subject's cached projection. |
| `AC-INS-04-R002-PROVIDER` | Given `insuranceInquiry` is unavailable, throttled or returns malformed/ambiguous data, when this action dispatches, then preserve durable intent, classify the outcome and use the stated fallback: A stale or unverified record cannot establish eligibility; show refresh or review required. Non-idempotent unknown effects are not blindly resent. |

**Test IDs:** `T-INS-04-R002-UNIT`, `T-INS-04-R002-PROPERTY`, `T-INS-04-R002-INTEGRATION`, `T-INS-04-R002-CONTRACT`, `T-INS-04-R002-E2E`, `T-INS-04-R002-SECURITY`, `T-INS-04-R002-PERF`. Fixtures include valid inputs above, invalid `inquiryId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** A stale or unverified record cannot establish eligibility; show refresh or review required. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### INS-04-R003 — Failures and manual correction with evidence

**Rule `BR-INS-04-R003`:** Keep the original response immutable, create a separately labeled correction proposal, and require an authorized reviewer before its use. Distinguish provider error from customer challenge.

**Actor/resource boundary:** Official inquiry access requires an approved provider contract, permitted purpose and verified subject authorization; raw provider output is restricted to operators with need-to-know. Require `feature.INS-04.correctInsuranceInquiry` and applicable context/relationship/property grants. The accountable decision owner is R02; R20 owns assigned exceptions.

**Local workflow stage:** `failed>review_pending`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** An operator cannot silently replace official provenance; timeout remains pending/unknown until provider status or manual evidence resolves it.

**Control:** `feature.INS-04.enabled`; evaluation `new_admission_only`. Feature enablement gates only fresh sale/new optional enrollment/admission. Never reapply it to verified callbacks, already committed work, reconciliation or contracted servicing; those use servicing.enabled, current authority and quarantine.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `inquiryId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.inquiryId.invalid` |
| `correctedFields` | `answers`; {"type": "array", "maxItems": 200}; Versioned form/risk/subject schema is mandatory second validation: unique field codes, allowed types, conditional required fields and field-specific constraints. This container grants no arbitrary keys. | required; no implicit default | `[{"fieldCode": "synthetic-field", "value": "Synthetic answer"}]` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.correctedFields.invalid` |
| `evidenceIds` | `uuidSet`; {"type": "array", "minItems": 0, "maxItems": 100, "uniqueItems": true} | required; no implicit default | `[]` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.evidenceIds.invalid` |
| `reason` | `text`; {"type": "string", "minLength": 1, "maxLength": 200} | required; no implicit default | `"Synthetic review reason"` | internal; Unicode NFC; trim outer whitespace; reject control characters except permitted line breaks; `validation.reason.invalid` |

**API:** `POST /v1/inquiries/correct-insurance-inquiry`; operation ID `correctInsuranceInquiry`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=correctInsuranceInquiry` and a closed typed result: `resourceId:uuid`, `resourceVersion:version`, `localWorkflowStage:code`, `decisionRecordId:uuid`, `recordedAt:instant`. Exact conditional variants are in `FCorrectInsuranceInquiryCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** insuranceInquiry. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `InsuranceInquiry` owned by `inquiries`; `inquiries.correct-insurance-inquiry.recorded.v1`. **Financial effects:** Provider inquiry fees, if contracted, are disclosed before charge; missing fee terms keep paid inquiries disabled. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-INS-04-R003-SUCCESS` | Given a synthetic authorized `InsuranceInquiry` and the declared valid inputs, when `correctInsuranceInquiry` executes, then Keep the original response immutable, create a separately labeled correction proposal, and require an authorized reviewer before its use. Distinguish provider error from customer challenge. Assert the exact local effect/projection and source/version references. |
| `AC-INS-04-R003-FAILURE` | Given missing or invalid `inquiryId` or the operation-specific invalid condition, when `correctInsuranceInquiry` executes, then reject malformed/domain-invalid input without partial mutation. An operator cannot silently replace official provenance; timeout remains pending/unknown until provider status or manual evidence resolves it. |
| `AC-INS-04-R003-DENIAL` | Given person A in tenant A and a `InsuranceInquiry` belonging only to person B/tenant B, when A substitutes B's reference in `correctInsuranceInquiry`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-INS-04-R003-DISABLE` | Given the applicable `feature.INS-04.enabled` or sales gate changes before a new-action commit, when the server rechecks configuration, then deny the new gated action and record the evaluated version. If work was already committed or is contracted servicing, continue under its independent controls unless separate quarantine applies. |
| `AC-INS-04-R003-RACE` | Given two concurrent `correctInsuranceInquiry` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-INS-04-R003-RECOVERY` | Given a process crash after the local `InsuranceInquiry` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-INS-04-R003-PROVIDER` | Given `insuranceInquiry` is unavailable, throttled or returns malformed/ambiguous data, when this action dispatches, then preserve durable intent, classify the outcome and use the stated fallback: An operator cannot silently replace official provenance; timeout remains pending/unknown until provider status or manual evidence resolves it. Non-idempotent unknown effects are not blindly resent. |

**Test IDs:** `T-INS-04-R003-UNIT`, `T-INS-04-R003-PROPERTY`, `T-INS-04-R003-INTEGRATION`, `T-INS-04-R003-CONTRACT`, `T-INS-04-R003-E2E`, `T-INS-04-R003-SECURITY`, `T-INS-04-R003-PERF`. Fixtures include valid inputs above, invalid `inquiryId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** An operator cannot silently replace official provenance; timeout remains pending/unknown until provider status or manual evidence resolves it. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

## 23. Test suites and synthetic fixtures

Per-child UNIT tests field/state guards; PROPERTY permutes duplicates and ordering while preserving invariants; INTEGRATION verifies transaction/outbox and authorization; CONTRACT validates declared adapter/schema behavior; E2E exercises actual screen states; SECURITY checks object/property/context boundaries; PERF runs the referenced workload. No-provider children explain contract-test inapplicability while retaining internal API checks. Fixtures never include real people/credentials. A renderer or structural schema pass is not semantic feature completeness.

## 24. Runbook, dependencies, blockers and done

For a stuck `InsuranceInquiry`, inspect the authorized event/status sequence and assigned queue, classify local validation/auth/configuration/provider/finance cause, preserve evidence, assign the accountable role, reconcile before replay and communicate safe pending/next-step status. Close only on verified outcome and audit; no direct status edits to clear alerts. Dependencies include identity/context, relationship grants, versioned product/configuration, durable database/outbox, declared partner capability, finance for value effects and consented messaging. [Blockers](../../_meta/risks-and-blockers.yaml) record missing authority/contracts/retention and owners. Done requires human role reviews, all acceptance categories, risk-based suite evidence, tenant/cache tests, measured budgets and recovery drills. Application implementation, deployment and live certification are outside this documentation claim.
