<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ArtalkComments from '../../components/ArtalkComments.vue'
import FloatingActionMenu from '../../components/FloatingActionMenu.vue'
import FloatingPanel from '../../components/FloatingPanel.vue'
import { useHomeContentStore } from '../../stores/homeContent'
import { useLitePreferencesStore } from '../../stores/litePreferences'
import { useThemeStore, type ThemeMode } from '../../stores/theme'
import type { SiteLink } from '../../types/home'
import HomeDirectory from './components/HomeDirectory.vue'
import HomeFooter from './components/HomeFooter.vue'
import HomeHeader from './components/HomeHeader.vue'
import HomeNewsSection from './components/HomeNewsSection.vue'
import HomeTooltip from './components/HomeTooltip.vue'
import { getGalleryLinkCount } from './components/homeViewModel'

interface LiteTooltip {
  visible: boolean
  text: string
  x: number
  y: number
  placement: 'top' | 'bottom'
}

const linkColumnCount = ref(6)
const showComments = ref(false)
const expandedLinkUrl = ref<string | null>(null)
const tooltip = ref<LiteTooltip>({
  visible: false,
  text: '',
  x: 0,
  y: 0,
  placement: 'top',
})
const homeContentStore = useHomeContentStore()
const litePreferencesStore = useLitePreferencesStore()
const themeStore = useThemeStore()
const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '系统', value: 'system' },
  { label: '日间', value: 'day' },
  { label: '夜间', value: 'night' },
]

const totalLinks = computed(() =>
  homeContentStore.galleries.reduce((total, gallery) => total + getGalleryLinkCount(gallery), 0),
)

const hideBrokenIcon = (event: Event) => {
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const isMobileViewport = () => window.innerWidth <= 760

const showTooltip = (link: SiteLink, event: MouseEvent | FocusEvent) => {
  if (litePreferencesStore.viewMode === 'detail' || isMobileViewport()) return

  const target = event.currentTarget as HTMLElement | null
  if (!target) return

  const rect = target.getBoundingClientRect()
  const tooltipWidth = 280
  const gutter = 16
  const centeredX = rect.left + rect.width / 2
  const x = Math.min(window.innerWidth - tooltipWidth / 2 - gutter, Math.max(tooltipWidth / 2 + gutter, centeredX))
  const shouldShowBelow = rect.top < 96

  tooltip.value = {
    visible: true,
    text: link.websiteDescription || link.websiteTitle,
    x,
    y: shouldShowBelow ? rect.bottom + 10 : rect.top - 10,
    placement: shouldShowBelow ? 'bottom' : 'top',
  }
}

const updateLinkColumnCount = () => {
  const width = window.innerWidth
  const isDetailMode = litePreferencesStore.viewMode === 'detail'

  if (width <= 560) {
    linkColumnCount.value = 1
  } else if (width <= 820) {
    linkColumnCount.value = 2
  } else if (width <= 1100) {
    linkColumnCount.value = isDetailMode ? 3 : 4
  } else {
    linkColumnCount.value = isDetailMode ? 4 : 6
  }

  if (!isMobileViewport()) {
    expandedLinkUrl.value = null
  }
}

onMounted(async () => {
  updateLinkColumnCount()
  window.addEventListener('resize', updateLinkColumnCount)
  window.addEventListener('scroll', hideTooltip, { passive: true })

  await homeContentStore.load().catch(() => undefined)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLinkColumnCount)
  window.removeEventListener('scroll', hideTooltip)
})

watch(() => litePreferencesStore.viewMode, updateLinkColumnCount)

watch(
  () => litePreferencesStore.viewMode,
  () => {
    hideTooltip()
    expandedLinkUrl.value = null
  },
)

const handleResourceClick = (link: SiteLink, event: MouseEvent) => {
  if (litePreferencesStore.viewMode === 'detail' || !isMobileViewport()) return

  if (expandedLinkUrl.value !== link.websiteUrl) {
    event.preventDefault()
    expandedLinkUrl.value = link.websiteUrl
  }
}

