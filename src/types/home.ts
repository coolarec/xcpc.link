export interface SiteLink {
  avatarUrl: string
  websiteUrl: string
  websiteTitle: string
  websiteDescription: string
}

export interface BackgroundWord {
  word: string
  size: string
  opacity: string
  repeatDelay: string
  tone: number
}

export interface BackgroundRow {
  words: BackgroundWord[]
}

export interface HomeGallerySectionSource {
  eyebrow: string
  title: string
  accent: string
  direction?: string
  reverse?: boolean
  cards: SiteLink[]
  watch?: WatchLinksBlock
  watches?: WatchLinksBlock[]
}

export interface WatchLinksBlock {
  title: string
  description: string
  links: SiteLink[]
}

export interface NewsItem {
  text: string
  sourceName: string
  sourceIcon: string
}

export interface NewsData {
  redList: NewsItem[]
  blackList: NewsItem[]
  gossip: NewsItem[]
}

export interface HomeGallerySection {
  eyebrow: string
  title: string
  accent: string
  direction?: 'left' | 'right'
  reverse?: boolean
  cards: SiteLink[]
  watch?: WatchLinksBlock
  watches?: WatchLinksBlock[]
}

export interface HeroDockItem {
  label: string
  glyph: string
  icon?: 'book' | 'rocket' | 'users' | 'pen' | 'trophy' | 'lite'
  to?: string
}

export interface AsyncVueModule<T> {
  default: T
}
