<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, ExternalLink } from '@lucide/vue'
import { useHomeContentStore } from '../../stores/homeContent'
import { useLitePreferencesStore } from '../../stores/litePreferences'
import { useThemeStore, type ThemeMode } from '../../stores/theme'
import type { HomeGallerySection, SiteLink, WatchLinksBlock } from '../../types/home'

interface LinkGroup {
  id: string
  title: string
  links: SiteLink[]
}

const linkColumnCount = ref(6)
const homeContentStore = useHomeContentStore()
const litePreferencesStore = useLitePreferencesStore()
const themeStore = useThemeStore()
const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '日间', value: 'day' },
  { label: '夜间', value: 'night' },
  { label: '系统', value: 'system' },
]

const getGalleryWatches = (gallery: HomeGallerySection): WatchLinksBlock[] => {
  if (gallery.watches?.length) return gallery.watches
  return gallery.watch ? [gallery.watch] : []
}

const getGroups = (gallery: HomeGallerySection): LinkGroup[] => [
  {
    id: `${gallery.title}-featured`,
    title: '精选资源',
    links: gallery.cards,
  },
  ...getGalleryWatches(gallery).map((watch, index) => ({
    id: `${gallery.title}-${watch.title}-${index}`,
    title: watch.title || '相关推荐',
    links: watch.links,
  })),
]

const getGalleryLinkCount = (gallery: HomeGallerySection): number =>
  getGroups(gallery).reduce((total, group) => total + group.links.length, 0)

const totalLinks = computed(() =>
  homeContentStore.galleries.reduce((total, gallery) => total + getGalleryLinkCount(gallery), 0),
)

const getPlaceholderCount = (linkCount: number): number => {
  const rest = linkCount % linkColumnCount.value
  return rest === 0 ? 0 : linkColumnCount.value - rest
}

const hideBrokenIcon = (event: Event) => {
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
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
}

onMounted(async () => {
  updateLinkColumnCount()
  window.addEventListener('resize', updateLinkColumnCount)

  await homeContentStore.load().catch(() => undefined)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLinkColumnCount)
})

watch(() => litePreferencesStore.viewMode, updateLinkColumnCount)
</script>

