<script setup lang="ts">
import { Maximize2, X } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface ScheduleRow {
  time: string
  category: string
  venue: string
  organizer: string
}

defineProps<{
  rows: ScheduleRow[]
  credit: string
}>()

const isPreviewOpen = ref(false)

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') isPreviewOpen.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <section class="schedule-announcement" aria-label="2026 赛季赛程">
    <button class="ticker-banner" type="button" aria-label="查看 2026XCPC 赛程安排" @click="isPreviewOpen = true">
      <span class="ticker-label">XCPC</span>
      <span class="ticker-window">
        <span class="ticker-track">
          <span class="ticker-content">
            <span>点击查看 2026XCPC 赛程安排</span>
            <Maximize2 :size="15" :stroke-width="2.2" aria-hidden="true" />
          </span>
        </span>
      </span>
    </button>

    <div
      v-if="isPreviewOpen"
      class="schedule-preview"
      role="dialog"
      aria-modal="true"
      aria-label="赛程表放大预览"
      @click.self="isPreviewOpen = false"
    >
      <button class="schedule-preview-close" type="button" aria-label="关闭赛程表预览" @click="isPreviewOpen = false">
        <X :size="20" :stroke-width="2.25" aria-hidden="true" />
      </button>
      <div class="schedule-preview-content">
        <table>
          <thead>
            <tr>
              <th scope="col">时间</th>
              <th scope="col">分类</th>
              <th scope="col">赛站</th>
              <th scope="col">主办</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="`${row.time}-${row.category}-${row.venue}`">
              <td>{{ row.time }}</td>
              <td>{{ row.category }}</td>
              <td>{{ row.venue }}</td>
              <td>{{ row.organizer }}</td>
            </tr>
          </tbody>
        </table>
        <p class="schedule-credit">{{ credit }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.schedule-announcement {
  min-width: 0;
}

.ticker-banner {
  width: 100%;
  min-height: 40px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  overflow: hidden;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
  touch-action: manipulation;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.ticker-banner:hover,
.ticker-banner:focus-visible {
  background: var(--surface-hover);
}

.ticker-banner:focus-visible,
.schedule-preview-close:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.ticker-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  color: var(--surface);
  background: var(--text);
  font-size: 12px;
  font-weight: 750;
  line-height: 1;
}

.ticker-window {
  min-width: 0;
  overflow: hidden;
}

.ticker-track {
  width: max-content;
  display: inline-flex;
  align-items: center;
  padding-left: 100%;
  animation: ticker-scroll 10s linear infinite;
}

.ticker-banner:hover .ticker-track,
.ticker-banner:focus-visible .ticker-track {
  animation-play-state: paused;
}

.ticker-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.2;
}

.ticker-content svg {
  flex: 0 0 auto;
  color: var(--secondary);
}

@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

.schedule-preview {
  position: fixed;
  z-index: 10010;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.52);
}

.schedule-preview-content {
  width: min(960px, 100%);
  max-height: calc(100dvh - 48px);
  overflow: auto;
  padding: 14px;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
}

table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text);
  font-size: 14px;
  line-height: 1.3;
  text-align: center;
}

th,
td {
  border: 1px solid var(--line);
  padding: 4px 7px;
  overflow-wrap: anywhere;
  vertical-align: middle;
}

th {
  color: var(--surface);
  background: var(--text);
  font-weight: 750;
}

th:nth-child(1),
td:nth-child(1) {
  font-variant-numeric: tabular-nums;
}

tbody tr:nth-child(odd) {
  background: var(--surface-subtle);
}

.schedule-credit {
  margin: 7px 0 0;
  color: var(--secondary);
  font-size: 11px;
  line-height: 1.25;
  text-align: right;
}

.schedule-preview-close {
  position: fixed;
  z-index: 1;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: var(--surface);
  cursor: pointer;
}

.schedule-preview-close:hover {
  background: var(--surface-hover);
}

@media (max-width: 760px) {
  .ticker-banner {
    min-height: 38px;
    gap: 8px;
    padding: 0 10px;
    border-radius: 12px;
  }

  .ticker-content {
    font-size: 12px;
  }

  .schedule-preview {
    padding: 12px;
  }

  .schedule-preview-content {
    max-height: calc(100dvh - 24px);
    padding: 10px;
  }

  .schedule-preview-close {
    top: 10px;
    right: 10px;
  }

  table {
    font-size: 12px;
  }

  th,
  td {
    padding: 3px 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    width: 100%;
    padding-left: 0;
    animation: none;
  }
}
</style>
