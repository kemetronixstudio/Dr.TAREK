const CACHE = 'kg-quiz-v1001-security-hardening';
const ASSETS = [
  "./",
  "./index.html",
  "./kg1.html",
  "./kg2.html",
  "./class.html",
  "./certificate.html",
  "./admin.html",
  "./play.html",
  "./homework.html",
  "./style.css",
  "./remove-empty-box.css",
  "./script.js",
  "./custom-classes.js",
  "./kg1-grade6-support.js",
  "./grades-extension.js",
  "./ui-language-patch.js",
  "./quiz-bulk-package.js",
  "./runtime-ui-fixes.js",
  "./play-test.js",
  "./play-question-bank.js",
  "./backend-access.js",
  "./student-cloud-admin.js",
  "./student-cloud-client.js",
  "./homework.js",
  "./homework-admin.js",
  "./play.html",
  "./hobby-upgrades.js",
  "./next-upgrade-pack.js",
  "./final-polish-pack.js",
  "./adaptive-access-admin.js",
  "./latest-admin-dynamic-fix.js",
  "./manifest.json",
  "./assets/icons/dreamers-192.png",
  "./assets/icons/dreamers-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/img/dreamers-logo.png"
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
