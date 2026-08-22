<script setup lang="ts">
import { Settings } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { LiteViewMode } from '../../../stores/litePreferences'
import type { ThemeMode } from '../../../stores/theme'
import HomeSearch from './HomeSearch.vue'
import HomeSettingsPopover from './HomeSettingsPopover.vue'
import type { HomeSearchItem } from './homeViewModel'

interface ThemeOption {
  label: string
  value: ThemeMode
}

const props = defineProps<{
  categoryCount: number
  totalLinks: number
  themeMode: ThemeMode
  themeOptions: ThemeOption[]
  viewMode: LiteViewMode
  searchItems: HomeSearchItem[]
  searchDisabled: boolean
}>()

const emit = defineEmits<{
  'set-theme': [mode: ThemeMode]
  'set-view-mode': [mode: LiteViewMode]
  'select-search': [item: HomeSearchItem]
}>()

const headerRef = ref<HTMLElement | null>(null)
const searchRef = ref<{ focus: () => void } | null>(null)
const activePopover = ref<'search' | 'settings' | null>(null)
const showSearchShortcutToast = ref(false)
let searchShortcutToastTimer: number | undefined

const setSearchOpen = (open: boolean) => {
  activePopover.value = open ? 'search' : null
}

const toggleSettings = () => {
  activePopover.value = activePopover.value === 'settings' ? null : 'settings'
}

const selectSearchItem = (item: HomeSearchItem) => {
  activePopover.value = null
  emit('select-search', item)
}

const closeOnOutsidePointer = (event: PointerEvent) => {
  if (!headerRef.value?.contains(event.target as Node)) {
    activePopover.value = null
  }
}

const focusSearchOnSlash = (event: KeyboardEvent) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return

  const target = event.target
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return
  }

  event.preventDefault()
  showSearchShortcutToast.value = false
  searchRef.value?.focus()
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutsidePointer)
  document.addEventListener('keydown', focusSearchOnSlash)

  if (window.matchMedia?.('(min-width: 761px) and (pointer: fine)').matches) {
    showSearchShortcutToast.value = true
    searchShortcutToastTimer = window.setTimeout(() => {
      showSearchShortcutToast.value = false
    }, 2000)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnOutsidePointer)
  document.removeEventListener('keydown', focusSearchOnSlash)
  if (searchShortcutToastTimer !== undefined) {
    window.clearTimeout(searchShortcutToastTimer)
  }
})
</script>

<template>
  <header ref="headerRef" class="page-header" @keydown.esc="activePopover = null">
    <Transition name="search-shortcut-toast">
      <p v-if="showSearchShortcutToast" class="search-shortcut-toast" role="status">
        尝试按下 <kbd>/</kbd> 可实现快速搜索
      </p>
    </Transition>

    <p class="community-prompt">
      想给开发者<a
        href="https://github.com/coolarec/xcpc.link"
        target="_blank"
        rel="noopener noreferrer"
      >点个 star</a> 或者<a
        href="https://github.com/coolarec/xcpc.link/issues/new?template=add-site.yml"
        target="_blank"
        rel="noopener noreferrer"
      >添加自己的网站</a>？
    </p>

    <div class="title-row">
      <div>
        <div class="brand-title">
          <img class="brand-mark" src="/favicon.svg" alt="" width="52" height="52" aria-hidden="true" />
          <h1>
            <span>AWESOME</span>
            <span class="ccpc-word" aria-label="XCPC">
              <i>X</i><i>C</i><i>P</i><i>C</i>
            </span>
          </h1>
        </div>
      </div>

      <div class="header-tools">
        <HomeSearch
          ref="searchRef"
          :items="props.searchItems"
          :open="activePopover === 'search'"
          :disabled="props.searchDisabled"
          @update:open="setSearchOpen"
          @select="selectSearchItem"
        />

        <div class="settings-anchor">
          <button
            type="button"
            class="settings-button"
            aria-label="打开设置"
            aria-haspopup="dialog"
            :aria-expanded="activePopover === 'settings'"
            @click="toggleSettings"
          >
            <Settings :size="20" :stroke-width="2.2" aria-hidden="true" />
          </button>

          <HomeSettingsPopover
            v-if="activePopover === 'settings'"
            :theme-mode="themeMode"
            :theme-options="themeOptions"
            :view-mode="viewMode"
            @set-theme="emit('set-theme', $event)"
            @set-view-mode="emit('set-view-mode', $event)"
          />
        </div>
      </div>
    </div>

    <p class="meta-line">{{ categoryCount }} 分类 · {{ totalLinks }} 链接</p>
  </header>
