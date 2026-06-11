<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  accent?: string
  direction?: 'left' | 'right'
  reverse?: boolean
  scrollDistanceRatio?: number
}>(), {
  eyebrow: 'Horizontal gallery',
  accent: '#007aff',
  direction: 'left',
  reverse: false,
  scrollDistanceRatio: 0.58,
})

const root = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLDivElement | null>(null)
const strip = ref<HTMLDivElement | null>(null)
let motionMedia: gsap.MatchMedia | undefined
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let refreshFrame = 0

const isReversed = () => props.reverse || props.direction === 'right'

onMounted(async () => {
  await nextTick()

  const rootElement = root.value
  const wrapperElement = wrapper.value
  const stripElement = strip.value
  if (!rootElement || !wrapperElement || !stripElement) return

  motionMedia = gsap.matchMedia()

  motionMedia.add('(min-width: 721px)', () => {
    let removeRefreshListener: (() => void) | undefined
    let tween: gsap.core.Tween | undefined

    const context = gsap.context(() => {
      let pinWrapWidth = 0
      let horizontalScrollLength = 0

      const refresh = () => {
        pinWrapWidth = stripElement.scrollWidth
        horizontalScrollLength = Math.max(0, pinWrapWidth - wrapperElement.clientWidth)
      }

      const getScrollDistance = () => horizontalScrollLength * 1.05
      const cards = () => gsap.utils.toArray<HTMLElement>(stripElement.children)
      const getStartX = () => (isReversed() ? -horizontalScrollLength : 0)
      const getEndX = () => (isReversed() ? 0 : -horizontalScrollLength)

      refresh()

      gsap.set(stripElement, { x: getStartX })

      tween = gsap.fromTo(stripElement, {
        x: getStartX,
      }, {
        scrollTrigger: {
          scrub: true,
          trigger: rootElement,
          pin: rootElement,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
        },
        x: getEndX,
        ease: 'none',
      })

      const cardNodes = cards()
      if (cardNodes.length) {
        gsap.from(cardNodes, {
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: rootElement,
            start: 'top 70%',
            once: true,
          },
        })
      }

      ScrollTrigger.addEventListener('refreshInit', refresh)
      removeRefreshListener = () => ScrollTrigger.removeEventListener('refreshInit', refresh)

      const scheduleRefresh = () => {
        if (refreshFrame) return
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = 0
          refresh()
          gsap.set(stripElement, { x: getStartX })
          tween?.invalidate()
          tween?.scrollTrigger?.refresh()
        })
      }

      resizeObserver = new ResizeObserver(scheduleRefresh)
      resizeObserver.observe(wrapperElement)
      resizeObserver.observe(stripElement)

      mutationObserver = new MutationObserver(scheduleRefresh)
      mutationObserver.observe(stripElement, { childList: true, subtree: true })

      requestAnimationFrame(() => {
        tween?.scrollTrigger?.refresh()
      })
    }, rootElement)

    return () => {
      if (refreshFrame) cancelAnimationFrame(refreshFrame)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      removeRefreshListener?.()
      context.revert()
    }
  })

  motionMedia.add('(max-width: 720px)', () => {
    const context = gsap.context(() => {
      gsap.set(stripElement, { clearProps: 'transform' })

      const cardNodes = gsap.utils.toArray<HTMLElement>(stripElement.children)
      if (cardNodes.length) {
        gsap.from(cardNodes, {
          autoAlpha: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: rootElement,
            start: 'top 78%',
            once: true,
          },
        })
      }

      requestAnimationFrame(() => ScrollTrigger.refresh())
    }, rootElement)

    return () => context.revert()
  })
})

onBeforeUnmount(() => {
  if (refreshFrame) cancelAnimationFrame(refreshFrame)
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  motionMedia?.revert()
})
</script>

<template>
  <section
    ref="root"
    class="horizontal-gallery"
    :class="{ 'is-reversed': isReversed() }"
    :style="{ '--accent': accent }"
  >
    <div class="gallery-heading">
      <p>{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>

    <div ref="wrapper" class="horiz-gallery-wrapper">
      <div ref="strip" class="horiz-gallery-strip">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.horizontal-gallery {
  --gallery-card-width: clamp(360px, 32vw, 600px);
  --gallery-card-height: 480px;
  position: relative;
  min-height: 100svh;
  contain: layout paint style;
  contain-intrinsic-size: 100svh;
  overflow: hidden;
  display: grid;
  align-content: center;
  gap: 42px;
  padding: 86px max(24px, calc((100vw - 1240px) / 2));
  color: var(--page-fg);
  background: var(--page-bg);
}

.gallery-heading {
  width: min(860px, 100%);
  padding: 0 6px;
}

.horizontal-gallery.is-reversed .gallery-heading {
  justify-self: end;
  text-align: right;
}

.gallery-heading p {
  margin: 0 0 12px;
  color: color-mix(in srgb, var(--accent), #ffffff 18%);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gallery-heading h2 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(52px, 8.8vw, 112px);
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.horiz-gallery-wrapper,
.horiz-gallery-strip {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  will-change: transform;
}

.horiz-gallery-wrapper {
  width: 100%;
  min-width: 0;
}

.horiz-gallery-strip {
  width: 118vw;
  min-width: max-content;
  align-items: stretch;
  gap: 50px;
}

.horizontal-gallery.is-reversed .horiz-gallery-strip {
  flex-direction: row-reverse;
}

.horiz-gallery-strip :deep(.gallery-card) {
  box-sizing: border-box;
  flex: 0 0 var(--gallery-card-width);
  width: var(--gallery-card-width);
  height: var(--gallery-card-height);
  min-height: var(--gallery-card-height);
  max-height: var(--gallery-card-height);
  align-self: stretch;
}

@media (max-width: 720px) {
  .horizontal-gallery {
    --gallery-card-width: 100%;
    --gallery-card-height: clamp(300px, 76svh, 330px);
    min-height: auto;
    contain-intrinsic-size: auto 1560px;
    padding: 52px 14px;
    gap: 24px;
  }

  .gallery-heading {
    width: 100%;
  }

  .gallery-heading h2 {
    font-size: clamp(34px, 11vw, 50px);
  }

  .horiz-gallery-wrapper {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: visible;
    transform: none !important;
  }

  .horiz-gallery-strip {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    gap: 28px;
  }

  .horizontal-gallery.is-reversed .horiz-gallery-strip {
    flex-direction: column;
  }

  .horizontal-gallery.is-reversed .gallery-heading {
    justify-self: start;
    text-align: left;
  }

  .horiz-gallery-strip :deep(.gallery-card) {
    flex-basis: auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
}
</style>
