import homeGalleries from './home-galleries.json'
import type { HeroDockItem, HomeGallerySection, HomeGallerySectionSource, SiteLink } from '../../types/home'

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
  tags = [],
}: SiteLink): SiteLink => ({
  avatarUrl,
  websiteUrl,
  websiteTitle,
  websiteDescription,
  tags,
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
})

const heroDockItems: HeroDockItem[] = [
  { label: 'Graph', glyph: 'G' },
  { label: 'String', glyph: 'S' },
  { label: 'Struct', glyph: 'D' },
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

  return cloneGalleries(homeGalleries).map(normalizeGallery)
}

export const fetchHeroDockItems = async (): Promise<HeroDockItem[]> => structuredClone(heroDockItems)

export const fetchHeroPanelEmojis = async (): Promise<string[]> => structuredClone(heroPanelEmojis)

export const fetchAlgorithmWords = async (): Promise<string[]> => structuredClone(algorithmWords)
