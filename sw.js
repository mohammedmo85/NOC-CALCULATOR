// ═══════════════════════════════════════════════════════════
//  NOC Calculator - Service Worker
//  شركة نفط الشمال - حاسبة الاستحقاقات
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'noc-calculator-v1.0.0';
const OFFLINE_URL = './index.html';

// الملفات التي سيتم تخزينها مؤقتاً
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// ── تثبيت Service Worker ──────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ── تفعيل Service Worker ──────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// ── معالجة الطلبات ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;

  // تجاهل طلبات chrome-extension
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // إرجاع النسخة المخزنة إن وجدت
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // طلب من الشبكة
        return fetch(event.request.clone())
          .then((networkResponse) => {
            // تخزين الاستجابة الجديدة
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // في حالة عدم الاتصال بالإنترنت
            console.log('[SW] Offline - serving fallback page');
            return caches.match(OFFLINE_URL);
          });
      })
  );
});

// ── رسائل من التطبيق ─────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
