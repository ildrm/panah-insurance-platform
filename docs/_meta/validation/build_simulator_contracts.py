#!/usr/bin/env python3
"""Generate fictional wire specifications and synthetic fixtures, never services."""
from pathlib import Path
import base64,hashlib,hmac,json

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'07-integrations/simulated-carriers'
WIRE=BASE/'wire'
WIRE.mkdir(parents=True,exist_ok=True)
def dump(name,obj):
    (WIRE/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
def obj(p,required=None):return dict(type='object',properties=p,required=list(p) if required is None else required,additionalProperties=False)
def text(maximum=128,**kw):return dict(type='string',minLength=1,maxLength=maximum,**kw)
def ref(name):return {'$ref':'#/$defs/'+name}
def kind(name):return {'const':name}
stamp=text(32,format='date-time')
date=text(10,format='date')
identifier=text(64,pattern='^[A-Za-z0-9_-]+$')
amount=text(24,pattern='^(0|[1-9][0-9]{0,23})$')
money=obj({'amount':amount,'currency':kind('IRR'),'unit':kind('rial')})

# A valid tiny one-page PDF: every object offset and xref is computed from bytes.
stream=b'BT /F1 16 Tf 50 750 Td (SYNTHETIC POLICY - NO COVERAGE) Tj ET\n'
objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
 b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
 b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'endstream']
pdf=b'%PDF-1.4\n';offsets=[]
for i,value in enumerate(objects,1):
    offsets.append(len(pdf));pdf+=f'{i} 0 obj\n'.encode()+value+b'\nendobj\n'
