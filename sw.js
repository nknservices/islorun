const CACHE_NAME = 'islorun-shell-v32';
const MAP_CACHE = 'islorun-map-tiles-v2';

// Files that make up the app shell — cached at install so the app
// works fully offline on iPhone (Safari) and Android Chrome
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  // Leaflet (map library)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  // Lucide icons
  'https://unpkg.com/lucide@latest',
  // html2canvas
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  // Tailwind CSS
  'https://cdn.tailwindcss.com',
  // Firebase SDKs
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual adds so one failure doesn't block the whole install
      return Promise.allSettled(
        SHELL_ASSETS.map(url =>
          cache.add(url).catch(() => console.log('[SW] Failed to cache:', url))
        )
      );
    })
  );
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== MAP_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Map tiles: cache-first (works offline after first load)
  if (url.hostname.includes('basemaps.cartocdn.com') ||
      url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(MAP_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // ── App shell: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        // Cache successful GET responses for the shell
        if (res.ok && event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        }
        return res;
      }).catch(() => {
        // Serve index.html for navigation requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
