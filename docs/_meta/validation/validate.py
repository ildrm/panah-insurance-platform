#!/usr/bin/env python3
"""Offline structural checks. Uses jsonschema when installed; honest fallback otherwise."""
from pathlib import Path
from urllib.parse import unquote,urlsplit
from datetime import datetime,date
import json,re,csv,hashlib,sys,uuid,subprocess
ROOT=Path(__file__).resolve().parents[2]
errors=[];limitations=[];checks={};schema_cases=[]
def need(test,message):
    if not test:errors.append(message)
def read(path):return json.loads((ROOT/path).read_text())
try:
    from jsonschema import Draft202012Validator,FormatChecker
    standards_jsonschema=True
except ImportError:
    standards_jsonschema=False
    limitations.append('Third-party jsonschema unavailable: local validator checks the used keyword subset, not full draft2020-12 metaschema conformance.')

def local_validate(value,schema,root=None,path='$'):
    """Rejects unsupported assertion keywords; never treats unknown assertions as pass."""
    if schema is True:return []
    if schema is False:return [path+': forbidden schema']
    root=schema if root is None else root
    if '$ref' in schema:
        ref=schema['$ref']
        if not ref.startswith('#/'):return [path+': external reference needs explicit resolution '+ref]
        s=root
        try:
            for k in ref[2:].split('/'):s=s[k.replace('~1','/').replace('~0','~')]
        except KeyError:return [path+': unresolved '+ref]
        return local_validate(value,s,root,path)
    allowed={'$schema','$id','$defs','title','description','examples','default','type','enum','const','properties','required','additionalProperties','items','minItems','maxItems','uniqueItems','minLength','maxLength','pattern','format','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','anyOf','oneOf','allOf','not','if','then','else','minProperties','maxProperties','readOnly','writeOnly','deprecated','contentEncoding','contentMediaType','discriminator'}
    allowed.update({'example','$comment'})  # Annotations, not validation assertions.
    bad={k for k in schema if k not in allowed and not k.startswith('x-')}
    result=[path+': unsupported schema keyword '+k for k in sorted(bad)]
    if 'anyOf' in schema and not any(not local_validate(value,s,root,path) for s in schema['anyOf']):result.append(path+': anyOf unmatched')
    if 'oneOf' in schema and sum(not local_validate(value,s,root,path) for s in schema['oneOf'])!=1:result.append(path+': oneOf not exactly one')
    for s in schema.get('allOf',[]):result+=local_validate(value,s,root,path)
    if 'not' in schema and not local_validate(value,schema['not'],root,path):result.append(path+': forbidden not match')
    if 'if' in schema:
        key='then' if not local_validate(value,schema['if'],root,path) else 'else'
        if key in schema:result+=local_validate(value,schema[key],root,path)
    def istype(t):return {'null':value is None,'boolean':isinstance(value,bool),'string':isinstance(value,str),'integer':isinstance(value,int) and not isinstance(value,bool),'number':isinstance(value,(int,float)) and not isinstance(value,bool),'object':isinstance(value,dict),'array':isinstance(value,list)}.get(t,False)
    if 'type' in schema and not any(istype(t) for t in (schema['type'] if isinstance(schema['type'],list) else [schema['type']])):return result+[path+': incorrect type']
    def equal_json(a,b):
        if isinstance(a,bool)!=isinstance(b,bool):return False
        if isinstance(a,dict) and isinstance(b,dict):return set(a)==set(b) and all(equal_json(a[k],b[k]) for k in a)
        if isinstance(a,list) and isinstance(b,list):return len(a)==len(b) and all(equal_json(x,y) for x,y in zip(a,b))
        return a==b
    if 'enum' in schema and not any(equal_json(value,x) for x in schema['enum']):result.append(path+': invalid enum')
    if 'const' in schema and not equal_json(value,schema['const']):result.append(path+': invalid const')
    if isinstance(value,dict):
        for k in schema.get('required',[]):
            if k not in value:result.append(path+': missing '+k)
        for k,v in value.items():
            if k in schema.get('properties',{}):result+=local_validate(v,schema['properties'][k],root,path+'.'+k)
            elif schema.get('additionalProperties') is False:result.append(path+': extra '+k)
            elif isinstance(schema.get('additionalProperties'),dict):result+=local_validate(v,schema['additionalProperties'],root,path+'.'+k)
        if len(value)<schema.get('minProperties',0) or len(value)>schema.get('maxProperties',float('inf')):result.append(path+': property count')
    if isinstance(value,list):
        if len(value)<schema.get('minItems',0) or len(value)>schema.get('maxItems',float('inf')):result.append(path+': array bounds')
        if schema.get('uniqueItems') and len(set(json.dumps(v,sort_keys=True) for v in value))!=len(value):result.append(path+': duplicate items')
        if 'items' in schema:
            for i,v in enumerate(value):result+=local_validate(v,schema['items'],root,path+f'[{i}]')
    if isinstance(value,str):
        if len(value)<schema.get('minLength',0) or len(value)>schema.get('maxLength',float('inf')):result.append(path+': string length')
        if 'pattern' in schema and not re.search(schema['pattern'],value):result.append(path+': pattern mismatch')
        fmt=schema.get('format')
        try:
            if fmt=='uuid':uuid.UUID(value)
            elif fmt=='date':date.fromisoformat(value)
            elif fmt=='date-time':
                parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
                if parsed.tzinfo is None:raise ValueError('timezone missing')
            elif fmt=='uri' and not urlsplit(value).scheme:raise ValueError('absolute URI required')
        except (ValueError,AttributeError):result.append(path+': invalid '+fmt)
    if isinstance(value,(int,float)) and not isinstance(value,bool):
        if value<schema.get('minimum',-float('inf')) or value>schema.get('maximum',float('inf')):result.append(path+': numeric bounds')
        if value<=schema.get('exclusiveMinimum',-float('inf')) or value>=schema.get('exclusiveMaximum',float('inf')):result.append(path+': exclusive numeric bounds')
        if schema.get('multipleOf') and value/schema['multipleOf']!=int(value/schema['multipleOf']):result.append(path+': multipleOf')
    return result

