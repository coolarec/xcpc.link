<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  active: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['hidden'])

const root = ref(null)
const logo = ref(null)
const word = ref(null)
const progress = ref(null)
const iconUrl = `${import.meta.env.BASE_URL}favicon.svg`

let context
let loopTimeline
let exitTimeline

const leave = () => {
  if (!root.value || exitTimeline?.isActive()) return

  loopTimeline?.pause()

  exitTimeline = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => emit('hidden'),
  })

  exitTimeline
    .to(progress.value, { scaleX: 1, duration: 0.28 }, 0)
    .to(logo.value, { scale: 0.96, autoAlpha: 0, duration: 0.34 }, 0.08)
    .to(word.value, { y: -12, autoAlpha: 0, duration: 0.32 }, 0.1)
    .to(root.value, { autoAlpha: 0, duration: 0.42 }, 0.22)
}

onMounted(async () => {
  await nextTick()

  if (!root.value) return

  context = gsap.context(() => {
    gsap.set(progress.value, { scaleX: 0.08, transformOrigin: '0% 50%' })

    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from('.loader-shell', { y: 18, autoAlpha: 0, duration: 0.55 })
      .from('.loader-site-icon', { scale: 0.86, autoAlpha: 0, duration: 0.46 }, 0.08)
      .from(word.value, { x: 18, autoAlpha: 0, duration: 0.42 }, 0.16)
      .to(progress.value, { scaleX: 0.72, duration: 0.88, ease: 'power2.inOut' }, 0.18)

    loopTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.05 })
    loopTimeline
      .to('.loader-site-icon', {
        scale: 1.035,
        duration: 0.86,
        ease: 'sine.inOut',
      }, 0)
      .to('.loader-site-icon', {
        scale: 1,
        duration: 0.86,
        ease: 'sine.inOut',
      })

    if (!props.active) {
      leave()
    }
  }, root.value)
})

watch(
  () => props.active,
  (active) => {
    if (!active) leave()
  },
)

onBeforeUnmount(() => {
  exitTimeline?.kill()
  loopTimeline?.kill()
  context?.revert()
})
</script>

<template>
  <div ref="root" class="loading-overlay" role="status" aria-live="polite" aria-label="Loading XCPC link">
    <div class="loader-shell">
      <div ref="logo" class="loader-mark" aria-hidden="true">
        <img class="loader-site-icon" :src="iconUrl" alt="" draggable="false" />
      </div>

      <div ref="word" class="loader-content">
        <div class="loader-copy">
          <strong>XCPC.LINK</strong>
          <span>Preparing collection space</span>
        </div>

        <div class="loader-progress" aria-hidden="true">
          <span ref="progress"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--panel-fg), transparent 88%), transparent 34%),
    var(--hero-bg);
  color: var(--panel-fg);
  pointer-events: auto;
  transform: translateZ(0);
}

.loader-shell {
  width: min(82vw, 560px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 28px;
  text-align: left;
  transform: translateZ(0);
}

.loader-mark {
  position: relative;
  width: 128px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  transform: translateZ(0);
  will-change: transform, opacity;
}

.loader-site-icon {
  position: relative;
  width: 104px;
  aspect-ratio: 1;
  display: block;
  border-radius: 24px;
  box-shadow:
    inset 0 0 0 1px var(--soft-line),
    0 18px 52px rgba(0, 0, 0, 0.28);
  user-select: none;
  will-change: transform, opacity;
}

.loader-content {
  min-width: 0;
  display: grid;
  gap: 18px;
  will-change: transform, opacity;
}

.loader-copy {
  display: grid;
  gap: 6px;
}

.loader-copy strong {
  font-family: "Sora", sans-serif;
  font-size: clamp(32px, 6vw, 48px);
  line-height: 1;
  letter-spacing: 0;
}

.loader-copy span {
  color: var(--muted-fg);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.loader-progress {
  width: min(42vw, 280px);
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-fg), transparent 86%);
}

.loader-progress span {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--panel-fg);
  transform: scaleX(0);
  will-change: transform;
}

@media (max-width: 560px) {
  .loader-shell {
    width: 88vw;
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 22px;
    text-align: center;
  }

  .loader-mark {
    width: 112px;
  }

  .loader-site-icon {
    width: 92px;
    border-radius: 21px;
  }

  .loader-content {
    justify-items: center;
  }

  .loader-progress {
    width: min(68vw, 260px);
  }
}
</style>
