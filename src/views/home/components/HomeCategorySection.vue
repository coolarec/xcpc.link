<script setup lang="ts">
import { computed } from 'vue'
import type { HomeGallerySection, SiteLink } from '../../../types/home'
import HomeResourceLink from './HomeResourceLink.vue'
import { getGalleryGroups, getGalleryLinkCount } from './homeViewModel'

const props = defineProps<{
  expandedLinkUrl: string | null
  gallery: HomeGallerySection
  linkColumnCount: number
  viewMode: 'compact' | 'detail'
}>()

const emit = defineEmits<{
  'icon-error': [event: Event]
  'resource-click': [link: SiteLink, event: MouseEvent]
  'show-tooltip': [link: SiteLink, event: MouseEvent | FocusEvent]
  'hide-tooltip': []
}>()

const groups = computed(() => getGalleryGroups(props.gallery))
const linkCount = computed(() => getGalleryLinkCount(props.gallery))

const getPlaceholderCount = (groupLinkCount: number): number => {
  const rest = groupLinkCount % props.linkColumnCount
  return rest === 0 ? 0 : props.linkColumnCount - rest
}

const shouldShowDetails = (link: SiteLink): boolean =>
  props.viewMode === 'detail' || props.expandedLinkUrl === link.websiteUrl

const forwardResourceClick = (link: SiteLink, event: MouseEvent): void => {
  emit('resource-click', link, event)
}

const forwardShowTooltip = (link: SiteLink, event: MouseEvent | FocusEvent): void => {
  emit('show-tooltip', link, event)
}
</script>

<template>
  <section class="category-section">
    <header class="category-header">
      <div>
        <p>{{ gallery.eyebrow }}</p>
        <h2>{{ gallery.title }}</h2>
      </div>
      <span>{{ linkCount }}</span>
    </header>

    <div class="group-list">
      <section v-for="group in groups" :key="group.id" class="link-group">
        <header class="group-header">
          <h3>{{ group.title }}</h3>
          <span>{{ group.links.length }}</span>
        </header>

        <div class="links" :data-mode="viewMode">
          <HomeResourceLink
            v-for="link in group.links"
            :key="link.websiteUrl"
            :detail="viewMode === 'detail'"
            :expanded="expandedLinkUrl === link.websiteUrl"
            :link="link"
            :show-details="shouldShowDetails(link)"
            @icon-error="emit('icon-error', $event)"
            @resource-click="forwardResourceClick"
            @show-tooltip="forwardShowTooltip"
            @hide-tooltip="emit('hide-tooltip')"
          />
          <span
            v-for="index in getPlaceholderCount(group.links.length)"
            :key="`${group.id}-placeholder-${index}`"
            class="resource-link resource-placeholder"
            aria-hidden="true"
          ></span>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.category-section {
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
  background: var(--surface);
}

.links[data-mode='detail'] {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.resource-placeholder {
  position: relative;
  min-height: 42px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  margin: -1px 0 0 -1px;
  color: var(--text);
  pointer-events: none;
}

.links[data-mode='detail'] > .resource-placeholder {
  min-height: 74px;
  grid-template-columns: 26px minmax(0, 1fr) 16px;
  padding: 10px;
}

@media (max-width: 1100px) {
  .links {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .links[data-mode='detail'] {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .link-group {
    grid-template-columns: 118px minmax(0, 1fr);
  }

  .links,
  .links[data-mode='detail'] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .resource-placeholder {
    display: none;
  }
}

@media (max-width: 560px) {
  .links,
  .links[data-mode='detail'] {
    grid-template-columns: 1fr;
  }
}
</style>
