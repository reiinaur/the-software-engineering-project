const CACHE_VERSION = "tt-v1";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;

//  urls pre-cached on install so the shell loads offline immediately
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// install - opens the static cache and stores the core shell pages before the SW activates
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

// activate - deletes any cache versions that aren't in the current keep list
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // skips interception entirely on local dev 
  // lets requests hit the dev server directly
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return; 
  }

  // api calls must always reach the server; never serve them from cache
  if (url.pathname.startsWith("/api/")) return;

  // game assets use their own cache bucket so they don't crowd out app shell
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(event.request, ASSET_CACHE));
    return;
  }

  // everything else (html, js, css) falls through to the static cache
  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

// cache-first strategy: return a cached copy if one exists, otherwise fetch and cache it
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // only cache successful same-origin responses 
    // opaque cross-origin ones can't be inspected
    if (response.ok && response.type !== "opaque") {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.headers.get("Accept")?.includes("text/html")) {
      return new Response(
        `<html><body style="font-family:Georgia;text-align:center;padding:80px;background:#fafaf8">
          <h1>The Typing Times</h1>
          <p style="color:#888">You're offline. Reconnect to keep typing.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
    // for non-html assets, return a neutral timeout response
    return new Response("", { status: 408, statusText: "Offline" });
  }
}