#!/usr/bin/env python3
"""Build versioned canonical contracts, examples and assembled API/event contracts."""
from build_root import ROOT, doc, write_json
import json,re

def obj(props,required=None,**kw):return dict(type='object',properties=props,required=list(props) if required is None else required,additionalProperties=False,**kw)
def string(**kw):return dict(type='string',**kw)
def ref(n):return {'$ref':'#/components/schemas/'+n}
uuid=string(format='uuid')
instant=string(format='date-time')
version=dict(type='integer',minimum=0,maximum=2147483647)
code=string(minLength=1,maxLength=128,pattern='^[A-Za-z0-9_.:-]+$')
schemas={
 'Money':obj({'amount':string(pattern='^-?(0|[1-9][0-9]{0,23})$'),'currency':string(pattern='^[A-Z]{3}$'),'unit':string(enum=['minor','rial'])}),
 'PartyRole':obj({'partyId':uuid,'role':string(enum=['buyer','payer','requester','approver','policyholder','insured','beneficiary','distributor','carrier']),'relationshipId':uuid},['partyId','role']),
 'PageInfo':obj({'nextCursor':{'type':['string','null'],'maxLength':512},'hasMore':{'type':'boolean'}}),
 'Context':obj({'contextId':uuid,'kind':string(enum=['personal','organization','carrier','seller','platform']),'permissionRevision':version}),
 'VersionedResource':obj({'id':uuid,'version':version,'updatedAt':instant}),
 'Error':obj({'code':code,'messageKey':code,'correlationId':uuid,'retriable':{'type':'boolean'},'fieldErrors':{'type':'array','maxItems':100,'items':obj({'field':string(minLength=1,maxLength=128),'code':code})}},['code','messageKey','correlationId','retriable']),
 'CommandReceipt':obj({'commandId':uuid,'resourceId':uuid,'resourceVersion':version,'status':string(enum=['committed','queued','external_outcome_unknown']),'acceptedAt':instant,'statusUrl':string(format='uri-reference',maxLength=512)}),
 'PendingCommand':obj({'commandId':uuid,'status':string(enum=['pending','running','succeeded','rejected','external_outcome_unknown']),'resourceId':uuid,'resourceVersion':version,'updatedAt':instant,'error':ref('Error')},['commandId','status','updatedAt']),
 'IdempotencyKey':string(minLength=16,maxLength=128,pattern='^[A-Za-z0-9_.:-]+$'),
 'SnapshotVersions':obj({k:code for k in ['product','form','risk','plan','price','wording','consent','mapping','featureConfig']}),
 'Allocation':obj({'lineId':uuid,'kind':string(enum=['premium','tax','fee','discount','financing_cost','insurer_payable','seller_commission','platform_revenue']),'money':ref('Money'),'agreementVersion':code},['lineId','kind','money']),
 'PurchaseSnapshot':obj({'purchaseId':uuid,'version':version,'contextId':uuid,'channel':string(enum=['b2c','corporate','commercial','reseller','b2b2c']),'productId':string(pattern='^PRD-[0-9]{2}$'),'carrierId':uuid,'parties':{'type':'array','minItems':3,'maxItems':10000,'items':ref('PartyRole')},'commitmentKind':string(enum=['verified_payment','approved_credit','approved_invoice']),'paymentReceiptIds':{'type':'array','maxItems':100,'items':uuid},'approvalId':uuid,'creditReservationId':uuid,'versions':ref('SnapshotVersions'),'riskSnapshotRef':uuid,'evidenceManifestRef':uuid,'recipientProjectionRef':uuid,'totalPayable':ref('Money'),'allocations':{'type':'array','minItems':1,'maxItems':1000,'items':ref('Allocation')},'committedAt':instant},['purchaseId','version','contextId','channel','productId','carrierId','parties','commitmentKind','versions','riskSnapshotRef','evidenceManifestRef','recipientProjectionRef','totalPayable','allocations','committedAt']),
 'VerifyPaymentRequest':obj({'attemptId':uuid,'providerReference':string(minLength=1,maxLength=128),'expectedVersion':version}),
 'VerifyPaymentResult':obj({'attemptId':uuid,'state':string(enum=['pending','verified','failed','external_outcome_unknown']),'verifiedAt':instant,'receiptId':uuid,'purchaseId':uuid,'receivedMoney':ref('Money'),'reasonCode':code},['attemptId','state']),
 'CreditCommitRequest':obj({'orderId':uuid,'approvalId':uuid,'approvedProposalDigest':string(pattern='^[a-f0-9]{64}$'),'expectedVersion':version}),
 'CarrierCallbackRequest':obj({'externalEventId':string(minLength=1,maxLength=128),'externalReference':string(minLength=1,maxLength=128),'operation':string(enum=['submission','issuance','endorsement','cancellation','claim','claim_payout']),'observedStatus':code,'occurredAt':instant,'mappingVersion':code,'payloadDocumentRef':uuid}),
 'CallbackAck':obj({'received':{'const':True},'duplicate':{'type':'boolean'},'inboxId':uuid}),
 'ReplayRequest':obj({'submissionId':uuid,'expectedVersion':version,'reconciliationEvidenceId':uuid,'checkerApprovalId':uuid,'reason':string(minLength=10,maxLength=1000),'resolution':string(enum=['confirmed_not_accepted','safe_idempotent_retry','confirmed_accepted_no_resend'])}),
 'FeatureRevisionProposal':obj({'controlId':code,'scope':obj({'kind':string(enum=['global','channel','organization','product','plan','carrier','region','cohort']),'key':code}), 'enabled':{'type':'boolean'},'effectiveAt':instant,'expectedVersion':version,'reason':string(minLength=10,maxLength=1000),'servicingImpactReviewed':{'const':True}}),
 'FeatureRevisionApproval':obj({'proposalId':uuid,'expectedVersion':version,'reason':string(minLength=10,maxLength=1000)}),
}

