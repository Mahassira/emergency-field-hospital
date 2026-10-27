// Keeps the app working with no internet connection.
// Pages: try the network first so updates show straight away; use the saved copy when offline.
// Images and other files: use the saved copy first, refresh it in the background.
const CACHE = 'tentcare-v20';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './assets/brand/logo.png', './assets/brand/tent.png', './assets/icons/favicon.png', './assets/icons/apple-touch-icon.png', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-512.png'];

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

function saveCopy(request, response) {
  if (response && response.ok && new URL(request.url).origin === location.origin) {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return; // other sites, such as the visit counter, go straight to the network

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => saveCopy(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const network = fetch(req).then(res => saveCopy(req, res)).catch(() => cached);
      return cached || network;
    })
  );
});
