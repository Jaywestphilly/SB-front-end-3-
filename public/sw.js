// Stock Bloc Service Worker - Forced Cache Purge
const CACHE_NAME = "stock-bloc-intel-cache-v2-purge";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate Event - Clean all old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim()).then(() => {
      self.registration.unregister();
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Always fetch from network to bypass broken caches
  event.respondWith(fetch(event.request));
});
