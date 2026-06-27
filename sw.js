// Bursa Namaz Takvimi 2026 — Service Worker
const CACHE_NAME = 'namaz-takvimi-v1';
const CACHED_URLS = [
  '/quiz/namaz_vakti.html',
];

// Kurulum: sayfayı önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHED_URLS).catch(() => {
        // Önbellek hatası olursa sessizce geç
      });
    })
  );
  self.skipWaiting();
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: önce önbellekten sun, yoksa ağdan çek
self.addEventListener('fetch', event => {
  // Sadece aynı origin isteklerine bak
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Arka planda güncelle (stale-while-revalidate)
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }
      // Önbellekte yoksa ağdan çek
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/quiz/namaz_vakti.html'));
    })
  );
});
