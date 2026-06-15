<script setup lang="ts">
interface NewsItem {
  text: string
  sourceName: string
  sourceIcon: string
  sourceUrl?: string
}

defineProps<{
  title: string
  items: NewsItem[]
  badgeColor: 'red' | 'gray' | 'orange'
}>()
</script>

<template>
  <div class="bento-card">
    <div class="card-label">{{ title }}</div>
    <ul class="news-list">
      <li v-for="(item, i) in items" :key="i">
        <a
          class="news-item"
          :href="item.sourceUrl"
          target="_blank"
          rel="noreferrer"
        >
        <span class="badge" :class="`badge-${badgeColor}`">
          <img class="badge-icon" :src="item.sourceIcon" alt="" />
          <span class="badge-name">{{ item.sourceName }}</span>
        </span>
        <span class="news-text">{{ item.text }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bento-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--soft-line);
}

.card-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--page-fg);
  margin-bottom: 16px;
  letter-spacing: 0.05em;
}

.news-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.news-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--page-fg) 6%, transparent);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.news-item:hover {
  opacity: 0.8;
}

.news-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Sans', sans-serif;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  flex-shrink: 0;
}

.badge-red {
  background: color-mix(in srgb, #ff3b30 12%, transparent);
  color: #ff3b30;
}

.badge-gray {
  background: color-mix(in srgb, #8e8e93 12%, transparent);
  color: #8e8e93;
}

.badge-orange {
  background: color-mix(in srgb, #ff9500 12%, transparent);
  color: #ff9500;
}

.badge-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  object-fit: cover;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--page-fg) 10%, transparent);
}

.badge-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.news-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--page-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  line-height: 1;
  padding-top: 1px;
}

@media (max-width: 720px) {
  .bento-card {
    padding: 20px 24px;
    border-radius: 20px;
  }
}
</style>
