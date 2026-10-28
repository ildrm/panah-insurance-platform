#!/usr/bin/env python3
"""Deterministically render owned product, experience and guide documentation.

This is documentation tooling. It neither implements nor exercises application behavior.
Run from any directory; generated Markdown and fixtures remain under docs/.
"""
from pathlib import Path
import json

DOCS = Path(__file__).resolve().parents[2]
DATE = "2026-10-28"
CHANNEL_CODES = {"B2C":"b2c","B2B.commercial":"commercial","B2B.corporate":"corporate","B2B.reseller":"reseller","B2B2C":"b2b2c"}
INVENTORY_ROUTES = set()
CHANNEL_MAPPING = """## Channel labels and canonical codes

Human-facing channel labels in these specifications map to the wire/domain codes below. API requests, events, persisted context and synthetic canonical examples use the canonical code; labels are display vocabulary, not extra enum values. `B2B` is an umbrella sales mode, not a sixth purchasable channel. A carrier/supplier organization is a commercial relationship, not a channel. An employee's separate personal purchase uses `b2c`; existing beneficiary servicing retains its coverage relationship independently of new-sales availability.

| Display/document label | Canonical code | Parent mode |
|---|---|---|
| B2C | `b2c` | B2C new sales |
| B2B.commercial | `commercial` | B2B plus commercial subchannel |
| B2B.corporate | `corporate` | B2B plus corporate subchannel |
| B2B.reseller | `reseller` | B2B plus reseller subchannel |
| B2B2C | `b2b2c` | B2B plus B2B2C new enrollment; contracted servicing evaluated separately |

Role/context selection never manufactures a channel entitlement. Unknown or display-label values at a strict canonical API boundary are rejected with a typed validation error rather than silently guessed. Import/adapters may translate an explicitly versioned label mapping before canonical validation and record the mapping version.
"""

def write(path, text):
    p = DOCS / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip() + "\n", encoding="utf-8")

def md(path, id, title, role, scopes, text, reviewers=None, sources=None):
    meta = dict(id=id, title=title, status="draft", version="1.0.0", owner_role=role,
                reviewer_roles=reviewers or ["R02", "R04", "R11", "R13", "R20"],
                scope_ids=scopes, source_refs=sources or ["S00"], assumption_refs=["A01"], updated=DATE)
    write(path, "---\n" + json.dumps(meta, ensure_ascii=False, indent=2) + "\n---\n\n# " + title + "\n\n" + text)

COMMON = """## Authority and implementation boundary

This contract is normative within the proposed design, pending the reviews recorded in metadata. The brief establishes desired product families, not their market availability. Field bounds below are input-safety constraints; they are not insurer eligibility rules. No real rate, waiting period, benefit guarantee, legal obligation, carrier access or payout authority is established by this document. Product specifications add differences and may not weaken the security, financial or relationship invariants in the [SRS](../../02-requirements/software-requirements-specification.md).

Every product has independently evaluated discovery, quote, purchase, assisted-sale and servicing capabilities. `product.PRD-NN.new_sales` defaults to `false` for live environments until product/carrier/channel certification is recorded. Local synthetic simulation can explicitly enable it. A product flag never authorizes a person or implies the carrier supports an operation. The authoritative decision also requires channel configuration, valid membership/resource relationship, carrier capability, plan validity and rule version. Each child operation evaluates the effective configuration in the transaction that commits it. Prior committed purchases continue under servicing and partner-delivery controls; a distinct security quarantine can stop unsafe transmission.

## Canonical application fields

The public contract contains these fields plus the family risk fields. Unknown properties are rejected. Client-supplied prices, tenant ownership, approval status and provider references are rejected, not trusted.

| Field | Type and required condition | Bounds, normalization and example | Sensitivity / validation message |
|---|---|---|---|
| applicationId | UUID, server-generated | Immutable opaque identifier; example `00000000-0000-4000-8000-000000000101` | Internal reference / `APPLICATION_REFERENCE_INVALID` |
| version | integer, required for a mutation | >= 1; `If-Match` must match current record | Internal / `APPLICATION_CHANGED_RELOAD` |
| productId | enum, required | One of PRD-01…PRD-24; immutable after first quote | Public taxonomy / `PRODUCT_NOT_SUPPORTED` |
| channel | enum, required | `b2c`, `corporate`, `commercial`, `reseller` or `b2b2c`; server verifies entry point; display labels map below | Internal / `CHANNEL_UNAVAILABLE` |
| organizationContextId | UUID, conditional | Required for organization purchase; forbidden as a grant of personal access | Confidential / `ORGANIZATION_CONTEXT_REQUIRED` |
| parties | array of role/reference pairs, required | Buyer, payer, policyholder and insured are explicit; beneficiary/distributor/requester/approver when applicable; role count <= 100 per bounded interactive application, bulk schedules use separate upload | Confidential / `PARTY_ROLE_OR_CONSENT_INVALID` |
| effectiveDate | ISO date, required before binding | Valid calendar date stored with product timezone and calendar source; never infer midnight UTC from a local date | Confidential / `EFFECTIVE_DATE_INVALID` |
| termCode | string, required before quote | 1–40 ASCII code points, offered by versioned plan configuration; no free-text duration assumptions | Public / `TERM_NOT_OFFERED` |
| currency | ISO currency code, required | Proposed IRR when applicable; amount serialized as integer minor-unit string, never float; UI labels any toman conversion | Financial / `CURRENCY_OR_UNIT_MISMATCH` |
| declarations | versioned answers, conditional | Required declarations from product/form snapshot; boolean acknowledgment is tied to text version and actor/time | Restricted / `DECLARATION_INCOMPLETE` |
| documentRefs | array of UUIDs, conditional | <= 100 per application; only same-resource clean-scanned uploads with permitted purpose; group evidence is a separate batch | Restricted / `DOCUMENT_UNAVAILABLE_OR_UNSAFE` |
| consentRefs | array of versioned references, conditional | Explicit authority to act for another person and transmit fields; no blanket consent inferred from employment | Restricted / `CONSENT_OR_AUTHORITY_REQUIRED` |

String inputs use Unicode NFC, trim surrounding whitespace and reject control characters. Human names remain Unicode; identifiers are never silently transliterated or zero-stripped. Persian/Arabic digits may be normalized to ASCII for defined numeric fields, with the submitted source retained in the audit context when necessary. Dates accept explicit calendar metadata then canonicalize to ISO dates; timestamps use UTC. Integer money strings match `^(0|[1-9][0-9]{0,17})$`; technical maximum is transport safety, not an insurable-value promise. Arrays are versioned lists with stable item IDs. File fields hold upload references, not untrusted URLs. Errors identify a field and stable code without echoing medical, identity or financial values. Nest validation is authoritative; frontend validation is explanatory.

## Relationships and authorization

An application owns its party-role assignments, not the identities themselves. Reference reuse requires both resource access and permission for the current purpose. A payer may see the payable amount and receipt without seeing medical declarations or beneficiary information. A seller's delegated mandate permits only enumerated sales actions and expires independently of a policy. Carrier projections include only the fields the selected contract requires. Employee/beneficiary access follows coverage relationship and does not grant access to employer billing, coworkers or unrelated personal policies. Corporate health administrators manage enrollment and aggregate contract metrics; they cannot inspect diagnoses, individual claims or private declarations. Proposed employer-report minimum cohort is 10, with complementary suppression and restrictions on repeated differencing queries; this is a privacy design proposal, not a legal safe harbor.

## Versioned pricing and comparison

A quote stores immutable product/form/plan/rate/underwriting/mapping/consent versions, normalized coverage, original carrier response reference, explicit currency/unit, premium, fees, taxes, financing costs, total payable, validity instant and assumptions. Missing mandatory rule versions block binding. Actual prices and eligibility come only from an authorized contract-backed source. Local fixtures use fictional offer amounts and explicitly synthetic rules. Comparison never substitutes a missing limit or exclusion with zero. Incomparable benefits show a reason and carrier wording reference. Sponsored ranking is labeled and never hides the ranking criterion.

Expiry is `min(carrier validUntil, permitted plan/rate window)` when both are known. If the carrier supplies no reliable binding validity, the quote is indicative and requires requotation/manual confirmation. A technical UI display lifetime is not a guarantee. Price/evidence/party changes invalidate affected quotes; server revalidates eligibility, evidence freshness, declaration versions, availability and price before purchase commitment.

## Workflow, state and external boundaries

Draft validation → quote requested → partial/complete/indicative offer → accepted application → payment pending or approved B2B credit commitment → committed purchase → carrier submission → underwriting/issuance → confirmed policy → delivery. These are separate records and state machines; a successful payment does not make insurance active. Family-specific review may happen before quote or issuance. Payment verification uses authoritative server evidence and creates the purchase event with the application/payment update in one database transaction. Credit purchases emit an explicit invoiced/credit commitment without asserting cash receipt.

Applications use optimistic version checks; commitment serializes the chosen quote/application and stable idempotency key. Repeating the same key and body returns the original result; changing body under the key returns a conflict. Outbox/inbox records support at-least-once transport. Unknown submission outcomes remain `external_outcome_unknown`; a carrier lacking idempotency or authoritative lookup requires operator reconciliation before replay, cancellation or refund. Manual assistance records actor, reason, source document, approved offer revision and checker where financial/coverage decisions require it; it never bypasses carrier authority.

Policy effective status requires carrier confirmation plus effective-date semantics. Endorsements create versions with effective dates and independent premium/refund effects. Cancellation requests do not cancel coverage until authorized confirmation. Renewal starts a new application with fresh rates, evidence and declarations; prior data is prefilled only with permission. Claims intake, assessment and settlement are separate; the platform may guide or transmit when it lacks authority to decide/pay.

## Evidence, operations and retention

Uploads are constrained by approved MIME signature, size, malware scanning and access-scoped retrieval; URLs are short-lived and not stored in analytics. The UI offers a mobile upload retry that resumes the same upload session instead of duplicating evidence. Requests for supplementary evidence explain the requested category, reviewer and due date. Family documents specify additional evidence. Medical and beneficiary documents receive restricted roles and access audit. Retention periods and deletion/legal-hold obligations remain contract/jurisdiction review blockers; absent a reviewed policy, production collection is disabled and synthetic fixtures remain clearly labeled.

Operators use scoped underwriting, inspection, submission and reconciliation queues. Queue assignment never confers a decision permission. A timeout case contains application/order references, last verified state, masked provider correlation, next permissible action and responsible owner. Customers see honest pending, action-required or reconciliation messages without invented coverage promises. Transactional messages refer to case IDs via authenticated links, not sensitive diagnoses or full identifiers in SMS/email. Promotional communication requires independent preferences and consent.

## Common interaction, telemetry and release evidence

Product routes are `/insurance/PRD-NN`, `/applications/:id`, `/quotes/:id/compare`, `/orders/:id` and `/policies/:id`; organization forms retain an explicit context banner. Loading preserves labels and keyboard focus, empty explains no eligible offers, partial shows completed/pending/timed-out carriers, expired blocks purchase, forbidden reveals no resource existence, read-only exposes permitted servicing, disabled distinguishes new sales from existing obligations, and success distinguishes submission from issuance. Errors preserve safe entered values and identify the correction. RTL uses logical layout properties, LTR isolates identifiers, and date/currency controls expose explicit units. Avoid local persistence of medical, financial or identity drafts; server drafts require authorization on resume.

Budgets are referenced from the [central registry](../../_meta/performance-budgets.yaml): PERF-READ for bounded drafts/policy reads, PERF-WRITE for local mutations, PERF-QUOTE for insurer aggregation, PERF-DISPATCH for committed submission, PERF-WEB and PERF-JS for user routes. Provider duration is measured separately. No private application/quote/policy enters a shared public cache. Analytics record product/channel, coarse outcome and elapsed bucket with pseudonymous journey references; never risk answers, diagnoses, policy numbers or documents. Measure draft-to-quote, quote-to-commit, commit-to-issue, evidence rework and claim handoff outcomes, distinguishing external dependency failures.

Each product acceptance suite must test own/other person, two organizations, payer versus insured visibility, revoked seller mandate, expired evidence/quote, feature changes at commitment, duplicate payment/callback, unknown external outcome and servicing with new sales disabled. Synthetic fixture acceptance is not carrier certification. Human R02/R19 commercial/legal review, R11 privacy review, R12 financial review, R13 execution evidence and R20 operational acceptance remain pending. An implementation is not done until its versioned contract, field validation, negative authorization, state transitions and measured budgets pass; this documentation contains planned tests, not passing application results.
"""

