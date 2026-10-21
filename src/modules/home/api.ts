import advancedGallery from './home-galleries/advanced.json' with { type: 'json' }
import authorsGallery from './home-galleries/authors.json' with { type: 'json' }
import beginnersGallery from './home-galleries/beginners.json' with { type: 'json' }
import coachesGallery from './home-galleries/coaches.json' with { type: 'json' }
import newsData from './home-news.json' with { type: 'json' }
import type { HomeGallerySection, NewsData, SiteLink, WatchLinksBlock } from '../../types/home.ts'

const cdnBaseUrl = (import.meta.env?.VITE_CDN_BASE_URL || '').trim().replace(/\/+$/, '')
const withCdnBase = (url: string): string =>
  cdnBaseUrl && url.startsWith('/assets/') ? `${cdnBaseUrl}${url}` : url

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('资源目录格式错误')
  return value as Record<string, unknown>
}
const stringField = (value: Record<string, unknown>, key: string, fallback?: string): string => {
  if (value[key] === undefined && fallback !== undefined) return fallback
  if (typeof value[key] !== 'string') throw new Error(`资源目录字段 ${key} 必须为字符串`)
  return value[key]
}
const arrayField = (value: unknown): unknown[] => {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('资源目录列表格式错误')
  return value
}
const createSiteLink = (source: unknown): SiteLink => {
  const value = record(source)
  const websiteUrl = stringField(value, 'websiteUrl')
  const protocol = new URL(websiteUrl, 'https://xcpc.link/').protocol
  if (!websiteUrl.trim() || !['http:', 'https:'].includes(protocol)) throw new Error('网站链接必须使用 HTTP 或 HTTPS')
  return {
    avatarUrl: withCdnBase(stringField(value, 'avatarUrl', '')),
    websiteUrl,
    websiteTitle: stringField(value, 'websiteTitle'),
    websiteDescription: stringField(value, 'websiteDescription', ''),
  }
}
const normalizeWatch = (source: unknown): WatchLinksBlock => {
  const value = record(source)
  return {
    title: stringField(value, 'title', '相关推荐'),
    description: stringField(value, 'description', ''),
    links: arrayField(value.links).map(createSiteLink),
  }
}

export const normalizeGallery = (source: unknown): HomeGallerySection => {
  const value = record(source)
  const watches = arrayField(value.watches)
  // Preserve the old precedence: a nonempty watches list replaces legacy watch.
  const watchSources = watches.length ? watches : value.watch ? [value.watch] : []
  return {
    eyebrow: stringField(value, 'eyebrow', ''),
    title: stringField(value, 'title'),
    accent: stringField(value, 'accent', ''),
    direction: value.direction === 'left' || value.direction === 'right' ? value.direction : undefined,
    reverse: value.reverse === true,
    cards: arrayField(value.cards).map(createSiteLink),
    watches: watchSources.map(normalizeWatch),
  }
}

export const getLocalHomeGalleries = (): HomeGallerySection[] =>
  [beginnersGallery, advancedGallery, coachesGallery, authorsGallery].map(normalizeGallery)

export const getLocalNewsData = (): NewsData => ({
  redList: newsData.redList.map((item) => ({ ...item, sourceIcon: withCdnBase(item.sourceIcon) })),
  blackList: newsData.blackList.map((item) => ({ ...item, sourceIcon: withCdnBase(item.sourceIcon) })),
  gossip: newsData.gossip.map((item) => ({ ...item, sourceIcon: withCdnBase(item.sourceIcon) })),
})

export interface GalleryRequestOptions {
  endpoint?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export const fetchRemoteGalleries = async ({
  endpoint = import.meta.env?.VITE_GALLERIES_API_URL,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: GalleryRequestOptions = {}): Promise<HomeGallerySection[] | null> => {
  if (!endpoint?.trim()) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(endpoint, { signal: controller.signal })
    if (!response.ok) throw new Error(`资源目录请求失败：HTTP ${response.status}`)
    const payload: unknown = await response.json()
    if (!Array.isArray(payload)) throw new Error('资源目录响应必须为数组')
    return payload.map(normalizeGallery)
  } finally {
    clearTimeout(timeout)
  }
}
