---
{
  "id": "SPEC-ORG-02",
  "title": "Organization authorization",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R11",
  "reviewer_roles": [
    "R03",
    "R11",
    "R13",
    "R17"
  ],
  "scope_ids": [
    "ORG-02"
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
# ORG-02 — Organization authorization

## 1. Identity, objective and scope

Owner R11; explicit user scope [S00], not proof of provider availability. Objective and retained baseline: RBAC plus resource/relationship scopes, delegated administration, multi-organization users, invitations, revocation, access review and audit.

This draft is proposed for human review. No live integration, legal approval, commercial rate or measured implementation result is asserted. Synthetic examples are not production rules. Adjacent capabilities stay in scope even when rollout is off.

## 2. Actors and commercial relationships

Channels: corporate, commercial, reseller, b2b2c. Field/action authority is specialized by the dashboard specifications: [corporate](../../03-experience/dashboards/corporate.md), [beneficiary](../../03-experience/dashboards/beneficiary.md), [seller](../../03-experience/dashboards/seller.md), [platform_admin](../../03-experience/dashboards/admin.md), [staff](../../03-experience/dashboards/operations.md). Buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier are separately assigned roles. RBAC narrows permitted actions; resource, relationship, field and effective-time checks further constrain every grant.

## 3. Preconditions, entitlements and permission

Private calls require an authenticated active context, `feature.ORG-02.read` or `.write` and the child operation grant, then resource/relationship/property and state checks. RBAC narrows permitted actions; resource, relationship, field and effective-time checks further constrain every grant.

Browser sessions use HttpOnly reference cookies and mutating requests require CSRF token plus Origin validation. Scoped bearer tokens serve authorized API/service clients; they cannot substitute for resource authority. Explicit anonymous discovery/auth operations remain allowlisted and rate-limited. Verified provider callbacks and internal services have distinct audiences. Privileged decisions require step-up and independent checker where the child guard specifies; switching roles cannot make a maker their own checker.

## 4. Feature controls and disablement

Child keys are boolean with effective-time and global/product/plan/carrier/organization/region/channel/customer scope. This feature is a mandatory true, noncommercial foundation; ordinary commercial flags cannot disable its authentication/authorization/configuration/validation/audit/durable-processing role. Provider live access always requires approved contract authority. New-admission flags NEVER govern provider verification callbacks, already committed delivery, reconciliation or contracted policy/claim/payment servicing. Existing work evaluates `servicing.enabled`, current resource/recipient authority and separate emergency quarantine; `partner_delivery` remains independent of buyer sales mode. Precedence for a new admission is emergency deny, authorization/security/state deny, applicable commercial parent/dependency deny, then allowed enablement. Publish reviewed immutable versions and recheck the authoritative commit boundary. Rollback creates a new version; it does not disable foundations or erase liabilities. Drafts may be read-only while committed work remains durably recoverable.

## 5. Stories, workflows and assisted paths

As an entitled actor, I need the child behaviors below with recoverable progress and accurate status. The `authorization` application service validates the exact request, records local facts and outbox atomically, and queues external effects. Each child states its unique happy path and failure/manual path. Assisted processing creates an assigned case with source evidence and next action; it cannot assert a carrier or financial outcome without authority.

## 6. Routes, components and UI states

Authored route and field/action authority map:

- `/org/:orgId/team` — Invite/revoke/review scoped memberships and delegated roles; actor: organization admin; [authority specification](../../03-experience/dashboards/corporate.md).
- `/account/settings` — Review personal sessions and mandate/context relationships; actor: personal customer; [authority specification](../../03-experience/dashboards/customer.md).
- `/admin/security-audit` — Audit grants, revocations and cross-context denials; actor: security administrator; [authority specification](../../03-experience/dashboards/admin.md).

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
| ORG-02-R001 | `proposed>active` | `grantOrganizationRole`; Allow a delegator to grant only a subset of their own delegable authority, constrain branch/team/portfolio and field access, and prohibit permission escalation through role combinations. |
| ORG-02-R002 | `absent>invited` | `inviteAndSwitchOrganization`; Issue single-use expiring invitations tied to verified identity and intended organization; accepting a second organization does not merge its data or permissions with the first. |
| ORG-02-R003 | `active>revoked` | `revokeAndReviewMembership`; Increment authorization version, invalidate active grants/caches and stop queued privileged work that needs current authority; preserve audit and schedule periodic owner review. |

## 10. Concurrency, idempotency and versioning

Conflicting `MembershipGrant` writes use a bounded transaction and optimistic revision/row lock. `If-Match` is the quoted decimal `resourceVersion`; any `expectedVersion` input is an alias and must agree. Scope idempotency to operation, actor/context and canonical body digest: same body returns stored outcome; changed body returns 409. Unique external/source-event references prevent duplicate local effects. Balance/budget/inventory/approval invariants use transactional checks, never cached counters. Provider calls occur outside database locks after commit and retain one stable business key across retries.

## 11. API contracts and errors

Versioned child operations below return authorized read projections or `CommandReceipt`. Local committed/queued is never carrier issuance or payout confirmation. Lists use stable context/filter-bound cursors, default 25 and maximum 100 rows. Errors: 400 malformed input, 401 invalid identity/signature, 403 authority/availability denied, 404 missing/concealed resource, 409 revision/idempotency/conflict, 422 business validation, 429 admission limit with Retry-After, 503 dependency unavailable. Return stable safe code/message/correlation; raw provider text and private fields are forbidden.

| Operation | Method and path | Permission | Acceptance root |
|---|---|---|---|
| `grantOrganizationRole` | `POST /v1/authorization/grant-organization-role` | `feature.ORG-02.grantOrganizationRole` | `AC-ORG-02-R001` |
| `inviteAndSwitchOrganization` | `POST /v1/authorization/invite-and-switch-organization` | `feature.ORG-02.inviteAndSwitchOrganization` | `AC-ORG-02-R002` |
| `revokeAndReviewMembership` | `POST /v1/authorization/revoke-and-review-membership` | `feature.ORG-02.revokeAndReviewMembership` | `AC-ORG-02-R003` |

## 12. Data ownership, indexes and lifecycle

`authorization` owns `MembershipGrant` and its operation records. Other modules use application contracts/events. Persist context/relationship, revision, local stage, immutable source versions and UTC timestamps; do not duplicate another module's authoritative finance/policy state. Index authorized list predicates `(context_id,state,updated_at,id)`, relationship joins and unique operation/context/idempotency plus provider/external reference where applicable. Verify query plans against scoped synthetic data. Retain immutable decisions/reversals and export only a field-approved audited background projection with authorization rechecked at download. Production retention duration/basis is a qualified-review blocker; synthetic fixtures are safe until approved retention/legal-hold/erasure rules exist.

## 13. Integration and recipient projection

Each child names its external capability or a reason it has none. Discover support per provider/product/channel/version. Translate immutable canonical fields through a reviewed mapping; reject unknown enum/date/unit transforms. Approved egress, TLS/signature verification and secret references are required. Unsupported capability uses the child assisted path; never fabricate a provider result. Only necessary purpose-authorized fields leave the module/platform.

## 14. Events, jobs, retries and reconciliation

Child mutation events include opaque resource/context IDs, aggregate version, schema version, occurredAt, correlation/causation and authorized snapshot reference. No raw medical/bank/secret data is placed in metrics or ordinary logs. Insert outbox with local effect, publish at least once and atomically deduplicate inbox effects. Serialize conflicting work by `MembershipGrant`. Retry only classified transient outcomes with provider policy, bounded attempts and owned dead-letter queue. Unknown non-idempotent outcomes require authoritative status/evidence before replay. Read projections emit no domain mutation event.

## 15. Commercial and financial effects

Finance permissions and approval limits require separate grants; organization administrator is not automatically a payout approver.

Money is integer-string amount plus currency/unit; conversion/rounding uses the approved transaction-time rule. Toman display does not change canonical rial accounting. A price/coverage change requires fresh acceptance. Synthetic amounts are test values, never approved premiums/fees/benefits.

## 16. Notifications, queues and service ownership

R11 owns decisions; R20 owns assigned customer/partner exceptions, R09 provider failures, R12 finance discrepancies and R11 privacy/security incidents. Workbenches show age, owner, next action and evidence. Notify using reviewed purpose-specific templates, verified contacts, consent/preferences and event/recipient deduplication. Response/escalation rules link to [operational SLOs](../../12-operations/sli-slo-alerts-and-oncall.md); uncontracted external SLAs remain blocked rather than invented.

## 17. Security, privacy and fraud

RBAC narrows permitted actions; resource, relationship, field and effective-time checks further constrain every grant.

Test object/property substitution with two users/two tenants, shared membership, context switch and revoked roles. Reauthorize queued privileged work and export/download use. Restrict partner recipients, verify callback replay protection, scan uploads, neutralize rendered provider text and exclude PII from high-cardinality telemetry. Financial and availability controls cannot weaken authorization.

## 18. Performance, caching and measurement

Use only [central budgets](../../_meta/performance-budgets.yaml): PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS. Child mapping below identifies its critical budget. Include authorization, validation, database commit/outbox in own-service timing; separately attribute external time. Bound pages and database queries, avoid N+1, move exports/provider work outside request transactions and enforce tenant/provider admission limits. Private results never enter shared public caches. Public catalog/content uses explicit versioned invalidation. Measure request/query latency, query count, event-loop/memory, queue age and provider outcome class with opaque correlations; no observed performance is claimed here.

## 19. Analytics and KPIs

Use `authorization.operation_requested`, `.operation_completed` and `.operation_failed` with operation, coarse channel, result code and consented pseudonymous correlation. Measure eligible completion, denial, retry, abandonment and aged exceptions. Never export raw answers, identity numbers, medical evidence, bank details or raw resource IDs to marketing analytics. Financial metrics reconcile to ledger facts rather than browser clicks.

## 20. Accessibility, localization, calendar and mobile

Target WCAG 2.2 AA with keyboard/screen-reader review plus automated checks. Programmatic labels/error associations, focus management and non-color status are required. A01 proposes Persian-first RTL with English identifiers; bidi-isolate money/references and label units. UTC instants differ from contract-local effective dates and selected Jalali presentation. Provide upload/camera/notification alternatives when device permission is denied. Offline clients cannot establish fresh purchase/coverage/finance authority or cache sensitive responses.

## 21. Configuration, migration and rollout

Deploy compatible reads/schema before writes; backfill in bounded resumable tenant-scoped batches with source counts/digests. Begin with fictional local fixtures, then certified sandbox evidence, then explicitly approved live scope. Preserve historical form/rule/mapping versions for committed work. Rollback stops new admission and restores compatible code/configuration while draining or reconciling committed work; never delete audit/ledger history or blindly replay unknown external effects.

## 22. Child requirements and measurable acceptance

Each child specializes all shared sections above through its exact fields, rule, operation, workflow stage, failure and seven acceptance cases. These are test specifications, not executed application evidence. Shared controls remain normative through the [SRS](../software-requirements-specification.md); they do not replace feature-specific behavior.

### ORG-02-R001 — RBAC, resource/relationship scopes and delegated administration

**Rule `BR-ORG-02-R001`:** Allow a delegator to grant only a subset of their own delegable authority, constrain branch/team/portfolio and field access, and prohibit permission escalation through role combinations.

**Actor/resource boundary:** RBAC narrows permitted actions; resource, relationship, field and effective-time checks further constrain every grant. Require `feature.ORG-02.grantOrganizationRole` and applicable context/relationship/property grants. The accountable decision owner is R11; R20 owns assigned exceptions.

**Local workflow stage:** `proposed>active`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** A delegated admin cannot grant global admin, medical-claim access or finance approval beyond their own scope.

**Control:** `feature.ORG-02.enabled`; evaluation `mandatory_foundation`. Foundation control is mandatory true and cannot be disabled by ordinary commercial flags. Specific new-sales admission remains governed by the requested channel/product capability. Authentication, authorization, audit, canonical validation and durable outbox/reconciliation remain available; approved provider live access still requires contract authority.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `membershipId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.membershipId.invalid` |
| `roleCodes` | `codeList`; {"type": "array", "minItems": 1, "maxItems": 100, "uniqueItems": true} | required; no implicit default | `["synthetic-code"]` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.roleCodes.invalid` |
| `resourceScope` | `answers`; {"type": "array", "maxItems": 200}; Versioned form/risk/subject schema is mandatory second validation: unique field codes, allowed types, conditional required fields and field-specific constraints. This container grants no arbitrary keys. | required; no implicit default | `[{"fieldCode": "synthetic-field", "value": "Synthetic answer"}]` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.resourceScope.invalid` |
| `expiresAt` | `instant`; {"type": "string", "format": "date-time", "pattern": "Z$"}; UTC RFC3339 event instant; display calendar is separate. | required; no implicit default | `"2026-10-28T08:00:00Z"` | internal; Strict parsing; date and instant differ; UTC event instants; display calendar never changes stored value; `validation.expiresAt.invalid` |

**API:** `POST /v1/authorization/grant-organization-role`; operation ID `grantOrganizationRole`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=grantOrganizationRole` and a closed typed result: `resourceId:uuid`, `resourceVersion:version`, `localWorkflowStage:code`, `decisionRecordId:uuid`, `recordedAt:instant`. Exact conditional variants are in `FGrantOrganizationRoleCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `MembershipGrant` owned by `authorization`; `authorization.grant-organization-role.recorded.v1`. **Financial effects:** Finance permissions and approval limits require separate grants; organization administrator is not automatically a payout approver. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-ORG-02-R001-SUCCESS` | Given a synthetic authorized `MembershipGrant` and the declared valid inputs, when `grantOrganizationRole` executes, then Allow a delegator to grant only a subset of their own delegable authority, constrain branch/team/portfolio and field access, and prohibit permission escalation through role combinations. Assert the exact local effect/projection and source/version references. |
| `AC-ORG-02-R001-FAILURE` | Given missing or invalid `membershipId` or the operation-specific invalid condition, when `grantOrganizationRole` executes, then reject malformed/domain-invalid input without partial mutation. A delegated admin cannot grant global admin, medical-claim access or finance approval beyond their own scope. |
| `AC-ORG-02-R001-DENIAL` | Given person A in tenant A and a `MembershipGrant` belonging only to person B/tenant B, when A substitutes B's reference in `grantOrganizationRole`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-ORG-02-R001-DISABLE` | Given a commercial editor attempts to set `feature.ORG-02.enabled` false, when configuration validation executes, then reject the noncommercial foundation disablement and audit the attempt. Channel sales may still be turned off independently; authentication, authorization, audit and durable servicing/reconciliation continue under current authority/quarantine. |
| `AC-ORG-02-R001-RACE` | Given two concurrent `grantOrganizationRole` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-ORG-02-R001-RECOVERY` | Given a process crash after the local `MembershipGrant` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-ORG-02-R001-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-ORG-02-R001-UNIT`, `T-ORG-02-R001-PROPERTY`, `T-ORG-02-R001-INTEGRATION`, `T-ORG-02-R001-CONTRACT`, `T-ORG-02-R001-E2E`, `T-ORG-02-R001-SECURITY`, `T-ORG-02-R001-PERF`. Fixtures include valid inputs above, invalid `membershipId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** A delegated admin cannot grant global admin, medical-claim access or finance approval beyond their own scope. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### ORG-02-R002 — Invitations and multi-organization users

**Rule `BR-ORG-02-R002`:** Issue single-use expiring invitations tied to verified identity and intended organization; accepting a second organization does not merge its data or permissions with the first.

**Actor/resource boundary:** RBAC narrows permitted actions; resource, relationship, field and effective-time checks further constrain every grant. Require `feature.ORG-02.inviteAndSwitchOrganization` and applicable context/relationship/property grants. The accountable decision owner is R11; R20 owns assigned exceptions.

**Local workflow stage:** `absent>invited`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** Forwarded/expired invitations fail uniformly; context switch reauthorizes and clears prior-context caches.

**Control:** `feature.ORG-02.enabled`; evaluation `mandatory_foundation`. Foundation control is mandatory true and cannot be disabled by ordinary commercial flags. Specific new-sales admission remains governed by the requested channel/product capability. Authentication, authorization, audit, canonical validation and durable outbox/reconciliation remain available; approved provider live access still requires contract authority.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `organizationId` | `uuid`; {"type": "string", "format": "uuid"} | optional; conditional guard still applies; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.organizationId.invalid` |
| `contact` | `contact`; {"type": "string", "minLength": 3, "maxLength": 254}; Discriminate email/mobile by the selected channel; validate email or country-aware E.164 mobile server-side. No unvalidated destination may be contacted. | required; no implicit default | `"synthetic@example.invalid"` | restricted; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.contact.invalid` |
| `roleCodes` | `codeList`; {"type": "array", "minItems": 1, "maxItems": 100, "uniqueItems": true} | required; no implicit default | `["synthetic-code"]` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.roleCodes.invalid` |

**API:** `POST /v1/authorization/invite-and-switch-organization`; operation ID `inviteAndSwitchOrganization`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=inviteAndSwitchOrganization` and a closed typed result: `resourceId:uuid`, `resourceVersion:version`, `localWorkflowStage:code`, `decisionRecordId:uuid`, `recordedAt:instant`. Exact conditional variants are in `FInviteAndSwitchOrganizationCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `MembershipGrant` owned by `authorization`; `authorization.invite-and-switch-organization.recorded.v1`. **Financial effects:** Finance permissions and approval limits require separate grants; organization administrator is not automatically a payout approver. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-ORG-02-R002-SUCCESS` | Given a synthetic authorized `MembershipGrant` and the declared valid inputs, when `inviteAndSwitchOrganization` executes, then Issue single-use expiring invitations tied to verified identity and intended organization; accepting a second organization does not merge its data or permissions with the first. Assert the exact local effect/projection and source/version references. |
| `AC-ORG-02-R002-FAILURE` | Given missing or invalid `contact` or the operation-specific invalid condition, when `inviteAndSwitchOrganization` executes, then reject malformed/domain-invalid input without partial mutation. Forwarded/expired invitations fail uniformly; context switch reauthorizes and clears prior-context caches. |
| `AC-ORG-02-R002-DENIAL` | Given person A in tenant A and a `MembershipGrant` belonging only to person B/tenant B, when A substitutes B's reference in `inviteAndSwitchOrganization`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-ORG-02-R002-DISABLE` | Given a commercial editor attempts to set `feature.ORG-02.enabled` false, when configuration validation executes, then reject the noncommercial foundation disablement and audit the attempt. Channel sales may still be turned off independently; authentication, authorization, audit and durable servicing/reconciliation continue under current authority/quarantine. |
| `AC-ORG-02-R002-RACE` | Given two concurrent `inviteAndSwitchOrganization` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-ORG-02-R002-RECOVERY` | Given a process crash after the local `MembershipGrant` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-ORG-02-R002-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-ORG-02-R002-UNIT`, `T-ORG-02-R002-PROPERTY`, `T-ORG-02-R002-INTEGRATION`, `T-ORG-02-R002-CONTRACT`, `T-ORG-02-R002-E2E`, `T-ORG-02-R002-SECURITY`, `T-ORG-02-R002-PERF`. Fixtures include valid inputs above, invalid `contact`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** Forwarded/expired invitations fail uniformly; context switch reauthorizes and clears prior-context caches. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

### ORG-02-R003 — Revocation, access review and audit

**Rule `BR-ORG-02-R003`:** Increment authorization version, invalidate active grants/caches and stop queued privileged work that needs current authority; preserve audit and schedule periodic owner review.

**Actor/resource boundary:** RBAC narrows permitted actions; resource, relationship, field and effective-time checks further constrain every grant. Require `feature.ORG-02.revokeAndReviewMembership` and applicable context/relationship/property grants. The accountable decision owner is R11; R20 owns assigned exceptions.

**Local workflow stage:** `active>revoked`. These labels describe feature-local work only; canonical order/payment/issuance states remain authoritative in [state machines](../state-machines.md). GET never persists a transition. **Failure/assisted route:** A stale token/export job cannot retain revoked access; retroactive audit records cannot be deleted by the revoked user.

**Control:** `feature.ORG-02.enabled`; evaluation `mandatory_foundation`. Foundation control is mandatory true and cannot be disabled by ordinary commercial flags. Specific new-sales admission remains governed by the requested channel/product capability. Authentication, authorization, audit, canonical validation and durable outbox/reconciliation remain available; approved provider live access still requires contract authority.

| Input field | Type / constraint | Required and default | Synthetic example | Classification / normalization / error |
|---|---|---|---|---|
| `membershipId` | `uuid`; {"type": "string", "format": "uuid"} | required; no implicit default | `"00000000-0000-4000-8000-000000000001"` | internal; Exact type and enum; no numeric-string or truthy/falsy coercion; `validation.membershipId.invalid` |
| `reason` | `text`; {"type": "string", "minLength": 1, "maxLength": 200} | required; no implicit default | `"Synthetic review reason"` | internal; Unicode NFC; trim outer whitespace; reject control characters except permitted line breaks; `validation.reason.invalid` |
| `reviewDueAt` | `instant`; {"type": "string", "format": "date-time", "pattern": "Z$"}; UTC RFC3339 event instant; display calendar is separate. | required; no implicit default | `"2026-10-28T08:00:00Z"` | internal; Strict parsing; date and instant differ; UTC event instants; display calendar never changes stored value; `validation.reviewDueAt.invalid` |

**API:** `POST /v1/authorization/revoke-and-review-membership`; operation ID `revokeAndReviewMembership`. Nest application/domain validation is authoritative. Input fields are limited to this table, plus documented idempotency/revision/CSRF headers. Product-specific answer fields require the pinned product schema; carrier codes require the approved registry.

**Write response:** `CommandReceipt {commandId,resourceId,resourceVersion,status,acceptedAt,statusUrl}`. `status=committed` means the local transaction completed; `queued` means a durable external/background action remains. Neither means carrier issuance, coverage activation or payout success. Retrieve the authorized command/resource status for completion.

**Successful completion:** `GET /v1/commands/{commandId}` returns `completion.operationId=revokeAndReviewMembership` and a closed typed result: `resourceId:uuid`, `resourceVersion:version`, `localWorkflowStage:code`, `decisionRecordId:uuid`, `recordedAt:instant`. Exact conditional variants are in `FRevokeAndReviewMembershipCompletionResult`. Pending/running/rejected/unknown commands must not include a fictitious success result. Reauthorize result fields at retrieval. Redirect results also include approved `formFields` (empty for GET); upload grants include exact `requiredHeaders` and PUT method. Short-lived URLs and session cookies are not logged or stored in client caches.

**Integration boundary:** N/A: local domain operation; no external provider required. Recipient projection contains only fields necessary for this operation's approved purpose. **Data/event:** `MembershipGrant` owned by `authorization`; `authorization.revoke-and-review-membership.recorded.v1`. **Financial effects:** Finance permissions and approval limits require separate grants; organization administrator is not automatically a payout approver. **Performance:** `PERF-WRITE` from the central registry, with provider time attributed separately.

| Acceptance ID | Given / When / Then |
|---|---|
| `AC-ORG-02-R003-SUCCESS` | Given a synthetic authorized `MembershipGrant` and the declared valid inputs, when `revokeAndReviewMembership` executes, then Increment authorization version, invalidate active grants/caches and stop queued privileged work that needs current authority; preserve audit and schedule periodic owner review. Assert the exact local effect/projection and source/version references. |
| `AC-ORG-02-R003-FAILURE` | Given missing or invalid `membershipId` or the operation-specific invalid condition, when `revokeAndReviewMembership` executes, then reject malformed/domain-invalid input without partial mutation. A stale token/export job cannot retain revoked access; retroactive audit records cannot be deleted by the revoked user. |
| `AC-ORG-02-R003-DENIAL` | Given person A in tenant A and a `MembershipGrant` belonging only to person B/tenant B, when A substitutes B's reference in `revokeAndReviewMembership`, then return concealed-not-found/denial and no restricted fields or side effects. Repeat after revoking an initially valid grant. |
| `AC-ORG-02-R003-DISABLE` | Given a commercial editor attempts to set `feature.ORG-02.enabled` false, when configuration validation executes, then reject the noncommercial foundation disablement and audit the attempt. Channel sales may still be turned off independently; authentication, authorization, audit and durable servicing/reconciliation continue under current authority/quarantine. |
| `AC-ORG-02-R003-RACE` | Given two concurrent `revokeAndReviewMembership` calls with one idempotency key and identical body, when both reach persistence, then one effect and one stored outcome exist. With conflicting bodies/revisions, return 409 and preserve the first accepted result; shared budget/balance/slot constraints remain true. |
| `AC-ORG-02-R003-RECOVERY` | Given a process crash after the local `MembershipGrant` transaction but before response/broker acknowledgment, when the client/worker retries, then recover the stored receipt/outbox, deduplicate local consumer effects and keep original source versions. An uncertain external effect stays unknown until verified reconciliation. |
| `AC-ORG-02-R003-PROVIDER` | Given no external provider is part of this local operation, when unrelated carrier/payment providers fail, then local authorized work remains available. A failure of this operation's own required database/projection returns unavailable, never fabricated data. External provider contract tests are N/A for this child; internal API compatibility tests remain required. |

**Test IDs:** `T-ORG-02-R003-UNIT`, `T-ORG-02-R003-PROPERTY`, `T-ORG-02-R003-INTEGRATION`, `T-ORG-02-R003-CONTRACT`, `T-ORG-02-R003-E2E`, `T-ORG-02-R003-SECURITY`, `T-ORG-02-R003-PERF`. Fixtures include valid inputs above, invalid `membershipId`, stale revision, two-user/two-tenant substitution and revoked relationship. Provider fixtures add duplicate/out-of-order callback, malformed data and timeout-after-acceptance. **Runbook specialization:** A stale token/export job cannot retain revoked access; retroactive audit records cannot be deleted by the revoked user. Closure requires verified outcome/evidence; the operator cannot edit status to bypass the guard.

## 23. Test suites and synthetic fixtures

Per-child UNIT tests field/state guards; PROPERTY permutes duplicates and ordering while preserving invariants; INTEGRATION verifies transaction/outbox and authorization; CONTRACT validates declared adapter/schema behavior; E2E exercises actual screen states; SECURITY checks object/property/context boundaries; PERF runs the referenced workload. No-provider children explain contract-test inapplicability while retaining internal API checks. Fixtures never include real people/credentials. A renderer or structural schema pass is not semantic feature completeness.

## 24. Runbook, dependencies, blockers and done

For a stuck `MembershipGrant`, inspect the authorized event/status sequence and assigned queue, classify local validation/auth/configuration/provider/finance cause, preserve evidence, assign the accountable role, reconcile before replay and communicate safe pending/next-step status. Close only on verified outcome and audit; no direct status edits to clear alerts. Dependencies include identity/context, relationship grants, versioned product/configuration, durable database/outbox, declared partner capability, finance for value effects and consented messaging. [Blockers](../../_meta/risks-and-blockers.yaml) record missing authority/contracts/retention and owners. Done requires human role reviews, all acceptance categories, risk-based suite evidence, tenant/cache tests, measured budgets and recovery drills. Application implementation, deployment and live certification are outside this documentation claim.
