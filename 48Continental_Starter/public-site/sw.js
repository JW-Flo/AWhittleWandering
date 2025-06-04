const CACHE = '48continental-v1';
const ASSETS = [
  '/',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Cache keys for weather data and map tiles
const WEATHER_CACHE = 'weather-cache-v1';
const MAP_TILE_CACHE = 'map-tile-cache-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Skip handling WebSocket connections
  if (e.request.headers.get('Upgrade') === 'websocket') {
    return;
  }
  
  // Skip handling WebSocket API endpoints (even for HTTP requests to these endpoints)
  if (url.pathname.startsWith('/api/stream/')) {
    return;
  }

  // Cache weather data requests
  if (url.pathname.startsWith('/weather') || url.hostname.includes('weather.gov')) {
    e.respondWith(
      caches.open(WEATHER_CACHE).then(cache =>
        cache.match(e.request).then(response => {
          const fetchPromise = fetch(e.request).then(networkResponse => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        })
      )
    );
    return;
  }

  // Cache map tile requests
  if (url.pathname.includes('/tiles/') || url.hostname.includes('mapbox.com')) {
    e.respondWith(
      caches.open(MAP_TILE_CACHE).then(cache =>
        cache.match(e.request).then(response => {
          const fetchPromise = fetch(e.request).then(networkResponse => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        })
      )
    );
    return;
  }

  // Default fetch handler
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Background sync for weather updates (simplified)
self.addEventListener('sync', event => {
  if (event.tag === 'weather-sync') {
    event.waitUntil(
      // Placeholder for sync logic
      Promise.resolve()
    );
  }
});
