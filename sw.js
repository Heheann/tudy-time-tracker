const CACHE_NAME="reading-timer-pwa-v3.4-update-flow";
const ASSETS=["./","./index.html?v=3.4","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

// Controllable update strategy
const SW_UPDATE_STRATEGY={
  autoSkipWaiting:false,
  autoClaimClients:true
};

self.addEventListener("install",(e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  if(SW_UPDATE_STRATEGY.autoSkipWaiting) self.skipWaiting();
});

self.addEventListener("activate",(e)=>{
  e.waitUntil((async ()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(k=>k===CACHE_NAME?null:caches.delete(k)));
    if(SW_UPDATE_STRATEGY.autoClaimClients) await self.clients.claim();
  })());
});

self.addEventListener("message",(e)=>{
  const type=e?.data?.type;
  if(type==="SKIP_WAITING") self.skipWaiting();
  if(type==="CLAIM_CLIENTS") self.clients.claim();
});

self.addEventListener("fetch",(e)=>{
  e.respondWith(
    caches.match(e.request).then(cached=> cached || fetch(e.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)).catch(()=>{});
      return res;
    }).catch(()=>cached))
  );
});