schemas['PurchaseSnapshot']['properties']['parties']['maxItems']=100
schemas['PurchaseSnapshot']['properties']['insuredScheduleRef']=uuid
schemas['PurchaseSnapshot']['oneOf']=[
    {'properties':{'commitmentKind':{'const':'verified_payment'},'paymentReceiptIds':{'minItems':1}},'required':['paymentReceiptIds']},
    {'properties':{'commitmentKind':{'enum':['approved_credit','approved_invoice']}},'required':['approvalId','creditReservationId'],'not':{'required':['paymentReceiptIds']}}
]
schemas['VerifyPaymentResult']['oneOf']=[
    {'properties':{'state':{'const':'verified'}},'required':['receiptId','verifiedAt','receivedMoney']},
    {'properties':{'state':{'enum':['pending','failed','external_outcome_unknown']}},'not':{'anyOf':[{'required':['receiptId']},{'required':['verifiedAt']},{'required':['receivedMoney']}]}}
]
schemas['PendingCommand']['properties'].update(operationId=code,completion=ref('FCommandCompletion'))
schemas['PendingCommand']['required'].append('operationId')
schemas['PendingCommand']['oneOf']=[
    {'properties':{'status':{'const':'succeeded'}},'required':['completion'],'not':{'required':['error']}},
    {'properties':{'status':{'enum':['pending','running','rejected','external_outcome_unknown']}},'not':{'required':['completion']}}
]
base_id='https://insurance.example.invalid/schemas/'
for name,s in schemas.items():
    def portable(v):
        if isinstance(v,dict):return {k: (('feature-types.schema.json#/$defs/'+x.rsplit('/',1)[-1] if x.rsplit('/',1)[-1].startswith('F') else x.replace('#/components/schemas/','')+'.schema.json') if k=='$ref' and x.startswith('#/components/schemas/') else portable(x)) for k,x in v.items()}
        if isinstance(v,list):return [portable(x) for x in v]
        return v
    write_json('06-contracts/schemas/'+name+'.schema.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':base_id+name+'.schema.json','title':name,**portable(s)})

