const CACHE_NAME = 'sensor-app-v1';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Background sync for sensor data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sensor-sync') {
        event.waitUntil(syncSensorData());
    }
});

async function syncSensorData() {
    try {
        const response = await fetch('/api/sensors');
        const data = await response.json();

        // Cache updated sensor data
        const cache = await caches.open('sensor-data-cache');
        await cache.put('/api/sensors', new Response(JSON.stringify(data)));

        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SENSOR_DATA_UPDATED',
                data: data
            });
        });
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}