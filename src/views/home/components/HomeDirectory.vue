<script setup lang="ts">
import type { HomeGallerySection, SiteLink } from '../../../types/home'
import HomeCategorySection from './HomeCategorySection.vue'

defineProps<{
  expandedLinkUrl: string | null
  galleries: HomeGallerySection[]
  isLoading: boolean
  linkColumnCount: number
  loadError: string
  viewMode: 'compact' | 'detail'
}>()

const emit = defineEmits<{
  'icon-error': [event: Event]
  'resource-click': [link: SiteLink, event: MouseEvent]
  'show-tooltip': [link: SiteLink, event: MouseEvent | FocusEvent]
  'hide-tooltip': []
}>()

const forwardResourceClick = (link: SiteLink, event: MouseEvent): void => {
  emit('resource-click', link, event)
}

const forwardShowTooltip = (link: SiteLink, event: MouseEvent | FocusEvent): void => {
  emit('show-tooltip', link, event)
}
</script>

<template>
  <section v-if="isLoading" class="state-panel" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <span>Loading</span>
  </section>

  <section v-else-if="loadError" class="state-panel" role="alert">
    <span>{{ loadError }}</span>
  </section>

  <HomeCategorySection
    v-for="gallery in galleries"
    v-else
    :key="gallery.title"
    :expanded-link-url="expandedLinkUrl"
    :gallery="gallery"
    :link-column-count="linkColumnCount"
    :view-mode="viewMode"
    @icon-error="emit('icon-error', $event)"
    @resource-click="forwardResourceClick"
    @show-tooltip="forwardShowTooltip"
    @hide-tooltip="emit('hide-tooltip')"
  />
</template>

<style scoped>
.state-panel {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  color: var(--muted);
  font-weight: 700;
}

.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #d2d2d7;
  border-top-color: var(--focus);
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
</style>