# Family fields are explicit interface constraints; carrier eligibility remains contract-owned.
# field tuple: name, type, requirement, constraint, example, sensitivity, validation code.
PRODUCTS = [
 dict(n=1,title="Motor third-party",kind="standalone; carrier-dependent plans",channels=["B2C","B2B.commercial","B2B.reseller","B2B2C"],
 subject="One identified vehicle and third-party liability exposure. The vehicle owner, driver, payer and policyholder are separate roles; a buyer acting for an owner needs an explicit mandate.",
 fields=[("vehicleRef","UUID","required","owned or delegated vehicle record","00000000-0000-4000-8000-000000000201","confidential","VEHICLE_AUTHORITY_REQUIRED"),("plate","string","conditional on approved inquiry","1–20 characters; format from jurisdiction profile","SYNTH-001","restricted","PLATE_FORMAT_INVALID"),("vehicleClass","enum code","required","versioned carrier-compatible classification","synthetic-passenger","internal","VEHICLE_CLASS_UNMAPPED"),("usageCode","enum code","required","1–40 characters from product form","synthetic-private","internal","USAGE_NOT_OFFERED"),("priorPolicyRef","UUID","optional","authorized policy or verified uploaded evidence","00000000-0000-4000-8000-000000000301","restricted","PRIOR_POLICY_AUTHORITY_REQUIRED"),("noClaimHistoryRef","UUID","conditional for discount","provenance, as-of time and inquiry version required","00000000-0000-4000-8000-000000000401","restricted","NO_CLAIM_EVIDENCE_STALE"),("liabilityPlanCode","string","required","1–40 characters; offered plan snapshot","SYNTH-LIABILITY-A","internal","LIABILITY_PLAN_UNAVAILABLE")],
 rating="Vehicle classification, permitted use, term, liability selections and verified policy/no-claim history are passed to the contract rule engine. Any late-renewal penalty requires a verified versioned rule; the application never derives a penalty from a guessed tariff.",
 evidence="Ownership/authority, prior policy and permitted official no-claim inquiry provenance. If inquiry fails, retain the failure and route uploaded evidence to review; customer edits cannot overwrite official provenance.",
 underwriting="Eligibility includes vehicle/use mapping, owner relationship and insurer rule checks. Motor liability does not automatically require a body inspection; any inspection requirement must come from the plan contract.",
 compare="Compare equivalent liability limits, term, deductible if relevant, payable breakdown and installment eligibility. Distinguish verified no-claim pricing from indicative pricing awaiting evidence.",
 service="Ownership or vehicle corrections use an endorsement with carrier validation. Renewal fetches fresh no-claim history and retains previous-policy linkage. Third-party claims identify incident parties and insurer procedure; the buyer cannot authorize disclosure of another claimant's sensitive evidence.",
 ops="Inquiry-support queue handles provenance discrepancies; underwriting owns unmapped vehicle classes; reconciliation owns paid/unissued cases.",
 scenario="Change no-claim evidence after an offer: the old offer becomes unusable, requotation includes the new evidence version, and no stale discount reaches commitment.",
 fixture={"vehicleClass":"synthetic-passenger","usageCode":"synthetic-private","plate":"SYNTH-001","liabilityPlanCode":"SYNTH-LIABILITY-A"}),
 dict(n=2,title="Comprehensive motor / body",kind="standalone with optional riders",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="One vehicle, scheduled accessories and named covered interests. The registered owner may differ from financing beneficiary and payer; coverage interest must be explicitly captured.",
 fields=[("vehicleRef","UUID","required","authorized vehicle record","00000000-0000-4000-8000-000000000202","confidential","VEHICLE_AUTHORITY_REQUIRED"),("declaredValue","money","required","positive integer minor units, explicit currency/unit","1200000000","financial","VALUE_REQUIRED"),("accessories","array","optional","<= 100 items; unique item IDs with description <= 200 and money value","[{id: SYNTH-A1, value: 1000000}]","confidential","ACCESSORY_SCHEDULE_INVALID"),("perilCodes","array<string>","required","1–30 distinct contract-offered codes","[SYNTH-COLLISION]","internal","PERIL_COMBINATION_INVALID"),("deductibleOption","string","required","1–40 characters from chosen plan","SYNTH-DEDUCT-A","internal","DEDUCTIBLE_UNAVAILABLE"),("inspectionRef","UUID","conditional before issuance","approved, current inspection bound to this vehicle/version","00000000-0000-4000-8000-000000000402","restricted","INSPECTION_REQUIRED"),("territoryCode","string","required","versioned jurisdiction/territory code <= 40","SYNTH-TERRITORY","confidential","TERRITORY_UNMAPPED")],
 rating="Vehicle value, make/model/year, use, accessories, perils, deductible and territory are contract-defined rating inputs. A declared value is not an insurer-approved valuation.",
 evidence="Vehicle identity, ownership/interest, valuation evidence, prior cover, inspection photos/video and accessory evidence. Photo capture records upload purpose and inspection session, not unrestricted camera-library access.",
 underwriting="Inspection may be self-capture or scheduled in person only when the carrier permits it. Reviewer can request retakes; expired inspection or altered risk invalidates approval. Pre-existing damage decisions are carrier-owned.",
 compare="Align insured value, peril set, accessory sublimits, deductible basis and geographic scope; show absent optional perils instead of ranking premiums alone.",
 service="Value/accessory/use changes create an effective-dated endorsement and may require reinspection. Renewal may require a new valuation/inspection. Claims distinguish own-damage evidence, repair estimate and approved insurer decision.",
 ops="Inspection queue tracks retake reasons and expiration. Operators cannot turn an inspection upload into approval or backdate a coverage start.",
 scenario="A customer adds an accessory after inspection approval: affected evidence and quote are revalidated, and issuance cannot reuse an inspection that excludes the changed risk.",
 fixture={"declaredValue":"1200000000","currency":"IRR","perilCodes":["SYNTH-COLLISION"],"deductibleOption":"SYNTH-DEDUCT-A","territoryCode":"SYNTH-TERRITORY"}),
 dict(n=3,title="Motorcycle third-party",kind="standalone",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="A motorcycle and its third-party liability exposure. Capture owner and authorized operator roles without assuming they are the payer.",
 fields=[("motorcycleRef","UUID","required","authorized asset record","00000000-0000-4000-8000-000000000203","confidential","MOTORCYCLE_AUTHORITY_REQUIRED"),("engineCapacityCc","integer","conditional by form","1–100000 technical bound, not eligibility","150","internal","ENGINE_CAPACITY_INVALID"),("powertrainCode","enum code","required","carrier-mapped code <= 40","SYNTH-PETROL","internal","POWERTRAIN_UNMAPPED"),("modelYear","integer","required","explicit calendar; four digits after conversion","2024","internal","MODEL_YEAR_INVALID"),("usageCode","enum code","required","private/commercial classifications are carrier-owned","SYNTH-DELIVERY","internal","USAGE_UNAVAILABLE"),("priorPolicyRef","UUID","optional","permission-checked document reference","00000000-0000-4000-8000-000000000303","restricted","PRIOR_POLICY_INVALID"),("liabilityPlanCode","string","required","1–40 characters from published plan","SYNTH-MOTO-A","internal","PLAN_NOT_OFFERED")],
 rating="Motorcycle specification, use, previous policy/no-claim evidence, selected liability and term. Engine/powertrain mappings are distinct from passenger-vehicle mappings.",
 evidence="Registration/ownership authority, previous policy and permitted history inquiry. Delivery use declarations cannot be silently defaulted to private use.",
 underwriting="Contract rules decide allowed usage and vehicle categories. Unknown engine/powertrain combinations enter assisted review rather than selecting the nearest vehicle category.",
 compare="Align liability/term, allowed usage and payment eligibility. Explicitly surface any insurer inability to quote the declared commercial use.",
 service="Ownership/use corrections require approval. Renewal rechecks usage and verified history. Claim guidance addresses incident parties and rider/vehicle evidence without equating rider accident benefits to third-party liability.",
 ops="Product specialist owns unrecognized motorcycle classes; customer support can correct a draft but cannot alter a submitted declaration without a recorded revision.",
 scenario="Two plans accept private use but reject delivery use: changing usage to delivery removes those offers and prevents stale quote selection.",
 fixture={"engineCapacityCc":150,"powertrainCode":"SYNTH-PETROL","modelYear":2024,"usageCode":"SYNTH-DELIVERY","liabilityPlanCode":"SYNTH-MOTO-A"}),
 dict(n=4,title="Fire / property",kind="standalone with peril riders",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="One location's building and/or contents interests. Owner, occupier, tenant and financier are separate roles; the selected interest determines eligible insured values.",
 fields=[("locationRef","UUID","required","authorized address with jurisdiction precision","00000000-0000-4000-8000-000000000204","restricted","LOCATION_REQUIRED"),("occupancyCode","enum code","required","versioned residential/commercial use code","SYNTH-RESIDENTIAL","internal","OCCUPANCY_UNMAPPED"),("constructionCode","enum code","required","carrier-mapped construction class","SYNTH-MASONRY","internal","CONSTRUCTION_REQUIRED"),("areaM2","decimal string","required","positive, <= 12 digits and 2 decimals","85.50","confidential","AREA_INVALID"),("buildingValue","money","conditional for building cover","nonnegative; positive if building selected","9000000000","financial","BUILDING_VALUE_REQUIRED"),("contentsValue","money","conditional for contents cover","nonnegative; positive if contents selected","500000000","financial","CONTENTS_VALUE_REQUIRED"),("perilCodes","array<string>","required","1–30 unique carrier-offered codes","[SYNTH-FIRE]","internal","PERIL_DEPENDENCY_INVALID")],
 rating="Location/risk zone, occupancy, construction, area, building/contents values and peril choices. Rebuild-value and market-value semantics are declared by each carrier; never mix them in comparison.",
 evidence="Address/interest evidence, value basis, occupancy declaration and requested inspection. Floor-area evidence or hazardous-storage declarations are conditional form fields.",
 underwriting="Inspection trigger and catastrophe limits are contract-defined. Mixed-use buildings or unknown construction require assisted classification; missing data cannot be treated as low risk.",
 compare="Separate building and contents limits, peril dependencies, deductibles, valuation basis and exclusions. Earthquake coverage links to PRD-05 only when offered.",
 service="Address relocation, occupancy, construction or values may require a new risk assessment rather than a clerical edit. Renewal revalidates values. Claims capture loss location/peril and owned interest, keeping neighbor documents scoped.",
 ops="Property underwriting owns valuation and occupancy disputes; inspection queues show location only to assigned staff.",
 scenario="A tenant selects building cover without the required insurable-interest evidence: the server requests review and cannot issue a plan based only on the tenant's contents evidence.",
 fixture={"occupancyCode":"SYNTH-RESIDENTIAL","constructionCode":"SYNTH-MASONRY","areaM2":"85.50","buildingValue":"9000000000","contentsValue":"500000000","perilCodes":["SYNTH-FIRE"]}),
 dict(n=5,title="Earthquake coverage",kind="standalone or rider only where contracted",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="Contract-defined earthquake exposure at an identified property. Rider relationships require a compatible base policy/quote and matching insured interest.",
 fields=[("coverageMode","enum","required","standalone or rider; offered mode only","rider","internal","EARTHQUAKE_MODE_UNAVAILABLE"),("basePolicyOrQuoteRef","UUID","required for rider","same permitted property and interest","00000000-0000-4000-8000-000000000305","confidential","BASE_COVER_INCOMPATIBLE"),("locationRef","UUID","required","risk-zone mapping version retained","00000000-0000-4000-8000-000000000205","restricted","LOCATION_UNMAPPED"),("constructionCode","enum code","required","contract-mapped structural category","SYNTH-STRUCTURE-A","internal","STRUCTURE_UNMAPPED"),("insuredValue","money","required","positive; valuation basis explicit","9000000000","financial","VALUE_INVALID"),("limitOption","string","required","offered limit code <= 40","SYNTH-EQ-LIMIT","internal","LIMIT_UNAVAILABLE"),("deductibleOption","string","required","offered deductible code <= 40","SYNTH-EQ-DEDUCT","internal","DEDUCTIBLE_REQUIRED")],
 rating="Geographic risk zone, structural class, value, mode, base coverage and chosen limit/deductible. Hazard mapping source and revision are immutable quote inputs.",
 evidence="Property/interest, construction and base-policy documents; inspection where required. A public map does not establish insurer acceptance or exact risk zone without mapping approval.",
 underwriting="Carrier confirms whether standalone coverage exists or a rider is permitted. A rider cannot outlive or exceed its base-policy compatibility rules; unavailable mode has no purchase CTA.",
 compare="Show standalone versus rider prominently, base-policy dependency, covered peril definition, sublimits and deductible basis. Never combine them as equivalent offers solely by premium.",
 service="Base-policy cancellation/change triggers rider dependency review. Renewal must renew/revalidate the dependency. Claim intake uses the carrier's earthquake definitions and does not infer automatic catastrophe payment.",
 ops="Property specialist resolves base/rider mismatches; absent a documented carrier offering the product remains assisted-information only with live sale disabled.",
 scenario="The base policy is cancelled between quote and purchase: the rider commitment fails dependency validation and offers an authorized assisted path without charging for invalid cover.",
 fixture={"coverageMode":"rider","constructionCode":"SYNTH-STRUCTURE-A","insuredValue":"9000000000","limitOption":"SYNTH-EQ-LIMIT","deductibleOption":"SYNTH-EQ-DEDUCT"}),
 dict(n=6,title="Individual / family supplementary health",kind="standalone or contract-dependent supplementary plan",channels=["B2C","B2B.reseller","B2B2C"],
 subject="One person or a family schedule. Applicant, each adult member, guardian of a dependent, payer, policyholder and benefit recipient have distinct access relationships.",
 fields=[("memberRefs","array<UUID>","required","1–100 stable authorized person refs; batch above this","[00000000-0000-4000-8000-000000000206]","restricted","MEMBER_AUTHORITY_REQUIRED"),("relationshipCodes","map","required","one carrier-compatible relationship per member","{SYNTH-M1: dependent}","restricted","RELATIONSHIP_INVALID"),("birthDates","map<date>","required by rating","valid dates, not future; restricted projection","{SYNTH-M1: 2000-01-01}","restricted","BIRTH_DATE_INVALID"),("baseCoverageRefs","map<UUID>","conditional by plan","verified evidence and current status","{SYNTH-M1: SYNTH-BASE}","restricted","BASE_COVERAGE_REQUIRED"),("healthDeclarationRefs","map<UUID>","conditional by underwriting","member-specific restricted evidence","{SYNTH-M1: SYNTH-DECL}","highly restricted","DECLARATION_REQUIRED"),("benefitPlanCode","string","required","carrier plan version <= 40 code points","SYNTH-HEALTH-A","internal","BENEFIT_PLAN_INVALID"),("networkCode","string","conditional","offered provider-network revision","SYNTH-NET-A","internal","NETWORK_UNAVAILABLE")],
 rating="Member ages under explicit effective-date semantics, relationship, base coverage, selected limits/network and permitted underwriting answers. No diagnosis is sent to analytics, employer or unrelated family members.",
 evidence="Identity/guardian authority, dependent relationship, base insurance and requested medical evidence. Adult dependents can supply medical declarations privately; payer visibility excludes their answers.",
 underwriting="Waiting periods, pre-existing condition handling, age eligibility and network participation are contract-owned. An offer pending medical review is marked conditional and cannot imply coverage acceptance.",
 compare="Compare benefit categories, annual/per-event limits, deductible/copay basis, network version, waiting/eligibility conditions and family member applicability. Missing values remain unknown.",
 service="Dependent additions/removals use effective-dated enrollment and insurer approval. Renewal obtains current consent/declarations. Private health claims are visible to claimant/authorized guardian and assigned claims roles; family payer alone is insufficient.",
 ops="Restricted health underwriting queue; sensitive requests use authenticated inbox, never diagnosis in SMS. Consent revocation affects future sharing while lawful/contractual retention is reviewed.",
 scenario="A parent payer opens an adult dependent's claim URL without a health-data mandate: amount/diagnosis/document access is denied while the payer's receipt remains available.",
 fixture={"memberRefs":["00000000-0000-4000-8000-000000000206"],"relationshipCodes":{"SYNTH-M1":"dependent"},"birthDates":{"SYNTH-M1":"2000-01-01"},"benefitPlanCode":"SYNTH-HEALTH-A","networkCode":"SYNTH-NET-A"}),
 dict(n=7,title="Corporate / group health",kind="negotiated group plan with beneficiary servicing",channels=["B2B.corporate","B2B.commercial","B2B.reseller","B2B2C"],
 subject="An employer/group contract with effective-dated employee/dependent enrollments. Organization buyer/payer, requester, checker, employee insured and dependent beneficiary are separate.",
 fields=[("organizationRef","UUID","required","active permitted buyer tenant","00000000-0000-4000-8000-000000000207","confidential","ORGANIZATION_REQUIRED"),("censusBatchRef","UUID","required","approved row-validation snapshot","00000000-0000-4000-8000-000000000407","restricted","CENSUS_NOT_APPROVED"),("benefitClassCode","string","required per member","1–40 characters mapped to negotiated benefits","SYNTH-CLASS-A","confidential","BENEFIT_CLASS_UNMAPPED"),("enrollmentWindowRef","UUID","required","versioned group contract window","00000000-0000-4000-8000-000000000507","internal","ENROLLMENT_WINDOW_CLOSED"),("effectiveDate","date","required per change","contract timezone, approved date rule","2027-01-01","restricted","ENROLLMENT_DATE_INVALID"),("billingBasisCode","string","required","versioned negotiated billing basis","SYNTH-MONTHLY","financial","BILLING_BASIS_UNAPPROVED"),("proposalVersion","integer","required at commitment","positive; exact checker-approved revision","3","confidential","PROPOSAL_APPROVAL_STALE")],
 rating="Approved census by benefit class, age/relationship distributions where authorized, benefit schedule and negotiated terms. Group-level analytics do not disclose individuals; health histories stay restricted.",
 evidence="Organization authority, group agreement, approved census, dependency evidence and signed proposal. HR feed provenance is retained; employment alone does not grant employer medical-claim access.",
 underwriting="Carrier negotiates aggregate/group terms and any member-specific requirements. Enrollment windows, late additions, pre-existing conditions and effective dates are contract-dependent. Partial row acceptance must be explicit and approved.",
 compare="Compare consistent census versions, benefit classes, network, limits, waiting conditions, billing adjustment method and exclusions. A proposal for a different census is not directly comparable.",
 service="Joiners/leavers/dependent changes create effective-dated roster versions and insurer acknowledgments; billing adjustments reconcile to accepted rows. Renewals support insurer switching and revised census. Employees retain private claim access after permitted employment changes according to policy entitlement.",
 ops="Corporate account team handles negotiation and checker approval; enrollment queue separates rejected rows from committed rows; restricted claims team handles individual records.",
 scenario="An HR import removes a member while a dependent addition is being approved: version conflict forces a new preview and no overlapping unauthorized coverage interval is committed.",
 fixture={"benefitClassCode":"SYNTH-CLASS-A","effectiveDate":"2027-01-01","billingBasisCode":"SYNTH-MONTHLY","proposalVersion":3,"syntheticCensus":{"acceptedRows":18,"rejectedRows":2}}),
 dict(n=8,title="Life / investment-linked life",kind="standalone; investment-linked only under approved contract",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="A life insured with explicit policy owner, contribution payer and versioned beneficiaries. Beneficiary allocation and consent rules come from approved contract/jurisdiction review.",
 fields=[("insuredRef","UUID","required","authorized person and underwriting purpose","00000000-0000-4000-8000-000000000208","restricted","INSURED_AUTHORITY_REQUIRED"),("birthDate","date","required","valid nonfuture date with calendar source","1990-01-01","restricted","BIRTH_DATE_INVALID"),("occupationCode","string","conditional","versioned risk classification <= 40","SYNTH-OCC-A","restricted","OCCUPATION_UNMAPPED"),("beneficiaries","array","required before issue","1–100 party refs with allocation basis points summing 10000 when percentage allocation applies","[{ref:SYNTH-B1,basisPoints:10000}]","highly restricted","BENEFICIARY_ALLOCATION_INVALID"),("contributionAmount","money","required","positive; explicit schedule/currency","1000000","financial","CONTRIBUTION_INVALID"),("contributionFrequency","enum code","required","contract-offered schedule code","SYNTH-MONTHLY","financial","FREQUENCY_UNAVAILABLE"),("illustrationVersion","string","conditional for projection","approved document/version <= 80","SYNTH-ILLUSTRATION-1","financial","ILLUSTRATION_UNAPPROVED"),("medicalDeclarationRef","UUID","conditional","restricted member-specific record","00000000-0000-4000-8000-000000000408","highly restricted","MEDICAL_REVIEW_REQUIRED")],
 rating="Insured age, occupation, medical underwriting, term, benefits, contribution amount/frequency and rider selection. Approved illustrations identify assumptions and guaranteed versus non-guaranteed components; the marketplace invents no return.",
 evidence="Identity/consent, beneficiary designation, declarations, medical evidence when requested and acknowledged approved illustration. Payer access does not imply beneficiary-detail access.",
 underwriting="Carrier decides medical/financial underwriting and acceptable beneficiary arrangements. A provisional illustration is not a binding offer. Risk acceptance and contribution collection have independent states.",
 compare="Align term, insured benefit, contribution schedule, fees, surrender/withdrawal restrictions and approved projection assumptions; do not rank hypothetical returns as guaranteed benefits.",
 service="Beneficiary, contribution or rider changes require versioned insurer endorsement. Lapse/reinstatement and surrender are contract-defined, not ordinary refunds. Claims require claimant relationship and death/benefit evidence through restricted handling.",
 ops="Life specialist reviews illustrations and beneficiary ambiguities; dual control applies to financial disposition and verified recipient changes.",
 scenario="Two concurrent beneficiary edits each total 100%: only the matching application version succeeds, preserving a single approved designation and prior history.",
 fixture={"birthDate":"1990-01-01","occupationCode":"SYNTH-OCC-A","beneficiaries":[{"ref":"SYNTH-B1","basisPoints":10000}],"contributionAmount":"1000000","contributionFrequency":"SYNTH-MONTHLY","illustrationVersion":"SYNTH-ILLUSTRATION-1"}),
 dict(n=9,title="Pension / annuity",kind="contract-defined pension or annuity plan",channels=["B2C","B2B.corporate","B2B.reseller"],
 subject="A contributing member/annuitant, policy owner and permitted payout recipient; employer contribution may differ from personal ownership.",
 fields=[("annuitantRef","UUID","required","authorized insured/member relationship","00000000-0000-4000-8000-000000000209","restricted","ANNUITANT_REQUIRED"),("birthDate","date","required","valid nonfuture date","1985-01-01","restricted","BIRTH_DATE_INVALID"),("contributionAmount","money","required","positive exact integer amount","2000000","financial","CONTRIBUTION_INVALID"),("contributionTermCode","string","required","offered term <= 40 characters","SYNTH-TERM-A","financial","TERM_UNAVAILABLE"),("payoutOptionCode","string","required","contract-supported benefit option","SYNTH-PAYOUT-A","financial","PAYOUT_OPTION_UNAVAILABLE"),("plannedStartDate","date","required","explicit local-date semantics; eligibility from contract","2040-01-01","confidential","START_DATE_INELIGIBLE"),("illustrationVersion","string","required for benefit display","approved version <= 80","SYNTH-PENSION-ILL-1","financial","BENEFIT_ILLUSTRATION_REQUIRED")],
 rating="Contribution schedule, duration, age and approved payout option/illustration. Mortality/return assumptions are carrier-provided and versioned, not calculated from unsupported marketplace estimates.",
 evidence="Member identity/authority, contribution ownership, approved terms/illustration acceptance and any employer plan agreement.",
 underwriting="Eligibility, vesting, transfer, early exit and payout timing require plan rules. Missing approved payout terms block purchase, not merely hide a disclosure.",
 compare="Compare equivalent contribution horizon and payout basis; distinguish guaranteed, projected and conditional amounts, fees and withdrawal restrictions.",
 service="Contribution changes, suspension, transfer or early exit follow the plan workflow and may require revised illustrations. Maturity/payout initiation requires recipient verification and separate settlement authority; renewal is not presumed for long-duration contracts.",
 ops="Pension specialist handles benefit illustration questions; finance tracks contributions independently of insurer benefit accrual statements.",
 scenario="An expired illustration is selected after the contribution frequency changes: commitment requires a new approved illustration and renewed acknowledgment.",
 fixture={"birthDate":"1985-01-01","contributionAmount":"2000000","contributionTermCode":"SYNTH-TERM-A","payoutOptionCode":"SYNTH-PAYOUT-A","plannedStartDate":"2040-01-01","illustrationVersion":"SYNTH-PENSION-ILL-1"}),
 dict(n=10,title="Travel",kind="standalone trip or contract-defined multi-trip plan",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="Named travelers and an explicit itinerary. Buyer/payer may be an employer or organizer; each traveler retains private medical/claim records.",
 fields=[("travelerRefs","array<UUID>","required","1–100 authorized traveler records","[00000000-0000-4000-8000-000000000210]","restricted","TRAVELER_AUTHORITY_REQUIRED"),("destinationCodes","array<string>","required","1–100 ISO/configured destination codes, unique","[SYNTH-DEST-A]","confidential","DESTINATION_UNSUPPORTED"),("departureDate","date","required","valid itinerary-local date","2027-02-01","confidential","DEPARTURE_DATE_INVALID"),("returnDate","date","required for single trip","not before departure; duration contract-validated","2027-02-10","confidential","RETURN_DATE_INVALID"),("tripTypeCode","string","required","offered single/multi-trip category","SYNTH-SINGLE","internal","TRIP_TYPE_UNAVAILABLE"),("assistancePlanCode","string","required","versioned assistance/coverage plan","SYNTH-TRAVEL-A","internal","ASSISTANCE_PLAN_UNAVAILABLE"),("passportEvidenceRef","UUID","conditional by contract","restricted evidence, never analytics payload","00000000-0000-4000-8000-000000000410","highly restricted","TRAVEL_DOCUMENT_REQUIRED")],
 rating="Traveler ages, destination eligibility, dates/duration, trip type and selected benefit/assistance limits. Travel-document or visa requirements are not inferred without authoritative provider evidence.",
 evidence="Traveler identity, itinerary, travel documents when required and declarations. Only necessary fields reach the insurer/assistance provider.",
 underwriting="Destination/date restrictions and pre-departure requirements are carrier-owned; unsupported destinations show no binding offer. Late purchase after departure is reviewed, not automatically accepted.",
 compare="Align geographic scope, trip dates, assistance network/contact availability, emergency limits, deductibles and exclusions; show multi-trip duration constraints separately.",
 service="Date/destination corrections may require cancellation/reissue under contract. Extension is not assumed. Emergency claims guidance remains available with new sales off and gives verified assistance instructions, not medical advice.",
 ops="Travel assistance queue distinguishes urgent contact routing from claim adjudication; stale assistance contact data blocks publication of that contact until verified.",
 scenario="The destination changes after pricing: the old quote is invalidated and a carrier that does not cover the new destination cannot be selected.",
 fixture={"destinationCodes":["SYNTH-DEST-A"],"departureDate":"2027-02-01","returnDate":"2027-02-10","tripTypeCode":"SYNTH-SINGLE","assistancePlanCode":"SYNTH-TRAVEL-A"}),
 dict(n=11,title="Pilgrimage / Karbala",kind="special-destination travel plan where contracted",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="Named pilgrims in an individual/group itinerary with destination and organizer roles distinct from insurer or assistance provider.",
 fields=[("travelerRefs","array<UUID>","required","1–100 authorized refs; larger groups use bulk workflow","[00000000-0000-4000-8000-000000000211]","restricted","TRAVELER_AUTHORITY_REQUIRED"),("destinationPlanCode","string","required","explicit offered pilgrimage destination/program <= 40","SYNTH-PILGRIMAGE-A","confidential","PILGRIMAGE_PLAN_UNAVAILABLE"),("departureDate","date","required","explicit calendar/timezone context","2027-03-01","confidential","DEPARTURE_DATE_INVALID"),("durationDays","integer","required","1–3660 technical bound; actual max from carrier","7","internal","DURATION_NOT_OFFERED"),("organizerRef","UUID","optional","authorized organizer relationship","00000000-0000-4000-8000-000000000311","confidential","ORGANIZER_AUTHORITY_REQUIRED"),("assistancePlanCode","string","required","versioned emergency/assistance plan","SYNTH-PILGRIM-HELP","internal","ASSISTANCE_PLAN_UNAVAILABLE"),("requiredTravelEvidenceRef","UUID","conditional","contract-defined evidence only","00000000-0000-4000-8000-000000000411","highly restricted","TRAVEL_EVIDENCE_REQUIRED")],
 rating="Destination/program, traveler age, departure/duration, group size if contracted and assistance benefits. Do not assume a standard travel product satisfies a pilgrimage program.",
 evidence="Traveler identity, program/itinerary evidence and any contract-required travel document. Religious affiliation is not collected as a general profile attribute.",
 underwriting="Special destination eligibility, provider authority and assistance availability require explicit agreements. Unavailable program rules keep sale disabled while general guidance may be shown.",
 compare="Compare same destination/date program, assistance limits and verified provider availability; distinguish a pilgrimage-specific offering from generic travel coverage.",
 service="Group changes and date extensions require accepted roster/plan amendments. Claims guidance uses program-specific authorized contacts; organizer cannot access travelers' medical records merely by arranging the trip.",
 ops="Program specialist verifies assistance routes and seasonal plan versions; group organizer sees enrollment completeness without health declarations.",
 scenario="An organizer exports a group list: the export contains approved enrollment fields and certificates only, excluding traveler medical declarations and claim evidence.",
 fixture={"destinationPlanCode":"SYNTH-PILGRIMAGE-A","departureDate":"2027-03-01","durationDays":7,"assistancePlanCode":"SYNTH-PILGRIM-HELP"}),
 dict(n=12,title="Physicians professional liability",kind="professional liability; assisted variants",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="A named professional's declared practice risk; clinic employer, buyer, payer and insured physician may differ.",
 fields=[("professionalRef","UUID","required","authorized person/profile","00000000-0000-4000-8000-000000000212","restricted","PROFESSIONAL_AUTHORITY_REQUIRED"),("credentialRef","UUID","required","verified professional credential evidence/version","00000000-0000-4000-8000-000000000412","restricted","CREDENTIAL_REQUIRED"),("specialtyCode","string","required","carrier-mapped specialty <= 60","SYNTH-SPECIALTY-A","confidential","SPECIALTY_UNMAPPED"),("practiceLocations","array<UUID>","required","1–100 permitted practice addresses","[00000000-0000-4000-8000-000000000512]","confidential","PRACTICE_LOCATION_REQUIRED"),("procedureCodes","array<string>","conditional","<= 100 declared contract categories","[SYNTH-PROCEDURE-A]","restricted","PROCEDURE_DECLARATION_REQUIRED"),("priorClaimDeclarationRef","UUID","conditional by plan","restricted declaration with source version","00000000-0000-4000-8000-000000000612","highly restricted","CLAIM_HISTORY_REQUIRED"),("limitOption","string","required","offered limit/aggregate basis code","SYNTH-PROF-LIMIT","financial","LIMIT_UNAVAILABLE")],
 rating="Specialty, procedures, practice locations, prior claims, limit and coverage trigger basis. Credential validation is an authorized evidence check, not a platform license determination.",
 evidence="Professional credential, practice/organization relationship, prior policy and requested claims declarations. Patient records are excluded from quote intake unless an approved narrowly scoped underwriting need exists.",
 underwriting="High-risk procedures, expired credentials and claims history may require manual carrier review. Claims-made versus occurrence, retroactive dates and reporting periods must be explicit carrier terms.",
 compare="Align specialty/procedure scope, per-claim/aggregate limits, coverage trigger, retroactive/reporting terms, deductible and exclusions. Incompatible trigger bases are labeled non-equivalent.",
 service="Specialty, practice or procedure changes require endorsement; renewal preserves required continuity evidence. Claim intake minimizes patient identity and restricts medical/legal documents to authorized handlers.",
 ops="Professional-liability underwriter owns scope/trigger interpretation; support does not promise defense or settlement coverage.",
 scenario="The selected plan omits a declared procedure: the server cannot bind it by hiding the procedure; it requests a revised offer or authorized review.",
 fixture={"specialtyCode":"SYNTH-SPECIALTY-A","procedureCodes":["SYNTH-PROCEDURE-A"],"limitOption":"SYNTH-PROF-LIMIT"}),
]

