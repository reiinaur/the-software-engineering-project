const CACHE_VERSION = "tt-v1";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;

const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// deletes caches from old versions so stale files don't linger.
self.addEventListener("activate", (event) => {
  const KEEP = [STATIC_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { pathname } = new URL(event.request.url);

  if (pathname.startsWith("/api/")) return;

  if (pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(event.request, ASSET_CACHE));
    return;
  }

  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    if (request.headers.get("Accept")?.includes("text/html")) {
      return new Response(
        `<html><body style="font-family:Georgia;text-align:center;padding:80px;background:#fafaf8">
          <h1 style="font-size:42px">The Typing Times</h1>
          <p style="color:#888">You're offline. Reconnect to keep typing.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
  }
}