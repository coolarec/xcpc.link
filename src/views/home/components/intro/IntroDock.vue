<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { BookOpenCheck, GraduationCap, PenTool, Rocket, Trophy, type LucideIcon } from '@lucide/vue'
import type { HeroDockItem } from '../../../../types/home'

const props = defineProps<{
  items: HeroDockItem[]
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
const dock = ref<HTMLDivElement | null>(null)

const iconMap: Record<NonNullable<HeroDockItem['icon']>, LucideIcon> = {
  book: BookOpenCheck,
  rocket: Rocket,
  users: GraduationCap,
  pen: PenTool,
  trophy: Trophy,
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
  <div ref="dock" class="hero-dock" aria-label="Jump to algorithm sections">
    <button
      v-for="(item, index) in items"
      :key="item.label"
      class="hero-dock-item"
      type="button"
      :aria-label="`Jump to ${item.label}`"
      @click="emit('select', index)"
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
    </button>
  </div>
</template>

<style scoped>
.hero-dock {
  --dock-stretch: 1;
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 8;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 106px;
  padding: 14px 16px 19px;
  border: 0;
  border-radius: 24px;
  background: transparent;
  box-shadow: none;
  transform: translateX(-50%);
  isolation: isolate;
}

.hero-dock::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--page-fg), transparent 92%), transparent 44%),
    color-mix(in srgb, var(--panel-bg), transparent 18%);
  box-shadow: var(--dock-shadow);
  backdrop-filter: blur(30px) saturate(1.42);
  transform: scaleX(var(--dock-stretch));
  transform-origin: 50% 100%;
  will-change: transform;
}

.hero-dock-item {
  position: relative;
  z-index: 1;
  width: 66px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 18px;
  background: var(--card-bg);
  color: var(--page-fg); /* Monochrome (Black in Light, White in Dark) */
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 0 0 1px var(--soft-line);
  cursor: pointer;
  transform-origin: 50% 115%;
  will-change: transform;
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.hero-dock-item:hover {
  background: color-mix(in srgb, var(--card-bg), var(--page-fg) 2%);
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
  stroke-width: 2;
}

.hero-dock-item:focus-visible {
  outline: 3px solid rgba(0, 122, 255, 0.34);
  outline-offset: 4px;
}

@media (max-width: 860px) {
  .hero-dock {
    height: 98px;
    gap: 9px;
    padding: 13px 12px 15px;
  }

  .hero-dock-item {
    width: 58px;
  }

  .dock-icon-plate {
    width: 40px;
    font-size: 16px;
  }

  .dock-icon-plate :deep(svg) {
    width: 22px;
    height: 22px;
  }
}
</style>