PRODUCTS += [
 dict(n=13,title="Elevator liability",kind="equipment-related liability",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="An identified elevator at a building, its operator/owner interests and declared third-party liability exposure; maintenance contractor is a separate relationship.",
 fields=[("buildingRef","UUID","required","authorized building/address","00000000-0000-4000-8000-000000000213","confidential","BUILDING_AUTHORITY_REQUIRED"),("equipmentIdentifier","string","required","1–100 NFC characters, unique within building","SYNTH-LIFT-01","confidential","ELEVATOR_IDENTIFIER_REQUIRED"),("capacityPersons","integer","conditional by equipment type","1–10000 technical bound","8","internal","CAPACITY_INVALID"),("capacityKg","integer","required","1–1000000 technical bound","600","internal","CAPACITY_INVALID"),("stopCount","integer","required","1–1000 technical bound","6","internal","STOP_COUNT_INVALID"),("maintenanceEvidenceRef","UUID","conditional by carrier","current agreement/service evidence","00000000-0000-4000-8000-000000000413","restricted","MAINTENANCE_EVIDENCE_REQUIRED"),("inspectionEvidenceRef","UUID","conditional before issue","approved provider inspection with expiry","00000000-0000-4000-8000-000000000513","restricted","INSPECTION_EXPIRED"),("limitOption","string","required","offered per-person/per-event basis","SYNTH-LIFT-LIMIT","financial","LIMIT_UNAVAILABLE")],
 rating="Equipment capacity, stops, use, building occupancy, maintenance/inspection status and liability limits; technical field bounds never imply the carrier accepts that equipment.",
 evidence="Building/operator authority, elevator identity, service agreement and authorized inspection certificate where required.",
 underwriting="Inspection/maintenance requirements and expiry are carrier-defined. A service booking is not an inspection certificate. Mixed passenger/freight use requires correct classification.",
 compare="Align equipment, covered operator interests, per-person/per-event/aggregate limits, maintenance conditions and exclusions.",
 service="Equipment replacement, capacity change or maintenance interruption requires risk review. Renewal rechecks certificates. Incident intake records equipment and injured-party relationship without exposing unrelated resident information.",
 ops="Equipment-liability queue tracks evidence expiry; operators cannot approve a plan from an unverified maintenance invoice.",
 scenario="Inspection expires after quote but before commitment: binding is blocked pending current evidence while policy-vault access for existing coverage continues.",
 fixture={"equipmentIdentifier":"SYNTH-LIFT-01","capacityPersons":8,"capacityKg":600,"stopCount":6,"limitOption":"SYNTH-LIFT-LIMIT"}),
 dict(n=14,title="Sports",kind="participant/activity cover through authorized issuer",channels=["B2C","B2B.corporate","B2B.commercial","B2B.reseller","B2B2C"],
 subject="Named participants in a declared sport, activity or event. Club/organizer purchaser is distinct from participant and guardian.",
 fields=[("participantRefs","array<UUID>","required","1–100 authorized refs; larger rosters use bulk","[00000000-0000-4000-8000-000000000214]","restricted","PARTICIPANT_AUTHORITY_REQUIRED"),("sportCode","string","required","carrier/issuer classification <= 60","SYNTH-SPORT-A","internal","SPORT_UNMAPPED"),("activityLevelCode","string","required","offered recreational/competition classification","SYNTH-RECREATIONAL","internal","ACTIVITY_LEVEL_UNAVAILABLE"),("eventRef","UUID","optional","authorized event/organizer reference","00000000-0000-4000-8000-000000000314","confidential","EVENT_AUTHORITY_REQUIRED"),("periodStart","date","required","explicit activity-local date","2027-04-01","confidential","PERIOD_INVALID"),("periodEnd","date","required","not before start","2027-04-02","confidential","PERIOD_INVALID"),("issuerPlanCode","string","required","authorized issuer plan/version","SYNTH-SPORT-PLAN","internal","ISSUER_NOT_AUTHORIZED")],
 rating="Sport, activity level, participant ages where required, period and benefit plan. A general accident plan cannot be presented as an authorized sports membership or certificate unless contract supports it.",
 evidence="Participant/guardian authority, event/club relationship and contract-required eligibility evidence. Health data is requested only where underwriting requires it.",
 underwriting="High-risk activity and competition eligibility are issuer-specific. Coverage/certificate authority must be verified; no invented official federation relationship.",
 compare="Align sport/activity level, dates, benefit basis, excluded activities and certificate/issuer purpose; distinguish insurance from membership service.",
 service="Participant substitution or activity/date changes require approval. Renewal checks current activity and issuer rules. Claims capture incident/activity evidence with private medical intake.",
 ops="Sports program operator verifies issuer authority and roster; organizer sees enrollment outcome, not participants' diagnoses.",
 scenario="A recreational quote is reused for a competition event: server rejects the mismatched activity and requires a permitted plan or assisted review.",
 fixture={"sportCode":"SYNTH-SPORT-A","activityLevelCode":"SYNTH-RECREATIONAL","periodStart":"2027-04-01","periodEnd":"2027-04-02","issuerPlanCode":"SYNTH-SPORT-PLAN"}),
 dict(n=15,title="Personal accident",kind="individual/group accident plan",channels=["B2C","B2B.corporate","B2B.commercial","B2B.reseller","B2B2C"],
 subject="Named insured people with occupation/activity exposure, benefit recipients and beneficiary designations distinct from payer.",
 fields=[("insuredRefs","array<UUID>","required","1–100 authorized refs","[00000000-0000-4000-8000-000000000215]","restricted","INSURED_AUTHORITY_REQUIRED"),("occupationCode","string","required","versioned risk code <= 60","SYNTH-OCC-B","restricted","OCCUPATION_UNMAPPED"),("activityCodes","array<string>","required","1–100 distinct declared categories","[SYNTH-ACTIVITY-A]","restricted","ACTIVITY_REQUIRED"),("benefitPlanCode","string","required","offered death/disability/expense structure","SYNTH-ACCIDENT-A","internal","BENEFIT_PLAN_UNAVAILABLE"),("beneficiaryRefs","array<UUID>","conditional by benefit","authorized designation, allocation contract-validated","[00000000-0000-4000-8000-000000000315]","highly restricted","BENEFICIARY_REQUIRED"),("territoryCode","string","required","offered geographic scope <= 40","SYNTH-TERRITORY","internal","TERRITORY_UNAVAILABLE"),("termCode","string","required","offered period code <= 40","SYNTH-ANNUAL","internal","TERM_UNAVAILABLE")],
 rating="Occupation/activity class, age where applicable, benefits, territory and term. Disability schedules and definitions are insurer-provided; they are never reconstructed from a percentage guess.",
 evidence="Identity, insured/guardian consent, activity declaration and beneficiary designation. Employer-paid individual benefits remain private to the insured as appropriate.",
 underwriting="Occupational or hazardous activity eligibility requires exact mapping. Unknown activity goes to assisted review, not an optimistic default.",
 compare="Align death/disability/medical expense benefit basis, sublimits, activity scope, territory, deductible and exclusions; distinguish accident cover from health or life cover.",
 service="Occupation/activity changes may need endorsement. Renewal refreshes exposure and beneficiaries. Claim assessment uses carrier definitions and claimant authority; payout requires approved recipient verification.",
 ops="Accident specialist handles activity mapping; restricted claims queue handles injury evidence and reassessment requests.",
 scenario="Employer payer requests an employee's injury attachments: payer permission is insufficient and response excludes medical evidence even when the employer funded the premium.",
 fixture={"occupationCode":"SYNTH-OCC-B","activityCodes":["SYNTH-ACTIVITY-A"],"benefitPlanCode":"SYNTH-ACCIDENT-A","territoryCode":"SYNTH-TERRITORY","termCode":"SYNTH-ANNUAL"}),
 dict(n=16,title="Mobile-device protection",kind="insurance or contract-specific protection; classification disclosed",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="A uniquely identified device and authorized owner's interest. Seller warranty, repair service and insurance are distinct products and must not share a misleading insurance label.",
 fields=[("deviceModelCode","string","required","catalog/contract mapping <= 80","SYNTH-PHONE-A","internal","DEVICE_MODEL_UNMAPPED"),("deviceIdentifier","string","required","1–64 characters; scheme-specific validation, encrypt/mask","SYNTH-DEVICE-0001","restricted","DEVICE_IDENTIFIER_INVALID"),("purchaseDate","date","required","nonfuture; calendar source explicit","2026-09-01","confidential","PURCHASE_DATE_INVALID"),("declaredValue","money","required","positive explicit currency/unit","50000000","financial","DEVICE_VALUE_INVALID"),("conditionCode","enum code","required","contract-offered new/used/reconditioned category","SYNTH-NEW","internal","CONDITION_UNAVAILABLE"),("purchaseEvidenceRef","UUID","conditional","authorized invoice/ownership evidence","00000000-0000-4000-8000-000000000416","restricted","PURCHASE_EVIDENCE_REQUIRED"),("inspectionRef","UUID","conditional","approved device/condition check","00000000-0000-4000-8000-000000000516","restricted","DEVICE_INSPECTION_REQUIRED"),("perilPlanCode","string","required","offered damage/theft/other structure","SYNTH-DEVICE-PLAN","internal","DEVICE_PLAN_UNAVAILABLE")],
 rating="Device model, age/condition, value, perils and deductible/repair basis. Device identifiers do not authorize scraping carrier/telecom records.",
 evidence="Proof of ownership/purchase, device identifier and prescribed condition evidence. Upload capture excludes unrelated photo-library data and personal content on the device.",
 underwriting="Carrier decides device age, condition, inspection and replacement/repair eligibility. Duplicate active-risk checks use protected identifier matching and permit review for legitimate transfers.",
 compare="Align insured value, depreciation, repair/replacement basis, service network, deductible, claim limits and exclusions; distinguish warranty from insurance.",
 service="Device transfer/replacement or identifier correction follows endorsement rules. Renewal may require new inspection/value. Claims use damaged-device evidence and repair provider handoff without collecting user files.",
 ops="Device review queue handles identifier conflicts; repair integration transmits only device/service data and contact details needed for fulfillment.",
 scenario="Two accounts submit the same device identifier concurrently: transactional duplicate-risk review prevents duplicate binding without disclosing the other owner's identity.",
 fixture={"deviceModelCode":"SYNTH-PHONE-A","deviceIdentifier":"SYNTH-DEVICE-0001","purchaseDate":"2026-09-01","declaredValue":"50000000","conditionCode":"SYNTH-NEW","perilPlanCode":"SYNTH-DEVICE-PLAN"}),
 dict(n=17,title="Electronic equipment",kind="scheduled commercial equipment; assisted underwriting",channels=["B2B.commercial","B2B.corporate","B2B.reseller"],
 subject="A schedule of electronic equipment by location/use, owned/leased interests and commercial risk. Equipment lessor and operating organization may differ.",
 fields=[("organizationRef","UUID","required","permitted commercial buyer context","00000000-0000-4000-8000-000000000217","confidential","ORGANIZATION_REQUIRED"),("scheduleBatchRef","UUID","required","approved stable equipment row IDs","00000000-0000-4000-8000-000000000417","restricted","EQUIPMENT_SCHEDULE_INVALID"),("equipmentClassCode","string","required per row","carrier-mapped category <= 80","SYNTH-SERVER","internal","EQUIPMENT_CLASS_UNMAPPED"),("declaredValue","money","required per row","positive with valuation basis","800000000","financial","EQUIPMENT_VALUE_INVALID"),("locationRef","UUID","required per row","authorized site reference","00000000-0000-4000-8000-000000000517","restricted","LOCATION_REQUIRED"),("useCode","string","required per row","declared business use <= 60","SYNTH-DATA-PROCESSING","confidential","USE_UNMAPPED"),("maintenanceEvidenceRef","UUID","conditional","current service evidence","00000000-0000-4000-8000-000000000617","restricted","MAINTENANCE_REQUIRED")],
 rating="Equipment type/value/age/use, locations, protective measures, maintenance, deductibles and optional data/media or interruption sections only if contracted.",
 evidence="Asset schedule with serial references, values/interest, site details and maintenance/inspection evidence. Do not upload device data or customer databases as equipment evidence.",
 underwriting="Carrier reviews high-value or unusual equipment and multi-site aggregation. Asset schedule checksum/version is part of offer approval; unsupported rows cannot disappear silently.",
 compare="Align identical schedule revision, valuation basis, per-item/location/aggregate limits, transit/portable scope and any data-restoration or interruption sections.",
 service="Asset additions/removals/relocation create effective-dated schedule endorsements. Renewal reconciles inventory. Claims identify damaged scheduled assets and loss basis while preserving confidential site security details.",
 ops="Commercial equipment specialist owns schedule exceptions; partial acceptance requires explicit accepted-row list and buyer/checker consent.",
 scenario="An offer prices 99 of 100 rows: comparison shows the excluded row and commitment requires explicit revised schedule approval, never silently insuring an incomplete fleet of equipment.",
 fixture={"equipmentClassCode":"SYNTH-SERVER","declaredValue":"800000000","useCode":"SYNTH-DATA-PROCESSING","syntheticSchedule":{"rowCount":100,"acceptedRows":99}}),
 dict(n=18,title="Engineering",kind="project-specific assisted commercial cover",channels=["B2B.commercial","B2B.reseller"],
 subject="A named engineering/construction project with principal, contractors, subcontractors and other insured interests explicitly scheduled.",
 fields=[("projectName","string","required","1–200 NFC characters","Synthetic Bridge Project","confidential","PROJECT_NAME_REQUIRED"),("projectTypeCode","string","required","carrier-mapped project category <= 80","SYNTH-CIVIL","confidential","PROJECT_TYPE_UNMAPPED"),("siteRefs","array<UUID>","required","1–100 authorized locations","[00000000-0000-4000-8000-000000000218]","restricted","PROJECT_SITE_REQUIRED"),("insuredValue","money","required","positive; value components separate","200000000000","financial","PROJECT_VALUE_INVALID"),("projectStart","date","required","explicit site-local date","2027-01-01","confidential","PROJECT_PERIOD_INVALID"),("projectEnd","date","required","not before start","2028-06-30","confidential","PROJECT_PERIOD_INVALID"),("contractorPartyRefs","array<UUID>","required","1–100 role-linked participants","[00000000-0000-4000-8000-000000000318]","confidential","CONTRACTOR_ROLE_REQUIRED"),("technicalDossierRef","UUID","required for underwriting","versioned design/scope/evidence bundle","00000000-0000-4000-8000-000000000418","highly restricted","TECHNICAL_DOSSIER_REQUIRED")],
 rating="Project type/value components, site hazards, period, parties, construction/testing/maintenance phases and optional liability/interruption sections from contract.",
 evidence="Project contract/scope, values, site plans, engineering dossier, contractor schedule and inspection/risk survey. Dossier documents may contain confidential infrastructure details and need restricted recipients.",
 underwriting="Negotiated insurer review is the default. Carrier may require risk survey, phased acceptance or project conditions. No automated premium or coverage promise is generated from a generic project category.",
 compare="Normalize project/scope/period and dossier version, coverage sections, phase conditions, limits, deductibles and exclusions; display negotiated deviations explicitly.",
 service="Time extensions, contract value changes and party/site changes require endorsed approval. Project completion/maintenance phase transition is explicit; annual renewal is not assumed. Claims preserve project phase, incident and assessment versions.",
 ops="Assigned commercial account owner coordinates proposal revisions and technical reviewer; maker-checker approves the final scope/financial commitment.",
 scenario="A contractor changes the project completion date after checker approval: the approval and quote become stale, requiring a revised proposal before commitment.",
 fixture={"projectName":"Synthetic Bridge Project","projectTypeCode":"SYNTH-CIVIL","insuredValue":"200000000000","projectStart":"2027-01-01","projectEnd":"2028-06-30"}),
 dict(n=19,title="Cargo / transit",kind="shipment or contract-defined open-cover declaration",channels=["B2B.commercial","B2B.reseller","B2C"],
 subject="Declared goods on a defined transport route with shipper, consignee, owner, policyholder and beneficiary interests represented separately.",
 fields=[("cargoDescription","string","required","1–1000 NFC characters; no embedded files","Synthetic machine components","confidential","CARGO_DESCRIPTION_REQUIRED"),("commodityCode","string","required","contract-mapped cargo category <= 80","SYNTH-MACHINERY","confidential","COMMODITY_UNMAPPED"),("insuredValue","money","required","positive; value/currency/valuation basis explicit","750000000","financial","CARGO_VALUE_INVALID"),("originCode","string","required","approved location code <= 80","SYNTH-ORIGIN","confidential","ROUTE_LOCATION_INVALID"),("destinationCode","string","required","approved location code <= 80","SYNTH-DESTINATION","confidential","ROUTE_LOCATION_INVALID"),("transportMode","enum code","required","one or multiple legs explicitly modeled","SYNTH-ROAD","internal","TRANSPORT_MODE_UNAVAILABLE"),("shipmentStart","date","required","route-local effective semantics","2027-05-01","confidential","SHIPMENT_DATE_INVALID"),("transportEvidenceRef","UUID","conditional","invoice/packing/transport document refs","00000000-0000-4000-8000-000000000419","restricted","TRANSPORT_EVIDENCE_REQUIRED")],
 rating="Goods/value/packing, route and legs, transport mode, shipment dates, coverage clauses and contract-defined valuation basis. Trade terms are explicit where needed and never guessed from payer.",
 evidence="Commercial invoice, packing list, transport/consignment document, interest and route evidence. Open-cover declarations reference an approved master agreement and remaining limits.",
 underwriting="Hazardous/perishable goods, route restrictions, unusual packing or shipment already in progress require carrier decision. Backdated coverage is never inferred from an uploaded invoice.",
 compare="Align goods/value/route/mode and clause version, covered transit stages, exclusions, deductible and valuation uplift if contract permits; different routes are non-equivalent.",
 service="Route/value/date changes require insurer acceptance; open-cover declarations use contract limits atomically. Claims capture loss stage, survey and transport evidence; recovery rights and payments remain authorized insurer decisions.",
 ops="Cargo specialist owns shipment urgency and missing documents; operator prioritization cannot bypass effective-date or risk acceptance rules.",
 scenario="A route leg changes after quote and the shipment is already underway: automated bind stops and the case requires explicit carrier review without pretending the earlier quote covers the new route.",
 fixture={"cargoDescription":"Synthetic machine components","commodityCode":"SYNTH-MACHINERY","insuredValue":"750000000","originCode":"SYNTH-ORIGIN","destinationCode":"SYNTH-DESTINATION","transportMode":"SYNTH-ROAD","shipmentStart":"2027-05-01"}),
 dict(n=20,title="Commercial property / assets",kind="multi-site scheduled commercial cover",channels=["B2B.commercial","B2B.corporate","B2B.reseller"],
 subject="An organization's site/asset schedules, ownership/lease interests and declared operating risks; branch/cost center allocations are billing relationships, not independent coverage authority.",
 fields=[("organizationRef","UUID","required","active permitted organization","00000000-0000-4000-8000-000000000220","confidential","ORGANIZATION_REQUIRED"),("siteScheduleRef","UUID","required","approved versioned site rows","00000000-0000-4000-8000-000000000420","restricted","SITE_SCHEDULE_REQUIRED"),("assetScheduleRef","UUID","required","approved values/interests by asset/site","00000000-0000-4000-8000-000000000520","restricted","ASSET_SCHEDULE_REQUIRED"),("occupancyCodes","array<string>","required by site","1–100 distinct mapped use codes","[SYNTH-WAREHOUSE]","confidential","OCCUPANCY_UNMAPPED"),("totalDeclaredValue","money","required","exact sum validated against approved schedule","500000000000","financial","SCHEDULE_TOTAL_MISMATCH"),("valuationBasisCode","string","required","contract-offered basis <= 60","SYNTH-REPLACEMENT","financial","VALUATION_BASIS_REQUIRED"),("riskSurveyRefs","array<UUID>","conditional","site-bound current evidence","[00000000-0000-4000-8000-000000000620]","highly restricted","RISK_SURVEY_REQUIRED")],
 rating="Site/asset values, use, construction/protection, geography, peril/limit structure and negotiated terms. Do not sum mixed currencies before an approved conversion policy exists.",
 evidence="Organization/interest authority, site and asset schedules, valuations and risk surveys. Security/protection plans are restricted and not part of ordinary corporate exports.",
 underwriting="Multi-site exposure and high-risk occupancy require negotiated review. Insurer acceptance explicitly identifies included sites/assets and conditions.",
 compare="Align schedule revisions, valuation basis, site/peril/aggregate sublimits, deductible and optional business-interruption terms; publish a structured deviations table.",
 service="Site acquisition/disposal, asset movement and value changes create effective-dated endorsements and billing allocations. Renewal reconciles schedules. Claims map incident to insured site/assets and avoid exposing other sites' sensitive plans.",
 ops="Commercial property account team owns valuation discrepancies; finance reconciles site allocations to accepted policy premiums, not requested totals.",
 scenario="The sum of row values differs from totalDeclaredValue: the preview reports exact row totals and commitment fails until a checker approves the corrected version.",
 fixture={"occupancyCodes":["SYNTH-WAREHOUSE"],"totalDeclaredValue":"500000000000","valuationBasisCode":"SYNTH-REPLACEMENT","syntheticSchedule":{"sites":3,"currency":"IRR"}}),
 dict(n=21,title="Other liability",kind="assisted professional/public/employer liability variants",channels=["B2C","B2B.commercial","B2B.corporate","B2B.reseller"],
 subject="A declared person/organization's permitted liability exposure. Liability class, insured operations and interested parties must be explicit; this is not an unrestricted catch-all quote.",
 fields=[("liabilityClassCode","string","required","approved professional/public/employer classification <= 80","SYNTH-PUBLIC-LIABILITY","internal","LIABILITY_CLASS_UNAVAILABLE"),("insuredPartyRef","UUID","required","authorized person or legal entity","00000000-0000-4000-8000-000000000221","restricted","INSURED_AUTHORITY_REQUIRED"),("operationsDescription","string","required","1–2000 NFC characters","Synthetic warehouse visitors","confidential","OPERATIONS_REQUIRED"),("exposureMeasures","object","required by class","only versioned named nonnegative decimal measures","{visitorCount:100}","confidential","EXPOSURE_SCHEMA_INVALID"),("locationRefs","array<UUID>","conditional by class","1–100 permitted locations","[00000000-0000-4000-8000-000000000421]","restricted","LOCATION_REQUIRED"),("limitOption","string","required","approved occurrence/aggregate structure","SYNTH-LIABILITY-LIMIT","financial","LIMIT_UNAVAILABLE"),("priorClaimsRef","UUID","conditional by underwriting","restricted declaration version","00000000-0000-4000-8000-000000000521","highly restricted","CLAIM_HISTORY_REQUIRED")],
 rating="Class-specific operations/exposure, locations, prior claims, limit, trigger and deductible. Each new liability class needs a versioned form/rating/underwriting extension before self-service.",
 evidence="Identity/business authority, operations/exposure records, prior cover/claims and class-specific evidence. Employee personal data is minimized for employer-liability exposure counts.",
 underwriting="Default assisted quotation for unmapped classes; an underwriter approves the form schema and carrier contract. Free text cannot be sent as executable mapping or treated as a validated risk class.",
 compare="Compare same liability class, operations, trigger, limits, defense-cost treatment if specified, deductible and exclusions. Non-equivalent classes are excluded from a single price ranking.",
 service="Operation, exposure, location or party changes require endorsed review. Renewal refreshes claims and exposure. Claims require allegation/incident handling without representing the marketplace as legal counsel or adjudicator.",
 ops="Liability specialist assigns proposal owner and insurer negotiation record; support routes coverage disputes to authorized reviewers.",
 scenario="An administrator creates a new liability category without an approved form and adapter mapping: it may be drafted but cannot become purchasable.",
 fixture={"liabilityClassCode":"SYNTH-PUBLIC-LIABILITY","operationsDescription":"Synthetic warehouse visitors","exposureMeasures":{"visitorCount":100},"limitOption":"SYNTH-LIABILITY-LIMIT"}),
 dict(n=22,title="Dental implant",kind="contract-defined health benefit, device protection or rider; classification explicit",channels=["B2C","B2B.corporate","B2B.reseller","B2B2C"],
 subject="An identified eligible treatment/device and patient benefit. Patient, payer, treating provider and benefit recipient are distinct; employer sponsorship gives no access to treatment details.",
 fields=[("patientRef","UUID","required","patient/guardian authority for health purpose","00000000-0000-4000-8000-000000000222","highly restricted","PATIENT_AUTHORITY_REQUIRED"),("treatmentCode","string","required","contract-approved category <= 80","SYNTH-IMPLANT-A","highly restricted","TREATMENT_NOT_ELIGIBLE"),("providerRef","UUID","required","approved provider/network revision","00000000-0000-4000-8000-000000000422","restricted","PROVIDER_NOT_ELIGIBLE"),("deviceModelCode","string","conditional by contract","approved device category <= 80","SYNTH-IMPLANT-MODEL","restricted","DEVICE_NOT_ELIGIBLE"),("treatmentDate","date","conditional before acceptance","explicit proposed/performed status","2027-06-01","highly restricted","TREATMENT_DATE_INVALID"),("clinicalEvidenceRef","UUID","conditional for underwriting","purpose-scoped evidence, restricted review","00000000-0000-4000-8000-000000000522","highly restricted","CLINICAL_EVIDENCE_REQUIRED"),("benefitPlanCode","string","required","approved benefit/exclusion version","SYNTH-DENTAL-PLAN","internal","BENEFIT_PLAN_UNAVAILABLE")],
 rating="Eligible treatment/device/provider, timing, approved benefit conditions and underwriting inputs. No assumption that an implant is covered, medically suitable or guaranteed to succeed.",
 evidence="Patient consent, provider/treatment evidence, device proof and narrowly requested clinical records. Images and clinical details are never employer reports or marketing events.",
 underwriting="Carrier defines pre-authorization, waiting conditions, exclusions, provider eligibility and whether this is insurance, a rider or a service guarantee. Classification must be approved before promotion.",
 compare="Align treatment/device scope, benefit basis, network/provider eligibility, exclusions, waiting conditions and deductible; distinguish insurance benefit from provider warranty.",
 service="Provider/treatment changes require reauthorization. Renewal applies only if product supports it. Claims use restricted clinical evidence and approved treatment/benefit decision; platform gives no diagnosis or treatment recommendation.",
 ops="Restricted dental/health reviewer handles evidence; provider sees only its authorized treatment case and cannot browse the patient's other policies.",
 scenario="Employer admin requests a treatment-level report for nine members: the report suppresses the cohort and complementary totals; individual treatment identifiers are never returned.",
 fixture={"treatmentCode":"SYNTH-IMPLANT-A","deviceModelCode":"SYNTH-IMPLANT-MODEL","treatmentDate":"2027-06-01","benefitPlanCode":"SYNTH-DENTAL-PLAN"}),
 dict(n=23,title="War-related property coverage",kind="contract-defined standalone/rider only; live availability unestablished",channels=["B2C","B2B.commercial","B2B.reseller"],
 subject="Explicitly contracted property exposure and eligible interests. The label does not assert market availability, legal permission, covered causes or insurer authority.",
 fields=[("coverageMode","enum","required","standalone or rider only if contract supports","rider","internal","WAR_COVER_MODE_UNAVAILABLE"),("basePolicyOrQuoteRef","UUID","required for rider","compatible approved property interest","00000000-0000-4000-8000-000000000323","confidential","BASE_POLICY_INCOMPATIBLE"),("propertyRef","UUID","required","authorized property/location","00000000-0000-4000-8000-000000000223","restricted","PROPERTY_AUTHORITY_REQUIRED"),("eligibleTerritoryCode","string","required","explicit contract-mapped geography <= 80","SYNTH-TERRITORY-A","restricted","TERRITORY_NOT_APPROVED"),("insuredValue","money","required","positive with explicit valuation basis","9000000000","financial","VALUE_INVALID"),("perilDefinitionVersion","string","required","approved exact wording/version <= 100","SYNTH-WAR-DEFINITION-1","restricted","PERIL_DEFINITION_UNAPPROVED"),("authorityEvidenceRef","UUID","required before any live offer","reviewed carrier/commercial/legal authority record","00000000-0000-4000-8000-000000000423","restricted","LIVE_AUTHORITY_MISSING")],
 rating="Only actual contract-defined territory, insured interest/value, peril/exclusion definitions, limits and term. The marketplace must not extrapolate fire/earthquake rates or infer conflict-risk pricing.",
 evidence="Property/interest/value evidence, compatible base policy for rider and verified carrier/legal commercial authorization; additional information only from approved forms.",
 underwriting="No live eligibility or offering is presumed. Contract, qualified review and precise peril/exclusion definitions are mandatory blockers. A generic inquiry may collect minimal contact/request details only with explicit consent.",
 compare="Compare only reviewed offers with equivalent exact peril wording, territory, value, dependency, deductible and exclusions. Missing definitions make the offer nonbinding and unsuitable for ranked purchase.",
 service="Base-policy/territory/interest changes require carrier review. Existing valid contracts retain servicing when new sales are disabled. Claims are transmitted under actual authority; no catastrophe/war settlement promise is implied.",
 ops="R02/R19 and partner owner jointly review authority and wording before enablement; ordinary admin overrides cannot bypass this release gate.",
 scenario="A simulated plan exists but authorityEvidenceRef is absent: live discovery cannot show it as available and every live quote/purchase request is rejected with an unavailable/assisted explanation.",
 fixture={"coverageMode":"rider","eligibleTerritoryCode":"SYNTH-TERRITORY-A","insuredValue":"9000000000","perilDefinitionVersion":"SYNTH-WAR-DEFINITION-1","simulationOnly":True}),
 dict(n=24,title="Fleet / other group insurance",kind="master contract with schedules/certificates where supported",channels=["B2B.corporate","B2B.commercial","B2B.reseller","B2B2C"],
 subject="A master contract and a versioned schedule of vehicles, assets or people; each schedule type uses its specific product risk schema. Group buyer/payer is separate from asset owner or individual insured.",
 fields=[("organizationRef","UUID","required","authorized group buyer context","00000000-0000-4000-8000-000000000224","confidential","ORGANIZATION_REQUIRED"),("groupTypeCode","string","required","approved vehicle/asset/person schedule type","SYNTH-FLEET","internal","GROUP_TYPE_UNAVAILABLE"),("scheduleBatchRef","UUID","required","approved row identities/schema/version","00000000-0000-4000-8000-000000000424","restricted","SCHEDULE_NOT_APPROVED"),("underlyingProductId","enum","required per row/group","approved PRD family; no recursive PRD-24","PRD-01","internal","UNDERLYING_PRODUCT_INVALID"),("effectiveDate","date","required per change","contract timezone and effective-window validation","2027-01-01","restricted","GROUP_EFFECTIVE_DATE_INVALID"),("allocationCode","string","required for billing","branch/cost-center mapping <= 60","SYNTH-COST-A","financial","ALLOCATION_INVALID"),("certificateMode","enum code","required","master-only or individual if contract permits","SYNTH-INDIVIDUAL","internal","CERTIFICATE_MODE_UNAVAILABLE"),("proposalVersion","integer","required at commitment","positive approved master/schedule revision","2","confidential","GROUP_APPROVAL_STALE")],
 rating="Underlying per-row product risk, group composition, accepted schedule, negotiated limits/rates and billing terms. Vehicle, property and person rows never share an untyped generic risk blob.",
 evidence="Master agreement, organization authority, row-level ownership/insured relationships and underlying product evidence. Employee/private health fields remain restricted even in mixed group programs.",
 underwriting="Group offer explicitly lists accepted/rejected rows, shared limits and certificate rules. Batch partial acceptance is reviewed and approved; no policy count is inferred from uploaded row count.",
 compare="Use the same schedule revision and underlying coverage definitions; compare aggregate and per-row limits, accepted population, billing method and certificate availability.",
 service="Add/remove/replace schedule rows with effective dates and insurer acknowledgments; avoid overlapping or missing coverage intervals. Renewal reconciles fleet/roster and permits switching. Claims resolve master contract plus insured row/version and never grant group administrator blanket personal-claim access.",
 ops="Group operations reconcile row statuses, certificates and billing totals. A failed row remains a visible exception with owner; retry uses the same row identity and stable request key.",
 scenario="A 20,000-row import includes a duplicate vehicle and two invalid relationships: preview reports all row errors; approved valid rows commit under the chosen partial policy, and retries cannot duplicate certificates or charges.",
 fixture={"groupTypeCode":"SYNTH-FLEET","underlyingProductId":"PRD-01","effectiveDate":"2027-01-01","allocationCode":"SYNTH-COST-A","certificateMode":"SYNTH-INDIVIDUAL","proposalVersion":2,"syntheticSchedule":{"rows":20000,"invalidRows":3}}),
]

