// Jhalak Reels PWA Service Worker (sw.js)
// Enables PWA caching, fast loading, and offline reliability

const CACHE_NAME = 'jhalak-pwa-v1.1';
const RUNTIME_CACHE = 'jhalak-runtime-v1.1';

// Core assets required for instant loading and offline app shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.svg',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/screenshots/screenshot-mobile-1.png',
  '/screenshots/screenshot-mobile-2.png',
  '/screenshots/screenshot-desktop-1.png',
];

// Install Event: Pre-cache app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use map with catch so a single asset failure never breaks service worker installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[SW] Precache skipped for:', url, err);
          })
        )
      );
    })
  );
});

// Activate Event: Clear outdated caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. Bypass non-HTTP/HTTPS schemes (e.g. chrome-extension, data:)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Bypass real-time database, auth, and advertising APIs (Network Only)
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('pagead2.googlesyndication.com') ||
    url.hostname.includes('googleads') ||
    url.hostname.includes('adsbygoogle') ||
    url.pathname.startsWith('/api/media/upload') ||
    url.pathname.includes('/socket.io/') ||
    request.headers.get('Upgrade') === 'websocket'
  ) {
    return;
  }

  // 4. Bypass media range requests (avoid partial content 206 cache errors)
  if (request.headers.has('range')) {
    return;
  }

  // 5. HTML Navigation Requests (App Shell): Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Jhalak Reels - Offline</title>
              <style>
                body { background: #0a0a0c; color: #fff; font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 24px; }
                h1 { font-size: 28px; margin-bottom: 12px; }
                p { color: #9ca3af; font-size: 16px; max-width: 400px; line-height: 1.5; }
                button { margin-top: 24px; padding: 12px 28px; border-radius: 9999px; background: #e11d48; color: #fff; border: none; font-size: 16px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div style="font-size: 64px; margin-bottom: 16px;">📶</div>
              <h1>You're Offline</h1>
              <p>Connect to the internet to watch new Bhojpuri reels and stories. Previously loaded content remains available.</p>
              <button onclick="window.location.reload()">Retry Connection</button>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 6. Static Assets (Scripts, Styles, Fonts, Images): Cache-first with stale-while-revalidate
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/screenshots/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.ico'));

  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset || isGoogleFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Fetch fresh copy in background to revalidate cache
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 7. Default Network-first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error('Offline and asset not in cache');
      })
  );
});
