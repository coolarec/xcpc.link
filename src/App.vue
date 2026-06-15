<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useRoute } from 'vue-router'
import { useThemeStore } from './stores/theme'

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

    gsap.killTweensOf(routeOverlay.value)
    gsap
      .timeline()
      .set(routeOverlay.value, { display: 'block', autoAlpha: 0 })
      .to(routeOverlay.value, { autoAlpha: 0.82, duration: 0.16, ease: 'power2.out' })
      .to(routeOverlay.value, {
        autoAlpha: 0,
        duration: 0.34,
        ease: 'power3.out',
        onComplete: () => {
          if (routeOverlay.value) routeOverlay.value.style.display = 'none'
        },
      })
  },
)
</script>

<template>
  <div class="app-layout theme-scope" :class="{ 'is-day': themeStore.isDayMode, 'is-night': themeStore.isDarkMode }">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath" class="route-view" />
    </RouterView>
    <div ref="routeOverlay" class="route-overlay" aria-hidden="true"></div>
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
</style>

<style>
@media (prefers-reduced-motion: reduce) {
  .route-view {
    transition: none;
  }
}
</style>
