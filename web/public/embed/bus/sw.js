const CACHE = 'bus-v1';
const SHELL = ['./', './page.js'];
const hhmm = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('x-saved-at', hhmm());
      await cache.put(request, new Response(await response.clone().blob(), { status: 200, headers }));
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached ?? Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/embed/bus/')) event.respondWith(networkFirst(event.request));
});
