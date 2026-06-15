import type { HomeGallerySection, NewsData, NewsItem, SiteLink, WatchLinksBlock } from '../../../types/home'

export interface HomeLinkGroup {
  id: string
  title: string
  links: SiteLink[]
}

export interface HomeNewsGroup {
  id: string
  title: string
  items: NewsItem[]
}

export const getGalleryWatches = (gallery: HomeGallerySection): WatchLinksBlock[] => {
  if (gallery.watches?.length) return gallery.watches
  return gallery.watch ? [gallery.watch] : []
}

export const getGalleryGroups = (gallery: HomeGallerySection): HomeLinkGroup[] => [
  {
    id: `${gallery.title}-featured`,
    title: '未分组',
    links: gallery.cards,
  },
  ...getGalleryWatches(gallery).map((watch, index) => ({
    id: `${gallery.title}-${watch.title}-${index}`,
    title: watch.title || '相关推荐',
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
