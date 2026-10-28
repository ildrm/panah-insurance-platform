#!/usr/bin/env python3
"""Optional loopback curl transport for isolated documentation-tool installs.

Only the official PyPI simple index and files.pythonhosted.org are reachable.
Wheel/hash bytes are preserved; this is not a third-party package mirror.
"""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import hashlib,subprocess,uuid
CACHE=Path('.local/pypi-cache');CACHE.mkdir(parents=True,exist_ok=True)
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '..' in self.path or '?' in self.path or self.path.startswith('//'):
            self.send_error(400);return
        if self.path.startswith('/simple/'):
            url='https://pypi.org'+self.path;html=True
        elif self.path.startswith('/packages/'):
            url='https://files.pythonhosted.org'+self.path;html=False
        else:self.send_error(404);return
        destination=CACHE/hashlib.sha256(url.encode()).hexdigest()
        if not destination.exists():
            partial=destination.with_suffix('.'+str(uuid.uuid4())+'.partial')
            result=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','60',url,'-o',str(partial)],capture_output=True)
            if result.returncode:self.send_error(502);return
            partial.replace(destination)
        content=destination.read_bytes()
        if html:content=content.replace(b'https://files.pythonhosted.org/',b'http://127.0.0.1:4875/')
        self.send_response(200);self.send_header('Content-Type','text/html' if html else 'application/octet-stream');self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content)
    def log_message(self,*args):pass
if __name__=='__main__':
    print('Official PyPI curl transport at127.0.0.1:4875',flush=True)
    ThreadingHTTPServer(('127.0.0.1',4875),Handler).serve_forever()
