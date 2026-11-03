const CACHE_PREFIX = 'peaceville-app-'
const precacheEntries = self.__WB_MANIFEST || []
const shellRevision = precacheEntries.find((entry) => entry.url === 'index.html')?.revision || 'v1'
const CACHE_NAME = `${CACHE_PREFIX}${shellRevision}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(precacheEntries.map((entry) => entry.url))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (
    request.method !== 'GET'
    || url.origin !== self.location.origin
    || url.pathname.startsWith('/api/')
  ) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME)
      return cache.match('/index.html')
    }))
    return
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})