def render_products():
    md("01-product/products/shared-product-contract.md", "PRODUCT-COMMON", "Shared product contract", "R02", ["INS-02","INS-03","INS-05","INS-11","COM-01","COM-06","SVC-04"], COMMON+"\n"+CHANNEL_MAPPING)
    catalog = []
    for p in PRODUCTS:
        pid = f"PRD-{p['n']:02d}"
        table = "\n".join("| " + " | ".join([f"`{row[0]}`", f"`{row[1]}`", row[2], row[3], f"`{row[4]}`", row[5], f"`{row[6]}`"]) + " |" for row in p["fields"])
        channels = ", ".join(f"`{x}`" for x in p["channels"])
        privacy = ("This family handles health/beneficiary information: the payer, employer and seller receive no medical or beneficiary-detail projection by default. Member/guardian authority is evaluated separately from purchase authority."
                   if p["n"] in [6,7,8,9,14,15,22,24] else "Risk and ownership records are confidential. A carrier, seller or service provider receives only its approved purpose-specific projection, and another organization cannot discover the record by ID.")
        body = f"""## Identity, scope and dependencies

`{pid}` is a desired capability from S00, owned by R02, with R01/R19/R20 review pending. Product classification: **{p['kind']}**. This specification adds family-specific rules to the [shared product contract](shared-product-contract.md); all canonical fields, authorization, versioning, payment/issuance boundaries, input normalization, UI states and release tests there apply. It does not establish availability, eligibility or a rate for any real carrier.

Subject and relationships: {p['subject']}

Proposed channels: {channels}. B2B2C means beneficiary access/enrollment under a group relationship; any separate personal purchase still requires B2C availability. Channel availability and carrier participation are independent. Dependencies are INS-02/03/05/07/08/10/11, COM-01/02/03/06/08 and SVC-01/02/04/05; additional inspection, group or claim dependencies follow the differences below.

## Family field dictionary and server validation

Fields below extend the canonical application. No field has an implicit business default; omitted conditional fields are accepted only when the versioned form predicate is false. Types `money`, `date`, `UUID`, code and evidence reference use the shared contract's exact rules. Required-before-issue fields may be absent in a draft but block the relevant transition. Examples are synthetic; SYNTH codes are deliberately not real carrier identifiers.

| Field | Type | Required condition | Constraint / authority | Synthetic example | Sensitivity | Validation code |
|---|---|---|---|---|---|---|
{table}

## Rating, eligibility, evidence and underwriting

**Rating inputs.** {p['rating']}

**Evidence.** {p['evidence']}

**Eligibility and review.** {p['underwriting']}

`RULE-{pid}-01`: the active form/plan/underwriting contract must map every mandatory risk field without dropping information. Unsupported risk or missing authority becomes a typed unavailable/manual-review outcome, never a fabricated eligible quote. Carrier rules must state required evidence freshness, eligibility, applicable exclusions and inspection requirements; these commercial values remain external dependencies.

## Plans, riders, comparison and quote validity

{p['compare']}

`RULE-{pid}-02`: a plan records base cover, selected riders, dependencies, limits, deductible basis, exclusion wording references, evidence conditions and versioned premium breakdown. Bindable validity must be supported by carrier evidence; otherwise label the offer indicative. A changed risk/evidence/party/schedule version invalidates affected offers and requires a new comparison confirmation. Do not convert missing benefits into zero-valued comparable limits.

## Purchase, issuance and documents

The product detail explains classification, eligibility information, evidence needs and assisted alternatives before collecting a full application. The draft page saves server-authorized values; the comparison page presents only compatible offers. At review, buyer and payer confirm their roles, risk/declaration version, precise total payable and insurer terms. Direct purchase requires verified payment plus commercial acceptance; an approved corporate credit/invoice path requires the distinct commitment event. Both persist commitment and outbox atomically.

Carrier submission uses the frozen application/offer/mapping versions. Await underwriting and confirmed policy reference/document; payment success, submission acknowledgment and coverage activation remain separate. Unknown provider outcomes enter reconciliation without automatic non-idempotent replay. Required outputs are the accepted application/declaration record, offer/terms snapshot, financial receipt or invoice/credit record, insurer policy/certificate and relevant schedule/riders; only contract-authorized documents are labeled insurer-issued. The product's evidence and classification differences above determine additional documents.

## Endorsements, renewal, cancellation and claims

{p['service']}

`RULE-{pid}-03`: an amendment or cancellation request does not itself change coverage or entitle a refund. Keep requested/approved/effective dates, insurer acknowledgment and financial adjustments distinct. All reversals are append-only ledger effects after authorized decisions. Where this family has no renewal or a different continuation mechanism, the UI uses the contract-specific term rather than inventing an annual renewal.

## Product controls, operational handling and privacy

`product.{pid}.new_sales` is a boolean proposed live default `false`, scoped by channel/carrier/plan/organization/region/effective time under the central precedence rules. Visibility may show editorial information while quote/purchase remain disabled. A separate `product.{pid}.servicing` control preserves contracted policy access, claims, installments and endorsements; ordinary sales toggles cannot suppress committed delivery. Security quarantine is a separately authorized incident action. Enabling a product requires verified contracts, authority, forms/rates, adapter mapping and executed tests. Missing prerequisites keep real operations off.

{p['ops']}

{privacy}

Support sees masked references and an actionable reason category; restricted evidence requires assigned role and purpose. Notifications disclose product/case status through an authenticated link, without full risk answers or documents. Analytics uses product/channel, coarse decision and latency bucket only. Export authorization is repeated at generation and download, including organization and relationship changes.

## Interaction and performance consequences

Routes `/insurance/{pid}` and `/applications/:id` select this versioned form; authenticated detail and comparison routes are private/no-store. Display distinct loading, empty, error, forbidden, read-only, disabled, partial, expired and success states from the shared contract. A partial quote never implies all carriers replied. Preserve draft data after a correctable field error, but do not persist restricted values in browser storage. Mobile forms use single-column steps and resumable secure upload; RTL layouts retain logical reading order and isolate identifiers/currency units. Calendar input states the chosen calendar and coverage date semantics.

Performance gates are PERF-READ, PERF-WRITE, PERF-QUOTE, PERF-DISPATCH, PERF-WEB and PERF-JS in the [budget registry](../../_meta/performance-budgets.yaml). Bounded views paginate schedules; large evidence processing and exports run as jobs. Quote telemetry separates first result, deadline/partial completion and provider duration. Product/risk fields never become metric labels. The fixtures below are a correctness input, not benchmark evidence.

## Measurable acceptance and fixture

| Acceptance ID | Given / When / Then and evidence |
|---|---|
| AC-{pid}-RISK | Given the synthetic fixture and a matching fictional carrier form, when validating and mapping, then all required fields survive with exact types/units and version references; compare canonical and provider projections. |
| AC-{pid}-VARIANT | Given the family-specific change below, when attempting the next transition, then apply the stated family result and preserve old-version audit history. |
| AC-{pid}-DENY | Given another user/organization or a payer lacking insured-data authority, when reading or exporting this application/evidence, then deny without leaking the protected fields or resource existence. |
| AC-{pid}-DISABLE | Given a quote and a sales disable before commit, when committing, then reject new purchase; given a previously committed order, then servicing/submission continues unless separately quarantined. |
| AC-{pid}-RACE | Given two edits or commitments using one version/idempotency key, when processed concurrently, then exactly one logical state transition and allocation occur; the loser receives original result or version conflict. |
| AC-{pid}-PROVIDER | Given an unavailable carrier or timeout after possible acceptance, when retry processing runs, then show partial/unavailable or external_outcome_unknown appropriately and require authoritative reconciliation before unsafe replay. |
| AC-{pid}-SERVE | Given a confirmed policy and new sales off, when the entitled person requests documents/claim guidance or an approved servicing operation, then the relationship checks still apply and servicing is not blocked by the sales flag. |

Family-specific scenario: **{p['scenario']}**

Fixture: [`fixtures/{pid}.json`](fixtures/{pid}.json). It is a partial risk example plus explicit expected outcomes; a test harness combines it with canonical party/date/consent fixtures and the fictional carrier rule set. Unit tests validate every field and rule; property tests preserve money/role/schedule invariants; integration tests exercise transaction/outbox and version conflicts; contract tests prove mapping/protocol errors; E2E tests exercise the family scenario and accessible states; security tests cover cross-relationship export; performance tests run the referenced workload. None has been executed against an application in this documentation task.

## Readiness and unresolved inputs

R02 supplies actual product/rate/underwriting/exclusion documents; R09 supplies capability/mapping/credential certification; R19 obtains qualified jurisdiction/licensing/contract review; R12 verifies payment/financing/settlement terms; R20 accepts manual queues and communication content. Each missing item blocks live operation for its affected product/carrier/channel. Safe default: simulated fixtures and editorial/assisted information only where permitted, with no live charge, bind or payout. Documentation remains draft; human approval and application test evidence are pending.
"""
        md(f"01-product/products/{pid}.md", f"PRODUCT-{pid}", f"{pid} — {p['title']}", "R02", [pid,"INS-11"], body)
        fixture = {"fixtureId":f"FIX-{pid}","synthetic":True,"productId":pid,"riskExample":p["fixture"],
                   "canonicalFields":"Combine with shared-product-contract.md; UUID examples are synthetic.",
                   "expected":{"withoutContract":"live_quote_and_purchase_disabled","withSyntheticRuleSet":"validate_required_fields_and_versioned_mapping","variant":p["scenario"]}}
        write(f"01-product/products/fixtures/{pid}.json",json.dumps(fixture,ensure_ascii=False,indent=2))
        catalog.append({"id":pid,"title":p["title"],"spec_path":f"01-product/products/{pid}.md","channels":p["channels"],"canonical_channels":[CHANNEL_CODES[c] for c in p["channels"]],"kind":p["kind"],
                        "risk_fields":[f[0] for f in p["fields"]],"contract_dependencies":["product authority","versioned rates and eligibility","carrier capability and mapping","jurisdiction and contract review"],
                        "acceptance_ids":[f"AC-{pid}-{x}" for x in ["RISK","VARIANT","DENY","DISABLE","RACE","PROVIDER","SERVE"]],
                        "fixture":f"01-product/products/fixtures/{pid}.json"})
    write("_meta/fragments/products.json",json.dumps(catalog,ensure_ascii=False,indent=2))

# Each route record: route, purpose/columns, filters/sort, query owner, action and field visibility.
DASHBOARDS = [
 dict(slug="customer",id="DSH-CUSTOMER",title="B2C customer dashboard",features=["DSH-01","INS-03","INS-10","SVC-01","SVC-02","SVC-03","SVC-06","GRW-02","GRW-03","AUTO-01"],
 roles=[("personal customer","Own parties/assets/policies; explicit guardian mandate where valid","View own records, edit drafts, initiate permitted purchase/service requests","Other persons, employer portfolios, carrier operations"),("authorized guardian/delegate","Only granted subject/purpose until mandate expiry","Specified enrollment/claim actions; no implied financial withdrawal","Adult dependent health or beneficiary detail without separate authority"),("support-assisted session","Explicit consent, purpose, duration and scope; visible session banner","Guide/read authorized fields; mutation only within separate operation grant","OTP, credentials, hidden medical evidence, silent impersonation")],
 routes=[("/account","Summary: policy count, pending orders, next installment, renewal actions","Status and product; due date ascending","Policy/Order/Installment projections with as_of","Open item; no mutation from KPI card"),("/account/policies","Policy reference masked, product, insured label, carrier, effective/expiry dates, state","State/product/carrier; expiry then opaque ID","Policy module authoritative read","Download/share own permitted document; sharing scoped/expiring"),("/account/quotes","Quote reference, product, carrier count, amount/unit, validUntil, state","Product/state; updatedAt descending","Quote module; expiry evaluated on read","Resume, compare, delete draft under version check"),("/account/orders","Order reference, product, payable, payment/submission/issuance/delivery states","State family/product; createdAt descending","Order timeline plus independent state projections","Continue payment or submit requested evidence; no activation inference"),("/account/payments","Receipt reference, amount/unit, allocation, provider verification state","Type/state/date; verifiedAt descending","Finance module authoritative read","Open receipt; request allowed refund; no direct ledger edit"),("/account/installments","Contract, due date, principal/fee breakdown, paid/balance, arrears state","Due/state; due date ascending","Installment schedule and ledger read","Pay allowed due amount; submit dispute"),("/account/renewals","Expiring policy, expiry, eligible action, application status","Product/expiry; expiry ascending","Renewal module with current policy version","Start fresh renewal or assisted inquiry"),("/account/people-and-assets","Authorized people, dependents, addresses, vehicles, property/devices","Subject type; user label ascending","Party and Asset modules","Create/edit relation-scoped record; revoke sharing; ownership changes reviewed"),("/account/claims","Claim reference, insured policy, incident date, stage, action required","Policy/stage; updatedAt descending","Claims projection with medical field mask","Create intake, upload evidence, view permitted decision/review rights"),("/account/documents","Document category, policy/order, version, issue date, availability","Category/resource; issuedAt descending","Document module clean-scan authorized view","Short-lived download; no public raw storage URL"),("/account/wallet-and-rewards","Separate cash/refund/commission/promo balances; points and expiry","Balance type; ledger date descending","Ledger and Loyalty modules; no combined cash total","Redeem permitted credit/reward; request eligible withdrawal with verification"),("/account/garage","Vehicle label, policy deadlines, inquiry freshness, service bookings","Vehicle/type; due date ascending","Garage/Automotive modules","Authorized inquiry/payment/booking; separately gated trading/referral"),("/account/support","Ticket reference, topic, stage, assigned team, last response","Topic/state; updatedAt descending","Support module","Create ticket, consent-limited assistance, complaint escalation"),("/account/notifications","Template subject, category, unread, createdAt","Unread/category; createdAt descending","Notification delivery projection","Mark read; open authorized resource"),("/account/settings","Profile, sessions, authentication, communication preferences, active mandates","Section navigation; not a bulk table","Identity and Consent modules","Revoke session/mandate; edit preferences; recovery requires verified flow")],
 forms="Quote resumption uses application version and requotes expired offers. Claim intake asks policy, incident date/time/place, claimant relationship and required evidence; medical fields stay restricted. Refund requests select receipt/allocation, amount and reason but do not execute a refund. Withdrawal verifies permitted balance and bank recipient under finance controls; promotional points never become withdrawable cash by UI conversion.",
 sensitive="Customer sees full own permitted risk data; receipt-only payers see payable/receipt fields but not another insured's health or beneficiary details. Policy sharing does not confer access to claims or wallet. Guardian access ends when authority expires or changes; all document reads re-evaluate it.",
 exports="Policy/payment history export up to 20,000 authorized rows per job; health claims require separate purpose-scoped export and exclude third-party evidence. A customer cannot export another adult's data through a family summary. Downloads reauthorize the same personal context.",
 disabled="With B2C new sales off, remove new quote/purchase actions with a clear message, preserve committed order follow-up, policy documents, installments, refunds, claims and support. Optional personal purchases from beneficiary context also obey B2C. Garage/automotive features retain their own independent flags.",
 tests=[("RELATION","A payer opens an insured's medical attachment without medical authority; deny while keeping the payer receipt visible."),("STATUS","A verified payment has submission pending; summary and timeline say paid/pending issuance and never active policy."),("BALANCE","A promotional balance exists with zero withdrawable cash; withdrawal is unavailable and the API cannot transfer promotional value as cash.")]),
 dict(slug="corporate",id="DSH-CORPORATE",title="Corporate buyer dashboard",features=["DSH-02","ORG-01","ORG-02","ORG-03","ORG-04","GRW-07","SVC-02"],
 roles=[("corporate viewer","Assigned organization/branch/cost centers","View masked portfolio and approved aggregate reports","Employee diagnoses/claims, other organizations, personal policies"),("enrollment administrator","Assigned roster and allowed nonmedical identity fields","Import, preview, request enrollment changes","Approve own restricted commitment; view private health declarations"),("requester","Assigned budget/cost-center scope","Draft inquiry and purchase request","Commit unapproved spend or approve own request"),("approver/checker","Delegated limit and disjoint maker role","Approve/reject exact proposal/census/budget version with reason","Self-approval, limit bypass, private claims"),("finance payer","Invoice/allocation scope","Pay, reconcile permitted invoices, view balances","Clinical/claim attachments and member medical answers"),("organization admin","Membership/configuration scope","Invite/revoke scoped users, request delegated changes","Grant more authority than own delegation or override platform security")],
 routes=[("/org/:orgId","Portfolio count, pending approvals, enrollment exceptions, due invoices","Branch/cost center; due date ascending","Portfolio/Approval/Billing projections","Navigate to authoritative item; show active organization banner"),("/org/:orgId/portfolio","Policy/master reference, product, carrier, covered population, effective/expiry, status","Product/site/branch/state; expiry ascending","Policy module organization projection","View master terms and allowed certificates; no personal unrelated cover"),("/org/:orgId/branches","Branch, department, cost center, parent, active status","Hierarchy/state; name ascending","Organization module","Create/version structure within delegated scope"),("/org/:orgId/benefits","Plan/class, contract version, enrollment windows, aggregate eligible/accepted counts","Class/product; effective date descending","Group Benefits module","Propose benefit changes; accepted version read-only"),("/org/:orgId/census","Member business ID masked, enrollment relation, class, dates, validation state","Branch/class/row status; stable row ID","Enrollment module masked row projection","Upload, preview, approve allowed batch, request effective-dated changes"),("/org/:orgId/assets","Asset/vehicle label, schedule version, location, coverage state","Type/site/state; label ascending","Asset Schedule module","Import/preview/version schedule; underlying ownership checks"),("/org/:orgId/quotes","Proposal revision, schedule checksum, carrier, comparable amount, deviations","Product/state; updatedAt descending","Commercial Quote module","Request/compare/return proposal for revision"),("/org/:orgId/approvals","Request, maker, budget, amount/unit, version, due date","Assigned scope/state; requestedAt ascending","Approval module authoritative limits","Checker approve/reject exact revision; reason mandatory"),("/org/:orgId/billing","Invoice, due date, premium/fees, allocated/remaining, credit exposure","State/cost center; due date ascending","Finance authoritative ledger projection","Pay, allocate approved invoice, dispute; no false cash receipt for credit"),("/org/:orgId/renewals","Contract, expiry, census/schedule delta, proposal state","Product/expiry; expiry ascending","Renewal and Enrollment modules","Start negotiation and approve updated population"),("/org/:orgId/contracts","Agreement version, parties, term, billing/approval terms, signature state","Type/state; effective date descending","Contract Evidence module","View authorized terms; request renewal; no edit signed evidence"),("/org/:orgId/reports","Premium, enrollment and suppressed aggregate claims utilization","Approved dimensions only; fixed report sorting","Analytics restricted projections with as_of","Async export; small-cohort and differencing controls"),("/org/:orgId/team","Member, role, branch scope, invitation/session state, last review","Role/state; member label ascending","Identity/Authorization modules","Invite/revoke/review within delegation; privileged grant checker"),("/org/:orgId/settings","Notification routing, locale, approved HR connection status","Section navigation","Organization/Notification/Integration modules","Configure allowed preferences; secrets never displayed")],
 forms="Bulk enrollment accepts schema version, source effective date, idempotency key and clean CSV/XLSX upload reference. Preview shows accepted/rejected counts and row errors before any commit. Explicit partial policy is required; a new file or roster version invalidates approval. Purchase request captures buyer/payer/policyholder, branch/cost-center allocations and requested invoice/credit/prepay terms. Checker confirms exact proposal checksum, budget reservation and delegated limit; requester and checker must differ.",
 sensitive="Roster views expose only employment/enrollment fields needed by the current role. Birth date/identity evidence is masked unless specifically required for enrollment work. Employer reports exclude individual claim records, diagnoses, attachments and unrelated personal policies. Proposed minimum cohort 10 and complementary suppression apply to health aggregates, with query history/dimension controls against subtraction. Payer sees invoice totals/allocation without medical reasons.",
 exports="Roster/asset exports are scoped asynchronous jobs up to 20,000 rows per request; larger approved exports partition by stable cursor and reauthorization, never bypass row scope. Claims utilization exports contain suppressed aggregates only. Every job records purpose, fields, organization, authorization version, requester and download expiry.",
 disabled="Corporate, commercial, reseller and B2B2C enrollment entry points have independent B2B subchannel controls. Turning corporate new sales off blocks new commitments after the authoritative cutoff, preserves approved committed obligations, employee certificates, existing billing, claims and negotiated servicing. A B2B sales flag never disables carriers serving B2C.",
 tests=[("MAKER","Requester is also a nominal approver; same-actor approval is denied even when a menu button was cached."),("COHORT","Filter reduces health report to nine members; suppress cell and complementary totals and reject differencing query sequence."),("IMPORT","HR and manual changes edit the same row version; preview/approval conflict prevents silent overwrite and duplicate enrollment.")]),
 dict(slug="beneficiary",id="DSH-BENEFICIARY",title="Employee / beneficiary dashboard",features=["DSH-03","ORG-04","SVC-01","SVC-05","SVC-06","CHN-05"],
 roles=[("employee/beneficiary","Own accepted enrollment/coverage relationship","Read own benefits/certificates, submit own claims and permitted changes","Employer billing, coworkers, other organizations' records"),("dependent/guardian","Specific dependent relationship and purpose","Read eligible dependent cover and permitted intake","Other adult members' private claims without authority"),("benefit administrator assist","Enrollment support scope only","Explain status/request correction","Diagnoses, private personal policies, unconsented impersonation")],
 routes=[("/benefits","Own organization relationships, active/pending benefits, actions required","Organization/product; effective date descending","Enrollment/Policy projections","Choose explicit benefit context; personal purchase shown separately"),("/benefits/:enrollmentId/coverage","Benefit category, approved limit wording, network, effective dates, status","Category; plan order","Policy/Benefit Plan module","View insurer-confirmed cover and authorized plan documents"),("/benefits/dependents","Dependent label, relationship, consent state, enrollment dates, status","Relationship/state; label ascending","Enrollment/Party module","Request add/remove/correct dependent; cannot self-approve acceptance"),("/benefits/certificates","Certificate, insured label, master plan, issue/effective dates","Product/state; issuedAt descending","Document/Policy modules","Authorized short-lived download/share"),("/benefits/claims","Own claim reference, incident date, stage, action required","Policy/stage; updatedAt descending","Restricted Claims module","Submit evidence, view own decision and review route"),("/benefits/providers","Contract network, service category, location, verification time","Category/location; declared relevance","Provider Directory module","View verified contact/assistance details; no unsupported appointment guarantee"),("/benefits/changes","Change request, effective date, insurer acknowledgment, status","Type/state; requestedAt descending","Enrollment change projection","Withdraw permitted uncommitted request or provide correction"),("/benefits/support","Private support tickets, benefit FAQs, assigned team","Topic/state; updatedAt descending","Support and original Content modules","Ask benefit question with scoped attachments"),("/benefits/notifications","Enrollment/claim notices, unread, createdAt","Category/unread; date descending","Notification projection","Open authorized case; no clinical details in external notice"),("/benefits/settings","Consent, contact, language/calendar, notification choices","Section navigation","Identity/Consent modules","Manage own preferences and authorized relationships")],
 forms="Dependent request collects relationship, effective date, identity/evidence and consent under the plan's enrollment rules. Adult dependents submit restricted declarations in their own authorized session. Removal is a request with requested/accepted/effective dates, not an immediate local coverage deletion. Claims ask the employee for policy/incident/evidence; employer approval is not a prerequisite to view private claim progress unless the actual workflow lawfully and contractually requires it, which remains a review blocker.",
 sensitive="Employer enrollment administrators may see membership completion and permitted benefit-class information but cannot use this surface to inspect individual claims or personal purchases. The beneficiary's personal wallet/policies live in a distinct personal context. Terminated employment is not automatically proof that already-effective cover or claim rights ended; check insurer-confirmed entitlement dates.",
 exports="Own certificates/coverage summaries and own permitted claim history only, up to 20,000 authorized rows per job; never whole-employer roster. Each adult dependent's private data requires a separate valid authority check.",
 disabled="B2B/B2C new-sales disablement preserves existing benefit certificates, claims, installments and support. A new dependent enrollment is classified explicitly as contracted servicing or new sales by the accepted group agreement; do not infer from the page label. Optional personal purchase appears only under the separate B2C rule.",
 tests=[("PERSONAL","Employer context changes while a personal policy tab is open; refetch with the new context and deny unrelated resource retrieval."),("DEPARTURE","Employment membership is revoked but policy entitlement remains effective; retain authorized beneficiary servicing without granting employer administration."),("DEPENDENT","A minor becomes an adult under the applicable reviewed rule; inherited guardian access cannot silently continue without valid authority.")]),
 dict(slug="seller",id="DSH-SELLER",title="Reseller / agent dashboard",features=["DSH-04","GRW-06","GRW-04","GRW-02","INS-12","COM-09","SVC-02"],
 roles=[("seller","Active contract and assigned customer mandate","Manage own leads/quotes/assisted sales and permitted renewals","Customer medical details outside mandate, other sellers' customers"),("team manager","Delegated team/territory scope","Assign leads, view scoped pipeline and aggregate performance","Unassigned teams and protected claim/health data"),("seller finance","Own contract/commission scope","View statements, request allowed payout","Edit commission calculation, approve own payout"),("seller administrator","Own team membership/configuration","Invite/revoke scoped members, training management","Expand distributor contract authority or approve platform grants")],
 routes=[("/seller","Lead funnel, tasks, pending commissions, renewal actions","Team/product; due date ascending","CRM/Commission/Renewal projections","Navigate to assigned task"),("/seller/onboarding","Contract version, required documents, review stage, training","State; updatedAt descending","Partner Onboarding module","Submit evidence; contract approval by authorized platform staff"),("/seller/leads","Lead reference, consented contact masked, product, owner, stage","Owner/source/product/stage; updatedAt descending","CRM module","Create, assign, call-back task with consent; no unsolicited data enrichment"),("/seller/customers","Mandated customer label, allowed products, mandate expiry","Team/product; name ascending","Relationship module","Request/renew authority; open only permitted portfolio"),("/seller/quotes","Quote/proposal, customer, carrier, revision, validity, stage","Customer/state/product; updatedAt descending","Quote/Assisted Sales module","Draft/compare/revise; customer's acceptance recorded separately"),("/seller/orders","Order, distribution reference, amount, independent states","State/carrier/product; createdAt descending","Order projection with seller mask","Follow up evidence/status within mandate"),("/seller/portfolio","Policy reference masked, product, expiry, permitted insured label","Product/expiry; expiry ascending","Policy delegated projection","Download only authorized documents; no blanket claim access"),("/seller/renewals","Assigned policy, due date, consent state, renewal attribution","Due/product/owner; due ascending","Renewal/Attribution modules","Create renewal lead/quote after permission check"),("/seller/team","Member, role, assigned scope, invitation/training state","Role/state; label ascending","Organization/Authorization modules","Delegate within seller contract; revoke and audit"),("/seller/commissions","Transaction, basis, pending/confirmed/reversed, amount/unit","State/product/period; postedAt descending","Commission and Ledger modules","View calculation inputs permitted by contract; dispute statement"),("/seller/wallet","Distinct commission/cash/promo balances and holds","Balance type/date; postedAt descending","Ledger authoritative projection","Request verified eligible withdrawal; cannot approve own payout"),("/seller/training","Module, required version, completion, expiry","Required/completion; priority","Training/CMS module","Complete acknowledgment; no fabricated certification"),("/seller/reports","Sales/renewal/conversion/commission aggregates with as_of","Team/product/period; metric descending","Analytics scoped projection","Async export of authorized pipeline/financial statement"),("/seller/settings","Profile, attribution codes, notices, sessions, payout-recipient status","Section navigation","Identity/Referral/Finance modules","Update permitted preferences; bank changes require verification")],
 forms="Lead form records source, consent/purpose, product, contact channel and assigned owner; duplicates merge only with authorized review and history. Assisted quote records customer mandate, proposal revision, insurer negotiation evidence and actual customer declaration acceptance. Seller cannot accept undisclosed terms for the customer. Payout request selects withdrawable confirmed commission, verified recipient and reason/reference; checker and payment execution are platform finance responsibilities.",
 sensitive="Contact details are masked until assigned purpose permits retrieval; access is audited. Customer documents/health details are excluded unless a narrow, explicit mandate and contract allow them. Commission statement can expose basis/adjustment needed for dispute without disclosing another seller's rate or payer bank details.",
 exports="Own/team-scoped CRM and statement exports up to 20,000 rows per job; consent/mandate evaluated both at job generation and download. No unrestricted customer phone list or medical data export. Formula-like spreadsheet cells are escaped for safe export.",
 disabled="Reseller new-sales control blocks new assisted purchases independently of direct B2C and corporate sales. Existing distributed policies, permitted renewals classified by channel, commission servicing, reversals and payout disputes remain available under their specific controls. Revoked seller contract removes actions even if flags remain on.",
 tests=[("MANDATE","A seller mandate expires after a quote was loaded; purchase/export fails on server recheck and cached customer details are cleared."),("COMMISSION","A policy refund reverses qualifying commission; wallet cannot withdraw the reversed amount during a concurrent payout request."),("ATTRIBUTION","Customer switches from referral link to assisted seller; attribution follows the recorded rule/version and cannot be overwritten by an untrusted query parameter.")]),
 dict(slug="carrier",id="DSH-CARRIER",title="Carrier / supplier dashboard",features=["DSH-05","INT-02","INT-06","INT-07","INT-08","COM-06","COM-09","SVC-07","SVC-08"],
 roles=[("carrier operations","Own carrier and assigned product/channel scope","Read submissions, request evidence, issue only with authority","Other carriers, unrelated platform transactions, employer private data"),("carrier underwriter","Own assigned risk cases and decision delegation","Record versioned accept/reject/evidence decision","Financial settlement or unassigned health records"),("carrier finance","Own settlement/commission contract scope","Review statements and reconciliation differences","Risk/medical evidence and platform-wide ledger"),("carrier admin","Own staff/delegated configuration","Invite scoped staff, propose product rules","Approve own platform integration mapping or live credential changes"),("supplier operator","Own automotive/other service orders only","Accept/fulfill allowed booking/parts operations","Insurance underwriting, carrier policies or unrelated supplier orders")],
 routes=[("/partner","Own incoming workload, issuance exceptions, settlement status","Product/channel/state; due priority","Partner-scoped projections","Navigate to assigned item; organization kind explicit"),("/partner/submissions","Submission/business ref, product, receivedAt, state, application version","Product/state/date; receivedAt ascending","Integration Inbox/Submission module","Acknowledge/request permitted evidence; idempotent decision commands"),("/partner/underwriting","Case, risk category, assigned reviewer, due date, evidence status","Assignment/product/state; due ascending","Restricted Underwriting module","Accept/reject/request evidence with reason and delegated authority"),("/partner/issuance","Order/application ref, accepted version, policy reference, document state","Product/state; updatedAt ascending","Issuance module","Submit signed/verified policy result or manual evidence; no payment-state overwrite"),("/partner/portfolio","Own policy reference, product, permitted insured fields, effective dates, status","Product/channel/state; expiry ascending","Carrier Policy projection","Retrieve own contracts and authorized servicing requests"),("/partner/product-proposals","Form/plan/rule proposal version, validation, review, effective time","Product/state; proposedAt descending","Catalog/Configuration proposal module","Propose changes; platform review required for publication"),("/partner/claims","Own claim reference, assigned case, incident/stage, evidence needed","Product/assignment/stage; updatedAt descending","Restricted Claims module","Assess/decide/pay only within actual contract/delegation"),("/partner/settlements","Statement, premium/commission/refund totals, payable, reconciled state","Period/state/currency; period descending","Finance partner projection","Confirm/dispute statement; payout dual-control remains enforced"),("/partner/api-transactions","Correlation, operation, mapping version, masked result, latency, delivery status","Operation/state/version; createdAt descending","Integration audit projection","View masked diagnostics; request replay review, not blind resend"),("/partner/service-orders","Own booking/parts reference, fulfillment status, permitted contact/address","Type/state/due; due ascending","Automotive Order module","Accept/reject/fulfill own contracted service order"),("/partner/team","Staff role, product scope, invitation/review status","Role/state; name ascending","Identity/Authorization module","Grant only bounded partner roles; revoke and review"),("/partner/settings","Organization profile, notification routing, credential metadata, API-only mode","Section navigation","Partner Configuration module","Request credential rotation; no plaintext secret retrieval")],
 forms="Underwriting decision includes case version, authority scope, reason code, evidence references and decision payload under carrier schema. Issuance requires verified carrier reference/document and effective dates; portal staff cannot mark payment verified. Product proposal includes rule/mapping version and synthetic contract results; live publication needs separate platform approver. Replay request records external outcome evidence and operator reason; unsupported idempotency/status capabilities block automatic replay.",
 sensitive="Recipient projection is per carrier capability, product, case and staff role. Finance roles see financial references/amounts, underwriters see necessary risk/evidence, and supplier operators see fulfillment contact/address only. Hidden credentials, unrelated employer records and other carriers' quotations are never exposed. Sensitive case/document access is audited.",
 exports="Own accepted transaction/statement exports up to 20,000 rows per job with product/channel/role filtering. Medical evidence requires case-specific access and separate export grant, not a generic portfolio download. API-only operation offers the same scoped operations and audit through versioned contracts; portal seats are optional and do not determine backend delivery availability.",
 disabled="Carrier connectivity is separate from B2B sales. Disabling B2B must leave a carrier's authorized B2C submissions operational. Suspended new carrier sales can coexist with policy/claim/settlement servicing. Security quarantine can stop a compromised endpoint and queues the required work durably for reconciliation.",
 tests=[("CARRIER","Carrier A requests Carrier B's submission, document or report cursor; deny without metadata leakage."),("API_ONLY","Carrier portal access is disabled while API-only mode is approved; durable authorized submission/status workflows continue."),("UNKNOWN","Carrier has no idempotency/status lookup and submit times out after acceptance; portal cannot replay without verified reconciliation evidence.")]),
 dict(slug="admin",id="DSH-ADMIN",title="Platform administrator dashboard",features=["DSH-06","CHN-01","CHN-02","CHN-03","CHN-04","ORG-01","INT-06","GRW-08","GRW-03","AUTO-05","AUTO-06","AUTO-07"],
 roles=[("platform configuration maker","Granted configuration domains","Draft/version/preview scoped changes","Approve own change, disable audit/security or inspect all PII"),("configuration checker","Disjoint maker; delegated change authority","Approve/reject effective version and rollback proposal","Self-approval, unreviewed live provider activation"),("tenant administrator","Organization onboarding scope","Review organizations and bounded role grants","Employee health, financial execution, other admin domains"),("catalog/content editor","Assigned product/content domains","Draft forms/rules/content/campaigns","Publish commercial rates without approval or run arbitrary mapping code"),("security administrator","Security/audit scope with step-up MFA","Revoke access, quarantine compromised path, review audit","Erase audit or approve own financial transaction"),("platform super-admin","Exceptional time-bound elevation with reason","Manage delegated roles/recovery under oversight","Default unrestricted medical browsing or unaudited impersonation")],
 routes=[("/admin","Operational summaries, pending approvals, release blockers","Domain/severity; createdAt ascending","Aggregated admin projections","Open role-permitted workbench; cards do not grant data rights"),("/admin/features","Key, type, scope, proposed/effective version, dependencies, rollout, reason","Domain/scope/state; effectiveAt descending","Feature Configuration module","Draft/preview/approve/schedule/rollback; show four B2C/B2B combinations"),("/admin/organizations","Legal entity, buyer/supplier/distributor relationships, onboarding, tenant state","Kind/state/region; name ascending","Organization/Partner module","Onboard/verify/delegate; carrier role distinct from corporate buyer"),("/admin/catalog","Category/product/plan, form/rule version, availability, review state","Product/carrier/state; updatedAt descending","Catalog/Form/Rule modules","Draft/test/publish approved versions; no historical overwrite"),("/admin/underwriting","Case queues, inspection evidence state, assignment and SLA state","Product/role/state; due ascending","Underwriting/Inspection projections","Assign permitted work; case decision belongs to separate role"),("/admin/orders-policies","Order, payment/submission/issuance/delivery states, policy reference","State/product/carrier; updatedAt descending","Order/Policy modules","Investigate and request correction; no synthetic activation button"),("/admin/finance","Reconciliation, allocations, commissions, refunds, settlements, payouts","Currency/state/partner; oldest unresolved","Finance workbench projection","Route to authorized finance controls; no unrestricted ledger mutation"),("/admin/claims-support","Claim/ticket counts, stage, assignment, escalation","Queue/product/severity; due ascending","Claims/Support modules","Assign/escalate; sensitive access requires case role"),("/admin/corporate","Contracts, census batches, proposals, approvals, billing exceptions","Organization/state; updatedAt descending","Corporate Sales/Enrollment modules","Review commercial exceptions without individual health disclosure"),("/admin/commissions","Contract rule version, accrual/reversal rules, payout exceptions","Distributor/state; effectiveAt descending","Commission module","Propose/approve rule revision; recalculate only controlled adjustments"),("/admin/marketing","Campaign/segment/budget, referral/loyalty rules, rewards, CMS revisions","Type/state/channel; schedule ascending","Marketing/Loyalty/CMS modules","Draft/approve/schedule; draws/games/charity mechanics require review"),("/admin/automotive","Providers, services, parts catalogs, inventory, trading/referral controls","Provider/capability/state; updatedAt descending","Automotive/Partner modules","Onboard/provider review; trading/auctions/contracts/debt settlement separate gates"),("/admin/integrations","Partner capabilities, mapping/auth metadata, sandbox/live, health, unknown outcomes","Operation/partner/environment; exception age","Integration Studio module","Validate/propose/promote mapping; approved endpoints; no secret values/arbitrary code"),("/admin/reports","Approved reports, dataset freshness, field policy, export requests","Domain/scope/status; generatedAt descending","Analytics/Export modules","Purpose-scoped export; tenant limits remain enforced"),("/admin/security-audit","Access events, privileged reasons, role changes, security incidents","Actor role/action/outcome/time; event time descending","Append-only Audit/Security modules","Review/revoke/quarantine with reason; no audit deletion"),("/admin/settings","Menu/widget/action/report definitions, locales, templates, environment metadata","Dashboard/domain/state; updatedAt descending","Experience Configuration module","Version/preview configuration; server permission intersection mandatory")],
 forms="Feature proposal captures key/type/scope/value, dependencies, effective time, reason, expected impact and rollback target; preview compares channel and servicing effects. Rule/form/mapping edits validate schemas and synthetic fixtures before checker review. Endpoint changes include approved destination/egress evidence and secret references, never arbitrary URLs/code execution. Menu/action configuration intersects server entitlements and cannot introduce an unregistered operation. Privileged grants, finance/rate rules, live integrations and material availability changes require maker-checker; emergencies use a separately audited, time-bounded security procedure.",
 sensitive="Administration is capability-scoped, not universal data access. Summary widgets use counts/coarse outcomes; opening customer/medical/financial detail requires the relevant role, purpose and resource scope. Super-admin break-glass is time-limited, audited and reviewed; secrets remain unreadable. Sensitive report fields cannot be enabled through a dashboard column setting.",
 exports="Audit/configuration/report exports are asynchronous, purpose-scoped and limited to 20,000 rows per request with approved continuation for larger evidence sets. No global customer/medical dump by default. Export manifests capture field policy and authorization version; downloading after role revocation fails.",
 disabled="Ordinary feature management cannot disable audit, authorization or financial invariants. New-sales modes, servicing, partner delivery and security quarantine are distinct controls. Every proposal preview displays draft/quote/payment-in-progress/committed behavior; committed work continues unless a separately authorized quarantine applies.",
 tests=[("MENU","Admin enables a finance action in a seller menu; server permission intersection still denies it and configuration validation flags the invalid audience."),("SELF_APPROVE","Maker attempts to approve own live mapping/rate/flag change; transaction rejects it and audit records denial."),("CUTOFF","Feature disable races verified payment commitment; authoritative transaction/version order determines commit versus refund/recovery path and is recorded.")]),
 dict(slug="operations",id="DSH-OPERATIONS",title="Operational staff workbench",features=["DSH-06","COM-06","COM-08","COM-09","SVC-07","SVC-08","SVC-09","INT-07","AUTO-05","AUTO-06"],
 roles=[("support agent","Assigned tickets and explicit assistance consent","Triage, respond, request documents, escalate","Policy activation, underwriting decision, refunds, health browsing outside case"),("underwriting/inspection operator","Assigned cases and product authority","Review evidence/retakes or record delegated decision","Finance execution and unassigned restricted claims"),("issuance operator","Assigned committed submissions","Reconcile verified status, request safe replay approval","Blind resend after unknown outcome or mark active from payment"),("finance maker/checker","Separate delegated roles and amount limits","Propose/approve refunds, settlements and payouts","Self-approval, destructive ledger edits, unverified recipients"),("claims handler/assessor","Assigned claims and actual contract authority","Intake/assess/request evidence/decide as delegated","Uncontracted settlement authority and employer disclosure"),("provider operations","Assigned automotive bookings/parts orders","Resolve fulfillment/returns/disputes","Insurance risk decision and unrelated provider information")],
 routes=[("/ops","Assigned queue counts, oldest age, due work, blocked cases","Queue/priority/assignee; due ascending","Operational projections with as_of","Claim permitted task; no generic all-customer search"),("/ops/underwriting","Case, product, evidence completeness, due date, version","Assignment/product/state; due ascending","Underwriting module","Request evidence/decide only within delegated scope"),("/ops/inspections","Booking, checklist, secure evidence status, retake reason, expiry","Provider/area/state; appointment ascending","Inspection module","Assign/reschedule/review/retake with recorded reason"),("/ops/issuance","Committed order, last attempt, acknowledgment, policy evidence, ambiguity state","Carrier/state/age; oldest first","Submission/Issuance module","Verify status; prepare replay with reconciliation evidence"),("/ops/reconciliation","Payment/order/ledger/provider refs, unmatched amount, age, owner","Provider/type/state; oldest first","Reconciliation module authoritative diff","Match supported evidence, raise adjustment proposal, escalate unknown"),("/ops/refunds-settlements","Proposal, recipient verified status, amount/unit, maker, checker, state","Type/currency/state; requestedAt ascending","Finance module","Maker propose; distinct checker approve; execution worker handles payout"),("/ops/claims","Claim, policy, assignment, stage, required evidence, review deadline","Product/stage/assignee; due ascending","Restricted Claims module","Assess, request evidence, record delegated decision/review; pay only authorized"),("/ops/support","Ticket, consent scope, topic, priority, owner, SLA state","Topic/state/priority; due ascending","Support module","Respond, transfer, escalate complaint; attachments access-scoped"),("/ops/import-export","Batch, source/schema, row counts, errors, approval, progress","Organization/type/state; createdAt descending","Bulk Processing module","Inspect errors, approve permitted partial policy, retry same identity safely"),("/ops/fulfillment","Booking/parts order, provider, promised slot, shipping/return state","Provider/type/state; due ascending","Automotive Fulfillment module","Resolve cancellation, retime with consent, track return/refund handoff"),("/ops/partner-exceptions","Partner/operation, capability/mapping version, failure class, next permitted action","Failure/partner/age; oldest first","Integration module masked diagnostics","Classify/escalate; rotation/replay requires separate grants"),("/ops/knowledge","Approved procedure version, product/carrier, last verified date","Product/topic; relevance","Original CMS/runbook projection","Read approved script; propose correction for review"),("/ops/notifications","Assigned case notices, shift handover, unread state","Queue/unread; createdAt descending","Notification module","Acknowledge and open authorized case"),("/ops/settings","Queue subscriptions, accessibility, language, active sessions","Section navigation","Identity/Operational Preferences","Set preferences within assigned queues; cannot self-assign privileged role")],
 forms="Every decision form shows current version, independent financial/insurance states, source evidence and allowed next actions. Claiming a task uses a lease/version check; another operator receives a conflict and read-only view. Case notes separate customer-visible explanation from restricted internal evidence and prohibit credentials/unnecessary PII. Refund/settlement proposal records original allocation, exact amount/unit, reason, verified recipient and supporting reconciliation; a different checker approves. Unknown external outcomes require positive reconciliation evidence, not a timeout screenshot alone.",
 sensitive="Task assignment plus role and purpose are all required. A support agent sees safe status and masked identity; medical evidence is restricted to the assigned claims/underwriting role. Customer impersonation is replaced by explicit consent-based assistance. Search results apply tenant/resource filters before counts and facets, so denied records do not leak through result totals.",
 exports="Queue handover exports include case IDs, safe status, owner and next action, not attachments/medical details. Financial reconciliations and audit evidence require separate permissions, reason and up to 20,000 rows per job. Download rechecks current scope and revocation.",
 disabled="Sales shutdown keeps operational servicing queues active. Provider/partner outage adds backpressure and pending status; it does not convert uncertain work into failed/cancelled business state. Security quarantine stops specified unsafe actions while preserving audit, reconciliation and customer-support access.",
 tests=[("LEASE","Two staff claim the same case version; exactly one lease is granted and only authorized current owner can mutate it."),("REPLAY","Paid/unissued case has unknown carrier outcome; replay action remains blocked until verified evidence satisfies adapter capability policy."),("DUAL","Refund maker attempts checker action after switching roles in the same identity; same-actor segregation is still enforced.")]),
]

