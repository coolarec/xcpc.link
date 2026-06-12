<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { fetchHeroPanelEmojis } from '../../../modules/home/api'

const props = withDefaults(defineProps<{
  motionActive?: boolean
}>(), {
  motionActive: true,
})

const root = ref<HTMLDivElement | null>(null)
const core = ref<HTMLDivElement | null>(null)
const title = ref<HTMLElement | null>(null)
const panels = ref<string[]>([])

let motionMedia: gsap.MatchMedia | undefined

const clamp01 = gsap.utils.clamp(0, 1)

const getTrackingRect = () => {
  const section = root.value?.closest('.tilt-section')

  return section?.getBoundingClientRect() ?? {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

const setupMotion = (isSmall: boolean) => {
  const rootElement = root.value
  const coreElement = core.value
  if (!rootElement || !coreElement) return undefined

  const cleanup: Array<() => void> = []
  const context = gsap.context(() => {
    const panelsElements = gsap.utils.toArray<HTMLElement>('.tilt-panel')
    const section = rootElement.closest<HTMLElement>('.tilt-section')
    const trackingTarget = section || window
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const disableMotion = isSmall || isCoarsePointer || reduceMotion
    const rotationRange = isSmall ? 6 : 15
    const coreShift = isSmall ? 12 : 30
    const titleShift = isSmall ? 22 : 84
    let latestPointerEvent: PointerEvent | undefined
    let pointerFrame = 0
    let trackingRect = getTrackingRect()

    if (section) {
      gsap.set(section, { perspective: isSmall ? 520 : 760 })
    }

    gsap.set(rootElement, {
      transformStyle: 'preserve-3d',
      transformOrigin: isSmall ? '50% 58%' : '50% 50%',
    })

    const rotateX = gsap.quickTo(rootElement, 'rotationX', {
      duration: 0.25,
      ease: 'power3.out',
    })
    const rotateY = gsap.quickTo(rootElement, 'rotationY', {
      duration: 0.25,
      ease: 'power3.out',
    })
    const coreX = gsap.quickTo(coreElement, 'x', {
      duration: 0.25,
      ease: 'power3.out',
    })
    const coreY = gsap.quickTo(coreElement, 'y', {
      duration: 0.25,
      ease: 'power3.out',
    })
    const titleCastX = gsap.quickTo('.title-cast', 'x', {
      duration: 0.24,
      ease: 'power2.out',
    })
    const titleCastY = gsap.quickTo('.title-cast', 'y', {
      duration: 0.24,
      ease: 'power2.out',
    })
    const titleXTo = title.value
      ? gsap.quickTo(title.value, 'x', { duration: 0.32, ease: 'power2.out' })
      : undefined
    const titleYTo = title.value
      ? gsap.quickTo(title.value, 'y', { duration: 0.32, ease: 'power2.out' })
      : undefined
    const titleScaleTo = title.value
      ? [
          gsap.quickTo(title.value, 'scaleX', { duration: 0.32, ease: 'power2.out' }),
          gsap.quickTo(title.value, 'scaleY', { duration: 0.32, ease: 'power2.out' }),
        ]
      : undefined

    gsap.set('.title-cast', { force3D: true, z: 132, scale: 1.08 })

    const updatePointerMotion = () => {
      pointerFrame = 0
      if (!latestPointerEvent) return

      const event = latestPointerEvent
      const rect = trackingRect
      const pointerX = clamp01((event.clientX - rect.left) / rect.width)
      const pointerY = clamp01((event.clientY - rect.top) / rect.height)
      const castX = (0.5 - pointerX) * titleShift * 1.15
      const castY = (0.5 - pointerY) * titleShift * 0.72

      section?.style.setProperty('--light-tx', `${(pointerX - 0.5) * 50}%`)
      section?.style.setProperty('--light-ty', `${(pointerY - 0.44) * 50}%`)

      titleCastX(castX)
      titleCastY(castY)

      rotateX(gsap.utils.interpolate(rotationRange, -rotationRange, pointerY))
      rotateY(gsap.utils.interpolate(-rotationRange, rotationRange, pointerX))
      coreX(gsap.utils.interpolate(-coreShift, coreShift, pointerX))
      coreY(gsap.utils.interpolate(-coreShift, coreShift, pointerY))

      if (title.value) {
        const titleX = gsap.utils.clamp(-1, 1, (pointerX - 0.5) * 2)
        const titleY = gsap.utils.clamp(-1, 1, (pointerY - 0.5) * 2)

        titleXTo?.(titleX * titleShift)
        titleYTo?.(titleY * titleShift)
        titleScaleTo?.forEach((scaleTo) => scaleTo(isSmall ? 1.02 : 1.045))
      }
    }

    const handlePointerMove = (event: Event) => {
      latestPointerEvent = event as PointerEvent
      if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointerMotion)
    }

    const resetTilt = () => {
      if (pointerFrame) {
        cancelAnimationFrame(pointerFrame)
        pointerFrame = 0
      }
      latestPointerEvent = undefined
      rotateX(0)
      rotateY(0)
      coreX(0)
      coreY(0)
      titleCastX(0)
      titleCastY(0)
      section?.style.setProperty('--light-tx', '0%')
      section?.style.setProperty('--light-ty', '0%')

      if (title.value) {
        titleXTo?.(0)
        titleYTo?.(0)
        titleScaleTo?.forEach((scaleTo) => scaleTo(1))
      }
    }

    if (!disableMotion) {
      const refreshTrackingRect = () => {
        trackingRect = getTrackingRect()
      }
      refreshTrackingRect()
      trackingTarget.addEventListener('pointermove', handlePointerMove)
      trackingTarget.addEventListener('pointerleave', resetTilt)
      window.addEventListener('blur', resetTilt)
      window.addEventListener('resize', refreshTrackingRect)
      cleanup.push(() => {
        if (pointerFrame) cancelAnimationFrame(pointerFrame)
        trackingTarget.removeEventListener('pointermove', handlePointerMove)
        trackingTarget.removeEventListener('pointerleave', resetTilt)
        window.removeEventListener('blur', resetTilt)
        window.removeEventListener('resize', refreshTrackingRect)
      })
    } else {
      resetTilt()
      if (panelsElements.length) {
        gsap.set(panelsElements, { autoAlpha: 1, z: 0, y: 0 })
      }
    }

    if (!disableMotion && panelsElements.length) {
      gsap.fromTo(
        panelsElements,
        {
          autoAlpha: 0,
          z: -180,
          y: 44,
        },
        {
          autoAlpha: 1,
          z: 0,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: {
            amount: 0.42,
            from: 'center',
          },
        },
      )
    }

    if (!disableMotion && panelsElements.length) {
      gsap.to(panelsElements, {
        y: 14,
        delay: 0.9,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.18,
          from: 'random',
        },
      })
    }

    if (!disableMotion) {
      gsap.from(coreElement, {
        autoAlpha: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 0.75,
        ease: 'power3.out',
      })
    }
  }, rootElement)

  return () => {
    cleanup.forEach((remove) => remove())
    context.revert()
  }
}

