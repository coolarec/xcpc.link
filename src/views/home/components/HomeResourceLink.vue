<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import type { SiteLink } from '../../../types/home'

defineProps<{
  detail: boolean
  expanded: boolean
  link: SiteLink
  showDetails: boolean
}>()

const emit = defineEmits<{
  'icon-error': [event: Event]
  'resource-click': [link: SiteLink, event: MouseEvent]
  'show-tooltip': [link: SiteLink, event: MouseEvent | FocusEvent]
  'hide-tooltip': []
}>()
</script>

<template>
  <a
    class="resource-link"
    :href="link.websiteUrl"
    target="_blank"
    rel="noreferrer"
    :data-tooltip="`${link.websiteTitle}\n${link.websiteDescription}`"
    :aria-label="`打开 ${link.websiteTitle}`"
    :class="{ 'is-detail': detail, 'is-expanded': expanded }"
    @click="emit('resource-click', link, $event)"
    @mouseenter="emit('show-tooltip', link, $event)"
    @mouseleave="emit('hide-tooltip')"
    @focus="emit('show-tooltip', link, $event)"
    @blur="emit('hide-tooltip')"
  >
    <span class="favicon" aria-hidden="true">
      <img
        v-if="link.avatarUrl"
        :src="link.avatarUrl"
        :alt="link.websiteTitle"
        width="28"
        height="28"
        loading="lazy"
        @error="emit('icon-error', $event)"
      />
      <span v-else>{{ link.websiteTitle.charAt(0) }}</span>
    </span>

    <span class="resource-copy">
      <span class="resource-title">{{ link.websiteTitle }}</span>
      <span v-if="showDetails" class="resource-description">
        {{ link.websiteDescription }}
      </span>
    </span>

    <ExternalLink class="resource-action" :size="15" aria-hidden="true" />
  </a>
</template>

<style scoped>
.resource-link {
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
  text-decoration: none;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.resource-link:hover,
.resource-link:focus-visible {
  z-index: 2;
  background: var(--surface-hover);
}

.favicon {
  position: relative;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 7px;
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
  object-fit: contain;
}

.resource-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.resource-title {
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.resource-action {
  color: var(--secondary);
  opacity: 0;
  transition: opacity 0.16s ease;
}

.resource-link:hover .resource-action,
.resource-link:focus-visible .resource-action {
  opacity: 1;
}

.resource-link.is-detail {
  min-height: 74px;
  align-items: center;
  grid-template-columns: 26px minmax(0, 1fr) 16px;
  padding: 10px;
}

.resource-link.is-detail .favicon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
}

.resource-link.is-detail .resource-copy {
  position: relative;
  display: block;
  height: 54px;
  overflow: hidden;
}

.resource-link.is-detail .resource-title {
  position: absolute;
  inset-inline: 0;
  top: 0;
  font-size: 13px;
  white-space: nowrap;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.resource-link.is-detail .resource-description {
  position: absolute;
  inset-inline: 0;
  top: 21px;
  transition:
    top 0.2s ease,
    transform 0.2s ease;
}

.resource-link.is-detail:hover .resource-title,
.resource-link.is-detail:focus-visible .resource-title {
  opacity: 0;
  transform: translateY(-140%);
}

.resource-link.is-detail:hover .resource-description,
.resource-link.is-detail:focus-visible .resource-description {
  top: 50%;
  transform: translateY(-50%);
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.resource-link.is-detail .resource-action,
.resource-link.is-expanded .resource-action {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .resource-link,
  .resource-title,
  .resource-description,
  .resource-action {
    transition: none;
  }
}

@media (max-width: 760px) {
  .resource-link {
    margin-left: 0;
  }
}
</style>
