<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <div class="app-layout theme-scope" :class="{ 'is-day': themeStore.isDayMode, 'is-night': themeStore.isDarkMode }">
    <RouterView />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100svh;
  background: var(--page-bg);
  color: var(--page-fg);
}
</style>
