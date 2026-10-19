const CACHE='tarot-research-private-v1-1';
const APP_SHELL=['./','./index.html','./styles.css','./app.js','./decks.js','./storage.js','./shuffle.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',evt=>{evt.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',evt=>{evt.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',evt=>{
  const {request}=evt;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  evt.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(res=>{if(res.ok){const clone=res.clone();caches.open(CACHE).then(c=>c.put(request,clone));}return res;})));
});
