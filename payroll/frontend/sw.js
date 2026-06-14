/**
 * Service Worker — RIFIM Payroll PWA
 * Cache-first untuk aset statis, network-first untuk API calls
 */

const CACHE_NAME = 'rifim-payroll-v3';
const STATIC_ASSETS = [
  './index.html',
  './dashboard.html',
  './css/main.css',
  './js/config.js',
  './js/auth.js',
  './js/api.js',
  './js/app.js',
  './js/modules/dashboard.js',
  './js/modules/staff.js',
  './js/modules/attendance.js',
  './js/modules/payroll.js',
  './js/modules/lembur.js',
  './js/modules/kasbon.js',
  './js/modules/leave.js',
  './js/modules/idcard.js',
  './js/modules/report.js',
  './js/modules/slip-gaji.js',
  './js/modules/settings.js'
];

// Install: cache semua aset statis
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first untuk aset statis, network-first untuk GAS API
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // GAS API calls — selalu network
  if (url.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ success: false, error: 'Offline — tidak ada koneksi' }),
        { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }

  // Aset statis — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