const startMotion = async () => {
  await nextTick()

  if (!root.value || motionMedia || !props.motionActive) return

  motionMedia = gsap.matchMedia()
  motionMedia.add('(max-width: 760px)', () => setupMotion(true))
  motionMedia.add('(min-width: 761px)', () => setupMotion(false))
}

onMounted(async () => {
  panels.value = await fetchHeroPanelEmojis()
  await nextTick()
  startMotion()
})

watch(
  () => props.motionActive,
  (active) => {
    if (active) {
      startMotion()
      return
    }

    motionMedia?.revert()
    motionMedia = undefined
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  motionMedia?.revert()
})
</script>

<template>
  <div ref="root" class="tilt-layer">
    <div class="tilt-orbit" aria-hidden="true"></div>
    <div ref="core" class="tilt-core">
      <span>ALGORITHM COLLECTION</span>
      <strong ref="title">XCPC</strong>
    </div>
    <div class="title-cast" aria-hidden="true">XCPC</div>
    <div
      v-for="(panel, index) in panels"
      :key="panel"
      class="tilt-panel"
      :class="`tilt-panel-${index + 1}`"
    >
      <span>{{ panel }}</span>
    </div>
  </div>
</template>

<style scoped>
.tilt-layer {
  position: relative;
  z-index: 1;
  width: min(80vw, 1080px);
  aspect-ratio: 1.62;
  transform-style: preserve-3d;
  will-change: transform;
}