# These are distinct tasks discovered during feature/surface reconciliation, not aliases.
for _dashboard in DASHBOARDS:
    if _dashboard['slug']=='customer':
        _dashboard['routes']=[
            ("/account/wallet-and-rewards","Separate cash/refund/commission/promo balances; points, mission progress, badges, rewards, approved draw/charity eligibility and expiry","Balance/reward type/state; ledger date descending","Ledger/Loyalty modules with rule versions and no combined cash total","Redeem permitted credit/reward; enter separately approved mechanics; request eligible verified withdrawal") if r[0]=='/account/wallet-and-rewards' else
            ("/account/garage","Vehicle label, policy/obligation deadlines, official inquiry category/provider/provenance/as_of, payable/receipt/pending settlement and service bookings","Vehicle/inquiry category/result state; due date ascending","Garage/Automotive Inquiry/Payment modules with source evidence","Request only authorized supported inquiry, review exact fee and pay eligible obligation, open booking; trading/referral separately gated") if r[0]=='/account/garage' else r
            for r in _dashboard['routes']]
        _dashboard['routes'].extend([
            ("/account/referrals","Own code/link, qualifying event category, pending/confirmed/reversed reward, budget/expiry disclosure","Reward state/campaign; createdAt descending","Referral/Attribution module with permitted reward projection","Copy own link, view reward basis, dispute attribution; no invitee purchase/health details"),
            ("/account/vehicle-alerts","Authorized vehicle, obligation category, preference, SMS subscription term/fee/expiry, renewal state","Vehicle/category/subscription state; next due ascending","Automotive Alert/Subscription and Notification modules","Set preferences, explicitly accept paid subscription/renewal, cancel future renewal; existing receipts preserved"),
            ("/account/vehicle-utilities","Authorized document wallet, road-condition provider/source/as_of, technical-report availability and limitations","Vehicle/utility/provider; as_of descending","Garage/Document/Automotive Utility modules","Open authorized document or request contracted utility; no unverified official-status claim")])
        _dashboard['features']=list(dict.fromkeys(_dashboard['features']+['GRW-04','AUTO-02','AUTO-03','AUTO-04','AUTO-08']))
        _dashboard['forms']+=" Referral rewards display only own qualification and state, not an invitee's private purchase. Loyalty missions/rewards show pending/confirmed/reversed accrual and terms; games, prize draws and charitable redemption are separately disabled until required review, not unlocked by a general loyalty flag. Paid vehicle-alert subscription review shows fee/unit, delivery channel, term, expiry and renewal consent separately from general reminders; duplicate subscription/payment commands use the same business key. Vehicle utility requests display provider provenance/freshness and require the same vehicle authority as the garage."
    if _dashboard['slug']=='operations':
        _dashboard['routes'].extend([
            ("/ops/policy-delivery","Policy/order, authorized recipient, document version, link/SMS/email/courier method, delivery state, last attempt","Method/carrier/state/assignee; oldest pending first","Policy Delivery/Document/Logistics modules","Reauthorize recipient, retry eligible delivery with stable key, reconcile courier result; never expose public raw policy files"),
            ("/ops/policy-changes","Policy, endorsement/cancellation request type, requested/approved/effective dates, carrier acknowledgment, financial adjustment state","Type/carrier/state/assignee; requestedAt ascending","Policy Servicing/Integration/Finance projections","Validate authority and evidence, transmit approved change, reconcile acknowledgment; no local coverage cancellation from request alone")])
        _dashboard['roles'].append(("policy servicing/delivery operator","Assigned policy changes/delivery and recipient scope","Request evidence, transmit/reconcile authorized changes, redeliver permitted documents","Invent coverage changes, refund authority or access to unrelated policy evidence"))
        _dashboard['roles'].append(("assigned integration operator","Assigned partner/product/environment and masked diagnostic scope","Classify delivery/mapping exceptions, inspect evidence and propose permitted replay","Read plaintext secrets, approve own live endpoint/mapping change or replay unknown non-idempotent outcome"))
        _dashboard['roles'].append(("assigned bulk-processing operator","Assigned organization/source import/export jobs and field scope","Inspect row errors and preview, safely retry stable identities, route partial approval to authorized checker","Approve a roster/financial commitment without separate delegated grant or export hidden fields"))
        _dashboard['features']=list(dict.fromkeys(_dashboard['features']+['COM-07','SVC-04']))
        _dashboard['forms']+=" Delivery retry names recipient, channel and document version and rechecks authority; courier failures retain delivery pending without changing issuance. Endorsement/cancellation review keeps requested/approved/effective dates separate, requires carrier authority and links any approved financial adjustment to its own finance workflow."

def render_dashboards():
    fragment = []
    for d in DASHBOARDS:
        slug=d["slug"]
        perms=[f"dashboard.{slug}.read",f"dashboard.{slug}.export",f"dashboard.{slug}.configure"]
        role_table="\n".join("| " + " | ".join(r) + " |" for r in d["roles"])
        routes="\n".join("| `"+r[0]+"` | "+" | ".join(r[1:])+" |" for r in d["routes"])
        cases="\n".join(f"| AC-DSH-{slug.upper()}-{key} | {case} |" for key,case in d["tests"])
        body=f"""## Purpose, authority and context

This dashboard serves the roles below and covers {', '.join(d['features'])}. It is a proposed experience specification, not a claim that screens or backend permissions have been implemented. Domain behavior remains in NestJS; Next.js renders authorized projections and invokes typed commands. The dashboard permission `dashboard.{slug}.read` grants entry only; every row, field, action, export and document rechecks its domain permission and resource relationship. `dashboard.{slug}.export` and `dashboard.{slug}.configure` are separate grants. Configuration can remove options but cannot grant domain authority.

The active context is always visible in the page heading and global switcher. Personal, organization, seller and carrier relationships remain separate even for one human identity. A context switch cancels pending reads, clears client query/router state for protected data, reauthorizes the destination and requests a fresh projection; no previous-context rows flash while loading. Deep links resolve context on the server before resource lookup and never silently select an organization based only on a user-controlled URL.

## Role and field-access matrix

| Role | Resource and field scope | Permitted mutations | Explicit denials |
|---|---|---|---|
{role_table}

{d['sensitive']}

## Navigation, widgets, routes and table contracts

Desktop uses a logical-start navigation rail and persistent context selector. Mobile uses a labeled navigation drawer with focus return, a persistent context label and one-column task summaries. Critical state is text plus icon, never color alone. Each route has a landmark heading, breadcrumb where useful, contextual help and permitted actions. Widgets use the same field masks as tables; counts and facets are computed after scope filtering.

| Route | Purpose and table/widget fields | Filters and default sort | Data owner / freshness | Mutations and field constraints |
|---|---|---|---|---|
{routes}

All multi-row tables default to 25 rows, maximum 100, with opaque cursor pagination and a stable ID tie-breaker. Supported sorts/filters are allowlisted per table above; arbitrary SQL/property paths are rejected. URL state contains nonsensitive filters only. Search is scoped before results/counts and matches normalized permitted labels/references; raw medical, credential and bank values are never global search terms. A stale cursor returns a typed restart response without mixing organizations. Rows have accessible headers; compact mobile cards preserve status, reference, next action and expandable labeled details rather than truncating essential amounts.

Transactional detail reads show authoritative version and are revalidated after a command. Event-derived summaries display `as_of` and pending/stale status; they cannot authorize a mutation or claim financial settlement. Action forms retrieve authoritative state/version before submission. Notification center lists template subject, safe case reference, category, unread/read and time; clicking repeats resource authorization. Preferences separate mandatory transactional delivery from optional promotional consent. Language/calendar/timezone and accessibility preferences are user-scoped; organization defaults cannot overwrite private consent.

## Forms, approvals, bulk actions and exports

{d['forms']}

Every form has field-level schema validation, labeled required/conditional fields, a linked error summary, preserved safe values after validation failure and a clear submitting state. Mutations send a stable idempotency key and expected version; server conflict asks the user to reload differences before retry. Disabled/hidden controls are presentation only. Material privileged mutations require a reason, audit and an independent checker when specified; changing role or organization does not make the same human a different checker.

Bulk actions select an explicit set of authorized IDs or a server-bound filter snapshot, display count/impact, and reauthorize each resource at execution. Per-row outcomes include completed/denied/conflict/failed; the interface does not report total success when only some rows changed. Long-running imports, exports and report generation create trackable jobs; browser disconnect does not discard committed work. Cancellation records whether it stopped unstarted work or requires compensation for completed rows.

{d['exports']}

## Availability and servicing behavior

{d['disabled']}

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
{cases}
| AC-DSH-{slug.upper()}-CONTEXT | Given two users and two organizations plus a personal context, when switching context during an in-flight response, discard the old response and expose no old rows, counts or documents. |
| AC-DSH-{slug.upper()}-REVOKE | Given a cached menu and an outstanding export, when permission is revoked, every mutation/download fails reauthorization; revoked data does not reappear via a replica or browser history. |
| AC-DSH-{slug.upper()}-STATES | Exercise loading/empty/error/forbidden/read-only/disabled/partial/expired/success with keyboard and screen reader in RTL/LTR and mobile widths; state and next action remain understandable. |
| AC-DSH-{slug.upper()}-PERF | Run bounded list/detail plus write workload and initial route production build against central budgets; report cold/warm and dependency boundaries separately. |

R04 owns interaction review, R11 field/relationship policy, R13 automated/manual evidence and R20 queue/UAT acceptance. Frontend unit/component tests cover field states and context cleanup; API integration/security tests prove server filtering; E2E tests cover each route family and critical action. Test IDs are planned acceptance contracts, not executed results. Live operation is blocked until underlying product/provider authority, configuration/permission review and release evidence exist. Dashboard delivery is complete only when the route inventory, field policy, actions, negative tests and measured budgets agree with published contracts.
"""
        md(f"03-experience/dashboards/{slug}.md",d["id"],d["title"],"R04",d["features"],body,["R01","R07","R11","R13","R20","R21"])
        fragment.append({"id":d["id"],"title":d["title"],"spec_path":f"03-experience/dashboards/{slug}.md","routes":[r[0] for r in d["routes"]],"roles":[r[0] for r in d["roles"]],"permissions":perms,"feature_ids":d["features"]})
    write("_meta/fragments/dashboards.json",json.dumps(fragment,ensure_ascii=False,indent=2))

