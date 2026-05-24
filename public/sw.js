const CACHE_NAME = 'acf-v1'
const STATIC_CACHE = 'acf-static-v1'

// Core app shell to cache on install
const APP_SHELL = [
  '/',
  '/feed',
  '/explore',
  '/offline',
]

// Install — cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

const APP_SHELL_CACHE_NAME = CACHE_NAME

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch — network first for API, cache first for assets
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, chrome-extension, and external requests
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return  // Always network for API

  // Static assets — cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        }).catch(() => cached || new Response('', { status: 404 }))
      })
    )
    return
  }

  // HTML pages — network first, fall back to cache, then offline page
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request)
          .then(cached => cached || caches.match('/offline'))
      )
  )
})

// Background sync for failed posts (future use)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-posts') {
    // Handle queued posts when back online
  }
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'AiCreatorFeed', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url || '/notifications' },
      vibrate: [100, 50, 100],
    })
  )
})

// Notification click — open app to the right page
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/notifications'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