error_response={'description':'Stable safe error; no raw partner/persistence fields.','content':{'application/problem+json':{'schema':ref('Error'),'example':{'code':'version_conflict','messageKey':'errors.version_conflict','correlationId':'00000000-0000-4000-8000-000000000009','retriable':False}}}}
paths={}
def operation(path,method,oid,title,request,response,permissions,feature_ids,success='200',admin=False,callback=False):
    params=[]
    for p in re.findall(r'\{(.*?)\}',path):params.append(dict(name=p,**{'in':'path'},required=True,schema=uuid))
    if method!='get' and not callback:params.append(dict(name='Idempotency-Key',**{'in':'header'},required=True,schema=ref('IdempotencyKey')))
    if callback:params += [dict(name=n,**{'in':'header'},required=True,schema=string(minLength=1,maxLength=512)) for n in ['X-Partner-Signature','X-Partner-Timestamp','X-Partner-Nonce']]
    if method!='get' and not callback and not path.startswith('/internal/'):
        params.append(dict(name='X-CSRF-Token',**{'in':'header'},required=False,schema=string(minLength=16,maxLength=256),description='Required for cookie-authenticated mutations; verify token and allowed Origin. Not required for independently scoped bearer API clients.'))
    op=dict(operationId=oid,summary=title,description='Validate input and resource/property permissions at the authoritative Nest boundary. Persist durable state before success. Unknown external outcomes remain explicit pending reconciliation.',tags=['administration' if admin else 'integration' if callback else 'platform'],parameters=params,security=[{'PartnerSignature':[]}] if callback else [{'BearerAuth':[]}],responses={success:{'description':'Persisted permitted result','content':{'application/json':{'schema':ref(response)}}},**{s:error_response for s in ['400','401','403','404','409','422','429','503']}},**{'x-permissions':permissions,'x-requirement-parents':feature_ids,'x-idempotency':'stable business operation key and request digest; mismatch409' if method!='get' else 'read-only','x-cache':'private, no-store','x-implementation-status':'specified-not-implemented'})
    if request:op['requestBody']={'required':True,'content':{'application/json':{'schema':ref(request)}}}
    if not callback and not path.startswith('/internal/'):
        op['security']=[{'SessionCookie':[]},{'BearerAuth':[]}]
    paths.setdefault(path,{})[method]=op

operation('/internal/v1/payments/verify','post','verifyPaymentAuthoritatively','Verify provider receipt and commit money atomically','VerifyPaymentRequest','VerifyPaymentResult',['payment.verify'],['COM-03','INT-03'])
operation('/v1/corporate/credit-commitments','post','commitApprovedCredit','Commit approved invoice/credit purchase without a cash receipt','CreditCommitRequest','CommandReceipt',['corporate.credit.commit'],['ORG-03','INT-03'],'202')
operation('/v1/commands/{commandId}','get','getCommandStatus','Retrieve authorized durable command status',None,'PendingCommand',['command.read-own'],['COM-08'])
operation('/internal/v1/purchases/{purchaseId}/snapshot','get','readPurchaseSnapshot','Read immutable permitted purchase snapshot',None,'PurchaseSnapshot',['purchase.snapshot.read'],['INT-01'])
operation('/v1/callbacks/carriers/{carrierId}','post','ingestCarrierCallback','Verify raw callback and persist inbox before acknowledgment','CarrierCallbackRequest','CallbackAck',['carrier.callback.own'],['INT-07','INT-08'],callback=True)
operation('/admin/v1/submissions/replay','post','authorizeSubmissionReplay','Reconcile unknown outcome before a safe operator replay','ReplayRequest','CommandReceipt',['integration.replay','integration.check'],['INT-07'],'202',True)
operation('/admin/v1/feature-revisions','post','proposeFeatureRevision','Propose scoped effective feature change','FeatureRevisionProposal','CommandReceipt',['feature.propose'],['CHN-04'],'201',True)
operation('/admin/v1/feature-revisions/approve','post','approveFeatureRevision','Independently approve immutable feature proposal','FeatureRevisionApproval','CommandReceipt',['feature.approve'],['CHN-04'],'202',True)

feature_path=ROOT/'06-contracts/feature-operations.json'
types_path=ROOT/'06-contracts/feature-types.json'
if types_path.exists():
    types=json.loads(types_path.read_text());schemas.update(types.get('schemas',types.get('components',{}).get('schemas',types)))
    def bundle_refs(value):
        if isinstance(value,dict):return {k:(v.replace('#/components/schemas/','#/$defs/') if k=='$ref' else bundle_refs(v)) for k,v in value.items()}
        if isinstance(value,list):return [bundle_refs(v) for v in value]
        return value
    write_json('06-contracts/schemas/feature-types.schema.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':base_id+'feature-types.schema.json','$defs':bundle_refs(schemas)})
