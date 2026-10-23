import { ACTIVITY_LIMIT, ACTIVITY_TIME_ZONE, activityDays, rankActivity } from '../src/modules/home/linkActivity.ts'

const CACHE_MS = 30_000
const MAX_BODY_BYTES = 1024
const EVENT_PREFIX = 'events/v1/'
const MAX_LIST_PAGES = 100
const MAX_LIST_ENTRIES = 100_000

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
})
const unavailable = (code = 'ACTIVITY_UNAVAILABLE') => json({ error: code }, 503, { 'Retry-After': '60' })
const hasStore = (store) => store && typeof store.list === 'function' && typeof store.setJSON === 'function'
const isDayKey = (day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
  && activityDays(Date.parse(`${day}T00:00:00+08:00`))[0] === day

async function readBody(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw json({ error: 'JSON_REQUIRED' }, 415)
  }
  const length = request.headers.get('Content-Length')
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    throw json({ error: 'BODY_TOO_LARGE' }, 413)
  }
  const reader = request.body?.getReader()
  if (!reader) throw json({ error: 'INVALID_BODY' }, 400)
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value)
      size += chunk.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        throw json({ error: 'BODY_TOO_LARGE' }, 413)
      }
      chunks.push(chunk)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    return await new Response(bytes).json()
  } catch (error) {
    if (error instanceof Response) throw error
    throw json({ error: 'INVALID_BODY' }, 400)
  } finally {
    reader.releaseLock()
  }
}

export function createActivityService({ urls, now = Date.now, cacheMs = CACHE_MS, maxListPages = MAX_LIST_PAGES }) {
  const allowed = new Set(urls)
  let catalog
  const caches = new WeakMap()

  const getCatalog = () => {
    if (!catalog) catalog = Promise.all([...allowed].map(async (url) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url))
      const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
      return [id, url]
    })).then((entries) => ({ byId: new Map(entries), byUrl: new Map(entries.map(([id, url]) => [url, id])) }))
    return catalog
  }

  const buildSnapshot = async (store, timestamp) => {
    const { byId } = await getCatalog()
    const days = activityDays(timestamp)
    const visits = new Map()
    let pages = 0
    let entries = 0
    const list = async (options, consume) => {
      let cursor
      const cursors = new Set()
      do {
        if (++pages > maxListPages) throw new Error('Activity listing limit reached')
        const page = await store.list({ ...options, paginate: false, consistency: 'strong', ...(cursor ? { cursor } : {}) })
        if (!page || !Array.isArray(page.blobs)
          || (options.directories && !Array.isArray(page.directories))) throw new Error('Invalid Blob listing')
        entries += page.blobs.length + (page.directories?.length ?? 0)
        if (entries > MAX_LIST_ENTRIES) throw new Error('Activity entry limit reached')
        consume(page)
        cursor = page.cursor
        if (cursor !== undefined && (typeof cursor !== 'string' || !cursor || cursors.has(cursor))) {
          throw new Error('Invalid Blob cursor')
        }
        cursors.add(cursor)
      } while (cursor)
    }
    const readDay = async (day) => {
      const prefix = `${EVENT_PREFIX}${day}/`
      const seen = new Set()
      await list({ prefix }, (page) => {
        for (const blob of page.blobs) {
          if (typeof blob.key !== 'string' || !blob.key.startsWith(prefix)) throw new Error('Invalid event key')
          if (seen.has(blob.key)) continue
          seen.add(blob.key)
          const match = /^(\d{13})_([a-f0-9]{32})_([a-f0-9]{64})\.json$/.exec(blob.key.slice(prefix.length))
          if (!match) throw new Error('Invalid event key')
          const openedAt = Number(match[1])
          if (activityDays(openedAt)[0] !== day) throw new Error('Invalid event date')
          const url = byId.get(match[3])
          if (!url || openedAt > timestamp) continue
          const visit = visits.get(url) ?? { url, total: 0, lastOpened: 0, days: {} }
          visit.total++
          visit.lastOpened = Math.max(visit.lastOpened, openedAt)
          if (days.includes(day)) visit.days[day] = (visit.days[day] ?? 0) + 1
          visits.set(url, visit)
        }
      })
    }
    for (const day of days) await readDay(day)
    if (visits.size < Math.min(ACTIVITY_LIMIT, allowed.size)) {
      const olderDays = new Set()
      await list({ prefix: EVENT_PREFIX, directories: true }, (page) => {
        for (const directory of page.directories) {
          if (typeof directory !== 'string') throw new Error('Invalid event directory')
          const day = directory.slice(EVENT_PREFIX.length, -1)
          if (directory !== `${EVENT_PREFIX}${day}/` || !isDayKey(day)) throw new Error('Invalid event directory')
          if (day < days[days.length - 1]) olderDays.add(day)
        }
      })
      for (const day of [...olderDays].sort().reverse()) {
        await readDay(day)
        if (visits.size >= Math.min(ACTIVITY_LIMIT, allowed.size)) break
      }
    }
    const ranked = rankActivity([...visits.values()], timestamp)
    const entry = ({ url, weekCount, lastOpened }) => ({ url, weekCount, lastOpened })
    return {
      version: 1, timeZone: ACTIVITY_TIME_ZONE, generatedAt: timestamp,
      popular: ranked.popular.map(entry), recent: ranked.recent.map(entry),
    }
  }

  const lists = async (request, store) => {
    if (request.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, 405, { Allow: 'GET' })
    if (!hasStore(store)) return unavailable('BLOB_NOT_CONFIGURED')
    try {
      const timestamp = now()
      const day = activityDays(timestamp)[0]
      let cached = caches.get(store)
      if (!cached || cached.expires <= timestamp || cached.day !== day) {
        const current = { expires: timestamp + cacheMs, day, promise: null }
        current.promise = buildSnapshot(store, timestamp)
        caches.set(store, current)
        cached = current
      }
      const snapshot = await cached.promise
      const untilMidnight = (Date.parse(`${day}T00:00:00+08:00`) + 86_400_000 - timestamp) / 1000
      const seconds = Math.max(0, Math.floor(Math.min(cacheMs / 1000, (cached.expires - timestamp) / 1000, untilMidnight)))
      return json(snapshot, 200, { 'Cache-Control': `public, max-age=0, s-maxage=${seconds}` })
    } catch {
      caches.delete(store)
      return unavailable()
    }
  }

  const click = async (request, store) => {
    if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405, { Allow: 'POST' })
    if (request.headers.get('Origin') !== new URL(request.url).origin
      || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'ORIGIN_NOT_ALLOWED' }, 403)
    try {
      const body = await readBody(request)
      if (!body || typeof body.url !== 'string' || !allowed.has(body.url)) return json({ error: 'UNKNOWN_LINK' }, 400)
      if (!hasStore(store)) return unavailable('BLOB_NOT_CONFIGURED')
      const url = body.url
      const timestamp = now()
      const { byUrl } = await getCatalog()
      const linkId = byUrl.get(url)
      const random = crypto.getRandomValues(new Uint8Array(16))
      const eventId = Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('')
      const key = `${EVENT_PREFIX}${activityDays(timestamp)[0]}/${String(timestamp).padStart(13, '0')}_${eventId}_${linkId}.json`
      await store.setJSON(key, { version: 1, linkId, openedAt: timestamp })
      caches.delete(store)
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      return error instanceof Response ? error : unavailable()
    }
  }

  return { lists, click }
}
