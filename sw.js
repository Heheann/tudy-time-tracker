const SW_VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_NAME = `reading-timer-pwa-${SW_VERSION}`;
const ASSETS = [
  "./",
  `./index.html?v=${SW_VERSION}`,
  "./index.html",
  `./manifest.json?v=${SW_VERSION}`,
  "./manifest.json",
  `./icon-192.png?v=${SW_VERSION}`,
  "./icon-192.png",
  `./icon-512.png?v=${SW_VERSION}`,
  "./icon-512.png"
];

// Controllable update strategy
const SW_UPDATE_STRATEGY = {
  autoSkipWaiting: false,
  autoClaimClients: true
};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  if (SW_UPDATE_STRATEGY.autoSkipWaiting) self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      if (SW_UPDATE_STRATEGY.autoClaimClients) await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (e) => {
  const type = e?.data?.type;
  if (type === "SKIP_WAITING") self.skipWaiting();
  if (type === "CLAIM_CLIENTS") self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match(`./index.html?v=${SW_VERSION}`).then((vMatch) => vMatch || caches.match("./index.html"));
          }
          return cached;
        });
    })
  );
});
