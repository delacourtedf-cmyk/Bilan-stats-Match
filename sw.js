/* Service worker de l'appli « Bilan volley DVW ».
   Change VERSION à chaque mise à jour : l'appli propose alors « Mettre à jour ». */
const VERSION = '2026-10-25.8';
const CACHE = 'bilan-volley-' + VERSION;
const FONTS = 'bilan-volley-polices';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('bilan-volley-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* Polices Google : copie locale après la 1re utilisation (sans Internet, police standard sinon) */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit || Response.error()))));
    return;
  }
  if (url.origin !== location.origin) return;
  /* Fichiers de l'appli : d'abord la copie locale (marche sans Internet) */
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); }
    catch (err) { if (req.mode === 'navigate') { const page = await caches.match('./index.html'); if (page) return page; } throw err; }
  })());
});
