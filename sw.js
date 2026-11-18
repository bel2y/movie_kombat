// Only immutable, content-hashed artwork is cached. App code always uses the network,
// so an update cannot leave users on an old game or old scoring formula.
const ART_CACHE = 'movie-kombat-art-v1';
const ART_ROOT = new URL('src/optimized/', self.registration.scope).href;
function isArtwork(url) {
  return url.startsWith(ART_ROOT) && /\.[a-f0-9]{12}\.webp$/.test(url.slice(ART_ROOT.length));
}
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
async function artwork(request) {
  let cache;
  try {
    cache = await caches.open(ART_CACHE);
    const saved = await cache.match(request);
    if (saved) return saved;
  } catch (_) { /* Storage may be disabled on a television. */ }
  const response = await fetch(request);
  if (cache && response.ok && response.type !== 'opaque') {
    try {
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      // Bound disk usage across multiple artwork releases, without touching user data.
      for (const key of keys.slice(0, Math.max(0, keys.length - 100))) await cache.delete(key);
    } catch (_) { /* Quota failure must never prevent an image from being displayed. */ }
  }
  return response;
}
self.addEventListener('fetch', event => {
  if (event.request.method === 'GET' && isArtwork(event.request.url)) {
    event.respondWith(artwork(event.request));
  }
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_VISIBLE_ART' || !Array.isArray(event.data.urls)) return;
  const urls = [...new Set(event.data.urls)].filter(url=>typeof url==='string' && isArtwork(url)).slice(0,24);
  event.waitUntil((async()=>{
    for(const url of urls) {
      try { await artwork(new Request(url)); } catch (_) { /* Next visit can retry. */ }
    }
  })());
});
