const CACHE = 'itcbt25-v5';

// Solo se precarga la app (archivos pequeños) — los PDFs se cachean cuando el usuario los abre
const PRECACHE = [
  './index.html',
  './manifest.json',
  './esquema-basico.png',
  './esquema-elevado.png'
];

// Archivos que se cachean bajo demanda (cuando el usuario los abre)
const LAZY = [
  'instalaciones-sanitarias.pdf',
  'instalaciones-electricas.pdf'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const filename = url.pathname.split('/').pop();

  // Para PDFs: sirve desde caché si existe, si no descarga y guarda para la próxima
  if (filename.endsWith('.pdf')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          // No está en caché: descarga y guarda
          return fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Para el resto: caché primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
