self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'Agentbot', body: 'New notification' }
  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: data.url || '/dashboard',
    vibrate: [100, 50, 100],
  }
  e.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(e.notification.data || '/dashboard')
    })
  )
})
