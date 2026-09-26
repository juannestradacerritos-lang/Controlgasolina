const CACHE_NAME = 'flotilla-cache-v17';

self.addEventListener('install', event => {
    self.skipWaiting(); // Obliga a actualizar la app al instante si hay cambios
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                './',
                './index.html',
                'https://cdn.tailwindcss.com',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
                'https://cdn.jsdelivr.net/npm/chart.js',
                'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
                'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim()); // Toma el control de la página inmediatamente
});

self.addEventListener('fetch', event => {
    // Solo intercepta peticiones seguras (ignora llamadas a Firebase o extensiones)
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('firebaseio.com') || event.request.url.includes('firestore') || event.request.url.includes('chrome-extension')) return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Estrategia: "Stale-While-Revalidate" -> Carga súper rápido desde caché, pero actualiza en el fondo
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, cacheCopy);
                    });
                }
                return networkResponse;
            }).catch(() => {
                console.log('Modo offline activado: No se pudo conectar a', event.request.url);
            });
            return cachedResponse || fetchPromise;
        })
    );
});
