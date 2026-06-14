<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { BookOpenCheck, ExternalLink, GraduationCap, PenTool, Rocket, Trophy, type LucideIcon } from '@lucide/vue'
import { useThemeStore } from '../../../../stores/theme'
import type { HeroDockItem } from '../../../../types/home'

const props = defineProps<{
  items: HeroDockItem[]
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
const dock = ref<HTMLDivElement | null>(null)
const hoveredLabel = ref('')
const themeStore = useThemeStore()

const iconMap: Record<NonNullable<HeroDockItem['icon']>, LucideIcon> = {
  book: BookOpenCheck,
  rocket: Rocket,
  users: GraduationCap,
  pen: PenTool,
  trophy: Trophy,
  lite: ExternalLink,
}

const getIcon = (item: HeroDockItem) => item.icon ? iconMap[item.icon] : undefined

let context: gsap.Context | undefined
let removeListeners: (() => void) | undefined

const teardownDock = () => {
  removeListeners?.()
  removeListeners = undefined
  context?.revert()
  context = undefined
}

const setupDock = () => {
  const dockElement = dock.value
  if (!dockElement) return

  teardownDock()

  context = gsap.context(() => {
    const icons = gsap.utils.toArray<HTMLElement>('.hero-dock-item')
    if (!icons.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(icons, {
        transformOrigin: '50% 115%',
        scaleX: 1,
        scaleY: 1,
        x: 0,
      })
      dockElement.style.setProperty('--dock-stretch', '1')
      return
    }

    const firstIcon = icons[0]
    
    // Explicitly set initial value to prevent GSAP from assuming 0 and causing the "starts from a line" bug
    gsap.set(dockElement, { '--dock-stretch': 1 })
    
    const stretchTo = gsap.quickTo(dockElement, '--dock-stretch', {
      duration: 0.46,
      ease: 'power3.out',
    })

    const iconTweens = icons.map(icon => ({
      x: gsap.quickTo(icon, 'x', { duration: 0.28, ease: 'power3.out' }),
      scaleX: gsap.quickTo(icon, 'scaleX', { duration: 0.28, ease: 'power3.out' }),
      scaleY: gsap.quickTo(icon, 'scaleY', { duration: 0.28, ease: 'power3.out' })
    }))

    gsap.set(icons, {
      transformOrigin: '50% 115%',
      scaleX: 1,
      scaleY: 1,
      x: 0,
      force3D: true,
    })

    const updateDock = (event: PointerEvent) => {
      if (!firstIcon) return

      const min = firstIcon.offsetWidth + 10
      const max = Math.min(104, min * 2.05)
      const bound = min * Math.PI
      const offset = dockElement.getBoundingClientRect().left + firstIcon.offsetLeft
      const pointer = event.clientX - offset
      let maxScale = 1

      icons.forEach((_, index) => {
        const distance = index * min + min / 2 - pointer
        let x = 0
        let scale = 1

        if (-bound < distance && distance < bound) {
          const rad = (distance / min) * 0.5
          scale = 1 + (max / min - 1) * Math.cos(rad)
          x = 2 * (max - min) * Math.sin(rad)
        } else {
          x = (-bound < distance ? 2 : -2) * (max - min)
        }

        maxScale = Math.max(maxScale, scale)

        iconTweens[index].x(x)
        iconTweens[index].scaleX(scale)
        iconTweens[index].scaleY(scale)
      })

      stretchTo(1 + (maxScale - 1) * 0.7)
    }

    const resetDock = () => {
      icons.forEach((_, index) => {
        iconTweens[index].x(0)
        iconTweens[index].scaleX(1)
        iconTweens[index].scaleY(1)
      })
      stretchTo(1)
    }

    dockElement.addEventListener('pointermove', updateDock)
    dockElement.addEventListener('pointerleave', resetDock)
    removeListeners = () => {
      dockElement.removeEventListener('pointermove', updateDock)
      dockElement.removeEventListener('pointerleave', resetDock)
    }
  }, dockElement)
}

onMounted(async () => {
  await nextTick()
  if (props.items.length) setupDock()
})

watch(
  () => props.items,
  async (items) => {
    if (!items.length) {
      teardownDock()
      return
    }

    await nextTick()
    setupDock()
  },
  { deep: true },
)

onBeforeUnmount(teardownDock)
</script>

<template>
  <div
    ref="dock"
    class="hero-dock"
    :class="{ 'is-day': themeStore.isDayMode, 'is-night': themeStore.isDarkMode }"
    aria-label="Jump to algorithm sections"
  >
    <div class="dock-tooltip" :class="{ 'is-visible': hoveredLabel }" aria-hidden="true">
      {{ hoveredLabel }}
    </div>

    <component
      v-for="(item, index) in items"
      :key="item.label"
      :is="item.to ? 'router-link' : 'button'"
      class="hero-dock-item"
      :type="item.to ? undefined : 'button'"
      :to="item.to"
      :aria-label="`Jump to ${item.label}`"
      @click="!item.to && emit('select', index)"
      @focus="hoveredLabel = item.tooltip || item.label"
      @blur="hoveredLabel = ''"
      @pointerenter="hoveredLabel = item.tooltip || item.label"
      @pointerleave="hoveredLabel = ''"
    >
      <span class="dock-icon-plate">
        <component
          :is="getIcon(item)"
          v-if="getIcon(item)"
          :size="24"
          :stroke-width="2.25"
          aria-hidden="true"
        />
        <template v-else>{{ item.glyph }}</template>
      </span>
    </component>
  </div>
</template>

<style scoped>
.hero-dock {
  --dock-glass: rgba(22, 22, 24, 0.58);
  --dock-glass-line: rgba(255, 255, 255, 0.14);
  --dock-glass-glow: rgba(255, 255, 255, 0.1);
  --dock-icon-color: #f5f5f7;
  --dock-focus-bg: rgba(255, 255, 255, 0.14);
  --dock-shadow: rgba(0, 0, 0, 0.18);

  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 8;
  display: flex;
  align-items: flex-end;
  gap: 8px; /* macOS dock gap */
  height: 106px;
  padding: 14px 16px 19px;
  border: 0;
  border-radius: 36px;
  background: transparent;
  box-shadow: none;
  transform: translateX(-50%);
  isolation: isolate;
}

.hero-dock.is-day {
  --dock-glass: rgba(255, 255, 255, 0.82);
  --dock-glass-line: rgba(255, 255, 255, 0.96);
  --dock-glass-glow: #ffffff;
  --dock-icon-color: #111111;
  --dock-focus-bg: #ffffff;
  --dock-shadow: rgba(0, 0, 0, 0.06);
}

.hero-dock.is-night {
  --dock-glass: rgba(22, 22, 24, 0.58);
  --dock-glass-line: rgba(255, 255, 255, 0.14);
  --dock-glass-glow: rgba(255, 255, 255, 0.1);
  --dock-icon-color: #f5f5f7;
  --dock-focus-bg: rgba(255, 255, 255, 0.14);
  --dock-shadow: rgba(0, 0, 0, 0.18);
}

.hero-dock::before {
  content: '';
  position: absolute;
  top: 16px;
  bottom: 16px;
  /* 使用 left 和 right 基于百分比向外延伸，完美解决 0 宽 bug，同时保持绝对的半圆端点 */
  left: calc(50% * (1 - var(--dock-stretch, 1)));
  right: calc(50% * (1 - var(--dock-stretch, 1)));
  z-index: 0;
  border-radius: 999px; /* Force perfect semi-circle ends */
  border: 1px solid var(--dock-glass-line);
  background: var(--dock-glass);
  box-shadow:
    inset 0 1px 1px var(--dock-glass-glow),
    0 10px 24px var(--dock-shadow);
  backdrop-filter: blur(48px) saturate(2);
  -webkit-backdrop-filter: blur(48px) saturate(2);
  will-change: left, right;
}

.dock-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 2;
  min-width: 104px;
  padding: 10px 16px;
  border: 1px solid var(--dock-glass-line);
  border-radius: 999px;
  background: var(--dock-glass);
  color: var(--dock-icon-color);
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 10px) scale(0.96);
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.2, 0.9, 0.2, 1);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
}

.dock-tooltip.is-visible {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}

.hero-dock-item {
  position: relative;
  z-index: 1;
  width: 60px;
  height: 60px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--dock-icon-color);
  text-decoration: none;
  cursor: pointer;
  transform-origin: 50% 115%;
  will-change: transform;
}

.hero-dock-item:hover {
  background: transparent;
}

.dock-icon-plate {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.dock-icon-plate :deep(svg) {
  width: 32px;
  height: 32px;
  stroke-width: 1.8;
}

.hero-dock-item:focus-visible {
  outline: none;
}

.hero-dock-item:focus-visible .dock-icon-plate {
  outline: 2px solid var(--dock-focus-bg);
  outline-offset: -4px;
  border-radius: 14px;
}

@media (max-width: 860px) {
  .hero-dock {
    height: 98px;
    gap: 6px;
    padding: 13px 12px 15px;
  }

  .hero-dock::before {
    inset: 14px 0 14px;
  }

  .hero-dock-item {
    width: 52px;
    height: 52px;
  }

  .dock-icon-plate {
    width: 40px;
    font-size: 16px;
  }

  .dock-icon-plate :deep(svg) {
    width: 26px;
    height: 26px;
  }
}
</style>
