// @vitest-environment jsdom

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHomeContentStore } from '../../../stores/homeContent'
import type { ThemeMode } from '../../../stores/theme'
import type { HomeGallerySection } from '../../../types/home'
import HomePage from '../HomePage.vue'
import HomeCategorySection from './HomeCategorySection.vue'
import HomeHeader from './HomeHeader.vue'
import HomeSearch from './HomeSearch.vue'
import HomeSettingsPopover from './HomeSettingsPopover.vue'
import type { HomeSearchItem } from './homeViewModel'

const componentExists = (filename: string): boolean =>
  existsSync(fileURLToPath(new URL(filename, import.meta.url)))

const searchItems: HomeSearchItem[] = [
  {
    kind: 'category',
    id: 'home-category-0',
    label: '入门指南',
    context: 'BEGINNERS',
    description: 'BEGINNERS',
  },
  {
    kind: 'website',
    id: 'home-website-0-0-0',
    label: 'Codeforces',
    context: '入门指南 · 未分组',
    description: 'Programming contests',
    url: 'https://codeforces.com/',
    avatarUrl: '/codeforces.svg',
  },
  {
    kind: 'website',
    id: 'home-website-0-0-1',
    label: 'CodeChef',
    context: '入门指南 · 未分组',
    description: 'Practice platform',
    url: 'https://codechef.com/',
    avatarUrl: '/codechef.svg',
  },
]

const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '系统', value: 'system' },
  { label: '日间', value: 'day' },
  { label: '夜间', value: 'night' },
]

const gallery: HomeGallerySection = {
  eyebrow: 'BEGINNERS',
  title: '入门指南',
  accent: '#007aff',
  cards: [
    {
      avatarUrl: '/oi-wiki.svg',
      websiteUrl: 'https://oi-wiki.org/',
      websiteTitle: 'OI Wiki',
      websiteDescription: '算法知识站点',
    },
  ],
  watches: [
    {
      title: '训练平台',
      description: '在线评测',
      links: [
        {
          avatarUrl: '/codeforces.svg',
          websiteUrl: 'https://codeforces.com/',
          websiteTitle: 'Codeforces',
          websiteDescription: 'Programming contests',
        },
      ],
    },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('home header controls', () => {
  it('provides dedicated search and settings components', () => {
    expect(componentExists('./HomeSearch.vue')).toBe(true)
    expect(componentExists('./HomeSettingsPopover.vue')).toBe(true)
  })

  it('filters search results and exposes combobox semantics', async () => {
    const wrapper = mount(HomeSearch, {
      props: { items: searchItems, open: false, disabled: false },
    })

    const input = wrapper.find('input[role="combobox"]')
    expect(input.exists()).toBe(true)
    await input.setValue('code')

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
    await wrapper.setProps({ open: true })
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Codeforces')
    expect(wrapper.text()).toContain('CodeChef')
  })

  it('uses arrow keys and Enter to select a search result', async () => {
    const wrapper = mount(HomeSearch, {
      props: { items: searchItems, open: true, disabled: false },
    })
    const input = wrapper.find('input[role="combobox"]')
    expect(input.exists()).toBe(true)
    await input.setValue('code')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('select')?.at(-1)?.[0]).toMatchObject({ label: 'CodeChef' })
  })

  it('renders website results as native new-tab links', async () => {
    const wrapper = mount(HomeSearch, {
      props: { items: searchItems, open: true, disabled: false },
    })
    await wrapper.find('input[role="combobox"]').setValue('Codeforces')

    const websiteLink = wrapper.find('a[role="option"]')
    expect(websiteLink.exists()).toBe(true)
    expect(websiteLink.attributes('href')).toBe('https://codeforces.com/')
    expect(websiteLink.attributes('target')).toBe('_blank')
    expect(websiteLink.attributes('rel')).toContain('noreferrer')
  })

  it('emits theme and view mode changes from settings', async () => {
    const wrapper = mount(HomeSettingsPopover, {
      props: { themeMode: 'system', themeOptions, viewMode: 'compact' },
    })

    const nightButton = wrapper.find('[data-theme="night"]')
    const detailButton = wrapper.find('[data-view-mode="detail"]')
    expect(nightButton.exists()).toBe(true)
    expect(detailButton.exists()).toBe(true)
    await nightButton.trigger('click')
    await detailButton.trigger('click')

    expect(wrapper.emitted('set-theme')).toEqual([['night']])
    expect(wrapper.emitted('set-view-mode')).toEqual([['detail']])
  })

  it('keeps the search and settings popovers mutually exclusive', async () => {
    const wrapper = mount(HomeHeader, {
      props: {
        categoryCount: 1,
        totalLinks: 2,
        themeMode: 'system',
        themeOptions,
        viewMode: 'compact',
        searchItems,
        searchDisabled: false,
      },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    const settingsButton = wrapper.find('[aria-label="打开设置"]')
    expect(settingsButton.exists()).toBe(true)
    await settingsButton.trigger('click')
    expect(wrapper.find('[data-testid="settings-popover"]').exists()).toBe(true)

    await wrapper.find('input[role="combobox"]').setValue('code')
    expect(wrapper.find('[data-testid="settings-popover"]').exists()).toBe(false)
  })

  it('adds stable anchors and highlights the selected directory target', () => {
    const wrapper = mount(HomeCategorySection, {
      props: {
        expandedLinkUrl: null,
        gallery,
        galleryIndex: 0,
        highlightedTargetId: 'home-group-0-1',
        linkColumnCount: 4,
        viewMode: 'compact',
      },
    })

    expect(wrapper.find('#home-category-0').exists()).toBe(true)
    const highlightedGroup = wrapper.find('#home-group-0-1')
    expect(highlightedGroup.exists()).toBe(true)
    expect(highlightedGroup.classes()).toContain('is-search-highlighted')
  })

  it('connects search results to page scrolling and website opening', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
    const storage = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    })
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const openWebsite = vi.spyOn(window, 'open').mockImplementation(() => null)
    const pinia = createPinia()
    setActivePinia(pinia)
    useHomeContentStore().galleries = [gallery]

    const wrapper = mount(HomePage, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        stubs: {
          ArtalkComments: true,
          FloatingActionMenu: true,
          FloatingPanel: { template: '<div><slot /></div>' },
          HomeDirectory: { template: '<div id="home-category-0"></div>' },
          HomeFooter: true,
          HomeNewsSection: true,
          HomeTickerBanner: true,
          HomeTooltip: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    const header = wrapper.findComponent(HomeHeader)

    expect(header.props('searchItems')).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'category', id: 'home-category-0' }),
      expect.objectContaining({ kind: 'website', label: 'Codeforces' }),
    ]))

    header.vm.$emit('select-search', searchItems[0])
    await wrapper.vm.$nextTick()
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })

    header.vm.$emit('select-search', searchItems[1])
    expect(openWebsite).toHaveBeenCalledWith('https://codeforces.com/', '_blank', 'noopener,noreferrer')
  })
})