if feature_path.exists():
    operations=json.loads(feature_path.read_text());newpaths=operations.get('paths',operations)
    for path,methods in newpaths.items():
        if path in paths:raise ValueError('duplicate path '+path)
        paths[path]=methods

openapi={'openapi':'3.1.0','info':{'title':'Insurance Marketplace API','version':'1.0.0','description':'Draft product and administration contracts. Fictional local server only; no production connectivity or approval. Canonical models and authored feature fragments are the generation source.'},'jsonSchemaDialect':'https://json-schema.org/draft/2020-12/schema','servers':[{'url':'https://api.insurance.example.invalid','description':'Fictional documentation endpoint; not live'}],'tags':[{'name':n} for n in ['platform','administration','integration','features']],'paths':paths,'components':{'securitySchemes':{'SessionCookie':{'type':'apiKey','in':'cookie','name':'__Host-session','description':'Opaque server session; HttpOnly Secure SameSite cookie, state-changing requests require CSRF token and trusted Origin.'},'BearerAuth':{'type':'http','scheme':'bearer','bearerFormat':'opaque-or-reviewed-token','description':'Subject context and grants resolved server-side; no client tenant authorization.'},'PartnerSignature':{'type':'apiKey','in':'header','name':'X-Partner-Signature','description':'Actual contract-specific signing plus timestamp/nonce; raw bytes verified before parsing.'}},'schemas':schemas},'x-status':'draft','x-source-of-truth':['06-contracts/schemas/','06-contracts/feature-operations.json','06-contracts/feature-types.json']}
write_json('06-contracts/openapi.yaml',openapi)

events={
'purchase.committed.v1':('PurchaseCommitted',obj({'purchaseId':uuid,'purchaseVersion':version,'commitmentKind':string(enum=['verified_payment','approved_credit','approved_invoice']),'snapshotRef':uuid,'recipientProjectionRef':uuid})),
'payment.verified.v1':('PaymentVerified',obj({'attemptId':uuid,'receiptId':uuid,'allocationVersion':version,'snapshotRef':uuid})),
'carrier.submission.requested.v1':('CarrierSubmissionRequested',obj({'submissionId':uuid,'purchaseId':uuid,'businessIdempotencyKey':ref('IdempotencyKey'),'mappingVersion':code,'recipientProjectionRef':uuid})),
'policy.issued.v1':('PolicyIssued',obj({'policyId':uuid,'policyVersion':version,'purchaseId':uuid,'carrierReference':string(minLength=1,maxLength=128),'effectiveFrom':string(format='date'),'effectiveUntil':string(format='date'),'dateSemanticsRef':code,'documentManifestRef':uuid})),
'refund.confirmed.v1':('RefundConfirmed',obj({'refundId':uuid,'receiptId':uuid,'journalId':uuid,'providerEvidenceRef':uuid})),
'claim.decision.recorded.v1':('ClaimDecisionRecorded',obj({'claimId':uuid,'decisionVersion':version,'decision':string(enum=['approved','rejected','evidence_required']),'authorityRef':uuid,'privateDecisionSnapshotRef':uuid}))}
fragment=ROOT/'_meta/fragments/features.json'
if fragment.exists():
    rows=json.loads(fragment.read_text());rows=rows.get('parents',rows.get('entries',[])) if isinstance(rows,dict) else rows
    for p in rows:
        for c in p['children']:
            e=c.get('event')
            if isinstance(e,str) and e and not e.startswith('N/A') and re.fullmatch(r'[a-z0-9_.-]+\.v[0-9]+',e) and e not in events:
                name=''.join(x.title() for x in re.split(r'[.-]',e))
                events[e]=(name,obj({'resourceId':uuid,'resourceVersion':version,'operationId':code,'snapshotRef':uuid,'recipientProjectionRef':uuid}))
