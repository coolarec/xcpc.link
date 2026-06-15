<script setup lang="ts">
import { computed } from 'vue'
import type { NewsData } from '../../../types/home'
import { getNewsCount, getNewsGroups } from './homeViewModel'

const props = defineProps<{
  newsData: NewsData
}>()

const emit = defineEmits<{
  'icon-error': [event: Event]
}>()

const newsGroups = computed(() => getNewsGroups(props.newsData))
const newsCount = computed(() => getNewsCount(props.newsData))
</script>

<template>
  <section class="category-section news-category">
    <header class="category-header">
      <div>
        <p>XCPC News</p>
        <h2>圈内播报</h2>
      </div>
      <span>{{ newsCount }}</span>
    </header>

    <div class="group-list">
      <section
        v-for="group in newsGroups"
        :key="group.id"
        class="link-group news-group"
        :class="`is-${group.id}`"
      >
        <header class="group-header">
          <h3>{{ group.title }}</h3>
          <span>{{ group.items.length }}</span>
        </header>

        <div class="links news-links">
          <a
            v-for="item in group.items"
            :key="`${group.id}-${item.text}`"
            class="resource-link news-row"
            :href="item.sourceUrl"
            target="_blank"
            rel="noreferrer"
            :aria-label="`打开 ${item.text}`"
          >
            <span class="resource-copy">
              <span class="resource-title">{{ item.text }}</span>
            </span>

            <span class="news-source">
              <span class="favicon" aria-hidden="true">
                <img
                  v-if="item.sourceIcon"
                  :src="item.sourceIcon"
                  :alt="item.sourceName"
                  width="24"
                  height="24"
                  loading="lazy"
                  @error="emit('icon-error', $event)"
                />
                <span v-else>{{ item.sourceName.charAt(0) }}</span>
              </span>
              <span>{{ item.sourceName }}</span>
            </span>
          </a>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.news-category {
  margin-top: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}

.category-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.category-header p,
.group-header span {
  margin: 0;
  color: var(--secondary);
  font-size: 13px;
  font-weight: 650;
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
  grid-template-columns: 1fr;
  background: var(--surface);
}

.resource-link {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  margin: -1px 0 0 -1px;
  color: var(--text);
  text-decoration: none;
  cursor: default;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.resource-link:hover,
.resource-link:focus-visible {
  z-index: 1;
  background: var(--surface-hover);
}

.resource-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
  align-self: center;
  text-align: left;
}

.resource-title {
  min-width: 0;
  overflow: visible;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: clip;
  white-space: normal;
}

.news-group.is-red-list .group-header h3 {
  color: #ff3b30;
}

.news-group.is-black-list .group-header h3 {
  color: var(--news-black-color, #111111);
}

.news-group.is-live-list .group-header h3 {
  color: #007aff;
}

.news-source {
  min-width: 0;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.favicon {
  position: relative;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
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

.news-source > span:last-child {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (prefers-reduced-motion: reduce) {
  .resource-link {
    transition: none;
  }
}

@media (max-width: 820px) {
  .link-group {
    grid-template-columns: 118px minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
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

  .resource-link {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-left: 0;
  }

  .news-source {
    justify-content: flex-start;
  }
}
</style>
