import advancedGallery from './home-galleries/advanced.json'
import authorsGallery from './home-galleries/authors.json'
import beginnersGallery from './home-galleries/beginners.json'
import coachesGallery from './home-galleries/coaches.json'
import newsData from './home-news.json'
import type { HeroDockItem, HomeGallerySection, HomeGallerySectionSource, NewsData, SiteLink } from '../../types/home'

const cloneGalleries = (galleries: HomeGallerySectionSource[]): HomeGallerySectionSource[] =>
  structuredClone(galleries)

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
  avatarUrl,
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

const heroDockItems: HeroDockItem[] = [
  { label: '入门', glyph: 'B', icon: 'book' },
  { label: '进阶', glyph: 'A', icon: 'rocket' },
  { label: '学生教练', glyph: 'C', icon: 'users' },
  { label: '出题人', glyph: 'P', icon: 'pen' },
  { label: '榜单', glyph: 'R', icon: 'trophy' },
]

const heroPanelEmojis: string[] = ['🏆', '💻', '🧠', '🧩', '🥇', '⏱️']

const algorithmWords: string[] = [
  'DIJKSTRA',
  'BELLMAN-FORD',
  'FLOYD',
  'SPFA',
  'A*',
  'KMP',
  'Z-ALGORITHM',
  'MANACHER',
  'AC-AUTOMATON',
  'SUFFIX ARRAY',
  'SAM',
  'LCP',
  'FFT',
  'NTT',
  'FWT',
  'MILLER-RABIN',
  'POLLARD-RHO',
  'CRT',
  'GAUSS',
  'DSU',
  'LCT',
  'HLD',
  'SEGMENT TREE',
  'FENWICK',
  'SPARSE TABLE',
  'TREAP',
  'SPLAY',
  'DINIC',
  'ISAP',
  'MCMF',
  'HOPCROFT-KARP',
  'TARJAN',
  'KOSARAJU',
  'TOPO SORT',
  'LCA',
  'CENTROID',
  'MO ALGORITHM',
  'CDQ',
  'KNUTH',
  'MONOTONE QUEUE',
  'CONVEX HULL',
  'MIN-COST FLOW',
]

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

  return cloneGalleries([
    beginnersGallery,
    advancedGallery,
    coachesGallery,
    authorsGallery,
  ]).map(normalizeGallery)
}

export const fetchHeroDockItems = async (): Promise<HeroDockItem[]> => structuredClone(heroDockItems)

export const fetchHeroPanelEmojis = async (): Promise<string[]> => structuredClone(heroPanelEmojis)

export const fetchAlgorithmWords = async (): Promise<string[]> => structuredClone(algorithmWords)

export const fetchNewsData = async (): Promise<NewsData> => structuredClone(newsData)