def validate(value,schema,label):
    schema_cases.append(dict(value=value,schema=schema,label=label,expectedValid=True))
    if standards_jsonschema:
        try:
            Draft202012Validator.check_schema(schema)
            errors.extend(label+': '+e.message for e in Draft202012Validator(schema,format_checker=FormatChecker()).iter_errors(value))
        except Exception as e:errors.append(label+': '+str(e))
    else:errors.extend(label+': '+e for e in local_validate(value,schema))

def resolve(document,ref,base):
    file,sep,fragment=ref.partition('#')
    if file.startswith(('https:','http:')):return None
    target=(base.parent/file).resolve() if file else base
    need(target.is_relative_to(ROOT.resolve()),'reference escapes docs: '+ref)
    if not target.exists():errors.append('missing contract reference '+str(target));return None
    d=json.loads(target.read_text()) if file else document
    try:
        for part in fragment.lstrip('/').split('/') if fragment else []:d=d[part.replace('~1','/').replace('~0','~')]
    except (KeyError,TypeError):errors.append('unresolved reference '+str(base)+':'+ref);return None
    return d

def refs(d,base,whole=None):
    whole=d if whole is None else whole
    if isinstance(d,dict):
        if '$ref' in d:resolve(whole,d['$ref'],base)
        for v in d.values():refs(v,base,whole)
    elif isinstance(d,list):
        for v in d:refs(v,base,whole)

manifest=read('_meta/document-manifest.yaml');all_files={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and not any(part in ['__pycache__','node_modules','.venv'] for part in p.parts) and p.suffix!='.pyc'}
manifest_files={r['path'] for r in manifest['entries']}
need(all_files==manifest_files,'manifest drift: unlisted '+str(sorted(all_files-manifest_files))+'; missing '+str(sorted(manifest_files-all_files)))
docids=[];metadata_schema=read('_meta/schemas/document-metadata.schema.json')
sources={e['id'] for e in read('_meta/source-registry.yaml')['entries']};assumptions={e['id'] for e in read('_meta/assumptions.yaml')['entries']}
for row in manifest['entries']:
    p=ROOT/row['path'];need(p.exists(),'missing manifest file '+row['path']);docids.append(row['document_id'])
    if not p.exists():continue
    if row.get('sha256'):need(hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],'content drift '+row['path'])
    if row['artifact_kind']=='normative-document':
        try:m=json.loads(p.read_text().split('---',2)[1])
        except Exception as e:errors.append('bad metadata '+row['path']+':'+str(e));continue
        validate(m,metadata_schema,row['path']);need(m['id']==row['document_id'],'manifest ID mismatch '+row['path'])
        need(set(m['source_refs'])<=sources,'unknown source '+row['path']);need(set(m['assumption_refs'])<=assumptions,'unknown assumption '+row['path'])
