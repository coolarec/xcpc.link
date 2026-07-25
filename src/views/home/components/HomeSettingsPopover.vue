<script setup lang="ts">
import type { LiteViewMode } from '../../../stores/litePreferences'
import type { ThemeMode } from '../../../stores/theme'

interface ThemeOption {
  label: string
  value: ThemeMode
}

defineProps<{
  themeMode: ThemeMode
  themeOptions: ThemeOption[]
  viewMode: LiteViewMode
}>()

const emit = defineEmits<{
  'set-theme': [mode: ThemeMode]
  'set-view-mode': [mode: LiteViewMode]
}>()
</script>

<template>
  <div class="home-settings-popover" data-testid="settings-popover">
    <section class="setting-group">
      <p id="theme-setting-label">主题</p>
      <div class="setting-segment theme-segment" role="radiogroup" aria-labelledby="theme-setting-label">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          :data-theme="option.value"
          role="radio"
          :aria-checked="themeMode === option.value"
          :class="{ 'is-active': themeMode === option.value }"
          @click="emit('set-theme', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="setting-group">
      <p id="view-setting-label">显示</p>
      <div class="setting-segment" role="radiogroup" aria-labelledby="view-setting-label">
        <button
          type="button"
          data-view-mode="compact"
          role="radio"
          :aria-checked="viewMode === 'compact'"
          :class="{ 'is-active': viewMode === 'compact' }"
          @click="emit('set-view-mode', 'compact')"
        >
          简洁
        </button>
        <button
          type="button"
          data-view-mode="detail"
          role="radio"
          :aria-checked="viewMode === 'detail'"
          :class="{ 'is-active': viewMode === 'detail' }"
          @click="emit('set-view-mode', 'detail')"
        >
          详细
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-settings-popover {
  position: absolute;
  z-index: 90;
  top: calc(100% + 8px);
  right: 0;
  width: 292px;
  display: grid;
  gap: 18px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  color: var(--text);
  background: var(--surface);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.14);
}

.setting-group {
  display: grid;
  gap: 8px;
}

.setting-group p {
  margin: 0 2px;
  color: var(--secondary);
  font-size: 12px;
  font-weight: 750;
}

.setting-segment {
  min-height: 42px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-subtle);
}

.setting-segment.theme-segment {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.setting-segment button {
  min-width: 0;
  min-height: 36px;
  padding: 0 8px;
  border-radius: 9px;
  color: var(--muted);
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.setting-segment button:hover,
.setting-segment button:focus-visible {
  color: var(--text);
}

.setting-segment button.is-active {
  color: var(--text);
  background: var(--surface);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.08);
}

@media (max-width: 420px) {
  .home-settings-popover {
    width: min(292px, calc(100vw - 20px));
  }
}
</style>
