<script setup lang="ts">
import GalleryNewsColumn from './GalleryNewsColumn.vue'
import type { NewsData } from '../../../../types/home'

defineProps<{
  data: NewsData
}>()
</script>

<template>
  <div class="bento-news-wrapper">
    <header class="bento-header">
      <div class="header-titles">
        <h3>圈内播报</h3>
        <p>XCPC Board</p>
      </div>
    </header>

    <div class="bento-grid" v-if="data">
      <GalleryNewsColumn title="红榜" :items="data.redList" badge-color="red" />
      <GalleryNewsColumn title="黑榜" :items="data.blackList" badge-color="gray" />
      <GalleryNewsColumn title="实时吃瓜" :items="data.gossip" badge-color="orange" />
    </div>
  </div>
</template>

<style scoped>
.bento-news-wrapper {
  width: 85vw;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bento-header {
  padding: 0 12px;
}

.header-titles h3 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: 34px;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--page-fg);
}

.header-titles p {
  margin: 4px 0 0;
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted-fg);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1100px) {
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 720px) {
  .bento-news-wrapper {
    width: calc(100vw - 48px);
  }

  .header-titles h3 {
    font-size: 28px;
  }
}
</style>