.tilt-orbit {
  position: absolute;
  inset: 8%;
  border: 1px solid var(--hero-orbit-line);
  border-radius: 999px;
  transform: translateZ(-80px) rotateX(68deg);
}

.tilt-core,
.tilt-panel {
  position: absolute;
  border: 0;
  border-radius: 18px;
  background: var(--panel-bg);
  box-shadow: var(--hero-card-shadow);
  overflow: hidden;
}

.tilt-core::before,
.tilt-panel::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, var(--panel-highlight), transparent 38%);
  transform: translate3d(var(--light-tx, 0%), var(--light-ty, 0%), 0);
  pointer-events: none;
  z-index: 0;
}

.tilt-core {
  inset: 16% 21%;
  z-index: 3;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
  transform: translateZ(90px) rotateX(2.5deg) rotateY(-3deg) rotateZ(-1deg);
  box-shadow: var(--hero-core-shadow);
  will-change: transform;
}

.tilt-core span {
  position: relative;
  z-index: 1;
  color: var(--muted-fg);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tilt-core strong {
  position: relative;
  z-index: 1;
  display: inline-block;
  transform-origin: center;
  color: var(--panel-fg);
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(72px, 9vw, 132px);
  line-height: 0.92;
  letter-spacing: -0.03em;
  text-align: center;
  text-shadow: var(--title-glow);
  will-change: transform;
}

.title-cast {
  position: absolute;
  inset: 16% 21%;
  z-index: 2;
  display: grid;
  place-items: center;
  color: var(--title-cast-color);
  font-family: "Sora", sans-serif;
  font-size: clamp(72px, 9vw, 132px);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.03em;
  pointer-events: none;
  filter: blur(14px);
  opacity: var(--title-cast-opacity);
  mix-blend-mode: multiply;
  will-change: transform;
}

.tilt-panel {
  z-index: 1;
  width: 170px;
  height: 112px;
  display: grid;
  place-items: center;
  opacity: 0;
  visibility: hidden;
  color: var(--panel-fg);
  font-family: "Sora", sans-serif;
  font-size: 44px;
  font-weight: 800;
}

.tilt-panel span {
  position: relative;
  z-index: 1;
  line-height: 1;
  text-align: center;
}

.tilt-panel-1 {
  top: 5%;
  left: 8%;
  transform: translateZ(140px) rotateX(-6deg) rotateY(8deg) rotateZ(-8deg);
}

.tilt-panel-2 {
  top: 6%;
  right: 10%;
  transform: translateZ(118px) rotateX(5deg) rotateY(-7deg) rotateZ(7deg);
}

.tilt-panel-3 {
  top: 42%;
  left: 0;
  transform: translateZ(78px) rotateX(7deg) rotateY(5deg) rotateZ(5deg);
}

.tilt-panel-4 {
  top: 42%;
  right: 1%;
  transform: translateZ(100px) rotateX(-5deg) rotateY(-9deg) rotateZ(-5deg);
}

.tilt-panel-5 {
  bottom: 5%;
  left: 18%;
  transform: translateZ(124px) rotateX(4deg) rotateY(10deg) rotateZ(8deg);
}

.tilt-panel-6 {
  right: 20%;
  bottom: 1%;
  transform: translateZ(152px) rotateX(-7deg) rotateY(-4deg) rotateZ(-7deg);
}

@media (max-width: 860px) {
  .tilt-layer {
    width: min(90vw, 620px);
    aspect-ratio: 0.86;
  }

  .tilt-core {
    inset: 28% 6%;
  }

  .tilt-core strong {
    font-size: 58px;
  }

  .tilt-panel {
    display: none;
  }
}

@media (max-width: 560px) {
  .tilt-layer {
    width: 90vw;
    aspect-ratio: 0.86;
  }

  .tilt-core {
    inset: 29% 6%;
  }

  .tilt-core span {
    font-size: 11px;
  }

  .tilt-core strong {
    font-size: 46px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tilt-layer,
  .tilt-core,
  .tilt-panel {
    transition: none;
    transform: none;
  }
}
</style>
