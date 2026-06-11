<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  links: {
    type: Array,
    default: () => [],
  },
  accent: {
    type: String,
    default: '#007aff',
  },
})

const root = ref(null)
const stage = ref(null)
const tooltip = ref(null)
const tooltipTitle = ref(null)
const tooltipDescription = ref(null)
const columnCount = ref(8)
const rowCount = ref(8)
const copyOffsets = ref([-1, 0, 1])
const slots = useSlots()

const flattenNodes = (nodes) =>
  nodes.flatMap((node) => {
    if (Array.isArray(node.children)) return flattenNodes(node.children)
    return [node]
  })

const slotLinks = computed(() => {
  const nodes = flattenNodes(slots.default?.() || [])

  return nodes
    .map((node) => node.props || {})
    .filter((nodeProps) => nodeProps.href && nodeProps.title)
    .map((nodeProps) => ({
      icon: nodeProps.icon,
      title: nodeProps.title,
      description: nodeProps.description,
      href: nodeProps.href,
    }))
})

const links = computed(() => (slotLinks.value.length ? slotLinks.value : props.links))

const visualItems = computed(() => {
  const source = links.value.length ? links.value : []
  const palette = ['#007aff', '#34c759', '#ff9f0a', '#ff375f', '#5e5ce6', '#64d2ff']

  return copyOffsets.value.flatMap((copyY) =>
    copyOffsets.value.flatMap((copyX) =>
      Array.from({ length: rowCount.value }).flatMap((_, row) =>
        Array.from({ length: columnCount.value }).map((__, col) => {
          const baseIndex = (row * columnCount.value + col) % source.length
          const item = source[baseIndex]

          return {
            item,
            key: `${item.title}-${copyX}-${copyY}-${row}-${col}`,
            baseIndex,
            copyX,
            copyY,
            col,
            row,
            color: palette[baseIndex % palette.length],
          }
        }),
      ),
    ),
  )
})

const clamp = (min, max, value) => Math.min(max, Math.max(min, value))
const wrap = (value, cycle) => ((value % cycle) + cycle) % cycle

const maxIconScale = 1.5
const minIconGap = 8

let stepX = 78
let stepY = 68
let iconSizePx = 54
let cachedIcons = []
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
let resizeObserver
let hasDragged = false

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

const measure = () => {
  const width = stage.value?.clientWidth || root.value?.clientWidth || 600
  const height = stage.value?.clientHeight || root.value?.clientHeight || 480
  const mobile = isMobileWatch()

  iconSizePx = mobile ? clamp(34, 42, width / 6.6) : clamp(40, 54, width / 8.8)
  const safeDiameter = iconSizePx * maxIconScale + (mobile ? 6 : minIconGap)

  stepX = safeDiameter
  stepY = safeDiameter * (mobile ? 0.96 : 0.9)
  columnCount.value = mobile ? Math.max(4, Math.ceil(width / stepX) + 2) : Math.max(7, Math.ceil(width / stepX) + 6)
  rowCount.value = mobile ? Math.max(4, Math.ceil(height / stepY) + 2) : Math.max(8, Math.ceil(height / stepY) + 6)
  copyOffsets.value = [0]
  root.value?.style.setProperty('--watch-icon-size', `${iconSizePx.toFixed(2)}px`)
}

const refreshIconCache = () => {
  cachedIcons = root.value ? [...root.value.querySelectorAll('.watch-icon')] : []
}

const render = () => {
  renderFrame = 0
  if (!root.value || !links.value.length) return

  normalizeOffsets()

  const cycles = getCycles()
  const icons = cachedIcons.length ? cachedIcons : root.value.querySelectorAll('.watch-icon')

  icons.forEach((node) => {
    const baseIndex = Number(node.dataset.baseIndex || 0)
    const copyX = Number(node.dataset.copyX || 0)
    const copyY = Number(node.dataset.copyY || 0)
    const col = Number(node.dataset.col || 0)
    const row = Number(node.dataset.row || 0)
    const rowOffset = row % 2 ? stepX * 0.5 : 0
    const rawX = col * stepX + rowOffset + copyX * cycles.width - offsetX - cycles.width / 2
    const rawY = row * stepY + copyY * cycles.height - offsetY - cycles.height / 2
    const x = wrap(rawX + cycles.width / 2, cycles.width) - cycles.width / 2
    const y = wrap(rawY + cycles.height / 2, cycles.height) - cycles.height / 2
    const mobile = isMobileWatch()
    const distance = Math.hypot(x, y)
    const scale = mobile
      ? clamp(0.64, 1.16, 1.16 - distance / (stepX * 5))
      : clamp(0.46, maxIconScale, maxIconScale - distance / (stepX * 4.4))
    const opacity = mobile
      ? clamp(0.34, 0.9, 1 - distance / (stepX * 5.6))
      : clamp(0.18, 0.92, 1.02 - distance / (stepX * 6.2))

    node.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`
    node.style.opacity = opacity.toFixed(3)
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

const handlePointerDown = (event) => {
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

const handlePointerMove = (event) => {
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

const handlePointerUp = (event) => {
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

const handleIconClick = (event) => {
  if (!suppressClick) return

  event.preventDefault()
  event.stopPropagation()
}

const showTooltip = (event, item) => {
  if (isDragging || isMobileWatch()) return

  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  const tooltipNode = tooltip.value

  if (!tooltipNode) return

  if (tooltipTitle.value) tooltipTitle.value.textContent = item.title
  if (tooltipDescription.value) tooltipDescription.value.textContent = item.description

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
            :href="entry.item.href"
            target="_blank"
            rel="noreferrer"
            :data-base-index="entry.baseIndex"
            :data-copy-x="entry.copyX"
            :data-copy-y="entry.copyY"
            :data-col="entry.col"
            :data-row="entry.row"
            :aria-label="entry.item.title"
            :style="{ '--watch-color': entry.color }"
            draggable="false"
            @pointerenter="showTooltip($event, entry.item)"
            @pointerleave="hideTooltip"
            @focus="showTooltip($event, entry.item)"
            @blur="hideTooltip"
            @click="handleIconClick"
            @dragstart.prevent
          >
            <span>{{ entry.item.icon }}</span>
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
  border-radius: 20px;
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
  border-radius: 0;
}

.watch-stage {
  position: absolute;
  inset: 6px;
  z-index: 1;
  overflow: hidden;
  border-radius: inherit;
  background: transparent;
  box-shadow: none;
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

.watch-icon span {
  font-family: "Sora", sans-serif;
  font-size: 23px;
  font-weight: 800;
  line-height: 1;
}

.watch-card:not(.is-dragging) .watch-icon:hover,
.watch-card:not(.is-dragging) .watch-icon:focus-visible {
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
    inset: 4px;
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
