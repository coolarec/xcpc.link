<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['select'])
const dock = ref(null)

let context
let removeListeners

onMounted(async () => {
  await nextTick()

  if (!dock.value) return

  context = gsap.context(() => {
    const icons = gsap.utils.toArray('.hero-dock-item')
    const firstIcon = icons[0]

    gsap.set(icons, {
      transformOrigin: '50% 115%',
      scale: 1,
      x: 0,
    })

    const updateDock = (event) => {
      if (!firstIcon) return

      const min = firstIcon.offsetWidth + 10
      const max = Math.min(104, min * 2.05)
      const bound = min * Math.PI
      const offset = dock.value.getBoundingClientRect().left + firstIcon.offsetLeft
      const pointer = event.clientX - offset

      icons.forEach((icon, index) => {
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

        gsap.to(icon, {
          duration: 0.28,
          x,
          scale,
          ease: 'power3.out',
        })
      })
    }

    const resetDock = () => {
      gsap.to(icons, {
        duration: 0.28,
        x: 0,
        scale: 1,
        ease: 'power3.out',
      })
    }

    dock.value.addEventListener('pointermove', updateDock)
    dock.value.addEventListener('pointerleave', resetDock)
    removeListeners = () => {
      dock.value?.removeEventListener('pointermove', updateDock)
      dock.value?.removeEventListener('pointerleave', resetDock)
    }
  }, dock.value)
})

onBeforeUnmount(() => {
  removeListeners?.()
  context?.revert()
})
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
      <span>{{ item.glyph }}</span>
    </button>
  </div>
</template>

<style scoped>
.hero-dock {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 8;
  display: flex;
  align-items: flex-end;
  gap: 13px;
  height: 104px;
  padding: 14px 16px 16px;
  border: 0;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(30px) saturate(1.42);
  transform: translateX(-50%);
}

.hero-dock-item {
  width: 66px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 18px;
  background: #f5f5f7;
  color: #1d1d1f;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.035);
  cursor: pointer;
  transform-origin: 50% 115%;
  will-change: transform;
}

.hero-dock-item span {
  width: 38px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #1d1d1f;
  color: #f5f5f7;
  font-size: 18px;
  font-weight: 850;
  line-height: 1;
}

.hero-dock-item:focus-visible {
  outline: 3px solid rgba(0, 122, 255, 0.34);
  outline-offset: 4px;
}

@media (max-width: 860px) {
  .hero-dock {
    height: 98px;
    padding: 13px 13px 15px;
  }

  .hero-dock-item {
    width: 64px;
  }

  .hero-dock-item span {
    width: 36px;
    font-size: 16px;
  }
}
</style>
