<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AlgorithmBackground from './components/AlgorithmBackground.vue'
import GalleryCardPlaceholder from './components/GalleryCardPlaceholder.vue'
import HeroDock from './components/HeroDock.vue'
import HeroTiltCards from './components/HeroTiltCards.vue'
import HorizontalGallery from './components/HorizontalGallery.vue'
import { fetchHeroDockItems, fetchHomeGalleries } from '../../modules/home/api'
import type { AsyncVueModule, HeroDockItem, HomeGallerySection } from '../../types/home'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

const asyncCardOptions = (loader: () => Promise<AsyncVueModule<Component>>) => ({
  loader,
  loadingComponent: GalleryCardPlaceholder,
  delay: 0,
})

const GalleryLinkCard = defineAsyncComponent(asyncCardOptions(() => import('./components/GalleryLinkCard.vue')))
const MotionFooter = defineAsyncComponent(() => import('./components/MotionFooter.vue'))
const WatchFaceLinkCard = defineAsyncComponent(
  asyncCardOptions(() => import('./components/WatchFaceLinkCard.vue')),
)

const pageRoot = ref<HTMLElement | null>(null)
const tiltSection = ref<HTMLElement | null>(null)
const gallerySection = ref<HTMLElement | null>(null)
const modeToggle = ref<HTMLElement | null>(null)
const isDayMode = ref(false)
const isHeroMotionActive = ref(false)
const galleries = ref<HomeGallerySection[]>([])
const dockItems = ref<HeroDockItem[]>([])

let context: gsap.Context | undefined
let removePreloaderListener: (() => void) | undefined

const toggleTheme = () => {
  isDayMode.value = !isDayMode.value

  if (!modeToggle.value) return

  gsap.fromTo(
    modeToggle.value,
    { scaleX: 0.94, scaleY: 0.94 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: 0.34,
      ease: 'back.out(2)',
      overwrite: true,
    },
  )
}

const scrollToGallery = (index: number): void => {
  const section = gallerySection.value
  if (!section) return

  const galleries = section.querySelectorAll<HTMLElement>('.horizontal-gallery')
  const target = galleries.item(index)

  if (!target) return

  gsap.to(window, {
    duration: 1.15,
    scrollTo: {
      y: target,
      offsetY: 0,
    },
    ease: 'power3.inOut',
  })
}

const startHeroMotion = () => {
  isHeroMotionActive.value = true
}

const notifyPreloaderReady = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('app-preloader:ready'))
    })
  })
}