need(len(docids)==len(set(docids)),'duplicate document IDs')

for p in list((ROOT/'_meta').glob('*.yaml'))+list((ROOT/'_meta').glob('*.json')):
    s=ROOT/('_meta/schemas/'+p.stem+'.schema.json');need(s.exists(),'missing registry schema '+p.name)
    if s.exists():validate(json.loads(p.read_text()),json.loads(s.read_text()),p.name)
    data=json.loads(p.read_text())
    if isinstance(data,dict) and isinstance(data.get('entries'),list):
        ids=[v['id'] for v in data['entries'] if 'id' in v];need(len(ids)==len(set(ids)),'duplicate registry IDs '+p.name)
for p in (ROOT/'_meta/fragments').glob('*.json'):
    s=ROOT/('_meta/schemas/fragment-'+p.stem+'.schema.json');need(s.exists(),'missing build fragment schema '+p.name)
    if s.exists():validate(json.loads(p.read_text()),json.loads(s.read_text()),'fragment-'+p.name)

# Mandatory tree is input evidence. Directories expand via catalog checks below.
brief=(ROOT/'_meta/input/st-docs.md').read_text();tree=brief.split('```text\ndocs/\n',1)[1].split('```',1)[0]
folder=''
for line in tree.splitlines():
    indent=len(line)-len(line.lstrip());name=line.strip()
    if indent==2:
        folder=name if name.endswith('/') else ''
        if not name.endswith('/'):need((ROOT/name).exists(),'missing mandatory '+name)
    elif indent==4 and not name.endswith('/'):need((ROOT/(folder+name)).exists(),'missing mandatory '+folder+name)

feature=read('_meta/feature-catalog.yaml')['entries'];product=read('_meta/product-catalog.yaml')['entries'];baseline=read('_meta/baseline.json')
need({x['id'] for x in feature}=={x['id'] for x in baseline['parents']},'baseline parent drift')
need({x['id'] for x in product}=={x['id'] for x in baseline['products']},'baseline product drift')
children={};acceptance=set();permission={x['id'] for x in read('_meta/permissions.yaml')['entries']};flags={x['id'] for x in read('_meta/feature-controls.yaml')['entries']};budgets={x['id'] for x in read('_meta/performance-budgets.yaml')['entries']}
for p in feature:
    file=ROOT/p['spec_path'];need(file.exists(),'missing feature spec '+p['id']);body=file.read_text() if file.exists() else ''
    sections=re.findall(r'^##\s+(\d+)[.)]?\s',body,re.M)
    need(set(sections)>={str(i) for i in range(1,25)},'missing 24-section feature template '+p['id'])
    for c in p['children']:
        need(bool(re.fullmatch(re.escape(p['id'])+r'-R[0-9]{3}',c['id'])),'invalid stable child ID '+c['id'])
        need(c['id'] not in children,'duplicate child '+c['id']);children[c['id']]=c
        need(c['id'] in body,'child missing in spec '+c['id']);need(bool(c.get('acceptance_ids')),'no acceptance '+c['id'])
        for a in c.get('acceptance_ids',[]):need(a in body,'acceptance not in spec '+a);acceptance.add(a)
        for a in c.get('acceptance_scenario_ids',[]):need(a in body,'scenario not in spec '+a)
        for q in c.get('permission_ids',[]):need(q in permission,'missing permission '+q)
        for f in c.get('flag_ids',[]):need(f in flags,'missing flag '+f)
        b=c.get('performance_budget',[]);b=[b] if isinstance(b,str) else b
        for x in b:
            if x and not x.startswith('N/A:'):need(x in budgets,'unknown budget '+x)
for p in product:
    need((ROOT/p['spec_path']).exists(),'missing product spec '+p['id'])
    for a in p.get('acceptance_ids',[]):need(a in (ROOT/p['spec_path']).read_text(),'missing product acceptance '+a)
