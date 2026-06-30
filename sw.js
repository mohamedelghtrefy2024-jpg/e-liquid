// ─── EPP Calculator Service Worker (CRITICAL-18) ────────────────────────────
// Cache-first strategy for static assets, network-first for dynamic requests.
// Enables offline usage and fast repeat loads.

const CACHE_NAME = 'epp-calc-v6';
const CACHE_VERSION = 5;

// Static assets to pre-cache on install
// ملاحظة: الملف الفعلي الذي يشغّل التطبيق هو EPP-Calculator-merged.html (راجع start.bat)
// لا يوجد index.html في هذا المشروع — كان مذكوراً بالغلط هنا في نسخة سابقة.
const PRECACHE_ASSETS = [
  './',
  './EPP-Calculator-merged.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── Install: pre-cache all static assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache what we can — individual failures don't abort install
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] Failed to pre-cache ${url}:`, err.message)
            )
          )
        );
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// ── Fetch: cache-first for static, network-first for API ─────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests (POST, etc.)
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cache hit, but also update cache in background (stale-while-revalidate)
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone))
                  .catch(() => {}); // Ignore cache update errors
              }
              return networkResponse;
            })
            .catch(() => {}); // Ignore network errors during background update
          // Don't await the background update — return cache immediately
          return cachedResponse;
        }

        // No cache hit — fetch from network and cache the response
        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone))
              .catch(() => {});
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback — return the actual app shell for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./EPP-Calculator-merged.html').then(cached => cached || _offlinePage());
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// ── Message: force update ─────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Offline fallback page (Session-10: TASK-4) ────────────────────────────────
// صفحة HTML جميلة ثنائية اللغة تظهر عند انعدام الاتصال بالإنترنت.
function _offlinePage() {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>غير متصل — EPP Calculator</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
      background: #0f0f1a;
      color: #e2e8f0;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%);
      border: 1px solid #4c1d95;
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(99, 102, 241, 0.25);
    }
    .icon {
      font-size: 72px;
      margin-bottom: 24px;
      display: block;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(0.95); opacity: 0.7; }
    }
    h1 {
      font-size: clamp(22px, 5vw, 28px);
      font-weight: 700;
      color: #a78bfa;
      margin-bottom: 8px;
    }
    h2 {
      font-size: clamp(16px, 4vw, 20px);
      font-weight: 600;
      color: #c4b5fd;
      margin-bottom: 20px;
      direction: ltr;
    }
    p.ar {
      font-size: 15px;
      line-height: 1.7;
      color: #cbd5e1;
      margin-bottom: 12px;
    }
    p.en {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
      direction: ltr;
      text-align: left;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #6366f1, transparent);
      margin: 20px 0;
    }
    .retry-btn {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      padding: 12px 32px;
      border-radius: 50px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s, transform 0.15s;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }
    .retry-btn:hover  { opacity: 0.9; transform: translateY(-1px); }
    .retry-btn:active { transform: translateY(0); }
    .footer {
      margin-top: 28px;
      font-size: 12px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="icon">📶</span>
    <h1>لا يوجد اتصال بالإنترنت</h1>
    <h2>You're Offline</h2>

    <p class="ar">
      يبدو أنك غير متصل بالإنترنت حالياً.
      تحقق من اتصالك وأعد المحاولة.
    </p>
    <p class="en">
      It seems you're not connected to the internet right now.
      Please check your connection and try again.
    </p>

    <div class="divider"></div>

    <button class="retry-btn" onclick="window.location.reload()">
      🔄 &nbsp; إعادة المحاولة / Retry
    </button>

    <p class="footer">EPP Calculator — حاسبة خلطات السوائل الإلكترونية</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
