/* Public fallback only. Private responses, tokens and commands are never cached. */
const CACHE='panah-public-shell-v1';
const SAFE=['/offline','/icon.svg'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of SAFE){const response=await fetch(path,{credentials:'omit',cache:'reload'});if(response.ok)await cache.put(path,response);}await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('panah-public-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin||event.request.method!=='GET')return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(async()=>{const offline=await caches.match('/offline');return offline??new Response('برای ادامه ارتباط با سرویس لازم است.',{headers:{'Content-Type':'text/plain;charset=utf-8'}});}));}else if(url.pathname==='/icon.svg'){event.respondWith(fetch(event.request).catch(()=>caches.match('/icon.svg')));}});
