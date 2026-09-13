/* BanglaPath Service Worker for Offline Capability */

const CACHE_NAME = 'banglapath-v2';
const STATIC_CACHE = 'banglapath-static-v2';
const DYNAMIC_CACHE = 'banglapath-dynamic-v2';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/home.css',
  '/modules.css',
  '/fonts.css',
  '/script.js',
  '/home.js',
  '/modules.js',
  '/config.js',
  '/places.json',
  '/manifest.json',
  '/images/bot-avatar.png',
  '/images/bd-map.png',
  '/fonts/Poppins-400-latin.woff2',
  '/fonts/PlayfairDisplay-700-latin.woff2'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        // console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
            })
            .map((cacheName) => {
              // console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
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

  // Skip external APIs (Gemini, etc.)
  if (url.origin !== self.location.origin) {
    // For API calls, always go to network (no caching)
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request).catch(() => {
          // Return offline error for API failures
          return new Response(
            JSON.stringify({ error: 'Offline - API unavailable' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
      return;
    }
    // For other external resources, try network then fail
    event.respondWith(fetch(request));
    return;
  }

  // During development and deployments, always prefer the current source for
  // HTML, CSS, JavaScript, and JSON. Fall back to cache only when offline.
  const isAppSource = /\.(html|css|js|json)$/.test(url.pathname) || url.pathname === '/';
  if (isAppSource) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For static files, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = networkResponse.clone();

            // Cache the fetched resource
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, serve offline page for HTML requests
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for offline actions (optional enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Push notification support (optional enhancement)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message from BanglaPath',
    icon: '/images/bot-avatar.png',
    badge: '/images/bot-avatar.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('BanglaPath', options)
  );
});

// Helper function for syncing messages (placeholder)
async function syncMessages() {
  // Implement message syncing logic here
  // console.log('[SW] Syncing messages...');
}
