<script setup lang="ts">
import type { HomeGallerySection, SiteLink } from '../../../types/home'
import HomeCategorySection from './HomeCategorySection.vue'

defineProps<{
  expandedLinkUrl: string | null
  galleries: HomeGallerySection[]
  highlightedTargetId: string | null
  linkColumnCount: number
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
  <HomeCategorySection
    v-for="(gallery, galleryIndex) in galleries"
    :key="gallery.title"
    :expanded-link-url="expandedLinkUrl"
    :gallery="gallery"
    :gallery-index="galleryIndex"
    :highlighted-target-id="highlightedTargetId"
    :link-column-count="linkColumnCount"
    :view-mode="viewMode"
    @icon-error="emit('icon-error', $event)"
    @resource-click="forwardResourceClick"
    @show-tooltip="forwardShowTooltip"
    @hide-tooltip="emit('hide-tooltip')"
  />
</template>
