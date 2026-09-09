<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './stores/theme'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'

const themeStore = useThemeStore()
const route = useRoute()
const routeOverlay = ref<HTMLDivElement | null>(null)

onMounted(() => {
  themeStore.initTheme()
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    if (!routeOverlay.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    routeOverlay.value.classList.remove('is-transitioning')
    // Force a reflow so consecutive navigations restart the short CSS transition.
    void routeOverlay.value.offsetWidth
    routeOverlay.value.classList.add('is-transitioning')
  },
)
</script>

<template>
  <div class="app-layout theme-scope" :class="{ 'is-day': themeStore.isDayMode, 'is-night': themeStore.isDarkMode }">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath" class="route-view" />
    </RouterView>
    <div ref="routeOverlay" class="route-overlay" aria-hidden="true"></div>
    <Analytics />
    <SpeedInsights />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  min-height: 100dvh;
  min-height: 100svh;
  overflow-x: hidden;
  background: var(--page-bg);
  color: var(--page-fg);
}

.route-view {
  min-height: 100vh;
  min-height: 100dvh;
  min-height: 100svh;
}

.route-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: none;
  pointer-events: none;
  background: var(--page-bg);
  opacity: 0;
}

.route-overlay.is-transitioning {
  display: block;
  animation: route-fade 0.5s ease-out forwards;
}

@keyframes route-fade {
  0% { opacity: 0; }
  32% { opacity: 0.82; }
  100% { opacity: 0; display: none; }
}
</style>

<style>
@media (prefers-reduced-motion: reduce) {
  .route-view {
    transition: none;
  }
}
</style>
