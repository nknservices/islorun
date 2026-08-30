const CACHE_NAME = 'islorun-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache Map Tiles (OpenStreetMap / CartoCDN) using Stale-While-Revalidate
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('cartocdn.com')) {
    event.respondWith(
      caches.open('islorun-map-tiles').then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
             // Ignore fetch errors for tiles if offline
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Default Network-first for everything else
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(res => {
         if (res) return res;
         return new Response('Network error occurred', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