EXPERIENCE = {
"information-architecture": ("EXP-IA","Information architecture",["DSH-01","DSH-02","DSH-03","DSH-04","DSH-05","DSH-06","INS-01","GRW-08"],"""## Surface boundaries

The proposed presentation consists of public storefront, authenticated portal and privileged administration surfaces. The [architecture overview](../04-architecture/architecture-overview.md) owns application/deployment boundaries; these navigation groups do not require separate domain backends. Next.js renders authorized data; NestJS remains the authority for business decisions.

```mermaid
flowchart TD
  Public[Public storefront] --> Catalog[Insurance catalog and original guides]
  Catalog --> Application[Versioned application and quotes]
  Application --> Checkout[Review and purchase]
  Checkout --> Account[Personal account]
  Portal[Authenticated context selector] --> Account
  Portal --> Corporate[Corporate buyer]
  Portal --> Benefits[Employee and beneficiary]
  Portal --> Seller[Reseller or agent]
  Portal --> Partner[Carrier or supplier]
  Privileged[Privileged entry with MFA] --> Admin[Configuration administration]
  Privileged --> Operations[Role-limited staff queues]
  Account --> Service[Policy and post-sale servicing]
  Benefits --> Service
```

Public navigation includes insurance categories, original insurer profiles, comparison education, permitted assisted requests, original content/search, help and separately controlled automotive services. It never exposes private application URLs in a sitemap. Adjacent referrals and vehicle trading are separate labeled destinations with capability/authority checks; their presence does not imply direct regulated execution.

## Context and navigation rules

The context selector lists only currently valid personal/organization/distributor/carrier/beneficiary relationships. A person can have several; the current role and organization are visible. Insurer identity is not a corporate-buyer role. Selecting a context reauthorizes it, cancels outstanding reads and clears protected client state. A deep link to another context asks for an explicit permitted switch before exposing resource data. Search, counts, breadcrumbs and recently viewed items share the same authorization filter as their destination.

Within each dashboard, navigation is task-based: policy/benefit records, current work, money where permitted, support and settings. The [seven dashboard specifications](dashboards/customer.md) supply exact routes; the [route inventory](screen-and-route-inventory.md) is the cross-surface index. Menu/widget/action/report configuration is versioned, but only hides or arranges server-granted capabilities. It cannot grant a permission or change a domain state.

## Channel modes and state visibility

All four combinations of B2C/B2B sales are valid. Public catalog/editorial visibility, quotation, purchase, assisted sales, contracted servicing and partner delivery are separate decisions. A disabled sales path explains availability and gives permitted support/servicing navigation; it must not look like an empty portfolio. Existing orders, installments, claims and policy documents remain discoverable according to entitlement. A security quarantine has a different explanation and operational owner.

Orders expose independent payment, submission, underwriting, issuance and delivery statuses. Policy pages show confirmed effective coverage only. Marketing cards cannot override these labels. Corporate commitment distinguishes invoice/credit approval from paid cash receipt. Every public or dashboard route has a defined unauthenticated, forbidden, disabled, expired and error behavior; no raw identifier or private title leaks on denied routes.

## Acceptance and change control

AC-EXP-IA-CONTEXT: two users, two organizations and personal policies exercise every context switch and direct link; no old-context data appears in DOM, response, counts or history restoration. AC-EXP-IA-MODES: every navigation group is tested in all four sales-mode combinations plus independent subchannels and servicing. AC-EXP-IA-CONFIG: a menu proposal referencing an unknown route/action or unauthorized audience fails publication. R04 reviews labels/structure, R11 access implications and R13 route coverage; unreviewed decisions remain draft.
"""),
"design-system": ("EXP-DESIGN","Design system",["DSH-06","GRW-10"],"""## Original visual language and tokens

Use an original calm, readable interface with strong typographic hierarchy and explicit state labels. Competitor assets, text, branding and private APIs are not design inputs to copy. [design-tokens.json](design-tokens.json) is the proposed semantic token source: colors, logical spacing, radius, type scale and focus styles. Components reference semantic names rather than embedding unexplained hex/spacing values. Persian-first RTL and Latin LTR are both supported; font selection and licensing remain an implementation dependency, with locally deployable font assets and fallbacks.

Semantic colors distinguish text/surface/border/action/focus/success/warning/danger. Status always includes text and an icon; color alone carries no insurance or financial meaning. Typography supports Persian shaping and mixed-script identifiers without forced letter spacing. Body text is readable under browser text scaling; controls inherit the document language and do not crop at 200% text zoom.

## Component contracts

| Component | Required states and behavior |
|---|---|
| Money | Explicit amount, currency and unit; label toman conversion; do not sum points/promotional balances with cash; bidirectional isolation. |
| Status timeline | Independent state families, verified timestamps and source; pending/unknown are distinct from failed; accessible ordered list. |
| Field | Persistent label, help, required/conditional cue, error association, safe value preservation; server error code translated into correction. |
| Step form | Current/remaining sections, save/resume status, back without data loss, version/conflict handling; no automatic sensitive browser storage. |
| Quote card/comparison | Price breakdown, equivalent benefit rows, unknown/incomparable explanation, sponsored label, validUntil and eligibility assumptions. |
| Table | Scope-aware counts, stable cursor pagination, accessible headers/sort state, mobile labeled details; no hidden columns that change authorization. |
| Upload | File purpose/allowed type/size, progress, clean-scan status, retry/cancel and requested retake; preview cannot bypass document authorization. |
| Dialog | Accessible name, initial focus, contained keyboard focus, Escape where safe, focus return; confirmation names resource/amount/impact. |
| Toast/notice | Nonblocking success only for acknowledged operation; persistent actionable errors; live region avoids duplicate announcements. |
| Context switcher | Visible role/context, authorized choices, in-flight cancellation and protected cache clearing; no silent switch. |

Design target is WCAG 2.2 AA with manual verification, not a certification. Text contrast follows 1.4.3, nontext affordances 1.4.11, visible focus 2.4.7/2.4.11, and pointer targets 2.5.8. Prefer 44 CSS-pixel touch targets as a product usability choice; applicable WCAG exceptions do not replace testing. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the primary reference S08.

## Responsive behavior and motion

Use content-driven breakpoints; forms collapse to one column before labels/values become cramped. Comparison preserves row labels and allows horizontal scrolling with a visible affordance; essential purchase information remains available without precision dragging. Navigation drawer closes on successful route navigation and restores focus when dismissed. Respect reduced-motion preferences and avoid animated counters for financial/coverage state. Skeletons preserve layout and never represent a confirmed amount or policy.

## Validation and governance

AC-EXP-DESIGN-TOKENS: generated token artifacts agree with source and all used combinations pass required contrast checks. AC-EXP-DESIGN-STATES: component stories cover loading/empty/error/forbidden/read-only/disabled/partial/expired/success in RTL/LTR. AC-EXP-DESIGN-INPUT: keyboard, screen reader, 200% text scaling, 400% reflow, reduced motion and touch are manually reviewed on critical journeys. R04 owns token/component decisions; R07 implements, R11 reviews sensitive display and R13 records evidence. No component implementation or visual approval is claimed here.
"""),
"interaction-and-content-guidelines": ("EXP-INTERACTION","Interaction and content guidelines",["INS-02","INS-06","COM-08","GRW-08","GRW-09","DSH-06"],"""## Truthful state language

Use precise verbs: saved, submitted, payment verified, awaiting insurer, issued, effective, delivered, refund requested and refund completed. Never use “insured” or “active” solely after payment. An acknowledgment explains what was durably accepted and what happens next. Unknown carrier outcome is “confirmation is being checked,” with a support reference and no claim of failure. Customer wording is distinct from masked operator diagnostics.

Quote results disclose incomplete carrier participation, failed/timeout carriers and validity. A price labeled indicative cannot lead directly to binding without revalidation. Sponsored ranking is labeled near the ranking control. Discounts and installment offers show eligibility, total payable, financing costs and terms version; loyalty points and promotional credit are not labeled cash.

## Form and recovery behavior

Ask only fields required by the current versioned product/plan. Conditional changes explain which earlier answers/evidence/quotes will become stale before discarding them. Save/resume displays the last server acknowledgment; local typing is not a persisted draft. When a server validation fails, focus an error summary linking to affected fields and preserve nonsensitive values. Medical/identity data is not echoed in logs, analytics or broad error messages.

For version conflicts, show a safe summary of changed fields and require review; do not silently merge declarations, beneficiaries, money or effective dates. Retry buttons reuse the original idempotency key while body is unchanged. Browser back, reload and duplicate callbacks cannot create a second purchase. Expired links request reauthorization and do not expose underlying document titles. A forbidden route has no record-specific hint.

## Copy and communication controls

Original content uses an editorial author/reviewer/version and source confidence. Product wording references approved insurer terms; unavailable commercial/legal facts are marked pending review rather than invented. Help distinguishes guidance from insurer-authorized decisions. Accessibility labels are meaningful in Persian and English, not direct transliterations of code identifiers.

Transactional messages include a safe case reference and authenticated destination. OTP messages never include account details; claim notifications omit diagnoses/beneficiary/bank data. Marketing requires separate consent/preferences and suppression checks; sending a service notice does not grant marketing permission. Rate limits, retries and delivery outcomes follow notification domain controls. Templates are versioned and audited; the preview must show sample synthetic variables only.

## Destructive and privileged actions

Use a confirmation only when it helps the user understand a material consequence: cancellation request, enrollment removal, payout proposal, role grant or configuration publication. State whether the action is a request or a completed external change, and show effective dates and financial implications. Reason is mandatory for privileged changes; maker-checker is required where domain policy specifies. A confirmation dialog does not replace server authorization or independent approval.

AC-EXP-COPY-STATE: test messages against each independent finance/insurance state and ensure no false activation. AC-EXP-COPY-PRIVACY: template/error/analytics snapshots contain no sensitive fixture values. AC-EXP-COPY-RECOVERY: keyboard user corrects a validation failure and version conflict without losing safe inputs or submitting twice. R04/R16 own copy, R02/R12 validate domain meaning and R13 records tests.
"""),
"localization-rtl-and-calendars": ("EXP-I18N","Localization, RTL and calendars",["INS-02","COM-01","DSH-06","GRW-10","INT-04"],"""## Proposed locale defaults and authority

Persian-first RTL, English documentation/code identifiers, IRR canonical accounting where applicable, optional labeled toman display and Jalali presentation are proposals from the brief. They do not establish jurisdiction, residency, deployment region, legal rules or currency acceptance. Supported locales, calendar algorithms and timezone choices require explicit versioned configuration and tests before launch.

All human text uses message keys with parameter typing, plural rules and translator context. Never concatenate a translated noun with a numeric amount or assume English pluralization. Server errors return stable codes/field paths, while the frontend maps approved copy. Contract wording retains the insurer's authoritative language/version and labels any translation status.

## Direction and formats

Use logical CSS properties and document `dir`; do not reverse business data arrays merely because layout is RTL. Tab order follows DOM reading order. Isolate Latin identifiers, phone numbers, email, policy references and money with appropriate bidirectional markup. Tables, comparison rows, arrows and icons are reviewed for semantic direction; universal symbols and chart time axes are not blindly mirrored. Screen-reader labels spell out units and states.

Normalize Persian/Arabic digits to ASCII only for fields whose schema defines numeric interpretation. Preserve meaningful leading zeros in identifiers. Names remain NFC Unicode, without forced transliteration. Phone/plate/identity formats come from an approved jurisdiction schema; a user's location does not select legal validation rules. Currency display includes explicit currency and unit. Toman display, if enabled, is a presentation conversion with labeled exact rule; ledger and provider mapping retain original units and reject ambiguous rounding. Never store formatted localized money strings as accounting values.

## Dates and time boundaries

| Value kind | Storage and display contract |
|---|---|
| Event timestamp | UTC instant with offset-aware input; display chosen user timezone and exact time on detail. |
| Policy effective/expiry date | Local calendar date plus authoritative coverage timezone/rule; conversion must not shift coverage by treating it as UTC midnight. |
| Trip/project dates | Explicit source calendar and location/contract semantics; validate ordered interval after conversion. |
| Birth date | Date-only, access-restricted; no timezone conversion; rating age uses explicit contract reference date. |
| Quote validity | Server UTC instant from carrier evidence; countdown is advisory and server rejects expiry. |
| Enrollment change | Requested, approved and effective dates remain separate; effective interval conflicts are checked transactionally. |

Calendar conversion uses a pinned reviewed library/algorithm with round-trip fixtures, leap-year cases, Nowruz boundaries and invalid dates. Timezone data version is recorded; daylight-saving/offset transitions are tested for supported zones without assuming current local rules are permanent. A user calendar preference does not rewrite stored contractual dates or historical source values.

## Acceptance

AC-EXP-I18N-ROUNDTRIP: ISO↔selected calendar conversion preserves date-only values and rejects impossible dates. AC-EXP-I18N-MONEY: mixed Persian/Arabic digits and toman display round-trip to explicit canonical integer units without float arithmetic or unlabeled conversion. AC-EXP-I18N-BIDI: malicious/mixed directional input cannot visually impersonate a different amount/reference; controls are normalized or safely represented according to field schema. AC-EXP-I18N-BOUNDARY: quote expiry, effective dates and age calculation cross midnight/year/offset boundaries with an injected clock. R04/R02/R12 review outputs; locale/contract legal sign-offs remain pending.
"""),
"accessibility": ("EXP-A11Y","Accessibility",["DSH-06","GRW-10","INS-02","INS-06","COM-01"],"""## Target and evidence policy

The proposed target is WCAG 2.2 Level AA for public and authenticated journeys. This is a verification target, not a conformance claim. Use the [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (S08), automated checks and manual assistive-technology review. Third-party redirects, uploads, PDFs and embedded support widgets are included in journey risk assessment; inaccessible dependencies require a documented alternative and release decision, not hidden exclusion.

## Verification matrix

| Area | Relevant WCAG 2.2 criteria | Planned evidence |
|---|---|---|
| Structure and labels | 1.3.1, 1.3.2, 2.4.6, 3.3.2 | Semantic landmarks/headings, form labels, table associations; screen-reader walkthrough. |
| Contrast and resize | 1.4.3, 1.4.4, 1.4.10, 1.4.11 | Token contrast, text zoom, reflow and controls at narrow widths. |
| Keyboard and focus | 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11 | Complete quote/purchase/claim flow without pointer; visible unobscured focus, no traps. |
| Pointer/alternatives | 2.5.1, 2.5.7, 2.5.8 | No drag-only action; target sizing and alternatives for complex gestures. |
| Errors and consequential actions | 3.3.1, 3.3.3, 3.3.4 | Linked errors, correction, review before financial/legal-data submission; actual domain revalidation. |
| Authentication | 3.3.8 | OTP paste/autofill, password-manager support for approved alternatives, accessible recovery. |
| Programmatic states | 4.1.2, 4.1.3 | Accessible control names/states; restrained live status announcements. |

## Critical interaction rules

Every dynamic form step has a clear heading and announcement; conditionally revealed fields enter logical reading order. Errors preserve safe data and focus the summary, with links to specific fields. Comparison conveys row/column relationships and exclusions without color or hover-only content. Expiration warnings are accessible; server expiry remains authoritative and cannot be bypassed by UI extension. Authentication challenges allow accessible alternatives consistent with the threat model; do not create cognitive puzzles as the sole route.

Uploads expose file selection, progress, scan/review status, cancel/retry and retake explanation to assistive technology. A camera-only workflow needs an equivalent supported upload/assisted path when carrier rules allow; any mandated capture limitation is explicit. PDF policy documents require accessible delivery planning and a readable structured summary without rewriting insurer terms. Support escalation is available when a third-party artifact cannot be used.

Dialogs set meaningful initial focus, keep focus contained while active and restore it to a valid trigger. Toasts do not steal focus; persistent action-required messages remain discoverable. Context switch clears sensitive state and announces the new context. Tables support keyboard sorting/pagination; virtualized rows require verified screen-reader semantics or a paginated alternative. Reduced-motion preference is honored as a product requirement.

## Test plan and ownership

AC-EXP-A11Y-AUTO: automated checks run on every critical state in RTL/LTR, including contrast and form semantics. AC-EXP-A11Y-MANUAL: keyboard plus a supported desktop and mobile screen reader completes direct purchase, corporate approval, dependent change, claim intake and admin flag approval. AC-EXP-A11Y-RECOVERY: errors, expired sessions, provider partial results and upload failures remain understandable without vision or pointer. AC-EXP-A11Y-REFLOW: zoom/reflow preserves amount, state and next action without clipped labels.

R04 defines experience, R07 implements semantics, R13 records browser/OS/assistive-technology versions and defects, R20 verifies assisted alternatives. High-impact blockers prevent the relevant release slice until corrected or an explicitly reviewed equivalent path exists. Automated pass counts alone do not establish conformance; manual evidence and unresolved issues remain in the release record.
"""),
"responsive-and-mobile": ("EXP-MOBILE","Responsive web, PWA and native scope",["GRW-10","AUTO-08","INS-09","COM-02","DSH-06"],"""## Scope and native decision

Responsive web and an installable PWA are proposed client capabilities. Native iOS/Android applications are an explicit separate scope/stack decision: **undecided, not delivered by this documentation or by a PWA**. R01/R21 must decide native needs after evaluating offline requirements, background work, device APIs, accessibility, distribution, security and maintenance cost. Native work remains visible in GRW-10 scope until a recorded decision; no additional stack is silently adopted.

## Responsive journeys

Public catalog, dynamic forms, comparison, checkout and all seven dashboards must work from narrow touch screens to desktop. Use a single-column form when necessary, persistent step context and a review summary before purchase. Tables become labeled cards or a deliberately scrollable comparison region, preserving essential fields and accessible relationships. Do not hide finance/coverage warnings merely to fit a screen. Touch controls have adequate target spacing; critical actions do not depend on hover or drag.

Mobile network interruption must preserve acknowledged server drafts and display which changes are unsaved. A timeout is not evidence that payment/submission failed. On return from a payment provider or deep link, reauthenticate as needed and query authoritative status rather than trusting URL parameters. Back navigation or repeat opening uses stable idempotency semantics. Sensitive screenshots/previews cannot be technically guaranteed absent on web, so minimize unnecessary display and do not claim screenshot prevention.

## PWA and offline boundary

Installability uses reviewed manifest/icons and a service worker whose cache allowlist contains only public static shell/assets. Do not cache claims, identity documents, policy PDFs, quotes, corporate pricing, wallet data or authenticated API responses offline. Offline mode shows a truthful unavailable message and safe public help; purchase, approval, payout and official inquiries require server authority. Background sync must not replay financial/issuance commands automatically. Logout/context change clears application caches that might contain private data and removes scoped notification subscriptions as required.

Push notifications are opt-in, permission-aware and separate from marketing consent. Lock-screen text contains a generic status and authenticated destination, not a diagnosis, amount, full policy number or beneficiary details. Subscription endpoints are protected personal data with revocation and retention rules. Permission denial leaves account inbox and approved alternative delivery available.

## Capture, files and device capabilities

Request camera/location permissions only at the relevant task with a purpose explanation. Location is optional unless an approved product/provider workflow requires it; manual location correction is supported where permitted. Uploads use scoped sessions, resumable chunks with integrity checks, malware review and same-resource authorization. Image orientation and compression preserve required inspection evidence; lossy transforms are not applied when contract evidence would be invalidated. The original is retained only under approved retention. Retake requests identify the missing view/quality issue without exposing unrelated documents.

Deep links bind route/context/resource and validate current authorization. Expiring document links require reauthorization rather than public bearer access where sensitivity demands. A mobile application installation does not grant access to every organization or carry old role entitlements indefinitely.

## Acceptance and release evidence

AC-EXP-MOBILE-OFFLINE: service-worker/cache inspection finds no sensitive fixtures; offline purchase/approval fails safely and reconnection does not duplicate commands. AC-EXP-MOBILE-UPLOAD: network loss/restart resumes the same permitted evidence session, preserves integrity and does not leak another tenant's upload. AC-EXP-MOBILE-PUSH: denied/revoked permission and logout prevent inappropriate delivery; notification body contains no restricted fixture data. AC-EXP-MOBILE-LINK: malicious/stale cross-context links disclose no resource metadata. AC-EXP-MOBILE-DEVICE: critical routes pass keyboard/touch/screen-reader and central PERF-WEB/PERF-JS budgets on the documented mobile profile.

R21 owns mobile/PWA behavior, R11 cache/permission review, R04 accessible interaction and R13 device evidence. Actual installability, browser compatibility and native-stack selection remain unverified until implementation and explicit review.
""")
}

def render_experience():
    for slug,(id,title,scopes,body) in EXPERIENCE.items():
        if slug=='information-architecture': body+="\n"+CHANNEL_MAPPING
        md(f"03-experience/{slug}.md",id,title,"R04",scopes,body,["R07","R11","R13","R21"],["S00","S08"] if slug in ["design-system","accessibility"] else ["S00"])
    tokens={"schemaVersion":"1.0.0","status":"proposed","ownerRole":"R04","sourceRefs":["S00","S08"],"updated":DATE,
            "color":{"text":"#172B4D","textMuted":"#44546F","surface":"#FFFFFF","surfaceSubtle":"#F4F7FA","border":"#74849A","action":"#005A78","actionText":"#FFFFFF","focus":"#6B3FA0","success":"#166534","warning":"#854D0E","danger":"#B42318"},
            "spacingPx":{"xs":4,"sm":8,"md":12,"lg":16,"xl":24,"xxl":32},"radiusPx":{"control":8,"panel":12},
            "typePx":{"body":16,"small":14,"heading3":20,"heading2":24,"heading1":32},"lineHeight":{"body":1.7,"heading":1.35},
            "focus":{"outlineWidthPx":3,"outlineOffsetPx":2},"direction":"logical-properties","contrastStatus":"requires component-state verification"}
    write("03-experience/design-tokens.json",json.dumps(tokens,indent=2))
    public=[
        ("/","Catalog navigation, featured permitted products, original content","INS-01, GRW-05, GRW-08","Public approved content only; campaign targeting respects consent"),
        ("/insurance","Hierarchical category/search/filter catalog","INS-01","Public product availability is separate from quote/purchase"),
        ("/insurance/:productId","Product-specific risks, evidence, plans and assisted entry","INS-11","Published editorial plus current availability; no binding price without offer"),
        ("/insurers/:slug","Original insurer profile and permitted plan information","INS-01, GRW-08","Only approved public fields; no private carrier API details"),
        ("/guides/:slug","Original articles, FAQs and assistance content","GRW-08, SVC-05","CMS approved/versioned; sitemap only indexable public content"),
        ("/search","Public product/editorial search","INS-01, GRW-08","No authenticated records/counts in public index"),
        ("/auth/sign-in","Mobile OTP and approved alternatives","GRW-01","Rate-limited, enumeration-resistant; paste/autofill and recovery"),
        ("/auth/recovery","Verified account recovery","GRW-01","No bypass of privileged MFA or organization grant"),
        ("/applications/:id","Versioned questionnaire, evidence, declarations","INS-02, COM-02","Resource relationship plus field mask; private/no-store"),
        ("/quotes/:id/compare","Progressive comparable offers and expiration","INS-05, INS-06, INS-07","Permitted recipient and current quote/risk version"),
        ("/checkout/:applicationId","Party roles, consents, totals and purchase commitment","COM-01, COM-03, COM-04, COM-05","Authoritative price/permission/flag/version recheck"),
        ("/orders/:id","Independent financial/insurance/delivery timeline","COM-08","Safe buyer/payer/insured projections; verified source states"),
        ("/policies/:id","Insurer-confirmed policy detail, cover, parties, effective dates, documents and version history","SVC-01, SVC-05","Policyholder/insured/beneficiary/delegate projection by purpose; payer access alone does not reveal private risk/claims"),
        ("/policies/:id/changes","Endorsement/cancellation request, evidence, requested/approved/effective dates and adjustment tracking","SVC-04","Policy-change authority plus state/carrier capability; request does not alter coverage or authorize refund"),
        ("/assisted-requests/:id","Assigned complex quote/proposal workflow","INS-12","Mandated parties and assigned staff; versioned negotiation"),
        ("/inspections/:id","Booking/checklist/upload/retake","INS-09","Vehicle/resource and assigned reviewer scope"),
        ("/automotive/services","Authorized maintenance providers and bookings","AUTO-05","Provider/service availability and fulfillment permission"),
        ("/automotive/parts","Compatibility/catalog/cart/shipping/returns","AUTO-06","Independent commerce controls and seller authority"),
        ("/automotive/trading","Valuation/listing/auction/transaction destinations","AUTO-07","Each capability separately gated; authority and provider dependencies"),
        ("/partner-referrals","Approved credit/investment partner referral","ECO-01","Disclosure/consent/attribution; no direct regulated execution"),
        ("/help","Approved assistance and support entry","SVC-05, SVC-09","Accessible public guidance; private tickets require identity")]
    INVENTORY_ROUTES.update(r[0] for r in public)
    INVENTORY_ROUTES.update(r[0] for d in DASHBOARDS for r in d['routes'])
    rows="\n".join("| `"+r[0]+"` | "+" | ".join(r[1:])+" |" for r in public)
    groups="\n\n".join(f"### {d['title']}\n\nNormative detail: [{d['slug']} dashboard](dashboards/{d['slug']}.md).\n\n"+"\n".join(f"- `{r[0]}` — {r[1]}" for r in d["routes"]) for d in DASHBOARDS)
    md("03-experience/screen-and-route-inventory.md","EXP-ROUTES","Screen and route inventory","R04",["DSH-06","INS-01","INS-02","COM-01","GRW-10"],f"""## Public and purchase routes

Routes are proposed presentation contracts. Dynamic IDs never grant authorization. Every private route checks context/resource/field access before fetching data; menus alone do not protect it. All routes implement the state contract in their dashboard or the [shared product contract](../01-product/products/shared-product-contract.md).

| Route | Screen and components | Feature scope | Authorization and availability |
|---|---|---|---|
{rows}

## Authenticated route map

{groups}

## Route conformance

The [feature surface map](../_meta/fragments/feature-surface-map.json) maps every baseline parent capability to these real task surfaces and owning specification/role. A feature may share a screen with other capabilities through distinct forms/panels; a background contract has an explicit no-standalone-screen reason and an operational inspection/exception surface. This does not create `/workspace/*` alias pages or imply that every child action is available to every role visiting a route. The feature specification supplies the action-specific rules, and server authorization remains authoritative.

AC-EXP-ROUTES-REGISTER: every published menu/action links to a registered route and domain operation. AC-EXP-ROUTES-DENY: direct navigation, prefetch, server rendering and client transitions enforce the same denial behavior with two users/two tenants. AC-EXP-ROUTES-MODES: cover all four B2C/B2B combinations, independent subchannels, servicing and quarantine. AC-EXP-ROUTES-INDEX: private routes are excluded from public indexing and shared caches; redirects cannot leak private resource titles. R07 owns route implementation, R11 authorization review and R13 coverage evidence. Registry presence is not proof that the screens exist.
""")

