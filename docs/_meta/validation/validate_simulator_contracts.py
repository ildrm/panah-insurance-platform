#!/usr/bin/env python3
"""Validate only synthetic documentation contracts; performs no HTTP operations."""
from pathlib import Path
from datetime import datetime,date
from urllib.parse import urlsplit
import ast,base64,hashlib,hmac,json,re,subprocess,tempfile,uuid,xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
WIRE=ROOT/'07-integrations/simulated-carriers/wire'
manifest=json.loads((WIRE/'fixture-manifest.json').read_text())
tree=ast.parse((Path(__file__).with_name('validate.py')).read_text())
# Reuse the checked local keyword subset without importing the validator's main
# execution/report mutation. Full parser status stays explicitly separate.
function=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='local_validate')
namespace=dict(re=re,uuid=uuid,datetime=datetime,date=date,urlsplit=urlsplit)
exec(compile(ast.Module(body=[function],type_ignores=[]),'<local-schema-subset>','exec'),namespace)
local_validate=namespace['local_validate']
try:
    from jsonschema import Draft202012Validator,FormatChecker
except ImportError:
    Draft202012Validator=None

errors=[];negative_count=0
assert not local_validate(manifest,json.loads((WIRE/'fixture-manifest.schema.json').read_text()))
for row in manifest['jsonFixtures']:
    data=json.loads((WIRE/row['path']).read_text());schema=json.loads((WIRE/row['schema']).read_text())
    selected={'$defs':schema['$defs'],'$ref':'#/$defs/'+row['definition']}
    if Draft202012Validator:
        Draft202012Validator.check_schema(schema)
        violations=list(Draft202012Validator(selected,format_checker=FormatChecker()).iter_errors(data))
    else:violations=local_validate(data,selected)
    if bool(violations)==row['valid']:errors.append(row['path']+': unexpected schema validity')
    if not row['valid']:negative_count+=1

soap_ns='http://schemas.xmlsoap.org/soap/envelope/'
ns='urn:fictional:carrier:soap:v1'
for row in manifest['xmlFixtures']:
    raw=(WIRE/row['path']).read_bytes()
    assert b'<!DOCTYPE' not in raw.upper() and b'<!ENTITY' not in raw.upper()
    env=ET.fromstring(raw)
    assert env.tag=='{'+soap_ns+'}Envelope'
    bodies=env.findall('{'+soap_ns+'}Body');assert len(bodies)==1 and len(bodies[0])==1
    payload=bodies[0][0];assert payload.tag=='{'+ns+'}'+row['payloadElement']
    with tempfile.NamedTemporaryFile(suffix='.xml') as f:
        f.write(ET.tostring(payload));f.flush()
        result=subprocess.run(['rtk','proxy','xmllint','--nonet','--noout','--schema',str(WIRE/row['schema']),f.name],capture_output=True,text=True)
        if result.returncode:errors.append(row['path']+': XSD failed '+result.stderr)
    values={e.tag.split('}',1)[1]:e.text for e in payload}
    if row['payloadElement']=='SubmissionStatus':
        state=values['Status'];ordinal=int(values['PollOrdinal'])
        if ordinal==1:assert state=='not_found' and values['Authoritative']=='false'
        if state=='pending':assert 'Ticket' in values and 'PolicyRef' not in values
        if state=='issued':assert all(k in values for k in ['Ticket','PolicyRef','EffectiveGregorianDate','UntilGregorianExclusive','DocumentRef'])
    if row['payloadElement']=='PolicyDocument':
        decoded=base64.b64decode(values['ContentBase64'],validate=True)
        assert hashlib.sha256(decoded).hexdigest()==values['SHA256']
        assert decoded==(WIRE/'synthetic-policy.pdf').read_bytes()

# Negative XML verifies that the XSD is actually constraining premium values.
raw=(WIRE/'soap-submit-request.xml').read_bytes().replace(b'120000',b'-1')
payload=ET.fromstring(raw).find('{'+soap_ns+'}Body')[0]
with tempfile.NamedTemporaryFile(suffix='.xml') as f:
    f.write(ET.tostring(payload));f.flush()
    bad=subprocess.run(['rtk','proxy','xmllint','--nonet','--noout','--schema',str(WIRE/'soap-payloads.xsd'),f.name],capture_output=True,text=True)
    assert bad.returncode!=0,'negative premium unexpectedly accepted by XSD'