async_schemas={};channels={};messages={};async_operations={}
for event,(name,payload) in events.items():
    envelope=obj({'eventId':uuid,'eventType':{'const':event},'schemaVersion':{'const':1},'occurredAt':instant,'correlationId':uuid,'causationId':uuid,'aggregateId':uuid,'aggregateVersion':version,'contextRef':uuid,'data':payload},['eventId','eventType','schemaVersion','occurredAt','correlationId','aggregateId','aggregateVersion','contextRef','data'])
    # Standalone event schema references canonical Money/etc locally.
    def eventrefs(v):
        if isinstance(v,dict):return {k:(x.replace('#/components/schemas/','')+'.schema.json' if k=='$ref' else eventrefs(x)) for k,x in v.items()}
        if isinstance(v,list):return list(map(eventrefs,v))
        return v
    write_json('06-contracts/schemas/'+name+'.event.schema.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':base_id+name+'.event.schema.json','title':name,**eventrefs(envelope)})
    async_schemas[name]=envelope
    messages[name]={'name':name,'title':event,'contentType':'application/json','payload':{'$ref':'#/components/schemas/'+name},'correlationId':{'location':'$message.payload#/correlationId'}}
    channels[name]={'address':event,'messages':{name:{'$ref':'#/components/messages/'+name}},'description':'Logical durable PostgreSQL outbox destination; broker transport is not assumed.'}
    async_operations['publish'+name]={'action':'send','channel':{'$ref':'#/channels/'+name},'messages':[{'$ref':'#/channels/'+name+'/messages/'+name}], 'summary':'Atomic local outbox emission, at-least-once delivery with receiver deduplication.'}
    async_operations['consume'+name]={'action':'receive','channel':{'$ref':'#/channels/'+name},'messages':[{'$ref':'#/channels/'+name+'/messages/'+name}], 'summary':'Authorize recipient, deduplicate inbox and apply per-aggregate guarded effect.'}
async_schemas['IdempotencyKey']=schemas['IdempotencyKey']
write_json('06-contracts/asyncapi.yaml',{'asyncapi':'3.0.0','info':{'title':'Insurance durable business events','version':'1.0.0','description':'Proposed logical event contracts; no deployed broker assumed.'},'defaultContentType':'application/json','channels':channels,'operations':async_operations,'components':{'messages':messages,'schemas':async_schemas},'x-status':'draft'})

U=lambda n:f'00000000-0000-4000-8000-{n:012}'
example={'purchaseId':U(1),'version':1,'contextId':U(2),'channel':'b2c','productId':'PRD-01','carrierId':U(3),'parties':[{'partyId':U(4),'role':r} for r in ['buyer','payer','policyholder','insured']]+[{'partyId':U(3),'role':'carrier'}],'commitmentKind':'verified_payment','paymentReceiptIds':[U(5)],'versions':{k:'synthetic-v1' for k in schemas['SnapshotVersions']['properties']},'riskSnapshotRef':U(6),'evidenceManifestRef':U(7),'recipientProjectionRef':U(8),'totalPayable':{'amount':'1000','currency':'IRR','unit':'rial'},'allocations':[{'lineId':U(9),'kind':'premium','money':{'amount':'1000','currency':'IRR','unit':'rial'}}],'committedAt':'2026-10-28T08:00:00Z'}
write_json('06-contracts/examples/purchase-committed-snapshot.json',example)
credit={**example,'channel':'corporate','commitmentKind':'approved_credit','approvalId':U(11),'creditReservationId':U(12)};credit.pop('paymentReceiptIds')
write_json('06-contracts/examples/credit-committed-snapshot.json',credit)
write_json('06-contracts/examples/purchase-committed-event.json',{'eventId':U(20),'eventType':'purchase.committed.v1','schemaVersion':1,'occurredAt':'2026-10-28T08:00:00Z','correlationId':U(21),'aggregateId':U(1),'aggregateVersion':1,'contextRef':U(2),'data':{'purchaseId':U(1),'purchaseVersion':1,'commitmentKind':'verified_payment','snapshotRef':U(22),'recipientProjectionRef':U(8)}})
write_json('06-contracts/examples/unknown-payment-result.json',{'attemptId':U(30),'state':'external_outcome_unknown','reasonCode':'provider_status_unconfirmed'})
core_examples={
 'PurchaseSnapshot':example,
 'CommandReceipt':{'commandId':U(40),'resourceId':U(1),'resourceVersion':1,'status':'queued','acceptedAt':'2026-10-28T08:00:00Z','statusUrl':'/v1/commands/'+U(40)},
 'PendingCommand':{'commandId':U(40),'operationId':'createPaymentIntent','status':'pending','resourceId':U(1),'resourceVersion':1,'updatedAt':'2026-10-28T08:00:00Z'},
 'VerifyPaymentRequest':{'attemptId':U(30),'providerReference':'SYN-RECEIPT-001','expectedVersion':1},
 'VerifyPaymentResult':{'attemptId':U(30),'state':'verified','verifiedAt':'2026-10-28T08:00:00Z','receiptId':U(5),'purchaseId':U(1),'receivedMoney':{'amount':'1000','currency':'IRR','unit':'rial'}},
 'CreditCommitRequest':{'orderId':U(1),'approvalId':U(11),'approvedProposalDigest':'a'*64,'expectedVersion':1},
 'CarrierCallbackRequest':{'externalEventId':'SYN-EVENT-001','externalReference':'SYN-POLICY-001','operation':'issuance','observedStatus':'issued','occurredAt':'2026-10-28T08:00:00Z','mappingVersion':'synthetic-v1','payloadDocumentRef':U(7)},
 'CallbackAck':{'received':True,'duplicate':False,'inboxId':U(41)},
 'ReplayRequest':{'submissionId':U(42),'expectedVersion':1,'reconciliationEvidenceId':U(43),'checkerApprovalId':U(44),'reason':'Synthetic carrier evidence confirms no acceptance','resolution':'confirmed_not_accepted'},
 'FeatureRevisionProposal':{'controlId':'sales.b2c','scope':{'kind':'global','key':'all'},'enabled':False,'effectiveAt':'2026-10-28T08:00:00Z','expectedVersion':1,'reason':'Synthetic controlled sales closure','servicingImpactReviewed':True},
 'FeatureRevisionApproval':{'proposalId':U(45),'expectedVersion':1,'reason':'Synthetic independent checker approval'}
}
for methods in openapi['paths'].values():
    for operation_item in methods.values():
        if not isinstance(operation_item,dict):continue
        for payload in [operation_item.get('requestBody',{})]+list(operation_item.get('responses',{}).values()):
            for media in payload.get('content',{}).values():
                name=media.get('schema',{}).get('$ref','').rsplit('/',1)[-1]
                if 'example' not in media and name in core_examples:media['example']=core_examples[name]
