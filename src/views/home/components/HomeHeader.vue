<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import type { ThemeMode } from '../../../stores/theme'

interface ThemeOption {
  label: string
  value: ThemeMode
}

defineProps<{
  categoryCount: number
  totalLinks: number
  themeMode: ThemeMode
  themeOptions: ThemeOption[]
  viewMode: 'compact' | 'detail'
}>()

const emit = defineEmits<{
  'set-theme': [mode: ThemeMode]
  'set-view-mode': [mode: 'compact' | 'detail']
}>()
</script>

<template>
  <header class="page-header">
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

      <div class="header-actions">
        <div class="theme-segment" role="radiogroup" aria-label="主题模式">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="theme-option"
            :class="{ 'is-active': themeMode === option.value }"
            role="radio"
            :aria-checked="themeMode === option.value"
            @click="emit('set-theme', option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="view-switch" role="group" aria-label="显示模式">
          <button
            type="button"
            class="view-button"
            :class="{ 'is-active': viewMode === 'compact' }"
            :aria-pressed="viewMode === 'compact'"
            @click="emit('set-view-mode', 'compact')"
          >
            简洁
          </button>
          <button
            type="button"
            class="view-button"
            :class="{ 'is-active': viewMode === 'detail' }"
            :aria-pressed="viewMode === 'detail'"
            @click="emit('set-view-mode', 'detail')"
          >
            详细
          </button>
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

.header-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
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

.view-switch {
  min-height: 42px;
  box-sizing: border-box;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.theme-segment {
  min-height: 42px;
  box-sizing: border-box;
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.theme-option {
  box-sizing: border-box;
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
  box-sizing: border-box;
  min-width: 64px;
  min-height: 36px;
  padding: 0 10px;
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

  .view-switch,
  .theme-segment {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .theme-segment,
  .view-switch {
    min-width: 0;
  }

  .theme-option,
  .view-button {
    min-width: 0;
    padding-inline: 6px;
  }
}
</style>
