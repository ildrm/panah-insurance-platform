#!/usr/bin/env python3
"""Build registry schemas and exact documentation inventory after all batches."""
from pathlib import Path
import json,re,hashlib
from build_root import ROOT, DATE, write_json

def kind(v):
    if v is None:return 'null'
    if isinstance(v,bool):return 'boolean'
    if isinstance(v,int):return 'integer'
    if isinstance(v,float):return 'number'
    if isinstance(v,str):return 'string'
    if isinstance(v,list):return 'array'
    return 'object'

def shape(values):
    types=sorted(set(map(kind,values)))
    if len(types)>1:return {'anyOf':[shape([v for v in values if kind(v)==t]) for t in types]}
    t=types[0];s={'type':t}
    if t=='object':
        keys=set().union(*(v.keys() for v in values));required=set.intersection(*(set(v) for v in values))
        s.update(properties={k:shape([v[k] for v in values if k in v]) for k in sorted(keys)},required=sorted(required),additionalProperties=False)
    elif t=='array':
        items=[x for v in values for x in v];s['items']=shape(items) if items else {'type':'string'}
    elif t=='string':s['minLength']=0 if any(v=='' for v in values) else 1
    return s

metadata={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/meta/document-metadata.schema.json','type':'object','required':['id','title','status','version','owner_role','reviewer_roles','scope_ids','source_refs','assumption_refs','updated'],'properties':{'id':{'type':'string','minLength':1},'title':{'type':'string','minLength':1},'status':{'enum':['draft','proposed','partial','reviewed','accepted']},'version':{'type':'string','pattern':'^[0-9]+\\.[0-9]+\\.[0-9]+$'},'owner_role':{'type':'string','pattern':'^R(0[1-9]|1[0-9]|2[01])$'},'reviewer_roles':{'type':'array','minItems':1,'items':{'type':'string','pattern':'^R(0[1-9]|1[0-9]|2[01])$'}},'scope_ids':{'type':'array','minItems':1,'items':{'type':'string'}},'source_refs':{'type':'array','minItems':1,'items':{'type':'string','pattern':'^S[0-9]{2}$'}},'assumption_refs':{'type':'array','items':{'type':'string','pattern':'^A[0-9]{2}$'}},'updated':{'type':'string','format':'date'}},'additionalProperties':False}
write_json('_meta/schemas/document-metadata.schema.json',metadata)

def meta(path):
    text=path.read_text()
    if not text.startswith('---\n'):return None
    return json.loads(text.split('---',2)[1])

# Schema definition is inferred from the authored registry structure, with strict
# fields/types plus explicit lifecycle constraints. Semantic references are checked
# independently by validate.py. Schema regeneration itself requires review.
registries=list((ROOT/'_meta').glob('*.yaml'))+list((ROOT/'_meta').glob('*.json'))
for p in registries:
    if p.name=='document-manifest.yaml':continue
    data=json.loads(p.read_text());s=shape([data])
    s.update({'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/meta/'+p.stem+'.schema.json','title':p.stem+' registry v1'})
    if 'status' in s.get('properties',{}):s['properties']['status']={'enum':['draft','proposed','partial','complete','blocked']}
    if p.stem in ['feature-catalog','product-catalog']:
        s['properties']['entries']['minItems']=74 if p.stem=='feature-catalog' else 24
        s['properties']['entries']['maxItems']=74 if p.stem=='feature-catalog' else 24
    write_json('_meta/schemas/'+p.stem+'.schema.json',s)
for p in sorted((ROOT/'_meta/fragments').glob('*.json')):
    s=shape([json.loads(p.read_text())]);s.update({'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/meta/fragment-'+p.stem+'.schema.json','title':'Authored '+p.stem+' build input v1'})
    write_json('_meta/schemas/fragment-'+p.stem+'.schema.json',s)

manifest_schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://insurance.example.invalid/meta/document-manifest.schema.json','type':'object','required':['id','version','status','updated','entries'],'properties':{'id':{'const':'REG-DOCUMENT-MANIFEST'},'version':{'const':'1.0.0'},'status':{'const':'draft'},'updated':{'type':'string','format':'date'},'entries':{'type':'array','minItems':1,'items':{'type':'object','required':['path','document_id','owner_role','review_state','validation_status','artifact_kind'],'properties':{'path':{'type':'string','minLength':1},'document_id':{'type':'string','minLength':1},'owner_role':{'type':'string'},'review_state':{'enum':['draft','proposed','source-evidence','generated','pending']},'validation_status':{'enum':['pending','structural-checked','not-applicable-source']},'artifact_kind':{'enum':['normative-document','source','registry','schema','contract','example','tooling','report','configuration']},'sha256':{'type':['string','null']}},'additionalProperties':False}}},'additionalProperties':False}
write_json('_meta/schemas/document-manifest.schema.json',manifest_schema)

entries=[]
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and not any(part in ['__pycache__','node_modules','.venv'] for part in p.parts) and not p.name.endswith('.pyc'))
manifest_path=ROOT/'_meta/document-manifest.yaml'
if manifest_path not in files:files.append(manifest_path)
for p in sorted(files):
    rel=p.relative_to(ROOT).as_posix();is_source=any(part in ['input','implementation-input'] for part in p.relative_to(ROOT).parts);m=meta(p) if p.exists() and p.suffix=='.md' and not is_source else None
    category='normative-document' if m else 'source' if is_source else 'schema' if '/schemas/' in '/'+rel else 'tooling' if '/validation/' in '/'+rel else 'contract' if rel.startswith('06-contracts/') and p.suffix in ['.json','.yaml'] else 'example' if '/fixtures/' in '/'+rel or '.fixture.' in rel else 'registry' if p.suffix in ['.yaml','.json','.csv'] else 'configuration'
    entries.append(dict(path=rel,document_id=m['id'] if m else 'ART-'+re.sub('[^A-Za-z0-9]+','-',rel).upper(),owner_role=m['owner_role'] if m else 'R17',review_state=m['status'] if m else 'source-evidence' if category=='source' else 'generated' if category in ['registry','schema','tooling'] else 'pending',validation_status='not-applicable-source' if category=='source' else 'pending',artifact_kind=category,sha256=hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() and p!=manifest_path and p.name not in ['validation-report.json','coverage-report.md','documentation-status.json','continuation.md','consistency-report.md','review-findings.md'] else None))
write_json('_meta/document-manifest.yaml',dict(id='REG-DOCUMENT-MANIFEST',version='1.0.0',status='draft',updated=DATE,entries=entries))
print(f'Inventoried {len(entries)} artifacts and generated strict registry schemas.')