GUIDES = {
"customer-guide": ("GUIDE-CUSTOMER","Customer guide",["DSH-01","INS-02","COM-01","COM-08","SVC-01"],"""## Sign in and choose the right context

Use the approved sign-in flow and verify the contact method. Never share an OTP with support or a seller. The account header identifies your personal context; organization or employee benefits appear as separate choices when you have those relationships. Switching context changes the records and actions you can access. Saved family members and assets can be reused only when you have authority for the purpose.

## Obtain and compare an offer

1. Open the product catalog and read the product's classification, evidence requirements and availability. If online quotation is unavailable, use the permitted assisted request.
2. Complete the versioned application. Identify buyer, payer, policyholder, insured and beneficiaries separately. Save waits for server acknowledgment; sensitive drafts are not kept offline.
3. Upload requested evidence through the application. Pending scan/review is not approval. A retake request identifies what needs correction.
4. Compare compatible limits, exclusions, deductibles, payment terms and total payable. Some carriers may still be pending or unavailable. An indicative or expired quote must be confirmed/requoted before purchase.
5. Review declarations, terms, party roles and exact currency/unit. A displayed toman amount is labeled separately from canonical accounting units. Confirm only an offer you understand and are authorized to accept.

## Pay and follow the actual status

Return from the payment provider to the order page and wait for server verification. A redirect message is not proof of payment. Do not repeatedly create new orders after a timeout; open the existing order to check status. Payment, insurer submission, underwriting, issuance and delivery are separate. The page may show paid while the insurer is still processing. Coverage is shown as effective only after insurer confirmation under the policy dates.

If confirmation is uncertain, use the support reference and preserve your provider receipt. The team must reconcile an unknown outcome before an unsafe resubmission/refund. If sales are disabled while you are paying, follow the order's verified outcome and recovery instructions rather than assuming that money or coverage has disappeared.

## Service a policy

The policy vault contains authorized documents, coverage and version history. Renewal starts a fresh application with current prices/evidence; old details are a convenience, not a guaranteed offer. An amendment or cancellation is a request until the insurer confirms it. Refund requested and refund completed are separate states. Installment balance, due dates and receipts remain available for existing obligations when new sales are off.

Claim intake asks for the relevant policy, incident and evidence. The platform may guide or transmit a claim without authority to decide/pay it. Your payer or employer does not automatically see private health evidence. Use the notification inbox to open authenticated case links; do not send medical documents in an unapproved channel. Wallet cash, refunds, commissions, promotional credit and loyalty points are separate balances with different permitted uses.

## Recover from a problem

Correct field errors from the linked summary; a changed application/quote requires review before retry. An expired document link can be reopened through the authorized account. For forbidden access, check the context and relationship rather than repeatedly sharing the URL. Support assistance requires visible consent and scope; it does not require your credentials. See the [customer dashboard specification](../03-experience/dashboards/customer.md) for exact screens and controls. This guide describes proposed behavior; product availability and human review remain pending.
"""),
"corporate-admin-guide": ("GUIDE-CORPORATE","Corporate administrator guide",["DSH-02","ORG-02","ORG-03","ORG-04"],"""## Establish organization and role scope

Select the organization explicitly and confirm the branch/cost-center scope shown in the header. A user can belong to several organizations and also hold private policies; corporate access does not include those personal records. Invite members into the smallest role and resource scope needed. Privileged grants require the configured checker. Revoking membership must remove access to open exports and future actions, not merely hide the menu.

## Prepare a census or asset schedule

Download the current import schema and use synthetic data for testing. In production, use only authorized employee/dependent/asset fields. Upload through the clean-scanned import flow, identify the schema/source/effective date and wait for validation. The preview lists row errors, duplicate identities, proposed additions/removals and accepted/rejected counts. Correct errors or explicitly choose an allowed partial policy. Changing the file, roster or effective dates creates a new version and can invalidate an approval.

HR synchronization has the same authority and effective-date rules as manual imports. Resolve conflicts through a new preview; do not overwrite a newer manual change silently. A row being accepted by the platform does not mean the insurer has issued coverage. Track insurer acknowledgment and individual certificates separately.

## Request, approve and pay

Request a group/commercial proposal using the approved schedule version. Compare equivalent census, benefits, deviations and billing terms. The requester records budget/cost-center allocations and proposed payment/credit/invoice arrangement. A distinct checker reviews the exact proposal version, amount, terms and delegated limit. Changing roles does not make the same person an independent checker.

Approved credit/invoice commitment is not cash receipt. Finance sees the corresponding invoice, allocations and exposure; direct payment uses authoritative provider verification. Monitor separate commitment, payment, submission and issuance statuses. Never tell employees that enrollment is effective solely because the employer paid or uploaded a roster.

## Manage benefits and reporting

Joiners, leavers and dependent changes have requested/approved/effective dates. Use the contract's window and change workflow; employment changes do not automatically rewrite insurer-confirmed coverage. Renewals reconcile current census/assets and require fresh offers. Keep employee certificate and claim servicing available for valid entitlements even when new corporate sales are disabled.

Employer reporting excludes individual medical claims, diagnoses, attachments and unrelated personal policies. Aggregate health reports apply proposed cohort and complementary suppression rules; a blank/suppressed cell is a privacy control, not permission to reconstruct it through successive filters. Exports need a purpose and allowed fields; downloads recheck current organization and permission.

Use the [corporate dashboard](../03-experience/dashboards/corporate.md) for route, role, table and error details. R20 support handles enrollment exceptions; finance handles billing differences; restricted claims staff handles private cases. Do not place medical details in general corporate tickets. This guide describes the draft operating model; real contracts and delegated limits require approval.
"""),
"employee-beneficiary-guide": ("GUIDE-BENEFICIARY","Employee and beneficiary guide",["DSH-03","ORG-04","SVC-01","SVC-06"],"""## Open your benefits context

Sign in through the approved flow and choose the relevant organization benefit relationship. Your personal account, employer portfolio and beneficiary access are separate. The benefit page shows accepted coverage, pending enrollment and action-required items distinctly. A census upload or employer payment is not proof that a policy is effective.

Open a coverage card to see the insurer-confirmed dates, benefit wording, network information and available certificate. Check the exact insured person and policy reference before using guidance. Product terms and provider eligibility come from the approved contract; the marketplace does not promise treatment coverage or claim payment merely because a provider appears in a directory.

## Add or correct a dependent

Use the dependent change form, select the relationship and requested effective date, and provide only the required authority/evidence. The plan may have an enrollment window or insurer review. Adult dependents supply private declarations through their own authorized session when required; the payer or employer does not automatically receive them. Track requested, accepted and effective status separately. Removing someone from a draft list is not a confirmed policy cancellation.

If a concurrent HR or administrator change affects the same record, review the refreshed version instead of repeatedly resubmitting. Correcting identity evidence may invalidate a pending offer or certificate request. A new-sales shutdown does not itself remove existing benefits; whether a new dependent addition is servicing or a new sale is determined by the actual group agreement.

## Submit a private claim or ask for help

Choose your policy, enter incident details and upload evidence through the restricted claim form. A claim may be intake, awaiting evidence, assessment, decision or payment processing. Guidance and transmission do not imply platform settlement authority. Employer administrators see only allowed enrollment/aggregate information; they do not receive your diagnosis or private attachments by default.

Use authenticated notifications to open your case. External messages contain a safe status, not medical details. If you need help, open a private benefits ticket and grant only the assistance scope required. Never send OTPs or credentials to an agent. A guardian/delegate must have current authority for the specific dependent/purpose.

## Employment changes and personal purchases

After an employment change, access follows current insurer-confirmed entitlement and relationship rules. Do not assume coverage ended or continued merely from an HR status. Ask support to reconcile discrepancies. A separate personal purchase uses the B2C channel and is not exposed to your employer simply because you entered from a benefits page. Existing certificates and permitted claims remain available according to entitlement when new sales are off.

See the [beneficiary dashboard](../03-experience/dashboards/beneficiary.md) for navigation and expected errors. Actual plan rules, coverage dates and privacy obligations require approved contract and qualified review; this is a draft user guide.
"""),
"seller-guide": ("GUIDE-SELLER","Seller and agent guide",["DSH-04","GRW-06","INS-12","COM-09"],"""## Work within your contract and mandate

Complete onboarding, required contract evidence and training before live sales are enabled. Choose the distributor/team context and verify your assigned scope. A customer's presence in your lead list does not grant access to every policy, health record or family member. Record the source, consent/purpose and current mandate before using customer details. Do not collect credentials or accept an OTP on the customer's behalf.

## Prepare a sale

Create or open an assigned lead, identify product/channel and confirm who is buyer, payer, policyholder and insured. Start an application using only permitted saved details. For an assisted commercial offer, record insurer negotiation evidence and each proposal revision. Customer declarations and final terms acceptance are recorded by the authorized party; a seller cannot silently accept undisclosed terms.

Compare equivalent limits, exclusions, total payable and validity. Changing risk, evidence, schedule or party details invalidates affected offers. Use the revised version for approval and purchase. If the reseller channel is disabled, follow the availability message; direct B2C and corporate controls are separate and cannot be used to bypass reseller authority.

## Follow the order and renewals

The order timeline separates payment, submission, underwriting, issuance and delivery. A verified payment is not an active policy. Request missing evidence only through the authorized case. When a carrier outcome is uncertain, escalate for reconciliation and do not repeatedly resubmit an issuance request. Existing delegated policy servicing may continue when new sales are off, subject to the mandate and contract.

Renewal tasks require current customer authority and fresh quote/evidence. Attribution is determined by the recorded rule/version and qualifying event, not a manually edited referral parameter. If another seller or channel is involved, raise an attribution dispute with evidence instead of changing ownership history.

## Commissions, wallet and payouts

Read pending, confirmed and reversed commissions separately. Refunds/cancellations can reverse a qualifying commission under the approved contract. The wallet distinguishes withdrawable confirmed commission, other cash/refund balances, promotional credit and points. A displayed total is not necessarily withdrawable.

Request a payout only to a verified permitted recipient. Platform finance performs the independent approval and execution; a seller cannot approve their own payout. Bank changes need verification. If the statement is wrong, open a dispute referencing the transaction and rule version; do not edit ledger records or compensate with an unrelated discount.

## Team, exports and support

Team managers assign only within delegated scope; revocation affects open data/downloads. CRM exports require current purpose/mandate and field restrictions. Never use the portal as an unrestricted phone list or medical-data export. Use safe ticket references and masked evidence for support. Exact route/actions are in the [seller dashboard](../03-experience/dashboards/seller.md). Real commission terms, distributor authority and live operations remain pending external approval.
"""),
"insurer-portal-guide": ("GUIDE-CARRIER","Insurer and supplier portal guide",["DSH-05","INT-06","INT-07","COM-06","COM-09"],"""## Select the correct partner role

The portal identifies carrier/supplier organization, product/channel scope and staff role. A carrier is not a corporate buyer. Underwriting, operations, finance and partner administration have different field/action grants; seeing a dashboard does not authorize every case. Supplier fulfillment staff receive only their service orders, not insurance underwriting data.

API-only operation is supported when approved: portal seats are optional, while versioned contracts, authorization, delivery audit and reconciliation still apply. Disabling B2B sales must not disable your authorized B2C carrier traffic. Sandbox and live environments are visibly distinct and use separate configuration/credentials.

## Process submissions and decisions

Open an assigned submission and review canonical application version, permitted risk/evidence and correlation reference. Acknowledge through the contracted operation. Request supplementary evidence with a reason and scope; do not ask for unrelated customer records. Underwriting accept/reject decisions require delegated authority, current case version and evidence references.

Issuance records the verified carrier policy reference, document and effective-date semantics. It must not overwrite payment status or infer activation from a receipt. Callback/polling races are deduplicated by the backend. If a submission times out after possible acceptance, reconcile using an authoritative status/reference before replay; lack of idempotency/status capability may require manual evidence and a separately approved action.

## Propose products or integration changes

Use a draft proposal for plan/form/rate/mapping changes. Supply source/version, capabilities, synthetic contract evidence, effective time and rollback plan. Publication/live activation requires the platform's independent review and real contract/authority evidence. Do not paste credentials into tickets, mapping examples or arbitrary URLs. Credential rotation uses secret references and reviewed endpoint/egress configuration.

Product capability discovery must say which operations are supported: quote/reserve/submit/status/issue/document/endorse/cancel/claim. Unsupported operations show an approved assisted path or unavailable state; the portal cannot manufacture an API capability.

## Claims and settlements

View only assigned claims and fields necessary for your contracted role. Assessment, decision and payout authority are separate. Finance reconciles statement amounts, premium allocations, commissions/refunds and approved settlements. A dispute preserves the original evidence and ledger history; adjustments use controlled entries. Payout and recipient changes obey dual control and authoritative verification.

Exports recheck organization, product/channel and role at generation and download. Diagnostic views mask secrets and unnecessary PII. For an incident, provide correlation, operation, environment, mapping version and observed state through the approved support route. See the [carrier dashboard](../03-experience/dashboards/carrier.md) for exact routes and denials. No real insurer connectivity, certification or authority is claimed by this documentation.
"""),
"platform-admin-guide": ("GUIDE-ADMIN","Platform administrator guide",["DSH-06","CHN-04","ORG-02","INT-06"],"""## Enter with a bounded privileged role

Use the privileged sign-in and required MFA. Confirm the domain and scope you administer. Super-admin is exceptional time-bound elevation, not a routine license to browse medical/financial data. Every material change needs reason and audit; protected operations may require an independent checker. Role switching does not make the same human eligible to approve their own proposal.

## Change availability safely

1. Open feature management and create a proposal with key/type, scope, value, effective time, dependency changes, reason and rollback target.
2. Preview all four B2C/B2B combinations and relevant corporate/commercial/reseller/B2B2C subchannels. Check discovery, quotation, purchase, assisted sale, servicing and partner delivery separately.
3. Inspect draft, existing quote, payment-in-progress and committed-order behavior. A new-sales shutdown must preserve contracted servicing and required committed delivery.
4. Run schema/dependency/permission and race tests, then obtain the required checker. Publish the approved version at its effective time and monitor audit/queue effects.
5. Roll back through a new audited configuration version if needed. Rollback does not undo completed purchases, restore revoked access or rewrite financial history.

Audit/security foundations cannot be disabled by ordinary commercial flags. A security quarantine is a distinct incident action with bounded scope, reason, operator ownership and recovery criteria.

## Manage catalog, organizations and integrations

Keep product/forms/rates/underwriting/mappings immutable once referenced by a transaction. Draft a new version, validate synthetic fixtures and obtain required domain/commercial review. Missing real carrier agreements, rates or authority keeps live operations disabled. Organization onboarding models buyer/supplier/distributor relationships separately; a carrier organization must not be treated as a B2B buyer by default.

Integration studio accepts reviewed schema mappings and secret references. Approved endpoints/egress, authentication rotation, capability discovery and sandbox/live separation are mandatory. It does not execute arbitrary administrator-supplied code. Unknown carrier outcomes must remain visible for reconciliation; a replay button is not a substitute for evidence.

## Configure experiences and commercial programs

Menus, widgets, actions and reports reference registered routes/operations and intersect server permissions. Preview both permitted and denied roles, including cross-context data. A hidden field is not protected unless the API projection also omits it. Content/campaign/loyalty/referral proposals need their domain controls; games, prize draws, charitable redemption and financial referrals remain separately review-gated.

Automotive providers, parts commerce, trading, auctions, contracts and debt settlement have distinct capabilities and authority requirements. Do not enable a whole vehicle-trading bundle because one provider supports valuation.

## Review and investigate

Use scoped reports and append-only audit. Exports require purpose, field policy and current permission; avoid global customer dumps. Operational cases belong in the [staff workbench](../03-experience/dashboards/operations.md), where assignment and decision authority are explicit. See the [admin specification](../03-experience/dashboards/admin.md) for the full workbench map. Human approval, live certification and release evidence remain pending.
"""),
"operator-support-guide": ("GUIDE-OPS","Operator and support guide",["DSH-06","COM-08","COM-09","SVC-09","INT-07"],"""## Claim and understand a case

Open only queues assigned to your role and scope. Claiming a task acquires a versioned lease; if another operator owns it, use the read-only view or authorized transfer. Read independent payment, submission, underwriting, issuance, delivery and settlement states before taking action. A customer payment receipt is evidence for reconciliation, not permission to mark coverage active.

Confirm resource/context, last verified state, source evidence, current version, next permitted action and customer-visible explanation. Notes distinguish restricted internal evidence from customer-visible content. Never include credentials, OTPs or unnecessary personal/medical data. Support assistance requires explicit consent and scope; do not impersonate the customer silently.

## Handle common exceptions

| Case | Allowed response | Prohibited shortcut |
|---|---|---|
| Payment return without verification | Query authoritative payment status and reconcile the existing attempt. | Mark paid from browser parameters or create repeated orders. |
| Paid but unissued | Check committed event/outbox, submission state, underwriting dependencies and carrier evidence. | Mark policy active to clear the queue. |
| Carrier timeout after possible acceptance | Set/retain unknown outcome, query authoritative status or escalate for evidence. | Blindly resend non-idempotent issuance or refund before reconciliation. |
| Duplicate callback | Match inbox/business key and preserve one logical transition. | Apply a second allocation or issue another policy. |
| Evidence rejected/expired | Request the specific correction/retake and preserve version history. | Approve an unsafe upload or reuse expired inspection. |
| Bulk partial failure | Identify accepted/rejected rows and approved partial policy; retry stable row identities. | Report whole-batch success or duplicate valid rows. |
| Provider fulfillment dispute | Track booking/shipping/return evidence and authorized remedy. | Promise an insurance refund or provider payment without authority. |

## Financial and claim decisions

Finance maker proposes a refund/settlement/payout with original allocation, exact currency/unit, reason, verified recipient and evidence. A distinct checker approves within delegated limit; the execution worker performs the provider operation. Unknown payout outcomes require reconciliation. Ledger corrections use reversals/adjustments, never destructive edits or balancing an unrelated account.

Claims handlers see only assigned restricted cases and actual contract authority. Intake, assessment, decision and payment are separate. Employer/seller/payer status does not grant medical access. Escalate coverage interpretation or legal questions to the designated qualified reviewer; do not invent a settlement promise or medical recommendation.

## Escalate and hand over

Escalation includes safe case reference, severity, observed/expected state, masked correlation, evidence location, owner and next permissible action. Alert on oldest unresolved paid/unissued/unknown-outcome work according to operational SLOs; repeated retries are not progress. Handover exports contain safe status/ownership, not attachments or diagnoses. Sales disablement leaves servicing queues available; security quarantine stops only its specified unsafe operations and preserves audit/reconciliation.

Use the [operations dashboard](../03-experience/dashboards/operations.md) and approved runbooks for exact steps. R20 owns queue procedure, R09 partner ambiguity and R12 finance decisions. This draft guide is not live operating authority and contains no claim that recovery tests have passed.
"""),
"developer-onboarding-guide": ("GUIDE-DEVELOPER","Developer onboarding guide",["INT-01","INT-07","DSH-06","CHN-05"],"""## Start from inspected reality

At documentation discovery the repository contained only `README.md` and Git metadata; no application package manifest, lockfile, source, credentials or deployment was present. This task adds documentation, specifications, fixtures and validation tooling under `docs/`. Do not treat planned module paths, API operations or acceptance IDs as implemented software or passing tests.

Read repository/user instructions and the [documentation index](../README.md), then the [architecture overview](../04-architecture/architecture-overview.md), [SRS](../02-requirements/software-requirements-specification.md), [state machines](../02-requirements/state-machines.md), [contracts](../06-contracts/api-conventions.md) and [performance registry](../_meta/performance-budgets.yaml). Check status, assumptions and blockers before selecting a vertical slice. Generated decisions are proposed/draft unless real approval evidence says otherwise.

## Work a vertical slice

1. Select requirement/acceptance IDs and product/channel/dashboard scope from traceability. Include denied roles, disabled new sales and preserved servicing.
2. Resolve schema/operation/event ownership and planned modules. NestJS owns domain services/workers; Next.js owns presentation and calls authorized contracts, not database tables.
3. Pin supported exact dependencies with official-source/security/compatibility evidence and a lockfile during the authorized implementation task. Do not infer a package version from this guide.
4. Implement trust-boundary validation, explicit party relationships, resource/field authorization, optimistic versions and idempotency before wiring UI actions.
5. Test durable commit/outbox, duplicate callback, unknown external outcome, financial invariants and recovery. Use fictional carrier/payment fixtures; never add real credentials or live purchases to a documentation test.
6. Measure the actual application journey against central budgets, separating provider latency, lab/synthetic/field evidence and cold/warm states. Health-endpoint throughput is not a purchase benchmark.

## Documentation workflow

Product/experience source data is in `docs/_meta/validation/build_experience.py`; its outputs are deterministic Markdown, fixtures and fragments. In this workspace shell commands follow the RTK instruction. Regenerate owned outputs with `rtk proxy python3 docs/_meta/validation/build_experience.py`, then run the repository's documentation validator documented in the metadata validation directory. Do not rerun generators over another author's manual changes without reconciling the source first.

Every normative document needs metadata, stable IDs, source/assumption references and review status. A specification change updates affected contracts, tests, flags, permissions, traceability and acceptance evidence. Structural validation does not prove semantic completeness. Preserve unknown external dependencies with owner, missing input, safe default and launch consequence rather than inventing a rate, rule, license or certification.

## Critical review checklist

Check two users/two tenants, multi-organization identity, employee health privacy, carrier recipient scope and role revocation across replicas/client caches. Verify new-sales flags cannot bypass authorization or disable committed servicing. Ensure payment success is independent from issuance, B2B credit commitment from cash receipt, and an ambiguous external outcome from definitive failure. Money is exact and unit-labeled; financial history is append-only. Bulk/import/report work is bounded and off request paths.

Application implementation, package installation, production integration and deployment require their own authorized scope. The product fixtures are synthetic design inputs and the guides describe intended behavior. Release readiness requires real approvals and executed evidence, not file count or a generated coverage claim.
""")
}

def render_guides():
    for slug,(id,title,scopes,body) in GUIDES.items():
        md(f"15-guides/{slug}.md",id,title,"R17",scopes,body,["R04","R11","R13","R20"])

