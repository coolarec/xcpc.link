<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import type { TickerBanner } from '../../../types/home'

// A single scrolling announcement banner.
// Parent views render multiple banners by passing one item per component instance.
defineProps<{
  item: TickerBanner
}>()
</script>

<template>
  <div class="ticker-banner">
    <span class="ticker-label">{{ item.label || '实时' }}</span>
    <span class="ticker-window">
      <!-- One copy only: it enters from the right, exits left, then restarts off-screen. -->
      <span class="ticker-track">
        <a
          class="ticker-link"
          :href="item.href"
          target="_blank"
          rel="noreferrer"
          :aria-label="`打开通知详情：${item.text}`"
        >
          <span>{{ item.text }}</span>
          <ExternalLink :size="15" :stroke-width="2.2" aria-hidden="true" />
        </a>
      </span>
    </span>
  </div>
</template>

<style scoped>
.ticker-banner {
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
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.ticker-banner:hover,
.ticker-banner:focus-within {
  background: var(--surface-hover);
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
  /* One full right-to-left pass; increase the duration to slow the banner down. */
  animation: ticker-scroll 10s linear infinite;
}

.ticker-banner:hover .ticker-track,
.ticker-banner:focus-within .ticker-track {
  animation-play-state: paused;
}

.ticker-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 56px;
  color: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.ticker-link:hover,
.ticker-link:focus-visible {
  color: var(--focus);
}

.ticker-link svg {
  flex: 0 0 auto;
  color: var(--secondary);
}

.ticker-link:hover svg,
.ticker-link:focus-visible svg {
  color: currentColor;
}

@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

@media (max-width: 760px) {
  .ticker-banner {
    min-height: 38px;
    gap: 8px;
    padding: 0 10px;
    border-radius: 12px;
  }

  .ticker-link {
    font-size: 12px;
    padding-right: 42px;
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
