// Caches the app so it opens and works with no internet connection.
const CACHE = 'tentcare-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './logo.png', './tent.png', './favicon.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      const network = fetch(event.request)
        .then(res => {
          if (res && res.ok && new URL(event.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || network;
    })
  );
});
