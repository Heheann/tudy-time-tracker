const CACHE_NAME = "reading-timer-pwa-v3.2";
const ASSETS = ["./", "./index.html?v=3.1", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k)))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;

  // 只處理 GET，避免意外攔截 POST/PUT 等請求。
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 只快取同源請求，避免把第三方資源塞進 cache。
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