dashboards=read('_meta/dashboard-catalog.yaml')['entries'];need(len(dashboards)==7,'expected seven dashboard specs')
route_text=(ROOT/'03-experience/screen-and-route-inventory.md').read_text()
for d in dashboards:
    need((ROOT/d['spec_path']).exists(),'missing dashboard spec '+d['id'])
    for route in d['routes']:need('`'+route+'`' in route_text,'dashboard route absent inventory '+route)
    for grant in d['permissions']:need(grant in permission,'dashboard permission unregistered '+grant)
surfaces=read('_meta/fragments/feature-surface-map.json')
validate(surfaces,read('03-experience/feature-surface-map.schema.json'),'feature surface map')
need({s['id'] for s in surfaces}=={p['id'] for p in feature},'feature surface coverage mismatch')
for s in surfaces:
    for item in s['surfaces']:
        path=ROOT/item['spec_path'];need(path.exists(),'surface spec missing '+item['spec_path'])
        if path.exists():need('`'+item['route']+'`' in path.read_text(),'surface route not in owning specification '+item['route'])
surface_routes={s['id']:{item['route'] for item in s['surfaces']} for s in surfaces}
for p in feature:
    for c in p['children']:need(c['screen'] in surface_routes[p['id']],'trace screen not in actual feature surfaces '+c['id']+':'+c['screen'])
rows=list(csv.DictReader((ROOT/'_meta/traceability.csv').open()))
need({r['child_requirement'] for r in rows}==set(children),'traceability child coverage mismatch')
need(len(rows)==len(children),'duplicate traceability children')
for r in rows:
    for k,v in r.items():need(bool(v and v.strip()),'empty traceability '+r['child_requirement']+':'+k)
    need((ROOT/r['documentation_path']).exists(),'traceability missing path '+r['documentation_path'])

links=0
def anchors(p):
    text=p.read_text();heads=re.findall(r'^#{1,6}\s+(.*)$',text,re.M)
    return {re.sub(r'[^\w\- ]','',h.lower().replace('`','')).replace(' ','-') for h in heads}|set(re.findall(r'<a\s+(?:id|name)=["\']([^"\']+)',text))
for p in ROOT.rglob('*.md'):
    if any(part in ['input','implementation-input','node_modules','.venv','__pycache__'] for part in p.parts):continue
    body=re.sub(r'```.*?```','',p.read_text(),flags=re.S)
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',body):
        target=target.strip('<>').split(' "',1)[0]
        if target.startswith(('https:','http:','mailto:')):continue
        links+=1;file,_,anchor=target.partition('#');resolved=(p.parent/unquote(file)).resolve() if file else p.resolve()
        need(resolved.is_relative_to(ROOT.resolve()),'link escapes docs '+str(p)+':'+target)
        need(resolved.exists(),'broken link '+str(p.relative_to(ROOT))+':'+target)
        if anchor and resolved.is_file() and resolved.suffix=='.md':need(unquote(anchor) in anchors(resolved),'missing anchor '+str(p.relative_to(ROOT))+':'+target)

api=read('06-contracts/openapi.yaml');need(api['openapi']=='3.1.0','unexpected OpenAPI version');refs(api,ROOT/'06-contracts/openapi.yaml')
operation_ids=[]
for path,methods in api['paths'].items():
    need(path.startswith('/'),'API path must be absolute '+path)
    for method,op in methods.items():
        if method not in ['get','put','post','patch','delete','head','options','trace']:continue
        operation_ids.append(op['operationId']);need(bool(op.get('responses')),'responses missing '+op['operationId']);need('security' in op,'authorization metadata missing '+op['operationId'])
        for field in re.findall(r'\{(.*?)\}',path):need(any(x.get('name')==field and x.get('in')=='path' and x.get('required') for x in op.get('parameters',[])),'missing required path param '+path)
need(len(operation_ids)==len(set(operation_ids)),'duplicate operation IDs')
for c in children.values():
    o=c.get('api_operation')
    if isinstance(o,str) and o and not o.startswith('N/A'):need(o in operation_ids,'missing OpenAPI operation '+o)
try:
    from openapi_spec_validator import validate as validate_openapi
    validate_openapi(api);openapi_standard=True
except ImportError:
    openapi_standard=False;limitations.append('openapi-spec-validator unavailable: local paths/operations/refs checked, full OpenAPI standards validation pending.')
