<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchHomeGalleries } from '../../modules/home/api'
import type { HomeGallerySection, WatchLinksBlock } from '../../types/home'
import { ArrowLeft, Star } from '@lucide/vue'

const galleries = ref<HomeGallerySection[]>([])
const isLoading = ref(true)

const getGalleryWatches = (gallery: HomeGallerySection): WatchLinksBlock[] => {
  if (gallery.watches?.length) return gallery.watches
  return gallery.watch ? [gallery.watch] : []
}

onMounted(async () => {
  try {
    galleries.value = await fetchHomeGalleries()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="lite-page theme-scope">
    <div class="lite-container">
      <header class="lite-header">
        <router-link to="/" class="back-btn">
          <ArrowLeft :size="18" />
          <span>返回主站</span>
        </router-link>
        <div class="header-content">
          <h1>XCPC.LINK</h1>
          <p>高密度导航模式 · 全量资源</p>
        </div>
      </header>

      <main class="lite-content" v-if="!isLoading">
        <section 
          v-for="gallery in galleries" 
          :key="gallery.title" 
          class="category-block"
        >
          <div class="category-header">
            <h2 class="category-title">{{ gallery.title }}</h2>
          </div>

          <!-- Group 1: Featured Links -->
          <div class="sub-group">
            <h3 class="sub-group-title">精选资源</h3>
            <div class="compact-grid">
              <a 
                v-for="link in gallery.cards" 
                :key="link.websiteUrl"
                :href="link.websiteUrl"
                target="_blank"
                class="grid-item"
              >
                <div class="item-top">
                  <div class="item-icon-box">
                    <img v-if="link.avatarUrl" :src="link.avatarUrl" :alt="link.websiteTitle" loading="lazy" />
                    <span v-else>{{ link.websiteTitle.charAt(0) }}</span>
                  </div>
                  <span class="item-name">{{ link.websiteTitle }}</span>
                </div>
                <p class="item-desc">{{ link.websiteDescription }}</p>
              </a>
            </div>
          </div>

          <!-- Group 2+: Additional Recommendation Groups (Watches) -->
          <div 
            v-for="(watchGroup, idx) in getGalleryWatches(gallery)"
            :key="idx"
            class="sub-group"
          >
            <h3 class="sub-group-title">{{ watchGroup.title || '相关推荐' }}</h3>
            <div class="compact-grid">
              <a 
                v-for="link in watchGroup.links" 
                :key="link.websiteUrl"
                :href="link.websiteUrl"
                target="_blank"
                class="grid-item is-rec"
              >
                <div class="item-top">
                  <div class="item-icon-box">
                    <div class="rec-star"><Star :size="8" fill="currentColor" /></div>
                    <img v-if="link.avatarUrl" :src="link.avatarUrl" :alt="link.websiteTitle" loading="lazy" />
                    <span v-else>{{ link.websiteTitle.charAt(0) }}</span>
                  </div>
                  <span class="item-name">{{ link.websiteTitle }}</span>
                </div>
                <p class="item-desc">{{ link.websiteDescription }}</p>
              </a>
            </div>
          </div>
        </section>
      </main>

      <div v-else class="lite-loading">
        <div class="spinner"></div>
      </div>

      <footer class="lite-footer">
        <p>© 2026 XCPC.LINK · High Density</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.lite-page {
  min-height: 100vh;
  background: var(--page-bg);
  color: var(--page-fg);
  padding: 64px 32px;
}

.lite-container {
  max-width: 1140px;
  margin: 0 auto;
}

.lite-header {
  margin-bottom: 64px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted-fg);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.back-btn:hover {
  color: var(--page-fg);
}

.header-content h1 {
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: 36px;
  letter-spacing: -0.02em;
  margin: 0;
}

.header-content p {
  color: var(--muted-fg);
  font-size: 15px;
  margin: 6px 0 0;
  font-weight: 500;
}

.category-block {
  margin-bottom: 64px;
}

.category-header {
  margin-bottom: 24px;
  border-bottom: 1px solid var(--soft-line);
  padding-bottom: 12px;
}

.category-title {
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: 26px;
  letter-spacing: -0.01em;
  margin: 0;
}

.sub-group {
  margin-bottom: 44px;
}

.sub-group:last-child {
  margin-bottom: 0;
}

.sub-group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-fg);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 20px 4px;
}

.compact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: var(--card-bg);
  border: 1px solid var(--soft-line);
  border-radius: 18px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.grid-item:hover {
  background: color-mix(in srgb, var(--page-fg) 3%, transparent);
  transform: translateY(-3px);
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.04),
    0 0 0 1px var(--page-fg);
}

.item-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  background: color-mix(in srgb, var(--page-fg) 8%, transparent);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-weight: 800;
  font-size: 14px;
  position: relative;
}

.item-icon-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rec-star {
  position: absolute;
  top: -1px;
  right: -1px;
  background: #ffcc00;
  color: #000;
  width: 12px;
  height: 12px;
  display: grid;
  place-items: center;
  border-radius: 0 0 0 4px;
  z-index: 2;
}

.item-name {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--page-fg);
}

.item-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted-fg);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lite-footer {
  margin-top: 100px;
  padding: 48px 0;
  text-align: center;
  opacity: 0.5;
  border-top: 1px solid var(--soft-line);
}

.lite-loading {
  height: 300px;
  display: grid;
  place-items: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--soft-line);
  border-top-color: var(--page-fg);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .lite-page {
    padding: 40px 16px;
  }

  .compact-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .grid-item {
    padding: 16px;
    border-radius: 14px;
  }
}
</style>
