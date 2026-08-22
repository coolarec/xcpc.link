// @vitest-environment jsdom

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHomeContentStore } from '../../../stores/homeContent'
import type { ThemeMode } from '../../../stores/theme'
import type { HomeGallerySection } from '../../../types/home'
import HomePage from '../HomePage.vue'
import { seasonScheduleRows } from '../../../modules/home/seasonSchedule'
import HomeCategorySection from './HomeCategorySection.vue'
import HomeFooter from './HomeFooter.vue'
import HomeHeader from './HomeHeader.vue'
import HomeScheduleAnnouncement from './HomeScheduleAnnouncement.vue'
import HomeSearch from './HomeSearch.vue'
import HomeTickerBanner from './HomeTickerBanner.vue'
import HomeSettingsPopover from './HomeSettingsPopover.vue'
import type { HomeSearchItem } from './homeViewModel'

const componentExists = (filename: string): boolean =>
  existsSync(fileURLToPath(new URL(filename, import.meta.url)))

const componentSource = (filename: string): string =>
  readFileSync(fileURLToPath(new URL(filename, import.meta.url)), 'utf8')

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
  it('constrains the desktop title row to the page width', () => {
    const source = componentSource('./HomeHeader.vue')
    const titleRowRule = source.match(/\.title-row\s*\{([^}]*)\}/)?.[1]

    expect(titleRowRule).toContain('width: 100%')
    expect(titleRowRule).toContain('min-width: 0')
  })

  it('provides a dedicated compact schedule announcement component', () => {
    expect(componentExists('./HomeScheduleAnnouncement.vue')).toBe(true)
  })

  it('links the footer contact copy to the QQ group', () => {
    const wrapper = mount(HomeFooter)
    const contactLink = wrapper.get('.qq-group a')

    expect(wrapper.find('.qq-group').text()).toBe('如果你有意见或新想法，欢迎联系我们')
    expect(contactLink.text()).toBe('联系我们')
    expect(contactLink.attributes('href')).toBe('https://qm.qq.com/q/2CsO3c3ZlS')
    expect(contactLink.attributes('target')).toBe('_blank')
    expect(contactLink.attributes('rel')).toContain('noreferrer')
  })

  it('keeps the season schedule in a dedicated content module', () => {
    expect(componentExists('../../../modules/home/seasonSchedule.ts')).toBe(true)
  })

  it('keeps only ICPC and CCPC events in the schedule preview', () => {
    expect(seasonScheduleRows.every((row) => row.category === 'ICPC' || row.category === 'CCPC')).toBe(true)
  })

  it('labels the three September online qualifiers as 网络赛', () => {
    expect(seasonScheduleRows.slice(0, 3).map((row) => row.venue)).toEqual([
      '网络赛',
      '网络赛',
      '网络赛',
    ])
  })

  it('records 成都信息工程大学 as the organizer of the CCPC women contest', () => {
    expect(seasonScheduleRows.find((row) => row.venue === '女赛（成都）')?.organizer).toBe('成都信息工程大学')
  })

  it('provides dedicated search and settings components', () => {
    expect(componentExists('./HomeSearch.vue')).toBe(true)
    expect(componentExists('./HomeSettingsPopover.vue')).toBe(true)
  })

  it('renders a schedule announcement instead of an inline table', () => {
    const wrapper = mount(HomeScheduleAnnouncement, {
      props: {
        rows: [
          { startDate: '2026-09-06', category: 'ICPC', venue: '网络赛', organizer: '线上' },
          { startDate: '2026-10-10', endDate: '2026-10-11', category: 'ICPC', venue: '西安', organizer: '西北工业大学' },
        ],
        credit: 'Schedule compiled by thedyingkai_ (TDK)',
      },
    })

    expect(wrapper.find('.ticker-label').text()).toBe('XCPC')
    expect(wrapper.find('.ticker-track').exists()).toBe(true)
    expect(wrapper.text()).toContain('点击查看 2026XCPC 赛程安排')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('opens the schedule as a monthly calendar and switches months', async () => {
    const wrapper = mount(HomeScheduleAnnouncement, {
      attachTo: document.body,
      props: {
        rows: [
          { startDate: '2026-09-06', category: 'ICPC', venue: '网络赛', organizer: '线上' },
          { startDate: '2026-10-10', endDate: '2026-10-11', category: 'ICPC', venue: '西安', organizer: '西北工业大学' },
          { startDate: '2027-01-09', endDate: '2027-01-10', category: 'ICPC', venue: '香港', organizer: '香港大学' },
          { startDate: '2027-01-26', endDate: '2027-01-28', category: 'ICPC', venue: 'ECF（杭州）', organizer: '杭州师范大学（浙江大学）' },
        ],
        credit: 'Schedule compiled by thedyingkai_ (TDK)',
      },
    })

    await wrapper.get('button[aria-label="查看 2026XCPC 赛程安排"]').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.find('.schedule-preview-content').attributes('data-density')).toBe('compact')
    expect(wrapper.find('[role="grid"][aria-label="2026年9月赛程"]').exists()).toBe(true)
    expect(wrapper.findAll('.calendar-week')).toHaveLength(6)
    expect(wrapper.find('.schedule-preview-content > .schedule-preview-close').exists()).toBe(true)
    expect(wrapper.text()).toContain('网络赛')
    expect(wrapper.find('.calendar-event-venue').text()).toBe('网络赛')
    expect(wrapper.find('.calendar-event-organizer').text()).toBe('线上')
    expect(wrapper.find('.calendar-agenda').exists()).toBe(false)
    expect(wrapper.find('table').exists()).toBe(false)

    await wrapper.get('button[aria-label="查看下个月"]').trigger('click')

    expect(wrapper.find('[role="grid"][aria-label="2026年10月赛程"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('西安')
    expect(wrapper.findAll('.calendar-event')).toHaveLength(1)
    expect(wrapper.get('.calendar-event').attributes('style')).toContain('grid-column: 6 / span 2')
    expect(wrapper.get('.calendar-event').text()).toContain('西北工业大学')
    expect(wrapper.get('.calendar-event').attributes('data-mobile-layout')).toBe('wide-wrap')
    expect(wrapper.findAll('.calendar-week')[2].attributes('style')).toContain(
      'grid-template-rows: 20px repeat(1, minmax(28px, auto))',
    )
    expect(wrapper.findAll('.calendar-week')[2].attributes('style')).toContain('min-height: 48px')
    expect(wrapper.get('.calendar-grid').attributes('data-column-density')).toBe('adaptive')
    expect(wrapper.get('.calendar-grid').attributes('data-horizontal-gutter')).toBe('roomy')
    expect(wrapper.get('.calendar-event').attributes('data-content-flow')).toBe('inline-first')
    expect(wrapper.get('.calendar-weekdays').attributes('style')).toContain(
      'minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 1.15fr) minmax(0, 1.15fr)',
    )

    await wrapper.get('button[aria-label="查看下个月"]').trigger('click')
    await wrapper.get('button[aria-label="查看下个月"]').trigger('click')
    await wrapper.get('button[aria-label="查看下个月"]').trigger('click')

    expect(wrapper.find('[role="grid"][aria-label="2027年1月赛程"]').exists()).toBe(true)
    expect(wrapper.get('.calendar-weekdays').attributes('style')).toContain(
      'minmax(0, 0.9fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.9fr) minmax(0, 1.15fr) minmax(0, 1.15fr)',
    )
    expect(wrapper.findAll('.calendar-event-organizer').at(-1)?.text()).toBe('杭州师范大学（浙江大学）')
  })

  it('closes the enlarged schedule preview with Escape', async () => {
    const wrapper = mount(HomeScheduleAnnouncement, {
      attachTo: document.body,
      props: {
        rows: [{ startDate: '2026-09-06', category: 'ICPC', venue: '网络赛', organizer: '线上' }],
        credit: 'Schedule compiled by thedyingkai_ (TDK)',
      },
    })

    await wrapper.get('button[aria-label="查看 2026XCPC 赛程安排"]').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
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

  it('scrolls the active result into view during keyboard navigation', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const wrapper = mount(HomeSearch, {
      props: { items: searchItems, open: true, disabled: false },
    })
    const input = wrapper.find('input[role="combobox"]')
    await input.setValue('code')

    await input.trigger('keydown', { key: 'ArrowDown' })

    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(wrapper.find('[role="option"][aria-selected="true"]').text()).toContain('CodeChef')
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

  it('focuses the search box when slash is pressed outside editable fields', async () => {
    const wrapper = mount(HomeHeader, {
      attachTo: document.body,
      props: {
        categoryCount: 1,
        totalLinks: 2,
        themeMode: 'system',
        themeOptions,
        viewMode: 'compact',
        searchItems,
        searchDisabled: false,
      },
    })
    const searchInput = wrapper.find('input[role="combobox"]').element as HTMLInputElement
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true })

    document.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(searchInput)
    expect(event.defaultPrevented).toBe(true)
  })

  it('offers GitHub star and website submission links instead of the DEV page', () => {
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
    })

    expect(wrapper.text()).toContain('想给开发者点个 star 或者添加自己的网站？')
    expect(wrapper.find('a[href="https://github.com/coolarec/xcpc.link"]').attributes('target')).toBe('_blank')
    expect(wrapper.find('a[href="https://github.com/coolarec/xcpc.link/issues/new?template=add-site.yml"]').attributes('target')).toBe('_blank')
    expect(wrapper.find('a[href="/dev"]').exists()).toBe(false)
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
          HomeScheduleAnnouncement: { template: '<div data-testid="schedule-announcement" />' },
          HomeTickerBanner: true,
          HomeTooltip: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    const header = wrapper.findComponent(HomeHeader)

    expect(wrapper.find('[data-testid="schedule-announcement"]').exists()).toBe(true)

    const tickerBanners = wrapper.findAllComponents(HomeTickerBanner)
    expect(tickerBanners).toHaveLength(2)
    expect(tickerBanners.map((banner) => banner.props('item'))).toEqual([
      {
        label: '赛站博弈',
        text: '从夯到拉锐评2025赛季ICPC/CCPC各赛站队伍强度 - 俊杰Charles',
        href: 'https://www.bilibili.com/video/BV1fkPuzJE6t',
      },
      {
        label: '赛站博弈',
        text: '从夯到拉锐评2025赛季ICPC/CCPC各赛站体验 - 俊杰Charles',
        href: 'https://www.bilibili.com/video/BV12XfiBfEhG',
      },
    ])

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
