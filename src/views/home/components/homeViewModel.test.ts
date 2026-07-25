import { describe, expect, it } from 'vitest'
import type { HomeGallerySection } from '../../../types/home'
import * as homeViewModel from './homeViewModel'

interface SearchItemLike {
  kind: 'category' | 'group' | 'website'
  id: string
  label: string
  context: string
  description: string
  url?: string
}

type BuildSearchIndex = (galleries: HomeGallerySection[]) => SearchItemLike[]
type SearchHomeItems = (items: SearchItemLike[], query: string, limit?: number) => SearchItemLike[]

const galleryFixture: HomeGallerySection[] = [
  {
    eyebrow: 'BEGINNERS',
    title: '入门指南',
    accent: '#007aff',
    cards: [
      {
        avatarUrl: '/oi-wiki.svg',
        websiteUrl: 'https://oi-wiki.org/',
        websiteTitle: 'OI Wiki',
        websiteDescription: '免费的算法知识站点',
      },
    ],
    watches: [
      {
        title: '训练平台',
        description: '在线评测站点',
        links: [
          {
            avatarUrl: '/codeforces.svg',
            websiteUrl: 'https://codeforces.com/',
            websiteTitle: 'Codeforces',
            websiteDescription: 'Online programming contests',
          },
        ],
      },
    ],
  },
]

const getSearchFunctions = (): { buildSearchIndex: BuildSearchIndex; searchItems: SearchHomeItems } => {
  const exports = homeViewModel as unknown as Record<string, unknown>
  expect(exports.buildHomeSearchIndex).toBeTypeOf('function')
  expect(exports.searchHomeItems).toBeTypeOf('function')

  return {
    buildSearchIndex: exports.buildHomeSearchIndex as BuildSearchIndex,
    searchItems: exports.searchHomeItems as SearchHomeItems,
  }
}

describe('home search view model', () => {
  it('builds location and website results from gallery content', () => {
    const { buildSearchIndex } = getSearchFunctions()

    expect(buildSearchIndex(galleryFixture)).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'category', id: 'home-category-0', label: '入门指南' }),
      expect.objectContaining({ kind: 'group', id: 'home-group-0-1', label: '训练平台' }),
      expect.objectContaining({
        kind: 'website',
        label: 'Codeforces',
        context: '入门指南 · 训练平台',
        url: 'https://codeforces.com/',
      }),
    ]))
  })

  it('matches Chinese titles and English titles without case sensitivity', () => {
    const { buildSearchIndex, searchItems } = getSearchFunctions()
    const index = buildSearchIndex(galleryFixture)

    expect(searchItems(index, '训练')[0]).toMatchObject({ kind: 'group', label: '训练平台' })
    expect(searchItems(index, 'CODE')[0]).toMatchObject({ kind: 'website', label: 'Codeforces' })
  })

  it('matches website descriptions and trims the query', () => {
    const { buildSearchIndex, searchItems } = getSearchFunctions()
    const index = buildSearchIndex(galleryFixture)

    expect(searchItems(index, '  算法知识  ')[0]).toMatchObject({ kind: 'website', label: 'OI Wiki' })
  })

  it('returns no results for an empty query and respects the result limit', () => {
    const { buildSearchIndex, searchItems } = getSearchFunctions()
    const index = buildSearchIndex(galleryFixture)

    expect(searchItems(index, '   ')).toEqual([])
    expect(searchItems(index, '入门', 1)).toHaveLength(1)
  })
})
