<script setup lang="ts">
import { computed, ref, useSlots, type VNode, type VNodeArrayChildren } from 'vue'
import type { SiteLink } from '../../../../types/home'
import { useWatchDrag } from '../../../../composables/useWatchDrag'

const props = withDefaults(defineProps<{
  title: string
  description: string
  links?: SiteLink[]
  accent?: string
}>(), {
  links: () => [],
  accent: '#007aff',
})

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLDivElement | null>(null)
const tooltip = ref<HTMLDivElement | null>(null)
const tooltipTitle = ref<HTMLElement | null>(null)
const tooltipDescription = ref<HTMLElement | null>(null)
const slots = useSlots()

const flattenNodes = (nodes: VNodeArrayChildren): VNode[] =>
  nodes.flatMap((node) => {
    if (node == null || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
      return []
    }

    if (Array.isArray(node)) return flattenNodes(node)
    if (Array.isArray(node.children)) return flattenNodes(node.children as VNodeArrayChildren)
    return [node]
  })

const slotLinks = computed<SiteLink[]>(() => {
  const nodes = flattenNodes(slots.default?.() || [])

  return nodes
    .map((node) => (node.props || {}) as Partial<SiteLink>)
    .filter((nodeProps) => nodeProps.websiteUrl && nodeProps.websiteTitle)
    .map((nodeProps): SiteLink => ({
      avatarUrl: nodeProps.avatarUrl as string,
      websiteUrl: nodeProps.websiteUrl as string,
      websiteTitle: nodeProps.websiteTitle as string,
      websiteDescription: nodeProps.websiteDescription as string,
    }))
})

const links = computed<SiteLink[]>(() => (slotLinks.value.length ? slotLinks.value : props.links))

const {
  visualItems,
  isUIHidden,
  handlePointerDown,
  handleIconClick,
  getIsDragging,
  isMobileWatch
} = useWatchDrag(root, stage, links)

const isMounted = ref(true)

const handleAvatarError = (event: Event): void => {
  const target = event.currentTarget as HTMLImageElement | null
  if (!target) return
  delete target.parentElement?.dataset.avatarLoaded
  target.hidden = true
}

const handleAvatarLoad = (event: Event): void => {
  const target = event.currentTarget as HTMLImageElement | null
  if (!target) return
  target.dataset.loaded = 'true'
  if (target.parentElement) target.parentElement.dataset.avatarLoaded = 'true'
}

const showTooltip = (event: PointerEvent | FocusEvent, item: SiteLink) => {
  if (getIsDragging() || isMobileWatch()) return

  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  const tooltipNode = tooltip.value

  if (!tooltipNode) return

  if (tooltipTitle.value) tooltipTitle.value.textContent = item.websiteTitle
  if (tooltipDescription.value) tooltipDescription.value.textContent = item.websiteDescription

  tooltipNode.style.left = `${rect.left + rect.width / 2}px`
  tooltipNode.style.top = `${rect.top - 16}px`
  tooltipNode.classList.add('is-visible')
}

const hideTooltip = () => {
  tooltip.value?.classList.remove('is-visible')
}

const hideFaceHint = () => {
  hideTooltip()
}
</script>

<template>
  <article
    ref="root"
    class="gallery-card watch-card"
    :class="{ 'is-ui-hidden': isUIHidden }"
    :style="{ '--accent': accent }"
    @pointerdown="handlePointerDown"
    @pointerleave="hideFaceHint"
  >
    <div class="card-watermark" aria-hidden="true">{{ title.charAt(0) }}</div>

    <div
      ref="stage"
      class="watch-stage"
      aria-label="Draggable related links"
    >
      <a
        v-for="entry in visualItems"
        :key="entry.key"
        class="watch-icon"
        :href="entry.item.websiteUrl"
        target="_blank"
        rel="noreferrer"
        :data-base-index="entry.baseIndex"
        :data-col="entry.col"
        :data-row="entry.row"
        :data-fallback="entry.item.websiteTitle.charAt(0)"
        :aria-label="entry.item.websiteTitle"
        :style="{ '--watch-color': entry.color }"
        draggable="false"
        @pointerenter="showTooltip($event, entry.item)"
        @pointerleave="hideTooltip"
        @focus="showTooltip($event, entry.item)"
        @blur="hideTooltip"
        @click="handleIconClick"
        @dragstart.prevent
      >
        <img
          v-if="entry.item.avatarUrl"
          class="watch-icon-image"
          :src="entry.item.avatarUrl"
          :alt="`${entry.item.websiteTitle} avatar`"
          draggable="false"
          @load="handleAvatarLoad"
          @error="handleAvatarError"
        >
      </a>
    </div>

    <div class="watch-drag-hint" aria-hidden="true">
      <span class="watch-drag-grip"></span>
      <span>拖动</span>
    </div>

    <div class="link-content" aria-hidden="true">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>

    <Teleport v-if="isMounted" to=".motion-page">
      <div ref="tooltip" class="watch-floating-tooltip" aria-hidden="true">
        <strong ref="tooltipTitle"></strong>
        <span ref="tooltipDescription"></span>
      </div>
    </Teleport>
  </article>