xref=len(pdf)
pdf+=b'xref\n0 6\n0000000000 65535 f \n'+b''.join(f'{n:010d} 00000 n \n'.encode() for n in offsets)
pdf+=f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()
(WIRE/'synthetic-policy.pdf').write_bytes(pdf)
document=dict(kind='document',documentRef='SIM-DOC-1',mediaType='application/pdf',sha256=hashlib.sha256(pdf).hexdigest(),sizeBytes=len(pdf),contentBase64=base64.b64encode(pdf).decode())
policy=obj({'policyRef':identifier,'effectiveFrom':date,'effectiveUntilExclusive':date,'documentRef':identifier})
defs={
 'QuoteRequest':obj({'kind':kind('quote_request'),'clientApplicationRef':identifier,'productCode':kind('SIM-MOTOR'),
   'risk':obj({'subjectRef':identifier,'manufactureYear':{'type':'integer','minimum':2000,'maximum':2030}}),'effectiveDate':date}),
 'QuoteResponse':obj({'kind':kind('quote'),'quoteRef':identifier,'premium':money,'expiresAt':stamp,'mappingVersion':kind('map-v1')}),
 'SubmitRequest':obj({'kind':kind('submission_request'),'clientApplicationRef':identifier,'quoteRef':identifier,'acceptedPremium':money,'effectiveDate':date,'mappingVersion':kind('map-v1')}),
 'Acknowledgment':obj({'kind':kind('submission_ack'),'externalRef':identifier,'acknowledgedAt':stamp,'issuanceState':kind('pending')}),
 'StatusRequest':obj({'kind':kind('status_request'),'clientApplicationRef':identifier}),
 'Status':obj({'kind':kind('status'),'clientApplicationRef':identifier,'externalRef':identifier,'submissionState':kind('acknowledged'),
     'issuanceState':text(enum=['pending','issued']),'observedAt':stamp,'policy':policy},['kind','clientApplicationRef','externalRef','submissionState','issuanceState','observedAt']),
 'NotFound':obj({'kind':kind('not_found'),'clientApplicationRef':identifier,'authoritative':{'type':'boolean'},'pollOrdinal':{'type':'integer','minimum':1,'maximum':100}}),
 'Reject':obj({'kind':kind('rejection'),'code':text(enum=['risk_ineligible','quote_expired','amount_mismatch','invalid_schema','idempotency_conflict','unauthorized','throttled','unavailable']),
               'accepted':kind(False),'retriable':{'type':'boolean'}}),
 'DocumentRequest':obj({'kind':kind('document_request'),'policyRef':identifier}),
 'Document':obj({'kind':kind('document'),'documentRef':identifier,'mediaType':kind('application/pdf'),'sha256':text(64,pattern='^[0-9a-f]{64}$'),
                  'sizeBytes':{'type':'integer','minimum':1,'maximum':32768},'contentBase64':text(43692,contentEncoding='base64')}),
 'TransportUnknown':obj({'kind':kind('transport_unknown'),'scenario':kind('timeout_after_acceptance'),'responseReceived':kind(False),
                      'requestMayHaveBeenAccepted':kind(True),'expectedLocalState':kind('external_outcome_unknown'),'automaticResubmitAllowed':kind(False)}),
}
defs['Status']['allOf']=[{'if':{'properties':{'issuanceState':{'const':'issued'}}},'then':{'required':['policy']},'else':{'not':{'required':['policy']}}}]
schema=dict(**{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/simulator/rest-wire.schema.json'},title='Fictional REST carrier wire types',**{'$defs':defs})
dump('rest-wire.schema.json',schema)
fixtures=[]
def fixture(name,shape,value,schema='rest-wire.schema.json',expected=True):
    dump(name,value);fixtures.append(dict(path=name,schema=schema,definition=shape,valid=expected))
quote_request=dict(kind='quote_request',clientApplicationRef='synthetic-order-001',productCode='SIM-MOTOR',risk=dict(subjectRef='synthetic-vehicle-001',manufactureYear=2025),effectiveDate='2026-11-01')
quote_response=dict(kind='quote',quoteRef='SIM-REST-Q-1',premium=dict(amount='120000',currency='IRR',unit='rial'),expiresAt='2026-10-28T08:10:00Z',mappingVersion='map-v1')
submit=dict(kind='submission_request',clientApplicationRef='synthetic-order-001',quoteRef='SIM-REST-Q-1',acceptedPremium=quote_response['premium'],effectiveDate='2026-11-01',mappingVersion='map-v1')
ack=dict(kind='submission_ack',externalRef='SIM-REST-S-1',acknowledgedAt='2026-10-28T08:00:00Z',issuanceState='pending')
pending=dict(kind='status',clientApplicationRef='synthetic-order-001',externalRef='SIM-REST-S-1',submissionState='acknowledged',issuanceState='pending',observedAt='2026-10-28T08:00:01Z')
issued={**pending,'issuanceState':'issued','observedAt':'2026-10-28T08:00:02Z','policy':dict(policyRef='SIM-REST-P-1',effectiveFrom='2026-11-01',effectiveUntilExclusive='2026-11-02',documentRef='SIM-DOC-1')}
for name,shape,value in [
 ('rest-quote-request.json','QuoteRequest',quote_request),('rest-quote-response.json','QuoteResponse',quote_response),
 ('rest-submit-request.json','SubmitRequest',submit),('rest-ack.json','Acknowledgment',ack),
 ('rest-status-request.json','StatusRequest',dict(kind='status_request',clientApplicationRef='synthetic-order-001')),
 ('rest-status-pending.json','Status',pending),('rest-status-issued.json','Status',issued),
 ('rest-rejected.json','Reject',dict(kind='rejection',code='risk_ineligible',accepted=False,retriable=False)),
 ('rest-document-request.json','DocumentRequest',dict(kind='document_request',policyRef='SIM-REST-P-1')),
 ('rest-document-response.json','Document',document),
 ('transport-unknown.json','TransportUnknown',dict(kind='transport_unknown',scenario='timeout_after_acceptance',responseReceived=False,requestMayHaveBeenAccepted=True,expectedLocalState='external_outcome_unknown',automaticResubmitAllowed=False)),
 ('invalid-rest-issued-without-policy.json','Status',{**pending,'issuanceState':'issued'}),
 ('invalid-rest-negative-premium.json','SubmitRequest',{**submit,'acceptedPremium':dict(amount='-1',currency='IRR',unit='rial')}),
 ('invalid-rest-malformed-quote.json','QuoteResponse',{**quote_response,'premium':dict(amount='NaN',currency='IRR',unit='rial')}),
 ('invalid-rest-mapping-v2.json','QuoteResponse',{k:v for k,v in {**quote_response,'priceRial':'120000'}.items() if k!='premium'}),
]:fixture(name,shape,value,expected=not name.startswith('invalid-'))

signed_defs={
 'SubmitRequest':obj({'client_ref':identifier,'quote_ref':identifier,'premium_toman':amount,'effective_jalali':text(10,pattern='^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),'calendar':kind('persian'),'mapping_version':kind('signed-map-v1')}),
 'QuoteRequest':obj({'client_ref':identifier,'product_code':kind('SIM-MOTOR'),'subject_ref':identifier,'effective_jalali':text(10,pattern='^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),'calendar':kind('persian')}),
 'QuoteResponse':obj({'quote_ref':identifier,'premium_toman':amount,'valid_until_utc':stamp,'mapping_version':kind('signed-map-v1')}),
 'Acknowledgment':obj({'receipt_ref':identifier,'result':kind('accepted'),'issuance':kind('pending')}),
 'Callback':obj({'event_id':identifier,'sequence':{'type':'integer','minimum':1,'maximum':100000},'client_ref':identifier,'receipt_ref':identifier,
                'issuance':text(enum=['pending','issued','rejected']),'occurred_at':stamp,'policy_ref':identifier,'effective_jalali':text(10,pattern='^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
                'until_jalali_exclusive':text(10,pattern='^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),'calendar':kind('persian'),'document_ref':identifier},
                ['event_id','sequence','client_ref','receipt_ref','issuance','occurred_at']),
 'CallbackAck':obj({'received':kind(True),'duplicate':{'type':'boolean'}}),
 'Reject':obj({'result':kind('rejected'),'code':text(enum=['risk_ineligible','bad_signature','expired_signature','nonce_replayed','capability_unsupported','invalid_mapping','throttled','unavailable']),'accepted':kind(False)}),
 'Document':defs['Document'],
}
signed_defs['Callback']['allOf']=[{'if':{'properties':{'issuance':{'const':'issued'}}},'then':{'required':['policy_ref','effective_jalali','until_jalali_exclusive','calendar','document_ref']},
    'else':{'not':{'anyOf':[{'required':[k]} for k in ['policy_ref','effective_jalali','until_jalali_exclusive','calendar','document_ref']]}}}]
dump('signed-wire.schema.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/simulator/signed-wire.schema.json','$defs':signed_defs})
signed_request=dict(client_ref='synthetic-order-001',quote_ref='SIM-SIGNED-Q-1',premium_toman='12000',effective_jalali='1405-08-10',calendar='persian',mapping_version='signed-map-v1')
callback=dict(event_id='SIM-SIGNED-E-1',sequence=2,client_ref='synthetic-order-001',receipt_ref='SIM-SIGNED-S-1',issuance='issued',occurred_at='2026-10-28T08:00:02Z',policy_ref='SIM-SIGNED-P-1',effective_jalali='1405-08-10',until_jalali_exclusive='1405-08-11',calendar='persian',document_ref='SIM-DOC-1')
for name,shape,value in [
 ('signed-quote-request.json','QuoteRequest',dict(client_ref='synthetic-order-001',product_code='SIM-MOTOR',subject_ref='synthetic-vehicle-001',effective_jalali='1405-08-10',calendar='persian')),
 ('signed-quote-response.json','QuoteResponse',dict(quote_ref='SIM-SIGNED-Q-1',premium_toman='12000',valid_until_utc='2026-10-28T08:10:00Z',mapping_version='signed-map-v1')),
 ('signed-submit-request.json','SubmitRequest',signed_request),('signed-ack.json','Acknowledgment',dict(receipt_ref='SIM-SIGNED-S-1',result='accepted',issuance='pending')),
 ('signed-callback-issued.json','Callback',callback),('signed-callback-pending.json','Callback',{k:v for k,v in {**callback,'event_id':'SIM-SIGNED-E-0','sequence':1,'issuance':'pending','occurred_at':'2026-10-28T08:00:01Z'}.items() if k in ['event_id','sequence','client_ref','receipt_ref','issuance','occurred_at']}),
 ('signed-callback-ack.json','CallbackAck',dict(received=True,duplicate=False)),('signed-rejected.json','Reject',dict(result='rejected',code='risk_ineligible',accepted=False)),
 ('signed-no-status.json','Reject',dict(result='rejected',code='capability_unsupported',accepted=False)),('signed-document-response.json','Document',document),
 ('invalid-signed-wrong-unit.json','SubmitRequest',{**signed_request,'currency':'IRR'}),
 ('invalid-signed-malformed-ack.json','Acknowledgment',dict(result='accepted',issuance='pending')),
 ('invalid-signed-mapping-v2.json','SubmitRequest',{k:v for k,v in {**signed_request,'premium_rial':'120000','calendar':'gregory'}.items() if k!='premium_toman'}),
]:fixture(name,shape,value,'signed-wire.schema.json',not name.startswith('invalid-'))
vectors=[]
for label,path,nonce,payload in [('submission','/sim/signed/v1/submissions','nonce-0001',signed_request),('callback','/callbacks/sim-signed','nonce-0002',callback)]:
    raw=json.dumps(payload,separators=(',',':'),ensure_ascii=False)
    digest=hashlib.sha256(raw.encode()).hexdigest()
    canonical='\n'.join(['POST',path,'2026-10-28T08:00:00Z',nonce,digest])
    key='synthetic-only-key-v1-not-for-live-use'
    signature=hmac.new(key.encode(),canonical.encode(),hashlib.sha256).hexdigest()
    vectors.append(dict(id=label,syntheticKeyAscii=key,keyId='sim-key-v1',method='POST',path=path,timestamp='2026-10-28T08:00:00Z',nonce=nonce,bodyUtf8=raw,bodySha256=digest,canonicalUtf8=canonical,signatureHex=signature))
dump('signed-vectors.json',dict(synthetic=True,algorithm='HMAC-SHA256',vectors=vectors))
dump('calendar-money-pair.json',dict(synthetic=True,canonical=dict(amount='120000',currency='IRR',unit='rial',effectiveGregorian='2026-11-01',untilGregorianExclusive='2026-11-02'),
    provider=dict(premium_toman='12000',effective_jalali='1405-08-10',until_jalali_exclusive='1405-08-11',calendar='persian'),
    moneyRule='Exact integer divide/multiply by10 under this fictional contract; nondivisible rial input rejects rather than rounds.',
    calendarRule='Date-only fields; no timezone arithmetic in payload. Test anchor uses UTC noon to avoid date rollover.',
    observedEvidence=dict(node='v26.12.0',icu='78.3',checked='2026-10-28',api='Intl.DateTimeFormat en-US-u-ca-persian-nu-latn timeZone UTC formatToParts',source='S26')))

NS='urn:fictional:carrier:soap:v1'
xsd='''<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:c="urn:fictional:carrier:soap:v1" targetNamespace="urn:fictional:carrier:soap:v1" elementFormDefault="qualified">
<xs:simpleType name="Ref"><xs:restriction base="xs:string"><xs:minLength value="1"/><xs:maxLength value="64"/><xs:pattern value="[A-Za-z0-9_-]+"/></xs:restriction></xs:simpleType>
<xs:simpleType name="Amount"><xs:restriction base="xs:string"><xs:maxLength value="24"/><xs:pattern value="(0|[1-9][0-9]*)"/></xs:restriction></xs:simpleType>
<xs:simpleType name="State"><xs:restriction base="xs:string"><xs:enumeration value="not_found"/><xs:enumeration value="pending"/><xs:enumeration value="issued"/></xs:restriction></xs:simpleType>
<xs:simpleType name="Digest"><xs:restriction base="xs:string"><xs:length value="64"/><xs:pattern value="[0-9a-f]+"/></xs:restriction></xs:simpleType>
<xs:simpleType name="Content"><xs:restriction base="xs:base64Binary"><xs:maxLength value="32768"/></xs:restriction></xs:simpleType>
<xs:element name="RequestQuote"><xs:complexType><xs:sequence><xs:element name="ClientApplicationRef" type="c:Ref"/><xs:element name="SubjectRef" type="c:Ref"/><xs:element name="EffectiveGregorianDate" type="xs:date"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="QuoteResponse"><xs:complexType><xs:sequence><xs:element name="QuoteRef" type="c:Ref"/><xs:element name="PremiumRial" type="c:Amount"/><xs:element name="ValidUntilUTC" type="xs:dateTime"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="SubmitApplication"><xs:complexType><xs:sequence><xs:element name="ClientApplicationRef" type="c:Ref"/><xs:element name="QuoteRef" type="c:Ref"/><xs:element name="PremiumRial" type="c:Amount"/><xs:element name="EffectiveGregorianDate" type="xs:date"/><xs:element name="MappingVersion" type="c:Ref"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="SubmissionAcknowledgment"><xs:complexType><xs:sequence><xs:element name="Ticket" type="c:Ref"/><xs:element name="AcceptedAtUTC" type="xs:dateTime"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="GetSubmissionStatus"><xs:complexType><xs:sequence><xs:element name="ClientApplicationRef" type="c:Ref"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="SubmissionStatus"><xs:complexType><xs:sequence><xs:element name="ClientApplicationRef" type="c:Ref"/><xs:element name="PollOrdinal"><xs:simpleType><xs:restriction base="xs:positiveInteger"><xs:maxInclusive value="100"/></xs:restriction></xs:simpleType></xs:element><xs:element name="Status" type="c:State"/><xs:element name="Authoritative" type="xs:boolean"/><xs:element name="Ticket" type="c:Ref" minOccurs="0"/><xs:element name="PolicyRef" type="c:Ref" minOccurs="0"/><xs:element name="EffectiveGregorianDate" type="xs:date" minOccurs="0"/><xs:element name="UntilGregorianExclusive" type="xs:date" minOccurs="0"/><xs:element name="DocumentRef" type="c:Ref" minOccurs="0"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="GetPolicyDocument"><xs:complexType><xs:sequence><xs:element name="PolicyRef" type="c:Ref"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="PolicyDocument"><xs:complexType><xs:sequence><xs:element name="DocumentRef" type="c:Ref"/><xs:element name="MediaType" fixed="application/pdf"/><xs:element name="SHA256" type="c:Digest"/><xs:element name="ContentBase64" type="c:Content"/></xs:sequence></xs:complexType></xs:element>
<xs:element name="Reject"><xs:complexType><xs:sequence><xs:element name="Code"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="risk_ineligible"/><xs:enumeration value="invalid_schema"/><xs:enumeration value="unauthorized"/><xs:enumeration value="throttled"/><xs:enumeration value="unavailable"/><xs:enumeration value="duplicate_reference"/></xs:restriction></xs:simpleType></xs:element><xs:element name="Accepted" type="xs:boolean" fixed="false"/><xs:element name="Retriable" type="xs:boolean"/></xs:sequence></xs:complexType></xs:element>
</xs:schema>
'''
(WIRE/'soap-payloads.xsd').write_text(xsd)
soap=[]
def xmlfixture(name,element,values):
    import xml.etree.ElementTree as ET
    ET.register_namespace('soap','http://schemas.xmlsoap.org/soap/envelope/');ET.register_namespace('c',NS)
    env=ET.Element('{http://schemas.xmlsoap.org/soap/envelope/}Envelope');body=ET.SubElement(env,'{http://schemas.xmlsoap.org/soap/envelope/}Body');payload=ET.SubElement(body,'{'+NS+'}'+element)
    for k,v in values.items():ET.SubElement(payload,'{'+NS+'}'+k).text=str(v)
    (WIRE/name).write_bytes(ET.tostring(env,encoding='utf-8',xml_declaration=True)+b'\n')
    soap.append(dict(path=name,payloadElement=element,schema='soap-payloads.xsd'))
xmlfixture('soap-quote-request.xml','RequestQuote',dict(ClientApplicationRef='synthetic-order-001',SubjectRef='synthetic-vehicle-001',EffectiveGregorianDate='2026-11-01'))
xmlfixture('soap-quote-response.xml','QuoteResponse',dict(QuoteRef='SIM-SOAP-Q-1',PremiumRial='120000',ValidUntilUTC='2026-10-28T08:10:00Z'))
xmlfixture('soap-submit-request.xml','SubmitApplication',dict(ClientApplicationRef='synthetic-order-001',QuoteRef='SIM-SOAP-Q-1',PremiumRial='120000',EffectiveGregorianDate='2026-11-01',MappingVersion='soap-map-v1'))
xmlfixture('soap-ack.xml','SubmissionAcknowledgment',dict(Ticket='SIM-SOAP-S-1',AcceptedAtUTC='2026-10-28T08:00:00Z'))
xmlfixture('soap-status-request.xml','GetSubmissionStatus',dict(ClientApplicationRef='synthetic-order-001'))
xmlfixture('soap-status-poll-1.xml','SubmissionStatus',dict(ClientApplicationRef='synthetic-order-001',PollOrdinal=1,Status='not_found',Authoritative='false'))
xmlfixture('soap-status-poll-2.xml','SubmissionStatus',dict(ClientApplicationRef='synthetic-order-001',PollOrdinal=2,Status='pending',Authoritative='true',Ticket='SIM-SOAP-S-1'))
xmlfixture('soap-status-poll-3.xml','SubmissionStatus',dict(ClientApplicationRef='synthetic-order-001',PollOrdinal=3,Status='issued',Authoritative='true',Ticket='SIM-SOAP-S-1',PolicyRef='SIM-SOAP-P-1',EffectiveGregorianDate='2026-11-01',UntilGregorianExclusive='2026-11-02',DocumentRef='SIM-DOC-1'))
xmlfixture('soap-rejected.xml','Reject',dict(Code='risk_ineligible',Accepted='false',Retriable='false'))
xmlfixture('soap-document-request.xml','GetPolicyDocument',dict(PolicyRef='SIM-SOAP-P-1'))
xmlfixture('soap-document-response.xml','PolicyDocument',dict(DocumentRef='SIM-DOC-1',MediaType='application/pdf',SHA256=document['sha256'],ContentBase64=document['contentBase64']))
dump('fixture-manifest.json',dict(id='SIM-WIRE-FIXTURES',version='1.0.0',status='synthetic',jsonFixtures=fixtures,xmlFixtures=soap,
    signingVectors='signed-vectors.json',calendarPair='calendar-money-pair.json',document='synthetic-policy.pdf'))
manifest_schema=obj({'id':kind('SIM-WIRE-FIXTURES'),'version':kind('1.0.0'),'status':kind('synthetic'),
    'jsonFixtures':{'type':'array','minItems':1,'maxItems':100,'items':obj({'path':text(128),'schema':text(128),'definition':text(64),'valid':{'type':'boolean'}})},
    'xmlFixtures':{'type':'array','minItems':1,'maxItems':100,'items':obj({'path':text(128),'payloadElement':text(64),'schema':text(128)})},
    'signingVectors':text(128),'calendarPair':text(128),'document':text(128)})
dump('fixture-manifest.schema.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/simulator/fixture-manifest.schema.json',**manifest_schema})
for slug,request,request_path in [('rest-json',submit,'wire/rest-submit-request.json'),('signed-http',signed_request,'wire/signed-submit-request.json'),
    ('soap-xml',{'format':'SOAP1.1','examplePath':'wire/soap-submit-request.xml'},'wire/soap-submit-request.xml')]:
    path=BASE/(slug+'.fixture.json');summary=json.loads(path.read_text());summary['request']=request
    summary['requestExamplePath']=request_path;summary['wireFixtureManifest']='wire/fixture-manifest.json'
    if slug=='signed-http':summary['validatedMappingPair']='wire/calendar-money-pair.json'
    path.write_text(json.dumps(summary,indent=2)+'\n')

def append(slug,body):
    target=BASE/f'{slug}.md';content=target.read_text();content=content.split('\n## Concrete wire contract')[0]
    raw_meta=content.split('---',2)[1];meta=json.loads(raw_meta)
    if 'S26' not in meta['source_refs']:meta['source_refs'].append('S26')
    content=content.replace(raw_meta,'\n'+json.dumps(meta,indent=2)+'\n',1)
    target.write_text(content.rstrip()+'\n\n## Concrete wire contract\n\n'+body.strip()+'\n')

common='''
The reset fixture clock is `2026-10-28T08:00:00Z`; each named scenario resets isolated state and counters. Scenario selection is test-harness input, never a live carrier header. Prices/dates and one-day coverage windows are synthetic tests with no commercial meaning. Bodies are UTF-8 and capped at 32768 bytes except document responses, whose decoded PDF cap is 32768 bytes. IDs are 1–64 ASCII letters/digits/underscore/hyphen; amount strings are nonnegative base10 with at most24 digits. Unknown properties fail schema validation.

The [fixture manifest](wire/fixture-manifest.json) identifies each request/response schema and expected validity. `transport-unknown.json` describes a local transport observation: it is **not** a fabricated provider response. No received response after possible acceptance yields canonical `external_outcome_unknown`. A received definitive rejection explicitly states `accepted=false`; it permits remediation only according to its code.

Run `rtk proxy python3 docs/_meta/validation/validate_simulator_contracts.py` to validate synthetic wire artifacts, signatures and calendar pair. This does not start an insurer simulator or certify connectivity.
'''
append('rest-json','''
### Endpoints and shapes

Use API key `X-Sim-Key: synthetic-rest-key-v1`; this documented value is deliberately fake. Submit requires `Idempotency-Key: synthetic-order-001-submit-v1`. No trailing slash/query is permitted in these local routes.

| Method/path | Request fixture | Response/status |
|---|---|---|
| POST `/sim/rest/v1/quotes` | [quote request](wire/rest-quote-request.json), QuoteRequest | 200 [quote](wire/rest-quote-response.json); synthetic validity fixed at08:10UTC |
| POST `/sim/rest/v1/submissions` | [submit request](wire/rest-submit-request.json), SubmitRequest | 202 [ack](wire/rest-ack.json); issuance remains pending |
| GET `/sim/rest/v1/submissions/by-client/synthetic-order-001` | client reference in path; no body | first call200 [pending](wire/rest-status-pending.json), second call200 [issued](wire/rest-status-issued.json) |
| GET `/sim/rest/v1/policies/SIM-REST-P-1/document` | path policy reference; no body | after issued200 [document](wire/rest-document-response.json); before issued409 rejection |

[REST schema](wire/rest-wire.schema.json) defines each named type. Issued status requires policy reference, effective interval and document reference; a pending observation cannot contain them. Document body is base64 PDF with size/hash validated against [the synthetic PDF](wire/synthetic-policy.pdf). Same idempotency key/body hash returns original acknowledgment/reference; same key with changed body returns409 `idempotency_conflict` and no new acceptance.

### Deterministic failure scenarios

`timeout_after_acceptance`: store the first submission then reset connection before response; first status returns pending and second issued; application must query before retry. `duplicate_callback`: REST has no callbacks, so repeat the second status response and verify one effect. `malformed_response`: return200 with `premium.amount="NaN"`, invalid under schema; do not offer purchase. `idempotency_not_supported`: alternate manifest disables idempotency, repeated submit creates a distinct provider reference; application must avoid it using status. `throttled`: first safe quote/status call429 with Retry-After1 and rejection accepted=false, second succeeds; mutation throttle occurs before acceptance. `expired_token`: first call401 accepted=false until test credential reference rotates. `partial_outage`: quote calls503 while status/document remain available. `mapping_version_change`: newly reset map-v2 fixture renames premium field; map-v1 parser rejects it and pauses new work; in-flight map-v1 attempts retain map-v1 responses. `definitive_reject`: submit422 [rejection](wire/rest-rejected.json), no provider record. No retry rule converts invalid/malformed or unknown results to a successful quote.
'''+common)
append('soap-xml','''
### XML operations and transport

SOAP1.1 HTTP POST `/sim/soap/v1`, Content-Type `text/xml; charset=utf-8`, SOAPAction exactly `urn:fictional:carrier:soap:v1:<operation>`. Synthetic client certificate ID `sim-soap-cert-v1` is a harness identity, not real certificate material. Only one Envelope/Body/payload is accepted; DTD/entity declarations, external schema imports, unknown elements and extra bodies are rejected. [Payload XSD](wire/soap-payloads.xsd) bounds identifiers, decimal text and document size; fixtures include complete SOAP envelopes. The validator extracts exactly one payload and validates against XSD with network access disabled.

| Operation | Request | Response |
|---|---|---|
| RequestQuote | [request](wire/soap-quote-request.xml) | HTTP200 [quote](wire/soap-quote-response.xml) |
| SubmitApplication | [request](wire/soap-submit-request.xml) | HTTP200 [acknowledgment](wire/soap-ack.xml); not issuance |
| GetSubmissionStatus | [request](wire/soap-status-request.xml) | HTTP200 first [not-found](wire/soap-status-poll-1.xml), second [pending](wire/soap-status-poll-2.xml), third [issued](wire/soap-status-poll-3.xml) |
| GetPolicyDocument | [request](wire/soap-document-request.xml) | HTTP200 [document](wire/soap-document-response.xml) only after issued |
| Definitive business rejection | same submit request in reject scenario | HTTP200 [Reject](wire/soap-rejected.xml), Accepted=false; never infer success from HTTP200 |

### Exact visibility boundary and duplicate risk

Successful submit is persisted immediately, but first status poll deliberately returns `not_found, Authoritative=false`. **The second status poll is the simulator's visibility boundary** and returns pending with the same ticket; third returns issued. Poll ordinals are per client reference after reset, including lookup after a lost submit response. Each poll advances virtual time one second; no wall-clock sleeps are required. An actually absent reference returns not_found with Authoritative=true only from poll2 onward. Application never resubmits after poll1. For the timeout-after-acceptance scenario, original submit occurs exactly once and polls2/3 resolve it.

No idempotency is supported. A repeated SubmitApplication creates another ticket, and lookup then returns Reject `duplicate_reference` for manual reconciliation; the test fails if the application sends this duplicate. XSD1.0 cannot encode all cross-field implications: runtime semantic validation requires ticket for pending, full policy interval/document for issued, and no policy fields for not_found.

### Other deterministic scenarios

Malformed response replaces PremiumRial with `NaN` and must fail XSD. Throttle returns HTTP429 with Retry-After1 and Reject throttled/Accepted=false before any write; second safe attempt succeeds. Expired certificate returns HTTP401 without acceptance until synthetic identity rotates. Partial outage returns HTTP503 only for RequestQuote; status/document remain healthy. Mapping change replaces the namespace with `urn:fictional:carrier:soap:v2`, which v1 must reject; in-flight v1 remains available. Duplicate observation repeats issued poll3 unchanged. Transport timeout after persistence sends no XML response and is classified using [transport unknown](wire/transport-unknown.json), never a synthetic rejection.
'''+common)
v=vectors[0]
append('signed-http','''
### Operations and bounded wire types

POST `/sim/signed/v1/quotes` uses [quote request](wire/signed-quote-request.json) and returns200 [quote](wire/signed-quote-response.json). POST `/sim/signed/v1/submissions` uses [submit](wire/signed-submit-request.json) and returns202 [receipt](wire/signed-ack.json). There is no issue command: at virtual tick2 the provider sends [issued callback](wire/signed-callback-issued.json) to POST `/callbacks/sim-signed`; receiver returns202 [callback acknowledgment](wire/signed-callback-ack.json) after durable inbox write. Tick1 pending is [this observation](wire/signed-callback-pending.json). GET `/sim/signed/v1/policies/SIM-SIGNED-P-1/document` returns200 [document](wire/signed-document-response.json) after issued. [Signed schema](wire/signed-wire.schema.json) defines each type.

The baseline manifest supports neither status nor idempotency. GET status returns405 [capability_unsupported](wire/signed-no-status.json), which is not evidence that a submission was absent. Timeout-after-acceptance persists one receipt then loses the response; callbacks are deliberately suppressed in that scenario so the application must hold external_outcome_unknown and require verified manual reconciliation. Repeated submit creates another receipt and is a test failure. Definitive business rejection returns422 [accepted=false](wire/signed-rejected.json) before any write.

### Exact signature algorithm and synthetic vector

Headers are `X-Sim-Key-Id`, `X-Sim-Timestamp`, `X-Sim-Nonce`, `X-Sim-Signature`. Key ID must be `sim-key-v1`; timestamp uses UTC RFC3339 second precision; nonce is1–64 ASCII alphanumeric/hyphen. Compare timestamp to injected clock with maximum absolute skew300 seconds and accept a nonce once per key within the600-second replay store. Real contracts may differ; these are only fictional protocol constants.

Sign UTF-8 bytes of uppercase method, exact path without query, timestamp, nonce, and lowercase hex SHA256 of **raw request body bytes**, joined by LF, with no trailing LF. No JSON reserialization, whitespace trimming, percent-decoding or Unicode normalization occurs before verification. HMAC-SHA256 output is lowercase hex, compared in constant time. GET uses the hash of empty body. Reject unsupported paths/query/algorithms before domain processing. Both submit and callback vectors are in [signed vectors](wire/signed-vectors.json); callback uses its own nonce. The key text is intentionally synthetic.

```text
'''+v['canonicalUtf8']+'''
```

Synthetic key: `'''+v['syntheticKeyAscii']+'''`.
Expected signature: `'''+v['signatureHex']+'''`.
Exact body bytes are `bodyUtf8` in the vector; pretty-printed request fixture is semantically equivalent but requires a different signature.

### Currency/calendar conversion and scenarios

[Mapping pair](wire/calendar-money-pair.json) binds canonical120000 rial to provider12000 labeled toman, Gregorian2026-11-01 to Persian1405-08-10, and exclusive end2026-11-02 to1405-08-11. Integer conversion rejects indivisible values; never round a premium silently. The date pair was executed with Node v26.12.0/ICU78.3 `Intl.DateTimeFormat` at UTC noon; validation repeats both dates. [ECMA402](https://tc39.es/ecma402/#sec-intl.datetimeformat) defines the calendar-capable API, while the recorded runtime observation supports this pair. This is date-only mapping, not a timezone/effective-date legal rule.

Duplicate callback scenario sends the same event ID/sequence/body twice with **fresh valid nonces**, so inbox dedupe returns duplicate=true once. An exact nonce replay is rejected401 `nonce_replayed` before applying a second effect. Out-of-order scenario delivers sequence2 issued before sequence1 pending; policy remains issued. Malformed response omits receipt_ref from202 ack and leaves possible acceptance unknown. Throttle returns429 before acceptance, then safe quote/document read succeeds after virtual tick1. Expired-key scenario returns401 expired_signature/accepted=false before mutation. Partial outage disables quotes only; callback ingestion/document remains available. Mapping-v2 changes premium_toman to premium_rial and calendar to gregory; v1 schema rejects it and existing v1 transactions retain v1 mapping. Signature body mutation, altered path and stale timestamp are mandatory negative cases.
'''+common)

if __name__=='__main__':
    print(f'Wrote {len(fixtures)} JSON wire fixtures, {len(soap)} XML fixtures, 2 signing vectors, schemas and synthetic PDF; no simulator service.')