except Exception as e:
    openapi_standard=False;errors.append('OpenAPI standard validation: '+str(e))
asyncapi=read('06-contracts/asyncapi.yaml');need(asyncapi['asyncapi']=='3.0.0','unexpected AsyncAPI version');refs(asyncapi,ROOT/'06-contracts/asyncapi.yaml')
limitations.append('AsyncAPI3 syntax/version, local references and operation/channel/message relationships checked; third-party AsyncAPI parser not available.')
for n,op in asyncapi['operations'].items():need(op.get('action') in ['send','receive'],'invalid AsyncAPI action '+n)
for p in (ROOT/'06-contracts/schemas').glob('*.json'):refs(json.loads(p.read_text()),p)

# Standalone examples resolved into local schema trees to avoid network lookups.
document_cache={}
def document(base):
    if base not in document_cache:document_cache[base]=json.loads(base.read_text())
    return document_cache[base]
def inline(schema,base,seen=None):
    seen=set() if seen is None else seen
    if isinstance(schema,dict):
        if '$ref' in schema:
            r=schema['$ref'];need(r not in seen,'recursive example schema unsupported '+r)
            resolved=resolve(document(base),r,base)
            if resolved is None:return False
            other=(base.parent/r.partition('#')[0]).resolve() if r.partition('#')[0] else base
            return inline(resolved,other,seen|{r})
        # Inline copies no longer have independent reference bases. Retaining
        # duplicate nested $id annotations would register the same URI twice.
        return {k:inline(v,base,seen) for k,v in schema.items() if k!='$id'}
    if isinstance(schema,list):return [inline(v,base,seen) for v in schema]
    return schema
example_map={'purchase-committed-snapshot.json':'PurchaseSnapshot.schema.json','credit-committed-snapshot.json':'PurchaseSnapshot.schema.json','purchase-committed-event.json':'PurchaseCommitted.event.schema.json','unknown-payment-result.json':'VerifyPaymentResult.schema.json'}
for name,s in example_map.items():
    p=ROOT/'06-contracts/schemas'/s;validate(read('06-contracts/examples/'+name),inline(json.loads(p.read_text()),p),name)
product_negative_checks=0
for product_row in product:
    if 'risk_schema' in product_row:
        p=ROOT/product_row['risk_schema'];fixture=read(product_row['fixture'])
        instance=fixture.get('riskExample',fixture);resolved=inline(document(p),p)
        validate(instance,resolved,product_row['id']+' risk fixture')
        for key in resolved.get('required',[])[:1]:
            invalid=dict(instance);invalid.pop(key,None)
            need(bool(local_validate(invalid,resolved)),'product missing-required negative did not fail '+product_row['id']);product_negative_checks+=1
        invalid={**instance,'unexpectedPrivateField':'must-be-rejected'}
        need(bool(local_validate(invalid,resolved)),'product additional-property negative did not fail '+product_row['id']);product_negative_checks+=1
for folder in ['08-security','12-operations']:
    for p in (ROOT/folder).glob('*.schema.json'):
        instance=p.with_name(p.name.replace('.schema.json','.json'))
        if instance.exists():validate(document(instance),inline(document(p),p),instance.name)
api_examples=0
for path,methods in api['paths'].items():
    for method,op in methods.items():
        if method not in ['get','put','post','patch','delete','head','options','trace']:continue
        for auth in op.get('security',[]):
            for key in auth:need(key in api['components']['securitySchemes'],'unknown security scheme '+key)
        payloads=[op.get('requestBody',{})]+list(op.get('responses',{}).values())
        for payload in payloads:
            for media in payload.get('content',{}).values():
                if 'example' in media and 'schema' in media:
                    validate(media['example'],inline(media['schema'],ROOT/'06-contracts/openapi.yaml'),op['operationId']+' example');api_examples+=1