onMounted(async () => {
  dockItems.value = await fetchHeroDockItems()
  galleries.value = await fetchHomeGalleries()
  await nextTick()

  const root = pageRoot.value
  const tilt = tiltSection.value
  const second = gallerySection.value

  if (!root) return

  context = gsap.context(() => {
    const media = gsap.matchMedia()

    media.add('(min-width: 761px)', () => {
      if (!tilt || !second) return undefined

      const timeline = gsap
        .timeline({
          scrollTrigger: {
            trigger: tilt,
            start: 'bottom bottom',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          tilt,
          { scaleX: 1, scaleY: 1, autoAlpha: 1 },
          {
            scaleX: 0.7,
            scaleY: 0.7,
            autoAlpha: 0.5,
            ease: 'none',
            duration: 0.9,
          },
        )
        .to(tilt, {
          autoAlpha: 0,
          ease: 'none',
          duration: 0.1,
        })

      return () => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
      }
    })

    media.add('(max-width: 760px)', () => {
      if (!tilt || !second) return undefined

      const timeline = gsap
        .timeline({
          scrollTrigger: {
            trigger: tilt,
            start: 'top top',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          tilt,
          { scaleX: 1, scaleY: 1, autoAlpha: 1 },
          {
            scaleX: 0.92,
            scaleY: 0.92,
            autoAlpha: 0.72,
            ease: 'none',
            duration: 0.85,
          },
        )
        .to(tilt, {
          autoAlpha: 0,
          ease: 'none',
          duration: 0.15,
        })

      return () => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
      }
    })

    if (window.innerWidth <= 760) {
      window.scrollTo(0, 0)
    }

    ScrollTrigger.refresh()

    return () => media.revert()
  }, root)

  const preloader = document.getElementById('app-preloader')

  if (preloader && !preloader.classList.contains('is-hidden')) {
    const handlePreloaderHidden = () => startHeroMotion()
    window.addEventListener('app-preloader:hidden', handlePreloaderHidden, { once: true })
    removePreloaderListener = () => {
      window.removeEventListener('app-preloader:hidden', handlePreloaderHidden)
    }
    notifyPreloaderReady()
  } else {
    requestAnimationFrame(startHeroMotion)
  }
})

onBeforeUnmount(() => {
  removePreloaderListener?.()
  context?.revert()
})
</script>

<template>
  <main ref="pageRoot" class="motion-page theme-scope" :class="{ 'is-day': isDayMode }">
    <section ref="tiltSection" class="tilt-section" aria-label="Cursor-driven perspective tilt">
      <AlgorithmBackground />
      <button
        ref="modeToggle"
        class="mode-toggle"
        type="button"
        :aria-label="isDayMode ? 'Switch to night mode' : 'Switch to day mode'"
        :aria-pressed="isDayMode"
        @click="toggleTheme"
      >
        <span class="mode-icon mode-icon-sun" aria-hidden="true"></span>
        <span class="mode-icon mode-icon-moon" aria-hidden="true"></span>
      </button>
      <p class="demo-label">XCPC.LINK</p>
      <HeroTiltCards :motion-active="isHeroMotionActive" />
      <HeroDock :items="dockItems" @select="scrollToGallery" />
    </section>

    <section ref="gallerySection" class="gallery-section" aria-label="Horizontal algorithm galleries">
      <HorizontalGallery
        v-for="gallery in galleries"
        :key="gallery.title"
        :eyebrow="gallery.eyebrow"
        :title="gallery.title"
        :accent="gallery.accent"
        :direction="gallery.direction"
        :reverse="gallery.reverse"
      >
        <GalleryLinkCard
          v-for="(card, cardIndex) in gallery.cards"
          :key="`${gallery.title}-${card.websiteTitle}`"
          :avatar-url="card.avatarUrl"
          :website-url="card.websiteUrl"
          :website-title="card.websiteTitle"
          :website-description="card.websiteDescription"
          :accent="gallery.accent"
        />

        <WatchFaceLinkCard
          v-if="gallery.watch?.links?.length"
          :title="gallery.watch.title"
          :description="gallery.watch.description"
          :links="gallery.watch.links"
          :accent="gallery.accent"
        />
      </HorizontalGallery>
    </section>

    <MotionFooter />
  </main>
</template>

<style scoped>
.motion-page {
  min-height: 100svh;
  overflow-x: hidden;
  background: var(--page-bg);
  color: var(--page-fg);
  transition:
    background-color 0.45s ease,
    color 0.45s ease;
}

.tilt-section {
  --light-x: 50%;
  --light-y: 44%;
  position: relative;
  z-index: 1;
  min-height: 100svh;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--hero-bg);
  transform-origin: center bottom;
  isolation: isolate;
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23ffffff' fill-opacity='0.5'/%3E%3C/svg%3E") 30 30, auto;
}

.tilt-section :deep(*) {
  cursor: inherit;
}

.is-day .tilt-section {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%231d1d1f' fill-opacity='0.5'/%3E%3C/svg%3E") 30 30, auto;
}

.mode-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  width: 78px;
  height: 42px;
  overflow: hidden;
  display: block;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-bg), transparent 18%);
  box-shadow:
    inset 0 0 0 1px var(--soft-line),
    0 16px 50px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(24px) saturate(1.25);
}

.mode-toggle::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1;
  width: 34px;
  aspect-ratio: 1;
  border-radius: 999px;
  background: var(--page-fg);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.22),
    inset 0 0 0 1px color-mix(in srgb, var(--soft-line), transparent 20%);
  transition:
    transform 0.46s cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 0.3s ease;
}

.is-day .mode-toggle::before {
  transform: translateX(36px);
}

.mode-icon {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 16px;
  aspect-ratio: 1;
  border-radius: 999px;
  transform: translateY(-50%);
  transition:
    background-color 0.32s ease,
    box-shadow 0.32s ease,
    opacity 0.32s ease;
}

.mode-icon-sun {
  right: 13px;
  background: #ffcc33;
  box-shadow:
    0 0 0 3px rgba(255, 204, 51, 0.22),
    0 0 12px rgba(255, 184, 42, 0.32);
  opacity: 0.5;
}

.mode-icon-moon {
  left: 13px;
  background: #f5f7fb;
  box-shadow: inset -5px -2px 0 #8f9ab2;
  opacity: 1;
}

.is-day .mode-icon-sun {
  opacity: 1;
}

.is-day .mode-icon-moon {
  opacity: 0.5;
}

.demo-label {
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 5;
  margin: 0;
  color: var(--muted-fg);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.gallery-section {
  position: relative;
  z-index: 2;
  background: var(--page-bg);
}

@media (max-width: 860px) {
  .tilt-section {
    min-height: 100vh;
    min-height: 100dvh;
    place-items: start center;
    padding-top: max(76px, calc(env(safe-area-inset-top) + 54px));
    cursor: auto;
  }

  .tilt-section :deep(*) {
    cursor: auto;
  }

  .demo-label {
    top: 22px;
    left: 22px;
  }

  .mode-toggle {
    top: 18px;
    right: 18px;
  }
}

@media (max-width: 560px) {
  .tilt-section {
    padding-top: max(70px, calc(env(safe-area-inset-top) + 48px));
  }

  .demo-label {
    max-width: calc(100vw - 44px);
    font-size: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tilt-section {
    transition: none;
    transform: none;
  }
}
</style>
