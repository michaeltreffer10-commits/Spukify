// Die alte Spukify-App hatte einen Service Worker, der die alte Seite im
// Browser zwischengespeichert hat. Dieser hier ersetzt ihn, löscht den
// Zwischenspeicher, meldet sich selbst ab und lädt offene Tabs neu.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) client.navigate(client.url)
    })(),
  )
})
