<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch, type VNode, type VNodeArrayChildren } from 'vue'
import type { SiteLink } from '../../../types/home'

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
const columnCount = ref(8)
const rowCount = ref(8)
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

const visualItems = computed(() => {
  const source = links.value.length ? links.value : []
  const palette = ['#007aff', '#34c759', '#ff9f0a', '#ff375f', '#5e5ce6', '#64d2ff']

  if (!source.length) return []

  return Array.from({ length: rowCount.value }).flatMap((_, row) =>
    Array.from({ length: columnCount.value }).map((__, col) => {
      const axialQ = col - Math.floor(row / 2)
      const baseIndex = wrap(axialQ + row * 2, source.length)
      const item = source[baseIndex]

      return {
        item,
        key: `${item.websiteTitle}-${row}-${col}`,
        baseIndex,
        col,
        row,
        color: palette[baseIndex % palette.length],
      }
    }),
  )
})

const clamp = (min: number, max: number, value: number): number => Math.min(max, Math.max(min, value))
const wrap = (value: number, cycle: number): number => ((value % cycle) + cycle) % cycle

const maxIconScale = 1.78
const minIconGap = 8

let stepX = 78
let stepY = 68
let iconSizePx = 54
let cachedIcons: HTMLElement[] = []
let offsetX = 0
let offsetY = 0
let startX = 0
let startY = 0
let startOffsetX = 0
let startOffsetY = 0
let lastX = 0
let lastY = 0
let lastTime = 0
let velocityX = 0
let velocityY = 0
let isDragging = false
let suppressClick = false
let renderFrame = 0
let inertiaFrame = 0
let resizeObserver: ResizeObserver | undefined
let hasDragged = false

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

