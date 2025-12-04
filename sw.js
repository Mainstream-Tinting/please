// Enhanced Service Worker for Mainstream Tinting
// Provides advanced offline functionality and intelligent caching

const CACHE_NAME = 'mainstream-tinting-v1.2';
const OFFLINE_PAGE = '/offline.html';
const CACHE_STRATEGY = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/residential.html', 
    '/commercial.html',
    '/gallery.html',
    '/technology.html',
    '/about.html',
    '/areas-we-serve.html',
    '/removal.html',
    '/style.css',
    '/main.js',
    '/m-logo-new.webp',
    '/m-logo-new.png',
    '/favicon-96x96.png',
    '/favicon.svg',
    '/favicon.ico',
    '/site.webmanifest',
    '/robots.txt'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching essential files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests (Google Fonts, reCAPTCHA, etc.)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    const url = new URL(event.request.url);
    
    // Determine caching strategy based on resource type
    let strategy = CACHE_STRATEGY.STALE_WHILE_REVALIDATE;
    
    if (url.pathname.endsWith('.html')) {
        strategy = CACHE_STRATEGY.NETWORK_FIRST;
    } else if (url.pathname.match(/\.(css|js|woff2?|ttf)$/)) {
        strategy = CACHE_STRATEGY.CACHE_FIRST;
    } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|mp4)$/)) {
        strategy = CACHE_STRATEGY.CACHE_FIRST;
    }
    
    event.respondWith(handleRequest(event.request, strategy));
});

// Intelligent request handling based on strategy
async function handleRequest(request, strategy) {
    const cache = await caches.open(CACHE_NAME);
    
    switch (strategy) {
        case CACHE_STRATEGY.CACHE_FIRST:
            return handleCacheFirst(request, cache);
        case CACHE_STRATEGY.NETWORK_FIRST:
            return handleNetworkFirst(request, cache);
        case CACHE_STRATEGY.STALE_WHILE_REVALIDATE:
        default:
            return handleStaleWhileRevalidate(request, cache);
    }
}

// Cache first strategy - good for static assets
async function handleCacheFirst(request, cache) {
    const cached = await cache.match(request);
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return cache.match(OFFLINE_PAGE) || 
                   cache.match('/index.html') ||
                   new Response('Offline - Please check your connection', {
                       status: 200,
                       headers: { 'Content-Type': 'text/html' }
                   });
        }
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network first strategy - good for HTML pages
async function handleNetworkFirst(request, cache) {
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return cache.match(OFFLINE_PAGE) || 
                   cache.match('/index.html') ||
                   new Response('Offline - Please check your connection', {
                       status: 200,
                       headers: { 'Content-Type': 'text/html' }
                   });
        }
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Stale while revalidate - good for frequently updated content
async function handleStaleWhileRevalidate(request, cache) {
    const cached = await cache.match(request);
    
    // Start fetch in background
    const fetchPromise = fetch(request).then(response => {
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => {
        // Silently fail background updates
    });
    
    // Return cached version immediately if available
    if (cached) {
        return cached;
    }
    
    // Otherwise wait for network
    try {
        return await fetchPromise;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return cache.match(OFFLINE_PAGE) || 
                   cache.match('/index.html') ||
                   new Response('Offline - Please check your connection', {
                       status: 200,
                       headers: { 'Content-Type': 'text/html' }
                   });
        }
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background sync for form submissions (if supported)
self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(
            // Handle offline form submissions when back online
            handleOfflineFormSubmissions()
        );
    }
});

// Handle offline form submissions
async function handleOfflineFormSubmissions() {
    try {
        // This would handle any queued form submissions
        // Implementation depends on your form handling needs
        console.log('Service Worker: Processing offline form submissions');
    } catch (error) {
        console.error('Service Worker: Error processing offline forms', error);
    }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/favicon-96x96.png',
            badge: '/favicon-96x96.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