<template>
  <div class="lite-page" :class="{ 'is-night': themeStore.isDarkMode }" :data-mode="litePreferencesStore.viewMode">
    <div class="page-shell">
      <header class="page-header">
        <router-link class="back-link" to="/" aria-label="返回主站">
          <ArrowLeft :size="17" aria-hidden="true" />
          <span>主站</span>
        </router-link>

        <div class="title-row">
          <div>
            <p class="kicker">Lite</p>
            <div class="brand-title">
              <img class="brand-mark" src="/favicon.svg" alt="" width="52" height="52" aria-hidden="true" />
              <h1>AWESOME XCPC</h1>
            </div>
          </div>

          <div class="header-actions">
            <div class="theme-segment" role="radiogroup" aria-label="主题模式">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                type="button"
                class="theme-option"
                :class="{ 'is-active': themeStore.mode === option.value }"
                role="radio"
                :aria-checked="themeStore.mode === option.value"
                @click="themeStore.setMode(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <div class="view-switch" role="group" aria-label="显示模式">
              <button
                type="button"
                class="view-button"
                :class="{ 'is-active': litePreferencesStore.viewMode === 'compact' }"
                :aria-pressed="litePreferencesStore.viewMode === 'compact'"
                @click="litePreferencesStore.setViewMode('compact')"
              >
                简洁
              </button>
              <button
                type="button"
                class="view-button"
                :class="{ 'is-active': litePreferencesStore.viewMode === 'detail' }"
                :aria-pressed="litePreferencesStore.viewMode === 'detail'"
                @click="litePreferencesStore.setViewMode('detail')"
              >
                详细
              </button>
            </div>
          </div>
        </div>

        <p class="meta-line">{{ homeContentStore.galleries.length }} 分类 · {{ totalLinks }} 链接</p>
      </header>

      <main class="directory">
        <section v-if="homeContentStore.isLoading" class="state-panel" role="status" aria-live="polite">
          <span class="spinner" aria-hidden="true"></span>
          <span>Loading</span>
        </section>

        <section v-else-if="homeContentStore.loadError" class="state-panel" role="alert">
          <span>{{ homeContentStore.loadError }}</span>
        </section>

        <section v-for="gallery in homeContentStore.galleries" v-else :key="gallery.title" class="category-section">
          <header class="category-header">
            <div>
              <p>{{ gallery.eyebrow }}</p>
              <h2>{{ gallery.title }}</h2>
            </div>
            <span>{{ getGalleryLinkCount(gallery) }}</span>
          </header>

          <div class="group-list">
            <section v-for="group in getGroups(gallery)" :key="group.id" class="link-group">
              <header class="group-header">
                <h3>{{ group.title }}</h3>
                <span>{{ group.links.length }}</span>
              </header>

              <div class="links">
                <a
                  v-for="link in group.links"
                  :key="link.websiteUrl"
                  class="resource-link"
                  :href="link.websiteUrl"
                  target="_blank"
                  rel="noreferrer"
                  :data-tooltip="`${link.websiteTitle}\n${link.websiteDescription}`"
                  :aria-label="`打开 ${link.websiteTitle}`"
                >
                  <span class="favicon" aria-hidden="true">
                    <span>{{ link.websiteTitle.charAt(0) }}</span>
                    <img
                      v-if="link.avatarUrl"
                      :src="link.avatarUrl"
                      :alt="link.websiteTitle"
                      width="28"
                      height="28"
                      loading="lazy"
                      @error="hideBrokenIcon"
                    />
                  </span>

                  <span class="resource-copy">
                    <span class="resource-title">{{ link.websiteTitle }}</span>
                    <span v-if="litePreferencesStore.viewMode === 'detail'" class="resource-description">
                      {{ link.websiteDescription }}
                    </span>
                  </span>

                  <ExternalLink class="resource-action" :size="15" aria-hidden="true" />
                </a>
                <span
                  v-for="index in getPlaceholderCount(group.links.length)"
                  :key="`${group.id}-placeholder-${index}`"
                  class="resource-link resource-placeholder"
                  aria-hidden="true"
                ></span>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
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

  color-scheme: dark;
}

.page-shell {
  width: min(100% - 32px, 1240px);
  margin: 0 auto;
  padding: 22px 0 48px;
}

.page-header {
  display: grid;
  gap: 12px;
  padding: 2px 0 18px;
}

.back-link {
  width: fit-content;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
}

.back-link:hover,
.back-link:focus-visible {
  color: var(--text);
}

.title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kicker,
.meta-line,
.category-header p,
.group-header span {
  margin: 0;
  color: var(--secondary);
  font-size: 13px;
  font-weight: 650;
}

.brand-title {
  --brand-title-size: clamp(38px, 6vw, 58px);

  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 3px;
}

.brand-title h1 {
  margin: 0;
  font-family: "Sora", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: var(--brand-title-size);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
}

.brand-mark {
  width: calc(var(--brand-title-size) * 0.92);
  height: calc(var(--brand-title-size) * 0.92);
  flex: 0 0 auto;
  display: block;
  transform: translateY(-3px);
}