</template>

<style scoped>
.page-header {
  display: grid;
  gap: 12px;
  padding: 2px 0 18px;
}

.search-shortcut-toast {
  position: fixed;
  z-index: 120;
  top: max(16px, env(safe-area-inset-top));
  left: 50%;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14);
  font-size: 13px;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  backdrop-filter: blur(16px);
}

.search-shortcut-toast kbd {
  min-width: 22px;
  padding: 4px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-subtle);
  font: inherit;
  text-align: center;
}

.search-shortcut-toast-enter-active,
.search-shortcut-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.search-shortcut-toast-enter-from,
.search-shortcut-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.community-prompt {
  width: fit-content;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.32em;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  font-weight: 650;
}

.community-prompt a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-underline-offset: 3px;
  transition: color 0.18s ease;
}

.community-prompt a:hover,
.community-prompt a:focus-visible {
  color: var(--text);
}

.title-row {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.header-tools {
  width: min(48vw, 560px);
  min-width: 360px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-line {
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
  display: flex;
  align-items: baseline;
  gap: 0.18em;
  font-family: "Sora", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: var(--brand-title-size);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
}

.ccpc-word {
  display: inline-flex;
  align-items: baseline;
  gap: 0.02em;
}

.ccpc-word i {
  font-style: normal;
}

.ccpc-word i:nth-child(1) {
  color: #007aff;
}

.ccpc-word i:nth-child(2) {
  color: #ffcc00;
}

.ccpc-word i:nth-child(3) {
  color: #ff3b30;
}

.ccpc-word i:nth-child(4) {
  color: #34c759;
}

.brand-mark {
  width: calc(var(--brand-title-size) * 0.92);
  height: calc(var(--brand-title-size) * 0.92);
  flex: 0 0 auto;
  display: block;
  transform: translateY(-3px);
}

.settings-anchor {
  position: relative;
  flex: 0 0 auto;
}

.settings-button {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--muted);
  background: var(--surface);
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.settings-button:hover,
.settings-button:focus-visible,
.settings-button[aria-expanded='true'] {
  color: var(--text);
  background: var(--surface-hover);
  border-color: color-mix(in srgb, var(--text) 18%, transparent);
}

@media (max-width: 1100px) {
  .title-row {
    width: 100%;
    min-width: 0;
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .title-row > div:first-child {
    width: 100%;
    min-width: 0;
  }

  .brand-title {
    --brand-title-size: clamp(31px, 10vw, 42px);

    width: 100%;
    min-width: 0;
    align-items: flex-start;
    gap: 10px;
  }

  .brand-title h1 {
    min-width: 0;
    flex: 1 1 auto;
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .brand-title h1 > span:first-child {
    flex: 0 1 100%;
  }

  .ccpc-word {
    flex: 0 1 auto;
  }

  .header-tools {
    width: 100%;
    min-width: 0;
    display: flex;
    gap: 8px;
  }
}

@media (max-width: 760px), (pointer: coarse) {
  .search-shortcut-toast {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .community-prompt a,
  .settings-button {
    transition: none;
  }

  .search-shortcut-toast-enter-active,
  .search-shortcut-toast-leave-active {
    transition: none;
  }
}
</style>
