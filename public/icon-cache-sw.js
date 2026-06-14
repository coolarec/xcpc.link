const ICON_CACHE_NAME = 'xcpc-link-icons-v1'
const IMAGE_EXTENSIONS = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:[?#].*)?$/i
const ICON_HOSTS = new Set(['favicone.com', 'unavatar.io'])

const isIconRequest = (request) => {
  if (request.method !== 'GET' || request.destination !== 'image') return false

  const url = new URL(request.url)
  return IMAGE_EXTENSIONS.test(url.pathname) || ICON_HOSTS.has(url.hostname)
}

const fetchAndCache = async (request, cache) => {
  const response = await fetch(request)

  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone())
  }

  return response
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== ICON_CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!isIconRequest(request)) return

  event.respondWith(
    caches.open(ICON_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) {
        event.waitUntil(fetchAndCache(request, cache).catch(() => undefined))
        return cached
      }

      return fetchAndCache(request, cache)
    }),
  )
})