const handleFloatingAction = (id: string) => {
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (id === 'comments') {
    showComments.value = true
  }
}
</script>

<template>
  <div class="lite-page" :class="{ 'is-night': themeStore.isDarkMode }" :data-mode="litePreferencesStore.viewMode">
    <div class="page-shell">
      <HomeHeader
        :category-count="homeContentStore.galleries.length"
        :theme-mode="themeStore.mode"
        :theme-options="themeOptions"
        :total-links="totalLinks"
        :view-mode="litePreferencesStore.viewMode"
        @set-theme="themeStore.setMode"
        @set-view-mode="litePreferencesStore.setViewMode"
      />

      <main class="directory">
        <HomeDirectory
          :expanded-link-url="expandedLinkUrl"
          :galleries="homeContentStore.galleries"
          :is-loading="homeContentStore.isLoading"
          :link-column-count="linkColumnCount"
          :load-error="homeContentStore.loadError"
          :view-mode="litePreferencesStore.viewMode"
          @icon-error="hideBrokenIcon"
          @resource-click="handleResourceClick"
          @show-tooltip="showTooltip"
          @hide-tooltip="hideTooltip"
        />

        <HomeNewsSection
          v-if="!homeContentStore.isLoading && !homeContentStore.loadError && homeContentStore.newsData"
          :news-data="homeContentStore.newsData"
          @icon-error="hideBrokenIcon"
        />
      </main>

      <HomeFooter />
    </div>

    <HomeTooltip
      v-if="tooltip.visible"
      :placement="tooltip.placement"
      :text="tooltip.text"
      :x="tooltip.x"
      :y="tooltip.y"
    />

    <FloatingPanel
      v-model="showComments"
      title="评论"
      eyebrow="AWESOME XCPC"
      :is-dark="themeStore.isDarkMode"
      panel-class="comments-panel-shell"
    >
      <ArtalkComments :active="showComments" :is-dark="themeStore.isDarkMode" />
    </FloatingPanel>

    <FloatingActionMenu :visible="true" @action="handleFloatingAction" />
  </div>
</template>

<style scoped>
.lite-page {
  --page: #f5f5f7;
  --surface: #ffffff;
  --surface-subtle: #fafafa;
  --surface-hover: #f2f2f4;
  --text: #1d1d1f;
  --muted: #6e6e73;
  --secondary: #86868b;
  --line: rgba(0, 0, 0, 0.09);
  --focus: #0071e3;
  --tooltip-bg: rgba(255, 255, 255, 0.98);
  --tooltip-border: rgba(0, 0, 0, 0.12);
  --tooltip-shadow: rgba(0, 0, 0, 0.14);
  --news-black-color: #111111;

  min-height: 64px;
  background: var(--page);
  color: var(--text);
  color-scheme: light;
  transition:
    background-color 0.22s ease,
    color 0.22s ease;
}

.lite-page.is-night {
  --page: #000000;
  --surface: #111113;
  --surface-subtle: #171719;
  --surface-hover: #1f1f21;
  --text: #f5f5f7;
  --muted: #a1a1a6;
  --secondary: #7e7e83;
  --line: rgba(255, 255, 255, 0.13);
  --focus: #2997ff;
  --tooltip-bg: rgba(31, 31, 33, 0.98);
  --tooltip-border: rgba(255, 255, 255, 0.16);
  --tooltip-shadow: rgba(0, 0, 0, 0.44);
  --news-black-color: #f5f5f7;

  color-scheme: dark;
}

.page-shell {
  width: min(100% - 32px, 1240px);
  margin: 0 auto;
  padding: 22px 0 48px;
}

.directory {
  display: grid;
  gap: 10px;
}

@media (max-width: 760px) {
  .page-shell {
    width: min(100% - 20px, 1240px);
    padding-top: 18px;
  }
}
</style>
