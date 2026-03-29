const CACHE = 'kg-quiz-v14';
const CORE_ASSETS = [
  './',
  './index.html',
  './kg1.html',
  './kg2.html',
  './certificate.html',
  './admin.html',
  './style.css',
  './script.js',
  './manifest.json',
  './school-logo.svg',
  './teacher-signature.svg',
  './cat.svg',
  './dog.svg',
  './apple.svg',
  './book.svg',
  './ball.svg',
  './bus.svg',
  './school.svg',
  './happy.svg',
  './sad.svg',
  './triangle.svg',
  './school-bag.svg',
  './orange.svg',
  './banana.svg',
  './carrots.svg',
  './cucumbers.svg',
  './chicken.svg',
  './meat.svg',
  './alligator.svg',
  './apricot.svg',
  './tooth.svg',
  './truck.svg',
  './head.svg',
  './hippo.svg',
  './wash.svg',
  './seat.svg',
  './please.svg',
  './food.svg',
  './healthy.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(request)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const isCoreText = /\.(html|js|css)$/i.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('/');
    if (isCoreText) {
      try {
        const fresh = await fetch(request, {cache: 'no-store'});
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(request)) || Response.error();
      }
    }
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const fresh = await fetch(request);
      const cache = await caches.open(CACHE);
      cache.put(request, fresh.clone());
      return fresh;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