</template>

<style scoped>
.gallery-card {
  box-sizing: border-box;
  position: relative;
  width: var(--gallery-card-width, clamp(280px, 32vw, 600px));
  height: var(--gallery-card-height, 480px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 36px 32px;
  border: 0;
  border-radius: 32px;
  background: color-mix(in srgb, var(--card-bg), transparent 2%);
  color: var(--page-fg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
  transform: translateZ(0);
}

.gallery-card:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.04);
  background: color-mix(in srgb, var(--card-bg), var(--page-fg) 2%);
}

.card-watermark {
  position: absolute;
  bottom: -4%;
  right: -4%;
  font-size: 280px;
  font-family: "Sora", sans-serif;
  font-weight: 900;
  line-height: 1;
  color: var(--accent);
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  transform: rotate(-4deg);
  visibility: visible;
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
}

.link-content {
  position: absolute;
  left: -2px;
  right: -2px;
  bottom: -2px;
  z-index: 2;
  padding: 96px 34px 38px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--card-bg), transparent 18%) 32%,
    var(--card-bg) 58%,
    var(--card-bg) 100%
  );
  pointer-events: auto;
  visibility: visible;
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  touch-action: pan-y;
}

.gallery-card h3,
.gallery-card p {
  position: relative;
  z-index: 2;
  pointer-events: none;
}

.gallery-card h3 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: var(--link-title-size, 34px);
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.gallery-card p {
  margin: 16px 0 0;
  overflow-wrap: anywhere;
  color: var(--muted-fg);
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--link-description-size, 16px);
  line-height: 1.5;
  font-weight: 400;
  line-clamp: var(--link-description-lines, 3);
  -webkit-line-clamp: var(--link-description-lines, 3);
  -webkit-box-orient: vertical;
}

.watch-card {
  cursor: grab;
  user-select: none;
  touch-action: pan-y; /* CRITICAL: Allow global page scroll */
}

.watch-card.is-dragging {
  cursor: grabbing;
}

.watch-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  border-radius: inherit;
  background: transparent;
  touch-action: none; /* Block scroll ONLY on the icons area */
}

.watch-drag-hint {
  position: absolute;
  top: 32px;
  right: 32px;
  z-index: 2;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--card-bg), transparent 18%);
  color: color-mix(in srgb, var(--page-fg), transparent 16%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--page-fg), transparent 88%);
  font-size: 12px;
  font-weight: 800;
  pointer-events: none;
  backdrop-filter: blur(14px);
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
}

@media (hover: hover) {
  .watch-card:hover .link-content,
  .watch-card:hover .card-watermark {
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
  }
}

.watch-card.is-ui-hidden .link-content,
.watch-card.is-ui-hidden .card-watermark {
  opacity: 0;
  visibility: hidden;
  transform: translateY(12px);
}

.watch-card.is-ui-hidden .watch-drag-hint {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-12px);
}

.watch-drag-grip {
  width: 13px;
  height: 13px;
  opacity: 0.86;
  background-image: radial-gradient(currentColor 1.5px, transparent 1.5px);
  background-size: 6px 6px;
  background-position: 0 0;
}

.watch-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--watch-icon-size, 54px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 999px;
  overflow: hidden;
  background: #ffffff;
  color: var(--page-bg);
  box-shadow:
    inset 0 -4px 10px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.08);
  opacity: 0;
  text-decoration: none;
  user-select: none;
  -webkit-user-drag: none;
  transform: translate(-50%, -50%) scale(0.7);
  will-change: transform, opacity;
}

