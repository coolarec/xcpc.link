import type { HomeGallerySection, NewsData, NewsItem, SiteLink, WatchLinksBlock } from '../../../types/home'

export interface HomeLinkGroup {
  id: string
  title: string
  description: string
  links: SiteLink[]
}

export interface HomeNewsGroup {
  id: string
  title: string
  items: NewsItem[]
}

export interface HomeSearchBaseItem {
  id: string
  label: string
  context: string
  description: string
}

export interface HomeLocationSearchItem extends HomeSearchBaseItem {
  kind: 'category' | 'group'
}

export interface HomeWebsiteSearchItem extends HomeSearchBaseItem {
  kind: 'website'
  url: string
  avatarUrl: string
}

export type HomeSearchItem = HomeLocationSearchItem | HomeWebsiteSearchItem

export const getGallerySectionId = (galleryIndex: number): string => `home-category-${galleryIndex}`

export const getGroupSectionId = (galleryIndex: number, groupIndex: number): string =>
  `home-group-${galleryIndex}-${groupIndex}`

export const getGalleryWatches = (gallery: HomeGallerySection): WatchLinksBlock[] => {
  if (gallery.watches?.length) return gallery.watches
  return gallery.watch ? [gallery.watch] : []
}

export const getGalleryGroups = (gallery: HomeGallerySection): HomeLinkGroup[] => [
  {
    id: `${gallery.title}-featured`,
    title: '未分组',
    description: '',
    links: gallery.cards,
  },
  ...getGalleryWatches(gallery).map((watch, index) => ({
    id: `${gallery.title}-${watch.title}-${index}`,
    title: watch.title || '相关推荐',
    description: watch.description,
    links: watch.links,
  })),
].filter((group) => group.links.length > 0)

export const getGalleryLinkCount = (gallery: HomeGallerySection): number =>
  getGalleryGroups(gallery).reduce((total, group) => total + group.links.length, 0)

export const getNewsGroups = (news: NewsData): HomeNewsGroup[] => [
  { id: 'red-list', title: '红榜', items: news.redList },
  { id: 'black-list', title: '黑榜', items: news.blackList },
  { id: 'live-list', title: '实时榜', items: news.gossip },
]

export const getNewsCount = (news: NewsData): number =>
  getNewsGroups(news).reduce((total, group) => total + group.items.length, 0)

export const buildHomeSearchIndex = (galleries: HomeGallerySection[]): HomeSearchItem[] =>
  galleries.flatMap((gallery, galleryIndex) => {
    const categoryItem: HomeLocationSearchItem = {
      kind: 'category',
      id: getGallerySectionId(galleryIndex),
      label: gallery.title,
      context: gallery.eyebrow,
      description: gallery.eyebrow,
    }

    const groupItems = getGalleryGroups(gallery).flatMap((group, groupIndex): HomeSearchItem[] => {
      const groupItem: HomeLocationSearchItem = {
        kind: 'group',
        id: getGroupSectionId(galleryIndex, groupIndex),
        label: group.title,
        context: gallery.title,
        description: group.description,
      }

      const websiteItems: HomeWebsiteSearchItem[] = group.links.map((link, linkIndex) => ({
        kind: 'website',
        id: `home-website-${galleryIndex}-${groupIndex}-${linkIndex}`,
        label: link.websiteTitle,
        context: `${gallery.title} · ${group.title}`,
        description: link.websiteDescription,
        url: link.websiteUrl,
        avatarUrl: link.avatarUrl,
      }))

      return [groupItem, ...websiteItems]
    })

    return [categoryItem, ...groupItems]
  })

const normalizeSearchText = (value: string): string => value.trim().toLocaleLowerCase()

const getSearchScore = (item: HomeSearchItem, query: string): number => {
  const label = normalizeSearchText(item.label)
  if (label === query) return 0
  if (label.startsWith(query)) return 1
  if (label.includes(query)) return 2
  if (normalizeSearchText(item.context).includes(query)) return 3
  if (normalizeSearchText(item.description).includes(query)) return 4
  return Number.POSITIVE_INFINITY
}

export const searchHomeItems = (
  items: HomeSearchItem[],
  query: string,
  limit = 10,
): HomeSearchItem[] => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery || limit <= 0) return []

  return items
    .map((item, index) => ({ item, index, score: getSearchScore(item, normalizedQuery) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .slice(0, limit)
    .map(({ item }) => item)
}
