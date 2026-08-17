const CACHE_PREFIX = "chalo-static-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/brand/chalo-logo-round.png",
  "/brand/chalo-pwa-192.png",
  "/brand/chalo-pwa-512.png",
];

function isStaticRequest(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (request.mode === "navigate" || request.destination === "document") return false;

  const accept = request.headers.get("accept") || "";
  if (
    request.headers.has("rsc") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("next-router-prefetch") ||
    accept.includes("text/x-component") ||
    accept.includes("text/event-stream") ||
    url.searchParams.has("_rsc")
  ) {
    return false;
  }

  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon.svg"
  );
}

function isCacheableStaticResponse(request, response) {
  if (!response.ok || response.type === "opaque") return false;

  const responseUrl = new URL(response.url || request.url);
  if (responseUrl.origin !== self.location.origin) return false;

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return (
    contentType.startsWith("text/css") ||
    contentType.startsWith("text/javascript") ||
    contentType.startsWith("application/javascript") ||
    contentType.startsWith("application/x-javascript") ||
    contentType.startsWith("application/wasm") ||
    contentType.startsWith("image/") ||
    contentType.startsWith("font/") ||
    contentType.startsWith("application/font-")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!isStaticRequest(event.request)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((response) => {
          if (isCacheableStaticResponse(event.request, response)) {
            const responseCopy = response.clone();
            event.waitUntil(cache.put(event.request, responseCopy));
          }

          return response;
        });
      }),
    ),
  );
});
