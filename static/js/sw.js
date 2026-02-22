const CACHE_NAME = 'unitranslate-v3';
const API_CACHE_NAME = 'unitranslate-api-v1';
const urlsToCache = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/i18n.js',
    '/static/js/history.js',
    '/static/manifest.json',
    '/static/images/icon-192.png',
    '/static/images/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // For API requests (POST /translate) – cache responses
    if (url.pathname === '/translate' && event.request.method === 'POST') {
        event.respondWith(
            fetch(event.request.clone())
                .then(response => {
                    const cloned = response.clone();
                    caches.open(API_CACHE_NAME).then(cache => {
                        cache.put(event.request, cloned);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // For static assets, use cache-first
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});