.view-switch {
  min-height: 42px;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.theme-segment {
  min-height: 42px;
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.theme-option {
  min-width: 58px;
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  color: var(--muted);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.theme-option:hover,
.theme-option:focus-visible {
  color: var(--text);
}

.theme-option.is-active {
  color: var(--text);
  background: var(--surface-hover);
}

.view-button {
  min-width: 82px;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  color: var(--muted);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.view-button.is-active {
  color: var(--text);
  background: var(--surface-hover);
}

.directory {
  display: grid;
  gap: 10px;
}

.category-section,
.state-panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}

.category-section {
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.category-header h2 {
  margin: 4px 0 0;
  font-family: "Sora", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: 0;
}

.category-header > span {
  color: var(--secondary);
  font-family: "Sora", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.group-list {
  display: grid;
}

.link-group {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  border-top: 1px solid var(--line);
}

.link-group:first-child {
  border-top: 0;
}

.group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px 14px 18px;
  border-right: 1px solid var(--line);
  background: var(--surface-subtle);
}

.group-header h3 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 750;
  line-height: 1.3;
}

.links {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  background: var(--surface);
}

.resource-link {
  position: relative;
  min-height: 42px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  margin: -1px 0 0 -1px;
  color: var(--text);
  text-decoration: none;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.resource-link::before,
.resource-link::after {
  position: absolute;
  left: 50%;
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.resource-link::before {
  bottom: calc(100% + 9px);
  width: max-content;
  max-width: min(280px, calc(100vw - 40px));
  padding: 8px 10px;
  border: 1px solid var(--tooltip-border);
  border-radius: 10px;
  background: var(--tooltip-bg);
  box-shadow: 0 10px 30px var(--tooltip-shadow);
  color: var(--text);
  content: attr(data-tooltip);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.45;
  text-align: left;
  white-space: pre-line;
}

.resource-link::after {
  bottom: calc(100% + 4px);
  width: 10px;
  height: 10px;
  border-right: 1px solid var(--tooltip-border);
  border-bottom: 1px solid var(--tooltip-border);
  background: var(--tooltip-bg);
  content: "";
  transform: translate(-50%, 4px) rotate(45deg);
}

.resource-link:hover,
.resource-link:focus-visible {
  z-index: 2;
  background: var(--surface-hover);
}

.resource-link:hover::before,
.resource-link:hover::after,
.resource-link:focus-visible::before,
.resource-link:focus-visible::after {
  opacity: 1;
  transform: translate(-50%, 0);
}

.resource-link:hover::after,
.resource-link:focus-visible::after {
  transform: translate(-50%, 0) rotate(45deg);
}

.resource-placeholder {
  pointer-events: none;
}

.favicon {
  position: relative;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.favicon img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.resource-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.resource-title {
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.resource-action {
  color: var(--secondary);
  opacity: 0;
  transition: opacity 0.16s ease;
}

.resource-link:hover .resource-action,
.resource-link:focus-visible .resource-action {
  opacity: 1;
}

.lite-page[data-mode='detail'] .resource-link {
  min-height: 74px;
  align-items: center;
  grid-template-columns: 26px minmax(0, 1fr) 16px;
  padding: 10px;
}

.lite-page[data-mode='detail'] .links {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.lite-page[data-mode='detail'] .favicon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
}

.lite-page[data-mode='detail'] .resource-title {
  font-size: 13px;
  white-space: nowrap;
}

.state-panel {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: var(--muted);
  font-weight: 700;
}

.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #d2d2d7;
  border-top-color: var(--focus);
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .resource-link,
  .resource-action,
  .resource-link::before,
  .resource-link::after,
  .spinner {
    animation: none;
    transition: none;
  }
}

@media (max-width: 1100px) {
  .links {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .lite-page[data-mode='detail'] .links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .link-group {
    grid-template-columns: 118px minmax(0, 1fr);
  }

  .links,
  .lite-page[data-mode='detail'] .links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-shell {
    width: min(100% - 20px, 1240px);
    padding-top: 18px;
  }

  .title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .view-switch {
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }

  .theme-segment {
    flex: 0 0 auto;
  }

  .view-switch {
    flex: 1 1 auto;
  }

  .category-header {
    align-items: flex-start;
    padding: 20px;
  }

  .link-group {
    grid-template-columns: 1fr;
  }

  .group-header {
    padding: 14px 16px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .resource-action {
    opacity: 1;
  }

  .resource-placeholder {
    display: none;
  }

  .resource-link {
    margin-left: 0;
  }

  .resource-link::before,
  .resource-link::after {
    display: none;
  }
}

@media (max-width: 560px) {
  .links,
  .lite-page[data-mode='detail'] .links {
    grid-template-columns: 1fr;
  }
}
</style>
