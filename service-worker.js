const CACHE = 'kg-quiz-v394';
const ASSETS = [
  './','./index.html','./kg1.html','./kg2.html','./class.html','./certificate.html','./admin.html','./style.css','./script.js','./custom-classes.js','./manifest.json'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const networkFirst = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  if (networkFirst) {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(res => res || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
    return res;
  }).catch(() => caches.match('./index.html'))));
});
