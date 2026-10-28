#!/usr/bin/env python3
"""Regenerate in a temporary copy and detect source/artifact drift without edits."""
from pathlib import Path
import tempfile,shutil,subprocess,sys,hashlib,json
ROOT=Path(__file__).resolve().parents[2]
builders=['build_root.py','build_experience.py','build_features.py','build_engineering.py','build_delivery.py','build_meta.py','build_contracts.py']
excluded={'_meta/document-manifest.yaml','_meta/validation-report.json','_meta/generation-drift-report.json','_meta/documentation-status.json','_meta/coverage-report.md','_meta/consistency-report.md','_meta/review-findings.md','_meta/continuation.md','README.md'}
def hashes(root):
    return {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and not any(part in ['__pycache__','node_modules','.venv'] for part in p.parts) and p.suffix!='.pyc' and p.relative_to(root).as_posix() not in excluded}
before=hashes(ROOT);runs=[]
with tempfile.TemporaryDirectory(prefix='insurance-docs-drift-') as temp:
    copy=Path(temp)/'docs';shutil.copytree(ROOT,copy,ignore=shutil.ignore_patterns('__pycache__','*.pyc','.venv','node_modules'))
    for builder in builders:
        result=subprocess.run([sys.executable,'-B',str(copy/'_meta/validation'/builder)],capture_output=True,text=True)
        runs.append({'builder':builder,'exit_code':result.returncode,'output':result.stdout.strip(),'error':result.stderr.strip()})
        if result.returncode:break
    after=hashes(copy)
changed=sorted(k for k in before.keys()|after.keys() if before.get(k)!=after.get(k))
report={'id':'REPORT-GENERATION-DRIFT','version':'1.0.0','status':'complete' if not changed and all(r['exit_code']==0 for r in runs) else 'partial','updated':'2026-10-28','result':'pass' if not changed and all(r['exit_code']==0 for r in runs) else 'fail','builders':runs,'compared_files':len(before),'changed_files':changed,'scope':'Regenerated authored documents, fragments, meta and contracts in isolated temporary copy; evidence reports/manifest intentionally excluded.'}
(ROOT/'_meta/generation-drift-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));sys.exit(report['result']!='pass')
