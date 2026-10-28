---
{
  "id": "EXP-ROUTES",
  "title": "Screen and route inventory",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R04",
  "reviewer_roles": [
    "R02",
    "R04",
    "R11",
    "R13",
    "R20"
  ],
  "scope_ids": [
    "DSH-06",
    "INS-01",
    "INS-02",
    "COM-01",
    "GRW-10"
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

# Screen and route inventory

## Public and purchase routes

Routes are proposed presentation contracts. Dynamic IDs never grant authorization. Every private route checks context/resource/field access before fetching data; menus alone do not protect it. All routes implement the state contract in their dashboard or the [shared product contract](../01-product/products/shared-product-contract.md).

| Route | Screen and components | Feature scope | Authorization and availability |
|---|---|---|---|
| `/` | Catalog navigation, featured permitted products, original content | INS-01, GRW-05, GRW-08 | Public approved content only; campaign targeting respects consent |
| `/insurance` | Hierarchical category/search/filter catalog | INS-01 | Public product availability is separate from quote/purchase |
| `/insurance/:productId` | Product-specific risks, evidence, plans and assisted entry | INS-11 | Published editorial plus current availability; no binding price without offer |
| `/insurers/:slug` | Original insurer profile and permitted plan information | INS-01, GRW-08 | Only approved public fields; no private carrier API details |
| `/guides/:slug` | Original articles, FAQs and assistance content | GRW-08, SVC-05 | CMS approved/versioned; sitemap only indexable public content |
| `/search` | Public product/editorial search | INS-01, GRW-08 | No authenticated records/counts in public index |
| `/auth/sign-in` | Mobile OTP and approved alternatives | GRW-01 | Rate-limited, enumeration-resistant; paste/autofill and recovery |
| `/auth/recovery` | Verified account recovery | GRW-01 | No bypass of privileged MFA or organization grant |
| `/applications/:id` | Versioned questionnaire, evidence, declarations | INS-02, COM-02 | Resource relationship plus field mask; private/no-store |
| `/quotes/:id/compare` | Progressive comparable offers and expiration | INS-05, INS-06, INS-07 | Permitted recipient and current quote/risk version |
| `/checkout/:applicationId` | Party roles, consents, totals and purchase commitment | COM-01, COM-03, COM-04, COM-05 | Authoritative price/permission/flag/version recheck |
| `/orders/:id` | Independent financial/insurance/delivery timeline | COM-08 | Safe buyer/payer/insured projections; verified source states |
| `/policies/:id` | Insurer-confirmed policy detail, cover, parties, effective dates, documents and version history | SVC-01, SVC-05 | Policyholder/insured/beneficiary/delegate projection by purpose; payer access alone does not reveal private risk/claims |
| `/policies/:id/changes` | Endorsement/cancellation request, evidence, requested/approved/effective dates and adjustment tracking | SVC-04 | Policy-change authority plus state/carrier capability; request does not alter coverage or authorize refund |
| `/assisted-requests/:id` | Assigned complex quote/proposal workflow | INS-12 | Mandated parties and assigned staff; versioned negotiation |
| `/inspections/:id` | Booking/checklist/upload/retake | INS-09 | Vehicle/resource and assigned reviewer scope |
| `/automotive/services` | Authorized maintenance providers and bookings | AUTO-05 | Provider/service availability and fulfillment permission |
| `/automotive/parts` | Compatibility/catalog/cart/shipping/returns | AUTO-06 | Independent commerce controls and seller authority |
| `/automotive/trading` | Valuation/listing/auction/transaction destinations | AUTO-07 | Each capability separately gated; authority and provider dependencies |
| `/partner-referrals` | Approved credit/investment partner referral | ECO-01 | Disclosure/consent/attribution; no direct regulated execution |
| `/help` | Approved assistance and support entry | SVC-05, SVC-09 | Accessible public guidance; private tickets require identity |

## Authenticated route map

### B2C customer dashboard

Normative detail: [customer dashboard](dashboards/customer.md).

- `/account` — Summary: policy count, pending orders, next installment, renewal actions
- `/account/policies` — Policy reference masked, product, insured label, carrier, effective/expiry dates, state
- `/account/quotes` — Quote reference, product, carrier count, amount/unit, validUntil, state
- `/account/orders` — Order reference, product, payable, payment/submission/issuance/delivery states
- `/account/payments` — Receipt reference, amount/unit, allocation, provider verification state
- `/account/installments` — Contract, due date, principal/fee breakdown, paid/balance, arrears state
- `/account/renewals` — Expiring policy, expiry, eligible action, application status
- `/account/people-and-assets` — Authorized people, dependents, addresses, vehicles, property/devices
- `/account/claims` — Claim reference, insured policy, incident date, stage, action required
- `/account/documents` — Document category, policy/order, version, issue date, availability
- `/account/wallet-and-rewards` — Separate cash/refund/commission/promo balances; points, mission progress, badges, rewards, approved draw/charity eligibility and expiry
- `/account/garage` — Vehicle label, policy/obligation deadlines, official inquiry category/provider/provenance/as_of, payable/receipt/pending settlement and service bookings
- `/account/support` — Ticket reference, topic, stage, assigned team, last response
- `/account/notifications` — Template subject, category, unread, createdAt
- `/account/settings` — Profile, sessions, authentication, communication preferences, active mandates
- `/account/referrals` — Own code/link, qualifying event category, pending/confirmed/reversed reward, budget/expiry disclosure
- `/account/vehicle-alerts` — Authorized vehicle, obligation category, preference, SMS subscription term/fee/expiry, renewal state
- `/account/vehicle-utilities` — Authorized document wallet, road-condition provider/source/as_of, technical-report availability and limitations

### Corporate buyer dashboard

Normative detail: [corporate dashboard](dashboards/corporate.md).

- `/org/:orgId` — Portfolio count, pending approvals, enrollment exceptions, due invoices
- `/org/:orgId/portfolio` — Policy/master reference, product, carrier, covered population, effective/expiry, status
- `/org/:orgId/branches` — Branch, department, cost center, parent, active status
- `/org/:orgId/benefits` — Plan/class, contract version, enrollment windows, aggregate eligible/accepted counts
- `/org/:orgId/census` — Member business ID masked, enrollment relation, class, dates, validation state
- `/org/:orgId/assets` — Asset/vehicle label, schedule version, location, coverage state
- `/org/:orgId/quotes` — Proposal revision, schedule checksum, carrier, comparable amount, deviations
- `/org/:orgId/approvals` — Request, maker, budget, amount/unit, version, due date
- `/org/:orgId/billing` — Invoice, due date, premium/fees, allocated/remaining, credit exposure
- `/org/:orgId/renewals` — Contract, expiry, census/schedule delta, proposal state
- `/org/:orgId/contracts` — Agreement version, parties, term, billing/approval terms, signature state
- `/org/:orgId/reports` — Premium, enrollment and suppressed aggregate claims utilization
- `/org/:orgId/team` — Member, role, branch scope, invitation/session state, last review
- `/org/:orgId/settings` — Notification routing, locale, approved HR connection status

### Employee / beneficiary dashboard

Normative detail: [beneficiary dashboard](dashboards/beneficiary.md).

- `/benefits` — Own organization relationships, active/pending benefits, actions required
- `/benefits/:enrollmentId/coverage` — Benefit category, approved limit wording, network, effective dates, status
- `/benefits/dependents` — Dependent label, relationship, consent state, enrollment dates, status
- `/benefits/certificates` — Certificate, insured label, master plan, issue/effective dates
- `/benefits/claims` — Own claim reference, incident date, stage, action required
- `/benefits/providers` — Contract network, service category, location, verification time
- `/benefits/changes` — Change request, effective date, insurer acknowledgment, status
- `/benefits/support` — Private support tickets, benefit FAQs, assigned team
- `/benefits/notifications` — Enrollment/claim notices, unread, createdAt
- `/benefits/settings` — Consent, contact, language/calendar, notification choices

### Reseller / agent dashboard

Normative detail: [seller dashboard](dashboards/seller.md).

- `/seller` — Lead funnel, tasks, pending commissions, renewal actions
- `/seller/onboarding` — Contract version, required documents, review stage, training
- `/seller/leads` — Lead reference, consented contact masked, product, owner, stage
- `/seller/customers` — Mandated customer label, allowed products, mandate expiry
- `/seller/quotes` — Quote/proposal, customer, carrier, revision, validity, stage
- `/seller/orders` — Order, distribution reference, amount, independent states
- `/seller/portfolio` — Policy reference masked, product, expiry, permitted insured label
- `/seller/renewals` — Assigned policy, due date, consent state, renewal attribution
- `/seller/team` — Member, role, assigned scope, invitation/training state
- `/seller/commissions` — Transaction, basis, pending/confirmed/reversed, amount/unit
- `/seller/wallet` — Distinct commission/cash/promo balances and holds
- `/seller/training` — Module, required version, completion, expiry
- `/seller/reports` — Sales/renewal/conversion/commission aggregates with as_of
- `/seller/settings` — Profile, attribution codes, notices, sessions, payout-recipient status

### Carrier / supplier dashboard

Normative detail: [carrier dashboard](dashboards/carrier.md).

- `/partner` — Own incoming workload, issuance exceptions, settlement status
- `/partner/submissions` — Submission/business ref, product, receivedAt, state, application version
- `/partner/underwriting` — Case, risk category, assigned reviewer, due date, evidence status
- `/partner/issuance` — Order/application ref, accepted version, policy reference, document state
- `/partner/portfolio` — Own policy reference, product, permitted insured fields, effective dates, status
- `/partner/product-proposals` — Form/plan/rule proposal version, validation, review, effective time
- `/partner/claims` — Own claim reference, assigned case, incident/stage, evidence needed
- `/partner/settlements` — Statement, premium/commission/refund totals, payable, reconciled state
- `/partner/api-transactions` — Correlation, operation, mapping version, masked result, latency, delivery status
- `/partner/service-orders` — Own booking/parts reference, fulfillment status, permitted contact/address
- `/partner/team` — Staff role, product scope, invitation/review status
- `/partner/settings` — Organization profile, notification routing, credential metadata, API-only mode

### Platform administrator dashboard

Normative detail: [admin dashboard](dashboards/admin.md).

- `/admin` — Operational summaries, pending approvals, release blockers
- `/admin/features` — Key, type, scope, proposed/effective version, dependencies, rollout, reason
- `/admin/organizations` — Legal entity, buyer/supplier/distributor relationships, onboarding, tenant state
- `/admin/catalog` — Category/product/plan, form/rule version, availability, review state
- `/admin/underwriting` — Case queues, inspection evidence state, assignment and SLA state
- `/admin/orders-policies` — Order, payment/submission/issuance/delivery states, policy reference
- `/admin/finance` — Reconciliation, allocations, commissions, refunds, settlements, payouts
- `/admin/claims-support` — Claim/ticket counts, stage, assignment, escalation
- `/admin/corporate` — Contracts, census batches, proposals, approvals, billing exceptions
- `/admin/commissions` — Contract rule version, accrual/reversal rules, payout exceptions
- `/admin/marketing` — Campaign/segment/budget, referral/loyalty rules, rewards, CMS revisions
- `/admin/automotive` — Providers, services, parts catalogs, inventory, trading/referral controls
- `/admin/integrations` — Partner capabilities, mapping/auth metadata, sandbox/live, health, unknown outcomes
- `/admin/reports` — Approved reports, dataset freshness, field policy, export requests
- `/admin/security-audit` — Access events, privileged reasons, role changes, security incidents
- `/admin/settings` — Menu/widget/action/report definitions, locales, templates, environment metadata

### Operational staff workbench

Normative detail: [operations dashboard](dashboards/operations.md).

- `/ops` — Assigned queue counts, oldest age, due work, blocked cases
- `/ops/underwriting` — Case, product, evidence completeness, due date, version
- `/ops/inspections` — Booking, checklist, secure evidence status, retake reason, expiry
- `/ops/issuance` — Committed order, last attempt, acknowledgment, policy evidence, ambiguity state
- `/ops/reconciliation` — Payment/order/ledger/provider refs, unmatched amount, age, owner
- `/ops/refunds-settlements` — Proposal, recipient verified status, amount/unit, maker, checker, state
- `/ops/claims` — Claim, policy, assignment, stage, required evidence, review deadline
- `/ops/support` — Ticket, consent scope, topic, priority, owner, SLA state
- `/ops/import-export` — Batch, source/schema, row counts, errors, approval, progress
- `/ops/fulfillment` — Booking/parts order, provider, promised slot, shipping/return state
- `/ops/partner-exceptions` — Partner/operation, capability/mapping version, failure class, next permitted action
- `/ops/knowledge` — Approved procedure version, product/carrier, last verified date
- `/ops/notifications` — Assigned case notices, shift handover, unread state
- `/ops/settings` — Queue subscriptions, accessibility, language, active sessions
- `/ops/policy-delivery` — Policy/order, authorized recipient, document version, link/SMS/email/courier method, delivery state, last attempt
- `/ops/policy-changes` — Policy, endorsement/cancellation request type, requested/approved/effective dates, carrier acknowledgment, financial adjustment state

## Route conformance

The [feature surface map](../_meta/fragments/feature-surface-map.json) maps every baseline parent capability to these real task surfaces and owning specification/role. A feature may share a screen with other capabilities through distinct forms/panels; a background contract has an explicit no-standalone-screen reason and an operational inspection/exception surface. This does not create `/workspace/*` alias pages or imply that every child action is available to every role visiting a route. The feature specification supplies the action-specific rules, and server authorization remains authoritative.

AC-EXP-ROUTES-REGISTER: every published menu/action links to a registered route and domain operation. AC-EXP-ROUTES-DENY: direct navigation, prefetch, server rendering and client transitions enforce the same denial behavior with two users/two tenants. AC-EXP-ROUTES-MODES: cover all four B2C/B2B combinations, independent subchannels, servicing and quarantine. AC-EXP-ROUTES-INDEX: private routes are excluded from public indexing and shared caches; redirects cannot leak private resource titles. R07 owns route implementation, R11 authorization review and R13 coverage evidence. Registry presence is not proof that the screens exist.