const isMobileWatch = () =>
  window.matchMedia('(max-width: 720px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches

const getCycles = () => ({
  width: Math.max(1, columnCount.value * stepX),
  height: Math.max(1, rowCount.value * stepY),
})

const normalizeOffsets = () => {
  const cycles = getCycles()
  offsetX = wrap(offsetX, cycles.width)
  offsetY = wrap(offsetY, cycles.height)
}

let isMobileCached = false

const measure = () => {
  const width = stage.value?.clientWidth || root.value?.clientWidth || 600
  const height = stage.value?.clientHeight || root.value?.clientHeight || 480
  isMobileCached = isMobileWatch()

  iconSizePx = isMobileCached ? clamp(34, 42, width / 6.6) : clamp(40, 54, width / 8.8)
  const safeDiameter = iconSizePx * maxIconScale + (isMobileCached ? 6 : minIconGap)

  stepX = safeDiameter
  stepY = safeDiameter * (isMobileCached ? 0.96 : 0.9)
  
  columnCount.value = isMobileCached ? Math.max(7, Math.ceil(width / stepX) + 2) : Math.max(9, Math.ceil(width / stepX) + 2)
  rowCount.value = isMobileCached ? Math.max(7, Math.ceil(height / stepY) + 2) : Math.max(9, Math.ceil(height / stepY) + 2)
  
  root.value?.style.setProperty('--watch-icon-size', `${iconSizePx.toFixed(2)}px`)
}

const refreshIconCache = () => {
  cachedIcons = root.value ? [...root.value.querySelectorAll<HTMLElement>('.watch-icon')] : []
}

const render = () => {
  renderFrame = 0
  if (!root.value || !links.value.length) return

  normalizeOffsets()

  const icons: HTMLElement[] = cachedIcons.length
    ? cachedIcons
    : [...root.value.querySelectorAll<HTMLElement>('.watch-icon')]
  const cycles = getCycles()

  icons.forEach((node) => {
    const col = Number(node.dataset.col || 0)
    const row = Number(node.dataset.row || 0)
    const rowOffset = row % 2 ? stepX * 0.5 : 0
    const rawX = col * stepX + rowOffset - offsetX - cycles.width / 2
    const rawY = row * stepY - offsetY - cycles.height / 2
    const x = wrap(rawX + cycles.width / 2, cycles.width) - cycles.width / 2
    const y = wrap(rawY + cycles.height / 2, cycles.height) - cycles.height / 2
    const distance = Math.hypot(x, y)
    
    const scale = isMobileCached
      ? clamp(0.5, 1.3, 1.3 - distance / (stepX * 3.8))
      : clamp(0.4, maxIconScale, maxIconScale - distance / (stepX * 3.1))
    
    const opacityNum = isMobileCached
      ? clamp(0, 0.9, 1.1 - distance / (stepX * 3.2))
      : clamp(0, 0.92, 1.15 - distance / (stepX * 3.5))

    const opacityStr = opacityNum.toFixed(3)
    const zIndexStr = `${100 + Math.round(scale * 100)}`

    node.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`
    
    if (node.style.opacity !== opacityStr) {
      node.style.opacity = opacityStr
    }
    
    if (node.style.zIndex !== zIndexStr) {
      node.style.zIndex = zIndexStr
    }
  })
}

const scheduleRender = () => {
  if (renderFrame) return
  renderFrame = requestAnimationFrame(render)
}

const stopInertia = () => {
  if (!inertiaFrame) return
  cancelAnimationFrame(inertiaFrame)
  inertiaFrame = 0
}

const glide = () => {
  offsetX += velocityX * 16
  offsetY += velocityY * 16
  velocityX *= 0.92
  velocityY *= 0.92
  render()

  if (Math.hypot(velocityX, velocityY) > 0.018) {
    inertiaFrame = requestAnimationFrame(glide)
    return
  }

  inertiaFrame = 0
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.button && event.button !== 0) return

  stopInertia()
  isDragging = true
  suppressClick = false
  startX = event.clientX
  startY = event.clientY
  startOffsetX = offsetX
  startOffsetY = offsetY
  lastX = event.clientX
  lastY = event.clientY
  lastTime = performance.now()
  velocityX = 0
  velocityY = 0
  root.value?.classList.add('is-dragging')
  root.value?.setPointerCapture?.(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging) return

  const now = performance.now()
  const elapsed = Math.max(16, now - lastTime)
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  const deltaX = event.clientX - lastX
  const deltaY = event.clientY - lastY

  if (Math.hypot(dx, dy) > 7) {
    suppressClick = true
    hasDragged = true
    root.value?.classList.remove('is-showing-drag-hint')
  }

  offsetX = startOffsetX - dx
  offsetY = startOffsetY - dy
  velocityX = -deltaX / elapsed
  velocityY = -deltaY / elapsed
  lastX = event.clientX
  lastY = event.clientY
  lastTime = now
  scheduleRender()
  event.preventDefault()
}

const handlePointerUp = (event: PointerEvent) => {
  if (!isDragging) return

  isDragging = false
  root.value?.classList.remove('is-dragging')
  root.value?.releasePointerCapture?.(event.pointerId)

  if (Math.hypot(velocityX, velocityY) > 0.018) {
    if (isMobileWatch()) {
      velocityX = 0
      velocityY = 0
      return
    }

    stopInertia()
    inertiaFrame = requestAnimationFrame(glide)
  }

  if (suppressClick) {
    window.setTimeout(() => {
      suppressClick = false
    }, 140)
  }
}

const handleIconClick = (event: MouseEvent) => {
  if (!suppressClick) return

  event.preventDefault()
  event.stopPropagation()
}

const showTooltip = (event: PointerEvent | FocusEvent, item: SiteLink) => {
  if (isDragging || isMobileWatch()) return

  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  const tooltipNode = tooltip.value

  if (!tooltipNode) return

  if (tooltipTitle.value) tooltipTitle.value.textContent = item.websiteTitle
  if (tooltipDescription.value) tooltipDescription.value.textContent = item.websiteDescription

  tooltipNode.style.left = `${rect.left + rect.width / 2}px`
  tooltipNode.style.top = `${rect.top - 12}px`
  tooltipNode.classList.add('is-visible')
}

const hideTooltip = () => {
  tooltip.value?.classList.remove('is-visible')
}

const showFaceHint = () => {
  if (hasDragged) return
  root.value?.classList.add('is-showing-drag-hint')
}

const hideFaceHint = () => {
  root.value?.classList.remove('is-showing-drag-hint')
  hideTooltip()
}

onMounted(async () => {
  await nextTick()

  if (!root.value) return

  measure()
  await nextTick()
  refreshIconCache()
  render()

  resizeObserver = new ResizeObserver(() => {
    measure()
    nextTick(() => {
      refreshIconCache()
      scheduleRender()
    })
  })
  resizeObserver.observe(root.value)
})

watch(
  links,
  async () => {
    measure()
    await nextTick()
    refreshIconCache()
    scheduleRender()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
  stopInertia()
  resizeObserver?.disconnect()
})
</script>

<template>
  <article
    ref="root"
    class="gallery-card watch-card"
    :style="{ '--accent': accent }"
    @pointerdown="handlePointerDown"
    @pointermove.capture="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @pointerleave="handlePointerUp"
  >
    <div class="watch-shell">
      <aside class="watch-rail" aria-hidden="true">
        <span>{{ title }}</span>
      </aside>

      <div
        class="watch-face"
        @pointerenter="showFaceHint"
        @pointerleave="hideFaceHint"
      >
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
      </div>
    </div>

    <Teleport to="body">
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
  width: clamp(360px, 32vw, 600px);
  height: 480px;
  overflow: hidden;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 18px;
  background: color-mix(in srgb, var(--card-bg), transparent 2%);
  color: var(--page-fg);
  box-shadow: var(--gallery-card-shadow);
}

.gallery-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  height: 4px;
  background: var(--accent);
}

.watch-card {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.watch-card.is-dragging {
  cursor: grabbing;
}

.watch-shell {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  overflow: hidden;
  border-radius: inherit;
  background: inherit;
}

.watch-rail {
  position: relative;
  z-index: 2003;
  display: grid;
  place-items: center;
  border-right: 0;
  background: transparent;
}

.watch-rail::after {
  content: '';
  position: absolute;
  top: 18px;
  right: 0;
  bottom: 18px;
  width: 1px;
  background: color-mix(in srgb, var(--page-fg), transparent 90%);
}

.watch-rail span {
  writing-mode: vertical-rl;
  color: color-mix(in srgb, var(--accent), #ffffff 18%);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.watch-face {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: inherit;
}

.watch-stage {
  position: absolute;
  inset: 8px;
  z-index: 1;
  overflow: hidden;
  border-radius: 14px;
  background: transparent;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--page-fg), transparent 90%);
}

.watch-drag-hint {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2002;
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
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    visibility 0.18s ease;
}

.watch-card.is-showing-drag-hint .watch-drag-hint {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
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
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.46), transparent 31%),
    linear-gradient(145deg, color-mix(in srgb, var(--watch-color), #ffffff 10%), color-mix(in srgb, var(--watch-color), #000000 18%));
  color: color-mix(in srgb, #ffffff, var(--accent) 8%);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 72%),
    inset 0 -10px 18px rgba(0, 0, 0, 0.16);
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
  color: color-mix(in srgb, #ffffff, var(--accent) 8%);
  font-family: "Sora", sans-serif;
  font-size: 23px;
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}

.watch-icon[data-avatar-loaded='true']::before {
  opacity: 0;
}

.watch-icon[data-avatar-loaded='true'] {
  background: transparent;
  box-shadow: none;
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
    inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 56%),
    inset 0 -10px 18px rgba(0, 0, 0, 0.16),
    0 18px 44px color-mix(in srgb, var(--watch-color), transparent 68%);
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 44%),
    color-mix(in srgb, var(--card-bg, #111827), transparent 2%);
  color: var(--page-fg, #f5f5f7);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
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
    width: 100%;
    max-width: 100%;
    height: clamp(300px, 76svh, 330px);
    padding: 0;
    border-radius: 18px;
  }

  .watch-card {
    box-shadow: inset 0 0 0 1px var(--soft-line);
  }

  .watch-stage {
    inset: 6px;
    border-radius: 12px;
  }

  .watch-shell {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .watch-rail span {
    font-size: 9px;
    letter-spacing: 0.12em;
  }

  .watch-drag-hint {
    backdrop-filter: none;
  }

  .watch-icon {
    box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 76%);
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
    box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 76%);
  }

}

@media (max-width: 420px) {
  .gallery-card {
    height: clamp(290px, 72svh, 315px);
  }

  .watch-shell {
    grid-template-columns: 38px minmax(0, 1fr);
  }

}
</style>
