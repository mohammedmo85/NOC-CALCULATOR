const CACHE = "noc-v3";
const FILES = [
  "/NOC-CALCULATOR/",
  "/NOC-CALCULATOR/index.html",
  "/NOC-CALCULATOR/manifest.json",
  "/NOC-CALCULATOR/icon-192.png",
  "/NOC-CALCULATOR/icon-512.png"
];

// التثبيت — تخزين الملفات في الكاش
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

// التفعيل — حذف الكاش القديم فوراً والسيطرة على جميع الصفحات
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// الجلب — الشبكة أولاً ثم الكاش احتياطاً
self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