write_json('06-contracts/openapi.yaml',openapi)

prose={
'api-conventions':'''The proposed API uses OpenAPI 3.1.0 with JSON Schema 2020-12. `/v1` denotes public version, `/admin/v1` privileged administration and `/internal/v1` service-only operations; a path prefix never replaces authentication. Method/path, operationId, permission metadata, input/output schema, status/error and idempotency are defined in [OpenAPI](openapi.yaml). APIs run in Nest; Next consumes typed clients and never reads domain tables directly.

JSON is UTF-8. Reject unknown command fields and unsupported versions. Bound request/response size by central budgets; uploads use scoped object-storage grants. Mutation responses acknowledge persisted commands or committed resources, never unpersisted intention. Durable commands return commandId/status URL, and unknown outcome remains explicit. Resource reads reauthorize relationship and property projection; private responses use no-store. Public editorial/catalog responses have separately declared cache headers.

Input DTO, domain aggregate and persistence row are separate contracts. Internal schemas must not be serialized as public DTOs. Examples are synthetic and `.invalid` servers are intentionally unreachable. Contract validation and source generation must run before implementation client generation.''',
'canonical-models':'''[PurchaseSnapshot](schemas/PurchaseSnapshot.schema.json) separates buyer, payer, requester, approver, policyholder, insured, beneficiary, distributor and carrier. `contextId` identifies the administrative context; it does not grant permission. Product/channel/carrier references and immutable risk/form/price/wording/consent/mapping/config versions make a purchase reproducible.

Direct commitment requires nonempty verified receipt references and amount/currency agreement with accepted allocations. Approved credit/invoice requires an independent approval and reserved commercial limit and must not carry a fabricated payment receipt. These cross-field and accounting invariants are checked by application/property tests, in addition to schema validation. Amounts are signed integer strings with explicit currency/unit; expected charge amounts must be positive under domain rules.

Events contain immutable reference IDs, versions and minimal routing facts; consumers fetch only an authorized versioned recipient projection. This avoids publishing health payloads or current mutable entity snapshots to unrelated recipients. The projection service must reject a recipient with no entitlement. Raw carrier schemas and credentials never become public canonical fields.''',
'public-and-internal-api-scope':'''Public scope includes authorized customer, corporate, employee, seller and carrier views/actions. Administration includes approved configuration, partner connections, finance decisions, audit and operator tasks. Internal scope includes authoritative payment verification, immutable purchase projections and durable worker operations. Carrier callbacks require contract-specific verification; carrier portal identities cannot invoke another carrier's callbacks.

Property projection examples: payer receives payment amount/reference, not insured diagnosis; employer sees enrolled status and approved billing allocation, not private claim evidence; seller sees delegated quote/policy fields, not unrelated account data; carrier receives only its own risk/consent/evidence projection. Platform administrators require explicit purpose/role grants for sensitive content rather than universal payload access.

All public and private shapes are versioned contracts. Persistence IDs, secret references, internal negotiation notes and risk-review flags are omitted unless explicitly permitted. Export, search, notification and background-job APIs obey the same field policy. API-only carrier mode preserves the same operation grants and audit as portal access.''',
'errors-pagination-idempotency':'''Errors use application/problem+json with stable `code`, `messageKey`, `correlationId`, `retriable` and bounded field errors. No stack trace or raw partner message is exposed. 404 conceals inaccessible objects; 403 identifies a forbidden action on an otherwise accessible context; 409 handles stale versions, expired offers, mode conflicts and key/body mismatches; 422 is domain/input rejection; 429 includes retry guidance; 503 is definite transient unavailability. Unknown outcome is a persisted pending state, not a definite 503 failure.

Cursor pagination sorts by a whitelisted field plus stable ID, caps page size and signs an opaque cursor bound to context/filter/schema version. Changing context invalidates the cursor. Counts must not reveal inaccessible rows; large exports are asynchronous and reauthorized at retrieval. Offset-based unbounded scans are prohibited for growing policy/ledger tables.

Idempotency keys are opaque 16–128-character values scoped by principal/context and operation, linked to a request hash and durable result. Same key/body returns prior result; different body is409. Retention must cover provider retry and reconciliation window under approved records policy. Stable business keys outlive transport attempt IDs. Optimistic versioning protects edits, while money/limit/stock reservations use transaction locks and constraints.''',
'webhook-and-event-conventions':'''[AsyncAPI](asyncapi.yaml) pins syntax3.0.0 and logical channels. Publish durable outbox in the same transaction as business state. Receiver inbox key `(source,eventId)` deduplicates; aggregateVersion and per-order serialization handle duplicate/reordered observations. At-least-once external delivery is expected; no exactly-once guarantee is made.

Webhook verification consumes original bounded bytes, validates approved provider signature/mTLS mechanism, timestamp/nonce replay window and destination binding, then schema/mapping. Store a redacted evidence hash and inbox record before acknowledgment. Actual signature algorithm/canonicalization/time window is contract-specific and absent until provider onboarding. Do not substitute a guessed signature recipe for a real contract.

Polling and callback observations resolve the same aggregate through one transition service. A late pending update cannot regress issued status. Timeout-after-send becomes external_outcome_unknown unless authoritative evidence proves rejection. Leases/retries are internal transport states; a worker crash must not change insurance authority or replay a non-idempotent payout.''',
'compatibility-and-versioning':'''Major versions change incompatible semantics; additive optional fields require consumers to handle absence and explicit contract review. Never widen a public response by serializing an updated database object. Retain old mapping/schema versions for in-flight purchases, documents and event replays.

The canonical schema builder and authored feature operation/type fragments are sources; OpenAPI and AsyncAPI are generated artifacts. Regenerate using `python3 -B docs/_meta/validation/build_contracts.py`, then run schema/reference/examples and drift validation. Client generation is a future implementation task requiring a pinned compatible generator and committed lockfile. No generated TypeScript application is claimed here.

Compatibility gates compare operation IDs, authorization requirements, required properties, enums, formats and error behavior, not just file diffs. Rolling deployments must read previous events and use expand/contract database migrations. Mapping rollback binds new work to the selected reviewed version while committed work retains its original mapping unless an explicit audited migration is proven safe.'''}
for slug,body in prose.items():doc('06-contracts/'+slug+'.md',slug.replace('-',' ').capitalize(),body,'R08')
print(f'Contracts: {sum(len([m for m in v if m in ["get","post","patch","delete","put"]]) for v in paths.values())} operations; {len(events)} events')
