export interface SiteLink {
  avatarUrl: string
  websiteUrl: string
  websiteTitle: string
  websiteDescription: string
  tags?: string[]
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
}

export interface WatchLinksBlock {
  title: string
  description: string
  links: SiteLink[]
}

export interface HomeGallerySection {
  eyebrow: string
  title: string
  accent: string
  direction?: 'left' | 'right'
  reverse?: boolean
  cards: SiteLink[]
  watch?: WatchLinksBlock
}

export interface HeroDockItem {
  label: string
  glyph: string
}

export interface AsyncVueModule<T> {
  default: T
}