# Prove validator rejects malformed inputs rather than only accepting generated data.
need(bool(local_validate({'state':'issued'},{'type':'object','required':['state'],'properties':{'state':{'enum':['pending']}},'additionalProperties':False})),'negative enum self-test failed')
need(bool(local_validate({}, {'type':'object','required':['id']})),'negative required-field self-test failed')
need(bool(local_validate({'a':1},{'type':'object','additionalProperties':False})),'negative unknown-field self-test failed')
domain_negative_cases=[
 ('float money',{'amount':1.25,'currency':'IRR','unit':'rial'},'Money'),
 ('verified payment without evidence',{'attemptId':'00000000-0000-4000-8000-000000000001','state':'verified'},'VerifyPaymentResult'),
 ('unknown command completion',{'operationId':'unregisteredOperation','result':{}},'FCommandCompletion'),
 ('credit with fabricated receipt',{**read('06-contracts/examples/credit-committed-snapshot.json'),'paymentReceiptIds':['00000000-0000-4000-8000-000000000005']},'PurchaseSnapshot'),
 ('non-boolean acknowledgment',{'received':1,'duplicate':False,'inboxId':'00000000-0000-4000-8000-000000000001'},'CallbackAck')]
for label,bad,schema_name in domain_negative_cases:
    need(bool(local_validate(bad,api['components']['schemas'][schema_name],api)),'contract negative did not fail: '+label)
    schema_cases.append(dict(value=bad,schema=inline(api['components']['schemas'][schema_name],ROOT/'06-contracts/openapi.yaml'),label='negative: '+label,expectedValid=False))
ajv_standard=False;ajv_checked=0
try:
    checked=subprocess.run(['node',str(ROOT/'_meta/validation/validate_jsonschema.mjs')],input=json.dumps(schema_cases),capture_output=True,text=True,timeout=90)
    result=json.loads(checked.stdout);ajv_standard=result['valid'] is True and checked.returncode==0;ajv_checked=result['checked']
    if not ajv_standard:errors.extend('Ajv JSON Schema2020-12: '+json.dumps(error) for error in result['errors'])
except (FileNotFoundError,subprocess.TimeoutExpired,json.JSONDecodeError) as error:
    limitations.append('Locked Ajv full JSON Schema batch unavailable: '+type(error).__name__)
checks.update(jsonschema_ajv_standard=ajv_standard,jsonschema_ajv_cases=ajv_checked)
asyncapi_standard=False
standards_path=ROOT/'_meta/contract-standards-report.json'
if standards_path.exists():
    recorded=json.loads(standards_path.read_text())
    if recorded.get('inputs') and all((ROOT/item['path']).exists() and hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sha256'] for item in recorded['inputs']):
        openapi_standard=any(item['kind']=='OpenAPI' and item['valid'] for item in recorded['outcomes'])
        asyncapi_standard=any(item['kind']=='AsyncAPI' and item['valid'] for item in recorded['outcomes'])
        if openapi_standard:limitations=[item for item in limitations if not item.startswith('openapi-spec-validator unavailable:')]
        if asyncapi_standard:limitations=[item for item in limitations if not item.startswith('AsyncAPI3 syntax/version,')]
if ajv_standard:
    limitations=[item for item in limitations if not item.startswith('Third-party jsonschema unavailable:')]
    limitations.append('Full JSON Schema2020-12 checks used locked Ajv8 with formats; Python jsonschema was unavailable. Contract standards evidence is a separate hash-bound local run, not proof of runtime operation compatibility.')
checks.update(asyncapi_standard=asyncapi_standard)
checks.update(parent_features=len(feature),child_requirements=len(children),product_families=len(product),product_negative_checks=product_negative_checks,dashboards=len(dashboards),dashboard_routes=sum(len(d['routes']) for d in dashboards),traceability_rows=len(rows),normative_documents=sum(r['artifact_kind']=='normative-document' for r in manifest['entries']),manifest_artifacts=len(manifest['entries']),local_links_checked=links,api_operations=len(operation_ids),api_examples_checked=api_examples,event_channels=len(asyncapi['channels']),jsonschema_standard=standards_jsonschema,openapi_standard=openapi_standard,negative_validator_checks=3,domain_negative_checks=len(domain_negative_cases))
report={'id':'REPORT-VALIDATION','version':'1.0.0','status':'complete' if not errors else 'partial','updated':'2026-10-28','result':'pass-structural-with-limitations' if not errors else 'fail','checks':checks,'errors':errors,'limitations':limitations,'semantic_completeness_proven':False,'application_tests_run':False}
if not errors:
    for entry in manifest['entries']:
        if entry['validation_status']!='not-applicable-source':entry['validation_status']='structural-checked'
    (ROOT/'_meta/document-manifest.yaml').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'_meta/validation-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));sys.exit(bool(errors))
