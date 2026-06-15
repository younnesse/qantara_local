self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Pass-through fetch handler satisfying PWA install conditions
  e.respondWith(fetch(e.request).catch(() => {
    // Optional fallback logic if needed
  }));
});
