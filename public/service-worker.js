self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (error) {
    console.error('อ่านข้อมูล Push notification ไม่สำเร็จ:', error)
  }

  const notificationData = payload.data || {}
  const options = {
    body: payload.body || 'มีการแจ้งเตือนใหม่จาก FixMatch',
    icon: payload.icon || '/FixMatch/icons/icon-192.png',
    badge: payload.badge || '/FixMatch/icons/favicon-32x32.png',
    tag: payload.tag || `fixmatch-${Date.now()}`,
    renotify: true,
    data: {
      url: payload.url || '/FixMatch/',
      ...notificationData,
    },
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'FixMatch', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || '/FixMatch/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then((windowClient) => windowClient?.focus())
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
