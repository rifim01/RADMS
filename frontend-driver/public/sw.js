// RADMS Driver Service Worker
const CACHE_NAME = 'radms-driver-v1';
const STATIC_CACHE = 'radms-static-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Static assets cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      console.log('[SW] Old caches cleared');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (tiles, CDN, etc.)
  if (url.origin !== location.origin) {
    // For map tiles, try cache then network
    if (url.href.includes('tile.openstreetmap.org')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(request);
          if (cached) return cached;
          try {
            const response = await fetch(request);
            cache.put(request, response.clone());
            return response;
          } catch {
            return new Response('', { status: 503 });
          }
        })
      );
    }
    return;
  }

  // Network-first for API calls, cache-first for assets
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-sync') {
    console.log('[SW] Background location sync triggered');
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.message || 'Ada notifikasi baru dari RADMS',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'RADMS Driver',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
