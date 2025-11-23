const CACHE_NAME = 'video-cache-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip proxy API routes - they handle their own caching and URL rewriting
    if (url.pathname.startsWith('/api/proxy')) {
        return; // Let the request pass through without Service Worker intervention
    }

    // Intercept HLS manifest files (.m3u8)
    if (url.pathname.endsWith('.m3u8')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request, { ignoreSearch: true }).then((response) => {
                    // Always fetch fresh manifest but return cached while fetching
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => response); // Fallback to cache on network error

                    // Return cache immediately if available, otherwise wait for network
                    return response || fetchPromise;
                });
            })
        );
    }

    // Intercept video segment files (.ts)
    if (url.pathname.endsWith('.ts')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                    // Cache hit - return immediately for instant playback
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Cache miss - fetch from network
                    return fetch(event.request).then((response) => {
                        // Only cache valid responses
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch((error) => {
                        console.error('[SW] Failed to fetch segment:', error);
                        throw error;
                    });
                });
            })
        );
    }
});
