import advancedGallery from './home-galleries/advanced.json'
import authorsGallery from './home-galleries/authors.json'
import beginnersGallery from './home-galleries/beginners.json'
import coachesGallery from './home-galleries/coaches.json'
import newsData from './home-news.json'
import type { HomeGallerySection, HomeGallerySectionSource, NewsData, SiteLink } from '../../types/home'

const cdnBaseUrl = (import.meta.env.VITE_CDN_BASE_URL || '').replace(/\/+$/, '')

const withCdnBase = (url: string): string => {
  if (!cdnBaseUrl || !url.startsWith('/assets/')) return url
  return `${cdnBaseUrl}${url}`
}

const fetchBackendGalleries = async (endpoint: string): Promise<HomeGallerySectionSource[]> => {
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`Failed to fetch home galleries: ${response.status}`)
  }

  return response.json()
}

const normalizeDirection = (direction?: string): 'left' | 'right' | undefined => {
  if (direction === 'left' || direction === 'right') return direction
  return undefined
}

const createSiteLink = ({
  avatarUrl,
  websiteUrl,
  websiteTitle,
  websiteDescription,
}: SiteLink): SiteLink => ({
  avatarUrl: withCdnBase(avatarUrl),
  websiteUrl,
  websiteTitle,
  websiteDescription,
})

const normalizeGallery = (gallery: HomeGallerySectionSource): HomeGallerySection => ({
  ...gallery,
  direction: normalizeDirection(gallery.direction),
  cards: (gallery.cards || []).map((card) => createSiteLink(card)),
  watch: gallery.watch
    ? {
        ...gallery.watch,
        links: (gallery.watch.links || []).map((link) => createSiteLink(link)),
      }
    : undefined,
  watches: (gallery.watches || []).map((watch) => ({
    ...watch,
    links: (watch.links || []).map((link) => createSiteLink(link)),
  })),
})

export const fetchHomeGalleries = async (): Promise<HomeGallerySection[]> => {
  const endpoint = import.meta.env.VITE_GALLERIES_API_URL

  if (endpoint) {
    try {
      const galleries = await fetchBackendGalleries(endpoint)
      return galleries.map(normalizeGallery)
    } catch (error) {
      console.warn(error)
    }
  }

  return [
    beginnersGallery,
    advancedGallery,
    coachesGallery,
    authorsGallery,
  ].map(normalizeGallery)
}

export const fetchNewsData = async (): Promise<NewsData> => {
  return {
    redList: newsData.redList.map((item) => ({
      ...item,
      sourceIcon: withCdnBase(item.sourceIcon),
    })),
    blackList: newsData.blackList.map((item) => ({
      ...item,
      sourceIcon: withCdnBase(item.sourceIcon),
    })),
    gossip: newsData.gossip.map((item) => ({
      ...item,
      sourceIcon: withCdnBase(item.sourceIcon),
    })),
  }
}
