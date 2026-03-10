const CACHE_NAME="reading-timer-pwa-v3.3-update-flow";
const ASSETS=["./","./index.html?v=3.3","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

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
  const { request } = e;

  // 只處理 GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 只處理同源請求
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((res) => {
          // 僅快取成功且基本類型的回應。
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // 導航失敗時，回退到離線可用的首頁。
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return cached;
        });
    })
  );
});