vectors=json.loads((WIRE/'signed-vectors.json').read_text())['vectors']
for v in vectors:
    digest=hashlib.sha256(v['bodyUtf8'].encode()).hexdigest();assert digest==v['bodySha256']
    canonical='\n'.join([v['method'],v['path'],v['timestamp'],v['nonce'],digest])
    assert canonical==v['canonicalUtf8'] and not canonical.endswith('\n')
    key=v['syntheticKeyAscii'].encode()
    assert hmac.compare_digest(hmac.new(key,canonical.encode(),hashlib.sha256).hexdigest(),v['signatureHex'])
    # Independent OpenSSL implementation checks the published synthetic vector.
    cross=subprocess.run(['rtk','proxy','openssl','dgst','-sha256','-hmac',v['syntheticKeyAscii']],input=canonical.encode(),capture_output=True)
    assert cross.returncode==0 and cross.stdout.decode().strip().endswith(v['signatureHex'])
    assert not hmac.compare_digest(hmac.new(key,(canonical+'x').encode(),hashlib.sha256).hexdigest(),v['signatureHex'])
    changed_digest=hashlib.sha256((v['bodyUtf8']+' ').encode()).hexdigest()
    changed_canonical='\n'.join([v['method'],v['path'],v['timestamp'],v['nonce'],changed_digest])
    assert not hmac.compare_digest(hmac.new(key,changed_canonical.encode(),hashlib.sha256).hexdigest(),v['signatureHex'])
issued_callback=json.loads((WIRE/'signed-callback-issued.json').read_text())
pending_callback=json.loads((WIRE/'signed-callback-pending.json').read_text())
assert pending_callback['event_id']!=issued_callback['event_id']
assert pending_callback['sequence']<issued_callback['sequence']

pair=json.loads((WIRE/'calendar-money-pair.json').read_text())
assert int(pair['canonical']['amount'])==int(pair['provider']['premium_toman'])*10
script='''const dates=["2026-11-01","2026-11-02"];const f=new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn",{timeZone:"UTC",year:"numeric",month:"2-digit",day:"2-digit"});console.log(JSON.stringify({node:process.version,icu:process.versions.icu,pairs:dates.map(d=>{const p=Object.fromEntries(f.formatToParts(new Date(d+"T12:00:00Z")).map(x=>[x.type,x.value]));return {gregorian:d,persian:p.year+"-"+p.month+"-"+p.day}})}));'''
run=subprocess.run(['rtk','proxy','node','-e',script],capture_output=True,text=True)
assert run.returncode==0,run.stderr
observed=json.loads(run.stdout)
assert observed['pairs']==[{'gregorian':pair['canonical']['effectiveGregorian'],'persian':pair['provider']['effective_jalali']},
                           {'gregorian':pair['canonical']['untilGregorianExclusive'],'persian':pair['provider']['until_jalali_exclusive']}]
pdf=(WIRE/'synthetic-policy.pdf').read_bytes()
doc=json.loads((WIRE/'rest-document-response.json').read_text())
assert base64.b64decode(doc['contentBase64'],validate=True)==pdf and len(pdf)==doc['sizeBytes']
assert hashlib.sha256(pdf).hexdigest()==doc['sha256']
assert pdf.startswith(b'%PDF-1.4') and pdf.endswith(b'%%EOF\n')
assert not errors,errors
report=dict(status='passed',scope='documentation wire artifacts only; no simulator service or provider integration executed',
    json_fixtures=len(manifest['jsonFixtures']),json_negative_fixtures=negative_count,json_validator='jsonschema Draft202012' if Draft202012Validator else 'local used-keyword subset; full standards parser not available',
    xml_fixtures=len(manifest['xmlFixtures']),xml_validator='xmllint XSD1.0 --nonet plus cross-field assertions',xml_negative_fixtures=1,
    hmac_vectors=len(vectors),independent_hmac='OpenSSL dgst',tampered_signature_rejected=True,calendar_observation=observed,
    pdf_hash_verified=True)
(WIRE/'validation-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
