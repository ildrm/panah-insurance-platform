#!/usr/bin/env python3
"""Optional loopback transport for environments where curl works but npm TLS fails.

Only official registry GET requests are permitted. Package integrity values are
unchanged. Normalize loopback resolved URLs in a generated lock before sharing it.
"""
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
import subprocess,json,hashlib,tempfile,os
from pathlib import Path
CACHE=Path(tempfile.gettempdir())/'st-registry-transport';CACHE.mkdir(exist_ok=True)
PORT=int(os.environ.get('ST_REGISTRY_PORT','4874'))
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '..' in self.path or self.path.startswith('//') or '?' in self.path:
            self.send_error(400);return
        url='https://registry.npmjs.org'+self.path
        destination=CACHE/hashlib.sha256(url.encode()).hexdigest()
        if not destination.exists():
            partial=destination.with_suffix('.'+str(os.getpid())+'.partial')
            run=subprocess.run(['curl','--fail','--silent','--show-error','--retry','2','--max-time','90',url,'-o',str(partial)],capture_output=True)
            if run.returncode:self.send_error(502,'Official registry fetch failed');return
            partial.replace(destination)
        content=destination.read_bytes()
        is_json=not self.path.endswith('.tgz')
        if is_json:
            try:
                data=json.loads(content)
                def transform(v):
                    if isinstance(v,dict):return {k:(x.replace('https://registry.npmjs.org',f'http://127.0.0.1:{PORT}') if k=='tarball' and isinstance(x,str) else transform(x)) for k,x in v.items()}
                    if isinstance(v,list):return [transform(x) for x in v]
                    return v
                content=json.dumps(transform(data)).encode()
            except ValueError:self.send_error(502);return
        self.send_response(200);self.send_header('Content-Type','application/json' if is_json else 'application/octet-stream');self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content)
    def log_message(self,format,*args):pass
if __name__=='__main__':
    print(f'Official npm registry curl transport on 127.0.0.1:{PORT}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