.watch-icon::before {
  content: attr(data-fallback);
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--page-bg);
  font-family: "Sora", sans-serif;
  font-size: 23px;
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}

.watch-icon[data-avatar-loaded='true']::before {
  opacity: 0;
}

.watch-icon-image {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 999px;
  opacity: 0;
  object-fit: cover;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.watch-icon-image[data-loaded='true'] {
  opacity: 1;
}

.watch-card:not(.is-dragging) .watch-icon:not([data-avatar-loaded='true']):hover,
.watch-card:not(.is-dragging) .watch-icon:not([data-avatar-loaded='true']):focus-visible {
  box-shadow:
    inset 0 -4px 10px rgba(0, 0, 0, 0.04),
    0 12px 24px rgba(0, 0, 0, 0.12);
}

:global(.watch-floating-tooltip) {
  position: fixed;
  z-index: 9999;
  width: 176px;
  display: grid;
  gap: 5px;
  padding: 9px 10px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 44%),
    color-mix(in srgb, var(--card-bg, #111827), transparent 2%);
  color: var(--page-fg, #f5f5f7);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px color-mix(in srgb, var(--page-fg, #f5f5f7), transparent 88%),
    0 1px 8px rgba(0, 0, 0, 0.08),
    0 14px 34px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, calc(-100% + 8px));
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    visibility 0.16s ease;
  font-family: "DM Sans", system-ui, sans-serif;
  backdrop-filter: blur(18px) saturate(1.2);
}

:global(.watch-floating-tooltip::after) {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 10px;
  height: 10px;
  border-right: 1px solid color-mix(in srgb, var(--page-fg, #f5f5f7), transparent 88%);
  border-bottom: 1px solid color-mix(in srgb, var(--page-fg, #f5f5f7), transparent 88%);
  background: color-mix(in srgb, var(--card-bg, #111827), transparent 2%);
  transform: translateX(-50%) rotate(45deg);
}

:global(.watch-floating-tooltip.is-visible) {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -100%);
}

:global(.watch-floating-tooltip strong) {
  overflow: hidden;
  color: var(--page-fg, #f5f5f7);
  font-family: "Sora", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.watch-floating-tooltip span) {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted-fg, #a1a1aa);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.3;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (max-width: 720px) {
  .gallery-card {
    width: 100% !important;
    max-width: 100% !important;
    height: clamp(240px, 62svh, 280px);
    padding: 28px 24px;
    border-radius: 28px;
  }

  .link-content {
    padding: 28px 24px 28px; /* Correct padding */
  }

  .card-ambient-glow {
    width: 90%;
    filter: blur(60px);
  }

  .card-watermark {
    font-size: 200px;
    bottom: -5%;
    right: -5%;
  }

  .gallery-card h3 {
    font-size: 28px;
  }

  .gallery-card p {
    margin-top: 12px;
    font-size: 14px;
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .watch-drag-hint {
    top: 24px;
    right: 24px;
    backdrop-filter: none;
  }

  .watch-icon {
    box-shadow: 
      inset 0 -4px 8px rgba(0, 0, 0, 0.04),
      0 2px 8px rgba(0, 0, 0, 0.06);
    will-change: transform;
  }

  .watch-icon[data-avatar-loaded='true'],
  .watch-icon[data-avatar-loaded='true']:hover,
  .watch-icon[data-avatar-loaded='true']:focus-visible {
    box-shadow: none;
  }

  .watch-icon::before {
    font-size: 18px;
  }

  .watch-icon:hover,
  .watch-icon:focus-visible {
    box-shadow: 
      inset 0 -4px 8px rgba(0, 0, 0, 0.04),
      0 6px 16px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 420px) {
  .gallery-card {
    height: clamp(290px, 72svh, 315px);
    padding: 24px 20px;
    border-radius: 24px;
  }

  .link-content {
    padding: 24px 20px 24px;
  }

  .gallery-card h3 {
    font-size: 24px;
  }

  .gallery-card p {
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }

  .watch-drag-hint {
    top: 20px;
    right: 20px;
  }
}
</style>
