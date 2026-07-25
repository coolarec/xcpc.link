<script setup lang="ts">
import { ArrowRight, Settings } from '@lucide/vue'
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
const activePopover = ref<'search' | 'settings' | null>(null)

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

onMounted(() => document.addEventListener('pointerdown', closeOnOutsidePointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutsidePointer))
</script>

<template>
  <header ref="headerRef" class="page-header" @keydown.esc="activePopover = null">
    <router-link class="back-link" to="/dev" aria-label="访问 DEV 版">
      <span>DEV 版</span>
      <ArrowRight :size="17" aria-hidden="true" />
    </router-link>

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

@media (max-width: 760px) {
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

@media (prefers-reduced-motion: reduce) {
  .settings-button {
    transition: none;
  }
}
</style>
