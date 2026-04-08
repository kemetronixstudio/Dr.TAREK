const CACHE_NAME = 'dr-tarek-phase1-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/class.html',
  '/certificate.html',
  '/kg1.html',
  '/kg2.html',
  '/play.html',
  '/style.css',
  '/script.js',
  '/custom-classes.js',
  '/student-cloud-client.js',
  '/student-cloud-admin.js',
  '/backend-access.js',
  '/public-config-sync.js',
  '/quiz-runtime-v2.js',
  '/admin-config-sync.js',
  '/play-test.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigate = request.mode === 'navigate' || request.destination === 'document';
  const isStaticAsset = ['script', 'style', 'image', 'font'].includes(request.destination);

  if (isNavigate) {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
