// Retirement worker for visitors still controlled by the former PWA.
// Keep this file at the historical URL until old registrations have aged out.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    await self.registration.unregister();

    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});
