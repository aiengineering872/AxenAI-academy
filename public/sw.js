// Service Worker for PWA
const CACHE_NAME = 'axen-v3';
const urlsToCache = [
  '/',
  '/dashboard',
  '/learning',
  '/simulator',
  '/projects',
  '/mentor',
  '/career',
  '/leaderboard',
  '/certificates',
  '/videos',
  '/practice-tests',
  '/resume-builder',
  '/api-integration',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't fail if some URLs don't exist
      return Promise.allSettled(
        urlsToCache.map(url => 
          fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              return null;
            })
            .catch(err => {
              // Silently fail - don't log errors for missing routes
              return null;
            })
        )
      );
    }).catch(err => {
      // Silently handle cache errors
      console.log('Cache installation error:', err);
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip service worker for Next.js internal files and external requests
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.js.map') ||
    url.pathname.includes('.css.map') ||
    !url.origin.startsWith(self.location.origin)
  ) {
    // Let Next.js handle these requests normally
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network with error handling
      return fetch(event.request).catch((error) => {
        // Silently handle fetch errors - don't log repeatedly
        // Return a basic response for navigation requests to prevent errors
        if (event.request.mode === 'navigate') {
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/html' }),
          });
        }
        // For other requests, return a simple error response instead of throwing
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    }).catch((error) => {
      // Final fallback - return a basic error response
      return new Response('Service unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

