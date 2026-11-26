// Minimal offline-fallback service worker.
// Scope is intentionally narrow: it only caches and serves the offline page
// itself when a navigation request fails - it does not cache the app's
// JS/CSS/API, so online users never risk seeing a stale cached version.

const CACHE_NAME = 'docmod-offline-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_ASSETS = [OFFLINE_URL, '/android-chrome-192x192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Serve the offline page's own sub-resources (e.g. its logo) from cache
  // when offline too, so the fallback page doesn't show a broken image.
  const { pathname } = new URL(event.request.url);
  if (PRECACHE_ASSETS.includes(pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