def render_feature_surface_map():
    """Bind feature specifications to actual task routes, not synthetic module pages."""
    # Each tuple names an authored route, permitted role lens and feature-specific task.
    mapping={
        'INS-01':[("/insurance","public visitor","Browse hierarchical products, search and availability"),("/insurers/:slug","public visitor","Read approved insurer profile/plan information"),("/admin/catalog","catalog/content editor","Version category, featured-product and availability presentation")],
        'INS-02':[("/applications/:id","authorized applicant/customer","Complete conditional versioned fields, declarations and save/resume"),("/admin/catalog","catalog/content editor","Draft/test/publish approved form schema and localization")],
        'INS-03':[("/account/people-and-assets","personal customer; authorized guardian/delegate","Manage purpose-authorized people, dependents, addresses and assets"),("/org/:orgId/census","enrollment administrator","Manage scoped enrollment relationships without private medical disclosure")],
        'INS-04':[("/applications/:id","authorized applicant/customer","Request permitted insurance history/owner inquiry and review provenance/manual correction"),("/ops/underwriting","underwriting/inspection operator","Resolve inquiry failure or conflicting evidence without replacing provenance")],
        'INS-05':[("/quotes/:id/compare","authorized applicant/customer","Start and observe eligible carrier fan-out, partial results and expiry"),("/seller/quotes","seller","Compare assigned customer's permitted proposals"),("/org/:orgId/quotes","requester","Review scoped commercial/group carrier offers")],
        'INS-06':[("/quotes/:id/compare","authorized applicant/customer","Sort/filter comparable premium, limits, deductible, exclusions and disclosed sponsorship"),("/org/:orgId/quotes","requester; approver/checker","Compare consistent schedule/proposal revisions and negotiated deviations")],
        'INS-07':[("/applications/:id","authorized applicant/customer","Select contract-offered coverages/riders and resolve dependencies"),("/quotes/:id/compare","authorized applicant/customer","Review coverage/pricing effects and incomparable limits"),("/admin/catalog","catalog/content editor","Version plan/rider constraints with approved carrier rules")],
        'INS-08':[("/ops/underwriting","underwriting/inspection operator","Review assigned risk/evidence and record only delegated decisions"),("/partner/underwriting","carrier underwriter","Request evidence and accept/reject within carrier authority"),("/applications/:id","authorized applicant/customer","Respond to underwriting declarations/evidence requests")],
        'INS-09':[("/inspections/:id","authorized vehicle applicant","Book inspection, upload checklist evidence and resolve retakes"),("/ops/inspections","underwriting/inspection operator","Assign/review inspection, expiry and retake workflow")],
        'INS-10':[("/account/quotes","personal customer","Save/resume and retrieve authorized quotes, expiry and reminder state"),("/quotes/:id/compare","authorized applicant or scoped share recipient","Open authorized expiring quote share and revalidate before action")],
        'INS-11':[("/insurance/:productId","public visitor; authorized applicant","Read family-specific product terms and enter its distinct risk form"),("/applications/:id","authorized applicant/customer","Complete the chosen product-family fields and evidence"),("/admin/catalog","catalog/content editor","Maintain each family schema, plan and live-authority gate")],
        'INS-12':[("/assisted-requests/:id","mandated applicant and assigned commercial staff","Track complex inquiry, callback, negotiation and approved proposal versions"),("/seller/quotes","seller","Prepare a mandated assisted proposal"),("/org/:orgId/quotes","requester; approver/checker","Review group/commercial negotiation and approval")],
        'COM-01':[("/checkout/:applicationId","authorized buyer/payer","Review party roles, consents, eligibility and exact total before commitment"),("/org/:orgId/approvals","approver/checker","Approve exact corporate purchase version within delegated limit")],
        'COM-02':[("/applications/:id","authorized applicant/customer","Provide purpose-required identity/ownership/medical/property evidence"),("/account/documents","personal customer; authorized guardian/delegate","Retrieve own permitted reviewed evidence/documents"),("/ops/underwriting","underwriting/inspection operator","Review assigned clean-scanned evidence and expiry")],
        'COM-03':[("/checkout/:applicationId","authorized payer","Create provider payment attempt and review exact allocation"),("/orders/:id","authorized buyer/payer","Observe authoritative verification and recover existing attempt"),("/ops/reconciliation","finance maker/checker","Resolve duplicate/unmatched provider payment evidence")],
        'COM-04':[("/checkout/:applicationId","authorized buyer/payer","Review installment eligibility, financing terms, down payment and total payable"),("/account/installments","personal customer or authorized payer","View accepted schedule and resulting obligations"),("/org/:orgId/billing","finance payer","Review permitted organization financing/billing obligations")],
        'COM-05':[("/checkout/:applicationId","authorized buyer/payer","Apply eligible promotion and see validated total/stacking result"),("/admin/marketing","catalog/content editor; configuration checker","Propose/approve campaign limits, budgets, stacking and expiry")],
        'COM-06':[("/ops/issuance","issuance operator","Process committed submissions, evidence dependencies and exceptions"),("/partner/issuance","carrier operations","Provide authorized policy reference/document/effective dates"),("/orders/:id","authorized buyer/policyholder","Track issuance separately from payment and delivery")],
        'COM-07':[("/account/documents","personal customer; authorized policy recipient","Access authorized insurer document/PDF"),("/ops/policy-delivery","policy servicing/delivery operator","Resolve account/link/SMS/email/physical courier delivery and safe redelivery"),("/orders/:id","authorized buyer/policyholder","Track delivery without changing issuance state")],
        'COM-08':[("/orders/:id","authorized buyer/payer/policyholder","Read independent order/payment/submission/underwriting/issuance/delivery timeline"),("/account/orders","personal customer","Find existing order and required action"),("/admin/orders-policies","platform configuration maker with domain read grant","Inspect masked cross-domain exception state; no inferred coverage")],
        'COM-09':[("/ops/reconciliation","finance maker/checker","Resolve allocation, payment and ledger/provider discrepancies"),("/ops/refunds-settlements","finance maker/checker","Propose/check controlled refunds, settlements and payouts"),("/partner/settlements","carrier finance","Review own carrier statement/dispute"),("/seller/commissions","seller finance","Review own commission accrual/reversal and dispute")],
        'SVC-01':[("/account/policies","personal customer; authorized policy delegate","Browse authorized policy vault and versions"),("/policies/:id","authorized policyholder/insured/beneficiary","Read permitted coverage/documents/history"),("/benefits/certificates","employee/beneficiary","Retrieve own accepted group certificate")],
        'SVC-02':[("/account/renewals","personal customer","Start fresh renewal from permitted prior policy data"),("/org/:orgId/renewals","requester; approver/checker","Reconcile group/fleet changes and negotiate renewal"),("/seller/renewals","seller","Work assigned renewal with current mandate and attribution")],
        'SVC-03':[("/account/installments","personal customer or authorized payer","Read schedule/balance, pay eligible installment and submit dispute"),("/org/:orgId/billing","finance payer","Manage scoped organization schedules/allocations"),("/ops/reconciliation","finance maker/checker","Resolve receipts, arrears allocation and disputed payment evidence")],
        'SVC-04':[("/policies/:id/changes","authorized policyholder/delegate","Request correction, endorsement or cancellation and track effective status"),("/ops/policy-changes","policy servicing/delivery operator","Process carrier-approved amendments/cancellation with versioned evidence"),("/ops/refunds-settlements","finance maker/checker","Approve resulting refund adjustment under separate authority")],
        'SVC-05':[("/help","public visitor; policy customer","Find approved claims procedures and support/escalation guidance"),("/policies/:id","authorized policyholder/insured","Read policy/carrier-specific claim instructions"),("/benefits/providers","employee/beneficiary","Find verified contracted service/assistance locations")],
        'SVC-06':[("/account/claims","authorized claimant/guardian","Submit policy-linked incident form, evidence and private status"),("/benefits/claims","employee/beneficiary; authorized guardian","Submit private group-benefit claim without employer disclosure"),("/ops/claims","claims handler/assessor","Triage assigned intake and supplementary evidence")],
        'SVC-07':[("/ops/claims","claims handler/assessor","Assign assessment, inspect loss, request evidence and track review rights"),("/partner/claims","carrier underwriter or delegated claims role","Record contract-authorized assessment/decision"),("/account/claims","authorized claimant","See safe decision/review status and requested next action")],
        'SVC-08':[("/ops/refunds-settlements","finance maker/checker with claims payout authority","Verify approved claim amount/recipient, check and reconcile payout"),("/ops/claims","claims handler/assessor","Link approved claim decision to distinct payment request/status"),("/account/claims","authorized claimant/beneficiary","View permitted payment status without assuming settlement from assessment")],
        'SVC-09':[("/account/support","personal customer","Create ticket/complaint, upload scoped attachments and grant limited assistance"),("/benefits/support","employee/beneficiary","Request private benefit support"),("/ops/support","support agent","Assign/respond/escalate cases within consent and queue scope")],
        'GRW-01':[("/auth/sign-in","unauthenticated account holder","Use approved OTP/authentication flow with enumeration resistance"),("/auth/recovery","account recovery claimant","Complete verified recovery without bypassing privileged MFA"),("/account/settings","personal customer","Manage sessions, profile, consent and mandates"),("/org/:orgId/team","organization admin","Invite/revoke scoped organization membership")],
        'GRW-02':[("/account/wallet-and-rewards","personal customer","Read separated cash/refund/promo balances and permitted redemption"),("/seller/wallet","seller finance","Read confirmed commission/holds and request eligible withdrawal"),("/ops/refunds-settlements","finance maker/checker","Check/reconcile approved wallet withdrawal or refund")],
        'GRW-03':[("/account/wallet-and-rewards","personal customer","View points, missions, rewards, badges, expiry and separately approved games/draw/charity options"),("/admin/marketing","catalog/content editor; configuration checker","Version/review loyalty rules, reward budgets, fraud and regulated-mechanic gates")],
        'GRW-04':[("/account/referrals","personal customer","Manage own referral code/link and pending/confirmed/reversed qualifying rewards"),("/seller/settings","seller","View contract-authorized attribution codes"),("/admin/marketing","catalog/content editor; configuration checker","Review attribution, caps, budgets and anti-self-referral controls")],
        'GRW-05':[("/","public visitor under applicable consent","View eligible original campaign placement/landing content"),("/admin/marketing","catalog/content editor; configuration checker","Plan/schedule/approve segments, budgets, targeting and channel/product restrictions")],
        'GRW-06':[("/seller/onboarding","seller","Submit contract/evidence and training prerequisites"),("/seller/leads","seller; team manager","Work scoped CRM, assignment and assisted-sale pipeline"),("/seller/commissions","seller finance","View own commission statement/disputes"),("/seller/reports","seller; team manager","Review scoped sales/renewal performance")],
        'GRW-07':[("/org/:orgId/quotes","requester; approver/checker","Request/review negotiated group/commercial proposals"),("/org/:orgId/contracts","organization admin; requester","Review own agreement and account-team handoff"),("/admin/corporate","tenant administrator with commercial scope","Coordinate corporate leads/accounts and exceptions")],
        'GRW-08':[("/guides/:slug","public visitor","Read original approved articles/FAQs/product guidance"),("/search","public visitor","Search only public approved content"),("/insurers/:slug","public visitor","Read original approved insurer profiles"),("/admin/marketing","catalog/content editor; configuration checker","Manage CMS revisions, redirects, metadata and indexing approval")],
        'GRW-09':[("/account/notifications","personal customer","Read safe transactional/reminder delivery and authorized destination"),("/account/settings","personal customer","Manage communication preferences and separate marketing consent"),("/admin/settings","platform configuration maker; configuration checker","Version approved templates/audiences and dashboard communication configuration"),("/ops/notifications","support agent or assigned operational role","Read assigned case/shift messages")],
        'GRW-10':[("/applications/:id","authorized applicant/customer","Use responsive form, secure mobile upload and truthful reconnect behavior"),("/account/settings","personal customer","Manage permission-aware web/PWA notifications and preferences"),("/account","personal customer","Use installable responsive portal; native-app scope remains separate undecided work")],
        'AUTO-01':[("/account/garage","personal customer; authorized vehicle delegate","Manage multiple vehicle/motorcycle relationships, policy links and deadlines"),("/account/people-and-assets","personal customer","Maintain authorized asset identity and ownership changes")],
        'AUTO-02':[("/account/garage","personal customer; authorized vehicle delegate","Request supported official fine/toll/tax/license/plate/registration/inspection/history inquiry with provenance/freshness"),("/ops/partner-exceptions","provider operations with inquiry scope","Resolve provider failures, unsupported inquiry and disputed provenance")],
        'AUTO-03':[("/account/garage","authorized vehicle payer","Review eligible official obligations, fee disclosure and supported payment request"),("/account/payments","personal customer or authorized payer","Read official receipt/pending settlement and allocation"),("/ops/reconciliation","finance maker/checker","Resolve duplicate/unmatched automotive provider settlement")],
        'AUTO-04':[("/account/vehicle-alerts","personal customer; authorized vehicle delegate","Manage reminders/inquiry alerts and explicit paid SMS subscription/renewal"),("/account/settings","personal customer","Set allowed communication preferences without hidden subscription consent"),("/admin/automotive","platform configuration maker; configuration checker","Review provider capability and alert/subscription offering")],
        'AUTO-05':[("/automotive/services","authorized service customer","Discover permitted providers/locations and book compatible maintenance service/slot"),("/partner/service-orders","supplier operator","Accept/fulfill own contracted booking"),("/ops/fulfillment","provider operations","Resolve cancellation, rebooking, commission and complaint handoff")],
        'AUTO-06':[("/automotive/parts","authorized commerce customer","Check compatibility/inventory, cart, shipping and permitted returns"),("/partner/service-orders","supplier operator","Fulfill own parts order and return workflow"),("/admin/automotive","platform configuration maker","Review seller/catalog/provider configuration"),("/ops/fulfillment","provider operations","Resolve shipping/returns and finance handoff")],
        'AUTO-07':[("/automotive/trading","authorized vehicle owner/buyer under separately approved capability","Use separately gated valuation/listing/history/auction/contract/secure-transaction/debt-settlement workflow"),("/admin/automotive","platform configuration maker; configuration checker","Review each vehicle-trading provider/authority gate separately"),("/ops/partner-exceptions","provider operations","Resolve trading-provider exception without assuming transaction authority")],
        'AUTO-08':[("/account/vehicle-utilities","personal customer; authorized vehicle delegate","View protected digital vehicle documents and provider road-condition/technical-report utilities with freshness"),("/account/documents","personal customer","Retrieve own authorized vehicle document reference"),("/admin/automotive","platform configuration maker","Review utility provenance, supported capability and official-claim restrictions")],
        'ECO-01':[("/partner-referrals","authorized prospective referral customer","Review partner credit/investment disclosure, consent and referral boundary"),("/admin/marketing","platform configuration maker; configuration checker","Review approved referral campaign/attribution and authority restriction"),("/ops/partner-exceptions","provider operations with referral scope","Resolve referral handoff without direct regulated execution")],
        'CHN-01':[("/admin/features","platform configuration maker; configuration checker","Preview/approve independent B2C new-sales availability and cutoff"),("/insurance","public visitor","See direct discovery availability distinct from other channels"),("/checkout/:applicationId","authorized buyer/payer","Receive authoritative B2C commitment availability decision")],
        'CHN-02':[("/admin/features","platform configuration maker; configuration checker","Preview/approve independent B2B new-sales mode without disabling carriers"),("/org/:orgId/quotes","requester","See corporate/commercial sales availability within organization scope"),("/seller/quotes","seller","See partner-sale availability under separate reseller rules")],
        'CHN-03':[("/admin/features","platform configuration maker; configuration checker","Configure independent corporate/commercial/reseller/B2B2C subchannels"),("/benefits/dependents","employee/beneficiary; authorized guardian","See enrollment eligibility separately from existing benefit servicing"),("/org/:orgId/quotes","requester","Use only enabled organization subchannel")],
        'CHN-04':[("/admin/features","platform configuration maker; configuration checker","Propose/preview/schedule scoped availability, dependencies and rollback"),("/admin/settings","platform configuration maker","Apply menu/widget presentation after server availability and permission intersection")],
        'CHN-05':[("/admin/features","platform configuration maker; configuration checker","Review servicing/partner-delivery impact independently of new sales and quarantine"),("/orders/:id","authorized buyer/policyholder","Track previously committed order during sales shutdown"),("/ops/issuance","issuance operator","Continue permitted committed delivery or handle separate quarantine"),("/account/policies","personal customer","Retain entitled policy access and servicing")],
        'ORG-01':[("/admin/organizations","tenant administrator","Onboard legal entity and buyer/supplier/distributor relationships"),("/org/:orgId/branches","organization admin","Manage delegated branch/department/cost-center hierarchy"),("/org/:orgId","corporate viewer","See explicit organization context and portfolio")],
        'ORG-02':[("/org/:orgId/team","organization admin","Invite/revoke/review scoped memberships and delegated roles"),("/account/settings","personal customer","Review personal sessions and mandate/context relationships"),("/admin/security-audit","security administrator","Audit grants, revocations and cross-context denials")],
        'ORG-03':[("/org/:orgId/approvals","requester; approver/checker","Separate request/check/commit with exact version, limits and budgets"),("/org/:orgId/billing","finance payer","Review invoices, approved credit/prepay and allocations"),("/ops/refunds-settlements","finance maker/checker","Handle authorized finance exceptions with segregation of duties")],
        'ORG-04':[("/org/:orgId/census","enrollment administrator","Import/preview/approve permitted employee/dependent changes and HR conflicts"),("/org/:orgId/assets","enrollment administrator with asset scope","Import/preview approved fleet/asset schedule"),("/ops/import-export","assigned bulk-processing operator","Resolve row errors, partial policy, replay and export authorization")],
        'DSH-01':[("/account","personal customer","Enter B2C portfolio/task summary under personal scope"),("/account/settings","personal customer","Configure permitted preferences and sessions")],
        'DSH-02':[("/org/:orgId","corporate viewer; organization admin","Enter organization portfolio, approval and billing summary"),("/org/:orgId/reports","corporate viewer with report grant","Read restricted aggregate reports with suppression")],
        'DSH-03':[("/benefits","employee/beneficiary","Enter own accepted benefits and pending enrollment"),("/benefits/:enrollmentId/coverage","employee/beneficiary; authorized guardian","Read own coverage and documents without employer/peer access")],
        'DSH-04':[("/seller","seller; team manager","Enter delegated leads/sales/renewal summary"),("/seller/reports","seller; team manager","Read scoped performance/commission reporting")],
        'DSH-05':[("/partner","carrier operations; supplier operator","Enter own carrier/supplier work summary under distinct capability grants"),("/partner/settings","carrier admin","Manage approved organization settings/API-only metadata without exposing secrets")],
        'DSH-06':[("/admin/settings","platform configuration maker; configuration checker","Version/preview menu, widget, action and report definitions with server permission intersection"),("/admin","platform configuration maker","Navigate role-limited administration surfaces"),("/ops","assigned operational staff","Enter separate role-limited task queues and handover")],
        'INT-01':[("/admin/integrations","platform configuration maker; configuration checker","Inspect/review versioned canonical schema and recipient projection compatibility"),("/ops/issuance","issuance operator","Inspect committed purchase correlation/version references in assigned case")],
        'INT-02':[("/admin/integrations","platform configuration maker; configuration checker","Review per-carrier adapter versions, capabilities and safe promotion"),("/partner/api-transactions","carrier operations with diagnostic grant","Inspect own masked protocol/mapping transaction evidence")],
        'INT-03':[("/ops/issuance","issuance operator","Observe durable committed transmission, first attempt and exceptions"),("/orders/:id","authorized buyer/policyholder","See committed order awaiting carrier without false issuance"),("/partner/submissions","carrier operations","Receive own required recipient-scoped submission")],
        'INT-04':[("/admin/integrations","platform configuration maker; configuration checker","Validate versioned canonical/provider fields, enums, dates, money and mapping errors"),("/ops/partner-exceptions","assigned integration operator","Resolve mapping/permanent/transient/ambiguous failure classification")],
        'INT-05':[("/admin/integrations","security administrator with integration configuration grant","Review endpoint/authentication/secret-reference/rotation evidence without secret disclosure"),("/partner/settings","carrier admin","Request approved credential rotation and inspect metadata")],
        'INT-06':[("/admin/integrations","platform configuration maker; configuration checker","Onboard/preview/certify/suspend environment-specific capabilities and endpoints"),("/partner/settings","carrier admin","View own sandbox/live, degraded and API-only connection state")],
        'INT-07':[("/ops/partner-exceptions","assigned integration operator","Review retries/dead letters/unknown outcomes and permitted recovery action"),("/ops/issuance","issuance operator","Serialize safe replay only after required external outcome evidence"),("/ops/reconciliation","finance maker/checker","Resolve paid/unissued or monetary ambiguity against authoritative evidence")],
        'INT-08':[("/ops/issuance","issuance operator","Observe submit/status/issue/callback/polling state and independent finance state"),("/partner/api-transactions","carrier operations with diagnostic grant","Inspect own sequence/correlation and deduplicated callbacks"),("/ops/policy-changes","policy servicing/delivery operator","Follow endorsement/cancellation asynchronous outcomes")],
        'INT-09':[("/admin/integrations","platform configuration maker; configuration checker","Review fictional simulator/conformance evidence and masked health/latency metrics"),("/ops/partner-exceptions","assigned integration operator","Investigate bounded failure injection/observability and recovery evidence"),("/partner/api-transactions","carrier operations with diagnostic grant","Review own masked transaction diagnostics")],
        'INT-10':[("/admin/integrations","platform configuration maker; configuration checker","Review mapping/contract compatibility, recipient routing and controlled version rollout/rollback"),("/admin/security-audit","security administrator","Inspect authorized delivery/export/webhook audit"),("/partner/api-transactions","carrier operations with diagnostic grant","Read own delivery contract/mapping version and status")],
    }
    background={
        'INT-01':"N/A standalone customer screen: canonical business/event schemas are internal contracts; the named workbenches inspect schema versions and committed correlation without exposing raw persistence data.",
        'INT-02':"N/A standalone customer screen: adapter execution is a backend boundary; integration studio and partner diagnostics expose approved version/capability evidence only.",
        'INT-03':"N/A customer send button: post-purchase transmission is triggered by durable authoritative commitment; customers see safe status and staff use issuance exceptions.",
        'INT-04':"N/A customer mapping editor: schema transformation runs at partner boundaries; only approved configuration/review and masked exception handling are interactive.",
        'INT-05':"N/A customer authentication surface: partner credentials/protocols are backend configuration; restricted metadata/rotation workflow never returns secret values.",
        'INT-07':"N/A customer retry control for external effects: outbox/inbox/deduplication are backend mechanisms; staff receive evidence-gated exception/reconciliation controls.",
        'INT-08':"N/A standalone workflow-engine page: synchronous/asynchronous execution is backend state; authorized parties inspect the associated issuance/servicing transaction.",
        'INT-09':"N/A production customer test console: simulator/fault tests are local/sandbox release evidence; integration studio and scoped diagnostics expose approved results and incidents.",
        'INT-10':"N/A customer event-routing page: routing/version compatibility is backend configuration; restricted studio/audit surfaces review changes and recipient delivery evidence.",
    }
    owners={r[0]:f"03-experience/dashboards/{d['slug']}.md" for d in DASHBOARDS for r in d['routes']}
    baseline=[]
    brief=(DOCS/'_meta/input/st-docs.md')
    if brief.exists():
        import re
        baseline=re.findall(r'^- \*\*([A-Z]{3,4}-\d{2}) —',brief.read_text(),re.M)
        baseline=[id for id in baseline if not id.startswith('PRD-')]
    assert len(mapping)==74,(len(mapping),'expected all 74 parents')
    if baseline: assert set(mapping)==set(baseline),('baseline drift',set(mapping)^set(baseline))
    records=[]
    for id,items in mapping.items():
        surfaces=[]
        for route,role,purpose in items:
            assert route in INVENTORY_ROUTES,(id,route,'not an authored route')
            assert not route.startswith('/workspace/'),route
            spec=owners.get(route,'03-experience/screen-and-route-inventory.md')
            assert (DOCS/spec).exists(),spec
            surfaces.append({'route':route,'spec_path':spec,'role':role,'purpose':purpose})
        records.append({'id':id,'status':'draft','source_refs':['S00'],'surfaces':surfaces,'applicability':{'kind':'background_with_workbench' if id in background else 'interactive','reason':background.get(id,'Interactive task is presented on the listed authored route(s); action/field authorization and domain state are checked separately from dashboard entry.')}})
    write('_meta/fragments/feature-surface-map.json',json.dumps(records,ensure_ascii=False,indent=2))
    schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.invalid/schemas/feature-surface-map.v1.schema.json','title':'Feature to authored surface map v1','type':'array','minItems':74,'maxItems':74,'items':{'type':'object','additionalProperties':False,'required':['id','status','source_refs','surfaces','applicability'],'properties':{'id':{'type':'string','enum':list(mapping)},'status':{'const':'draft'},'source_refs':{'type':'array','minItems':1,'items':{'enum':['S00']}},'surfaces':{'type':'array','minItems':1,'items':{'type':'object','additionalProperties':False,'required':['route','spec_path','role','purpose'],'properties':{'route':{'type':'string','enum':sorted(INVENTORY_ROUTES)},'spec_path':{'type':'string','enum':sorted(set(owners.values())|{'03-experience/screen-and-route-inventory.md'})},'role':{'type':'string','minLength':1},'purpose':{'type':'string','minLength':1}}}},'applicability':{'type':'object','additionalProperties':False,'required':['kind','reason'],'properties':{'kind':{'enum':['interactive','background_with_workbench']},'reason':{'type':'string','minLength':1}}}}},'description':'Generator additionally proves all baseline parent IDs appear exactly once and each route exists in its owning specification. This mapping does not grant action permissions.'}
    write('03-experience/feature-surface-map.schema.json',json.dumps(schema,ensure_ascii=False,indent=2))

def schema_and_fixtures():
    """Create strict syntax schemas and complete synthetic examples, not insurer rules."""
    catalog=json.loads((DOCS/"_meta/fragments/products.json").read_text())
    for p in PRODUCTS:
        pid=f"PRD-{p['n']:02d}"
        props={}
        required=[]
        sample={k:v for k,v in p['fixture'].items() if not k.startswith('synthetic') and k!='simulationOnly'}
        context={k:v for k,v in p['fixture'].items() if k.startswith('synthetic') or k=='simulationOnly'}
        for index,(name,typ,condition,constraint,example,sensitivity,error) in enumerate(p['fields'],1):
            desc=f"{condition}; {constraint}. Sensitivity: {sensitivity}. Error: {error}. Eligibility is contract-dependent."
            if typ=='UUID':
                s={"type":"string","format":"uuid"}
                default=f"00000000-0000-4000-8000-{p['n']*100+index:012d}"
            elif typ=='money':
                s={"type":"string","pattern":"^[1-9][0-9]{0,17}$" if 'positive' in constraint and 'nonnegative' not in constraint else "^(0|[1-9][0-9]{0,17})$"}; default="1000000"
            elif typ=='date':
                s={"type":"string","format":"date"}; default="2027-01-01"
            elif typ=='integer':
                s={"type":"integer","minimum":1,"maximum":2147483647}; default=1
                if name=='engineCapacityCc': s['maximum']=100000
                if name=='capacityPersons': s['maximum']=10000
                if name=='capacityKg': s['maximum']=1000000
                if name=='stopCount': s['maximum']=1000
                if name=='durationDays': s['maximum']=3660
                if name=='modelYear': s.update(minimum=1000,maximum=9999)
            elif typ=='decimal string':
                s={"type":"string","pattern":"^[0-9]{1,12}(\\.[0-9]{1,2})?$","not":{"pattern":"^0+(\\.0+)?$"}}; default="1.00"
            elif typ=='array<UUID>':
                s={"type":"array","minItems":1,"maxItems":100,"uniqueItems":True,"items":{"type":"string","format":"uuid"}}
                default=[f"00000000-0000-4000-8000-{p['n']*100+index:012d}"]
            elif typ=='array<string>':
                s={"type":"array","minItems":1,"maxItems":100,"uniqueItems":True,"items":{"type":"string","minLength":1,"maxLength":100}}
                if name=='perilCodes': s['maxItems']=30
                default=["SYNTH-CODE-A"]
            elif typ in ['map','map<date>','map<UUID>']:
                val={"type":"string","minLength":1,"maxLength":100}
                if typ=='map<date>': val={"type":"string","format":"date"}
                if typ=='map<UUID>': val={"type":"string","format":"uuid"}
                s={"type":"object","minProperties":1,"maxProperties":100,"additionalProperties":val}
                default={"00000000-0000-4000-8000-000000000206":"dependent" if typ=='map' else ("2000-01-01" if typ=='map<date>' else f"00000000-0000-4000-8000-{p['n']*100+index:012d}")}
            elif typ=='object':
                s={"type":"object","minProperties":1,"maxProperties":100,"additionalProperties":{"oneOf":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]{1,18}(\\.[0-9]{1,6})?$"}]}}
                default={"syntheticExposure":"1"}
            elif typ=='array':
                if name=='beneficiaries':
                    s={"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","required":["ref","basisPoints"],"additionalProperties":False,"properties":{"ref":{"type":"string","format":"uuid"},"basisPoints":{"type":"integer","minimum":1,"maximum":10000}}}}
                    default=[{"ref":f"00000000-0000-4000-8000-{p['n']*100+index:012d}","basisPoints":10000}]
                else:
                    s={"type":"array","maxItems":100,"items":{"type":"object","required":["id","description","value"],"additionalProperties":False,"properties":{"id":{"type":"string","minLength":1,"maxLength":100},"description":{"type":"string","minLength":1,"maxLength":200},"value":{"type":"string","pattern":"^(0|[1-9][0-9]{0,17})$"}}}}
                    default=[]
            else:
                maxlen=40
                if name in ['deviceModelCode','projectTypeCode','equipmentClassCode','commodityCode','liabilityClassCode','treatmentCode','deviceIdentifier','deviceModelCode','eligibleTerritoryCode']: maxlen=80
                if name in ['specialtyCode','occupationCode','sportCode','allocationCode','valuationBasisCode','useCode']: maxlen=60
                if name in ['illustrationVersion']: maxlen=80
                if name in ['equipmentIdentifier','perilDefinitionVersion']: maxlen=100
                if name=='projectName': maxlen=200
                if name=='cargoDescription': maxlen=1000
                if name=='operationsDescription': maxlen=2000
                if name=='plate': maxlen=20
                if name=='deviceIdentifier': maxlen=64
                s={"type":"string","minLength":1,"maxLength":maxlen}
                if name=='coverageMode': s={"type":"string","enum":["standalone","rider"]}
                if name=='underlyingProductId': s={"type":"string","enum":[f"PRD-{n:02d}" for n in range(1,24)]}
                default="SYNTH-CODE-A"
            s['description']=desc
            props[name]=s
            if condition.startswith('required'):
                if condition!='required for rider': required.append(name)
                if name not in sample: sample[name]=default
        if pid=='PRD-06':
            member=sample['memberRefs'][0]
            sample['relationshipCodes']={member:'dependent'}
            sample['birthDates']={member:'2000-01-01'}
        if pid=='PRD-08':
            sample['beneficiaries']=[{"ref":"00000000-0000-4000-8000-000000000308","basisPoints":10000}]
        # Currency is canonical, not a risk-field property.
        sample.pop('currency',None)
        schema={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":f"https://insurance.invalid/schemas/{pid}.risk.v1.schema.json","title":f"{pid} synthetic risk input syntax","type":"object","additionalProperties":False,"required":required,"properties":props,"description":"Strict syntax baseline. Conditional predicates, cross-field dates/sums/relationships and actual carrier eligibility require the versioned application validator; passing this schema is not underwriting acceptance."}
        # Mode-dependent base-reference requirement is testable even without a carrier contract.
        if 'coverageMode' in props:
            schema['allOf']=[{"if":{"properties":{"coverageMode":{"const":"rider"}},"required":["coverageMode"]},"then":{"required":["basePolicyOrQuoteRef"]}}]
        schema_path=f"01-product/products/schemas/{pid}.risk.schema.json"
        write(schema_path,json.dumps(schema,ensure_ascii=False,indent=2))
        fixture={"fixtureId":f"FIX-{pid}","synthetic":True,"productId":pid,"schemaRef":f"../schemas/{pid}.risk.schema.json","riskExample":sample,"canonicalContext":{"currency":"IRR","unit":"rial","channel":CHANNEL_CODES[p['channels'][0]],"partyAndAuthorityFixture":"Synthetic authorized buyer/payer/policyholder/insured roles; referenced UUIDs resolve only in the local test harness.","productRuleVersion":"SYNTH-1","liveOperationsAllowed":False},"scenarioContext":context,"expected":{"withoutContract":"live_quote_and_purchase_disabled","syntacticValidation":"pass","carrierEligibility":"undetermined_without_synthetic_rule_set","variant":p['scenario']}}
        write(f"01-product/products/fixtures/{pid}.json",json.dumps(fixture,ensure_ascii=False,indent=2))
        for rec in catalog:
            if rec['id']==pid: rec['risk_schema']=schema_path
        docpath=DOCS/f"01-product/products/{pid}.md"
        body=docpath.read_text()
        body=body.replace(f"It is a partial risk example plus explicit expected outcomes; a test harness combines it with canonical party/date/consent fixtures and the fictional carrier rule set.",f"Its riskExample validates against [`schemas/{pid}.risk.schema.json`](schemas/{pid}.risk.schema.json). A test harness combines it with canonical party/date/consent fixtures and the fictional carrier rule set; schema validation alone does not decide conditional underwriting or cross-field eligibility.")
        docpath.write_text(body)
    write("_meta/fragments/products.json",json.dumps(catalog,ensure_ascii=False,indent=2))

if __name__ == "__main__":
    render_products()
    render_dashboards()
    render_experience()
    render_feature_surface_map()
    render_guides()
    schema_and_fixtures()
    print(json.dumps({"products":len(PRODUCTS),"dashboards":len(DASHBOARDS),"experience_topics":len(EXPERIENCE)+1,"guides":len(GUIDES),"product_schemas":len(PRODUCTS),"fixtures":len(PRODUCTS),"status":"draft_generated_not_application_tested"}))
