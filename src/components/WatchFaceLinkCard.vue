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
const activeLink = ref(null)
const showInfo = ref(false)
const showDragHint = ref(false)
const hasDragged = ref(false)
const columnCount = ref(8)
const rowCount = ref(8)
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

const active = computed(() => activeLink.value)

const visualItems = computed(() => {
  const source = links.value.length ? links.value : []
  const copies = [-1, 0, 1]
  const palette = ['#007aff', '#34c759', '#ff9f0a', '#ff375f', '#5e5ce6', '#64d2ff']

  return copies.flatMap((copyY) =>
    copies.flatMap((copyX) =>
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

let stepX = 78
let stepY = 68
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
let inertiaFrame = 0
let resizeObserver

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
  const iconSize = clamp(40, 54, width / 8.8)

  stepX = iconSize * 1.42
  stepY = iconSize * 1.22
  columnCount.value = Math.max(6, Math.ceil(width / stepX) + 2)
  rowCount.value = Math.max(7, Math.ceil(height / stepY) + 2)
}

const render = () => {
  if (!root.value || !links.value.length) return

  normalizeOffsets()

  const cycles = getCycles()
  const icons = root.value.querySelectorAll('.watch-icon')

  icons.forEach((node) => {
    const baseIndex = Number(node.dataset.baseIndex || 0)
    const copyX = Number(node.dataset.copyX || 0)
    const copyY = Number(node.dataset.copyY || 0)
    const col = Number(node.dataset.col || 0)
    const row = Number(node.dataset.row || 0)
    const rowOffset = row % 2 ? stepX * 0.5 : 0
    const x = col * stepX + rowOffset + copyX * cycles.width - offsetX - cycles.width / 2
    const y = row * stepY + copyY * cycles.height - offsetY - cycles.height / 2
    const distance = Math.hypot(x, y)
    const scale = clamp(0.46, 1.3, 1.3 - distance / (stepX * 4.4))
    const opacity = clamp(0.18, 0.92, 1.02 - distance / (stepX * 6.2))

    node.style.setProperty('--watch-x', x.toFixed(2))
    node.style.setProperty('--watch-y', y.toFixed(2))
    node.style.setProperty('--watch-scale', scale.toFixed(3))
    node.style.setProperty('--watch-opacity', opacity.toFixed(3))
    node.style.zIndex = String(Math.round(1000 - distance))
  })
}

const updateNearestLink = (event) => {
  const source = links.value

  if (!stage.value || !source.length) return

  const icons = [...stage.value.querySelectorAll('.watch-icon')]
  const rect = stage.value.getBoundingClientRect()
  const pointerX = event.clientX - rect.left - rect.width / 2
  const pointerY = event.clientY - rect.top - rect.height / 2
  let nearest
  let nearestDistance = Number.POSITIVE_INFINITY

  icons.forEach((icon) => {
    const x = Number(icon.style.getPropertyValue('--watch-x') || 0)
    const y = Number(icon.style.getPropertyValue('--watch-y') || 0)
    const distance = (x - pointerX) ** 2 + (y - pointerY) ** 2

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = icon
    }
  })

  const baseIndex = Number(nearest?.dataset.baseIndex || 0)
  const next = source[baseIndex] || null

  if (next) {
    activeLink.value = next
    showInfo.value = true
  }
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

  updateNearestLink(event)

  const now = performance.now()
  const elapsed = Math.max(16, now - lastTime)
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  const deltaX = event.clientX - lastX
  const deltaY = event.clientY - lastY

  if (Math.hypot(dx, dy) > 7) {
    suppressClick = true
    hasDragged.value = true
    showDragHint.value = false
  }

  offsetX = startOffsetX - dx
  offsetY = startOffsetY - dy
  velocityX = -deltaX / elapsed
  velocityY = -deltaY / elapsed
  lastX = event.clientX
  lastY = event.clientY
  lastTime = now
  render()
  event.preventDefault()
}

const handlePointerUp = (event) => {
  if (!isDragging) return

  isDragging = false
  root.value?.classList.remove('is-dragging')
  root.value?.releasePointerCapture?.(event.pointerId)

  if (Math.hypot(velocityX, velocityY) > 0.018) {
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

const showFaceHint = () => {
  if (hasDragged.value) return
  showDragHint.value = true
}

const hideFaceHint = () => {
  showDragHint.value = false
  showInfo.value = false
  activeLink.value = null
}

const showIconInfo = (item) => {
  activeLink.value = item
  showInfo.value = true
}

const hideIconInfo = () => {
  if (isDragging) return
  showInfo.value = false
  activeLink.value = null
}

onMounted(async () => {
  await nextTick()

  if (!root.value) return

  measure()
  await nextTick()
  render()

  resizeObserver = new ResizeObserver(() => {
    measure()
    requestAnimationFrame(render)
  })
  resizeObserver.observe(root.value)
})

onBeforeUnmount(() => {
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
        :class="{ 'is-showing-info': showInfo }"
        @pointerenter="showFaceHint"
        @pointerleave="hideFaceHint"
      >
        <div ref="stage" class="watch-stage" aria-label="Draggable related links">
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
            @pointerenter="showIconInfo(entry.item)"
            @pointerleave="hideIconInfo"
            @focus="showIconInfo(entry.item)"
            @blur="hideIconInfo"
            @click="handleIconClick"
            @dragstart.prevent
          >
            <span>{{ entry.item.icon }}</span>
          </a>
        </div>

        <div v-if="showDragHint" class="watch-drag-hint" aria-hidden="true">
          <span class="watch-drag-grip"></span>
          <span>拖动</span>
        </div>

        <div v-if="showInfo && active" class="watch-info" aria-live="polite">
          <span>{{ title }}</span>
          <h3>{{ active?.title }}</h3>
          <p>{{ active?.description }}</p>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.gallery-card {
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

.watch-face::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1500;
  height: 42%;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent,
    color-mix(in srgb, var(--card-bg), transparent 42%) 56%,
    color-mix(in srgb, var(--card-bg), transparent 8%)
  );
  opacity: 0;
  transition: opacity 0.18s ease;
}

.watch-face.is-showing-info::after {
  opacity: 1;
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
  --watch-x: 0;
  --watch-y: 0;
  --watch-scale: 0.7;
  --watch-opacity: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 54px;
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
  opacity: var(--watch-opacity);
  text-decoration: none;
  user-select: none;
  -webkit-user-drag: none;
  transform:
    translate(calc(var(--watch-x) * 1px), calc(var(--watch-y) * 1px))
    translate(-50%, -50%)
    scale(var(--watch-scale));
  will-change: transform, opacity;
}

.watch-icon:hover,
.watch-icon:focus-visible {
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff, transparent 56%),
    inset 0 -10px 18px rgba(0, 0, 0, 0.16),
    0 18px 44px color-mix(in srgb, var(--watch-color), transparent 68%);
}

.watch-icon span {
  font-family: "Sora", sans-serif;
  font-size: 23px;
  font-weight: 800;
  line-height: 1;
}

.watch-info {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 22px;
  z-index: 2001;
  min-height: 102px;
  display: grid;
  align-content: end;
  pointer-events: none;
  text-shadow:
    0 2px 16px var(--card-bg),
    0 1px 2px var(--card-bg);
}

.watch-info span {
  color: color-mix(in srgb, var(--accent), #ffffff 18%);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.watch-info h3 {
  margin: 4px 0 8px;
  color: var(--page-fg);
  font-family: "Sora", sans-serif;
  font-size: clamp(34px, 4.4vw, 58px);
  font-weight: 800;
  line-height: 0.94;
  letter-spacing: -0.03em;
}

.watch-info p {
  max-width: 390px;
  margin: 0;
  color: var(--muted-fg);
  font-size: 15px;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .gallery-card {
    width: 100%;
    height: 360px;
    padding: 20px;
    border-radius: 18px;
  }

  .watch-stage {
    inset: 4px;
  }

  .watch-shell {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .watch-rail span {
    font-size: 10px;
    letter-spacing: 0.14em;
  }

  .watch-face::after {
    height: 48%;
  }

  .watch-info h3 {
    font-size: clamp(32px, 10vw, 46px);
  }

  .watch-info p {
    font-size: 14px;
  }
}
</style>
