<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AlgorithmBackground from './components/intro/AlgorithmBackground.vue'
import FloatingActionMenu from '../../components/FloatingActionMenu.vue'
import FloatingPanel from '../../components/FloatingPanel.vue'
import GalleryCardPlaceholder from './components/gallery/GalleryCardPlaceholder.vue'
import IntroDock from './components/intro/IntroDock.vue'
import IntroTiltCards from './components/intro/IntroTiltCards.vue'
import HorizontalGallery from './components/gallery/HorizontalGallery.vue'
import ArtalkComments from '../../components/ArtalkComments.vue'
import { useHomeContentStore } from '../../stores/homeContent'
import { useThemeStore, type ThemeMode } from '../../stores/theme'
import type { AsyncVueModule, HomeGallerySection, WatchLinksBlock } from '../../types/home'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

ScrollTrigger.config({
  ignoreMobileResize: true,
  autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
})

const asyncCardOptions = (loader: () => Promise<AsyncVueModule<Component>>) => ({
  loader,
  loadingComponent: GalleryCardPlaceholder,
  delay: 0,
})

const GalleryLinkCard = defineAsyncComponent(asyncCardOptions(() => import('./components/gallery/GalleryLinkCard.vue')))
const GalleryNewsCard = defineAsyncComponent(asyncCardOptions(() => import('./components/news/GalleryNewsCard.vue')))
const MotionFooter = defineAsyncComponent(() => import('../../components/MotionFooter.vue'))
const WatchFaceLinkCard = defineAsyncComponent(
  asyncCardOptions(() => import('./components/gallery/WatchFaceLinkCard.vue')),
)

const pageRoot = ref<HTMLElement | null>(null)
const tiltSection = ref<HTMLElement | null>(null)
const gallerySection = ref<HTMLElement | null>(null)
const newsSection = ref<HTMLElement | null>(null)
const isHeroMotionActive = ref(false)
const showComments = ref(false)
const isMenuVisible = ref(false)

let context: gsap.Context | undefined
let removePreloaderListener: (() => void) | undefined
const homeContentStore = useHomeContentStore()
const themeStore = useThemeStore()
const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '系统', value: 'system' },
  { label: '日间', value: 'day' },
  { label: '夜间', value: 'night' },
]
const dockItemsWithTooltips = computed(() =>
  homeContentStore.dockItems.map((item, index) => ({
    ...item,
    tooltip: item.to ? 'AWESOME XCPC Lite' : homeContentStore.galleries[index]?.title || '圈内播报',
  })),
)

const getGalleryWatches = (gallery: HomeGallerySection): WatchLinksBlock[] => {
  if (gallery.watches?.length) return gallery.watches
  return gallery.watch ? [gallery.watch] : []
}

const scrollToGallery = (index: number): void => {
  const section = gallerySection.value
  if (!section) return

  const galleries = section.querySelectorAll<HTMLElement>('.horizontal-gallery-pin-wrapper')
  const target = galleries.item(index) || newsSection.value

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

const handleFloatingAction = (id: string) => {
  if (id === 'top') {
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: 0 },
      ease: 'power3.inOut',
    })
  }

  if (id === 'comments') {
    showComments.value = true
  }
}

const notifyPreloaderReady = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('app-preloader:ready'))
    })
  })
}

onMounted(async () => {
  await homeContentStore.load().catch(() => undefined)

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

    // Scroll-based menu visibility
    if (second) {
      ScrollTrigger.create({
        trigger: second,
        start: 'top 80%',
        onEnter: () => { isMenuVisible.value = true },
        onLeaveBack: () => { isMenuVisible.value = false },
      })
    }

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
  <main ref="pageRoot" class="motion-page">
    <section ref="tiltSection" class="tilt-section" aria-label="Cursor-driven perspective tilt">
      <AlgorithmBackground />
      <div class="theme-segment" role="radiogroup" aria-label="主题模式">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="theme-option"
          :class="{ 'is-active': themeStore.mode === option.value }"
          role="radio"
          :aria-checked="themeStore.mode === option.value"
          @click="themeStore.setMode(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <p class="demo-label">AWESOME XCPC</p>
      <IntroTiltCards :motion-active="isHeroMotionActive" />
      <IntroDock :items="dockItemsWithTooltips" @select="scrollToGallery" />
    </section>

    <section ref="gallerySection" class="gallery-section" aria-label="Horizontal algorithm galleries">
      <HorizontalGallery
        v-for="(gallery, index) in homeContentStore.galleries"
        :key="gallery.title"
        :eyebrow="gallery.eyebrow"
        :title="gallery.title"
        :accent="gallery.accent"
        :direction="gallery.direction"
        :reverse="gallery.reverse"
        :is-dark="themeStore.isDarkMode"
        :links="[
          { title: '精选链接', items: gallery.cards },
          ...getGalleryWatches(gallery)
            .filter((watch) => watch.links?.length)
            .map((watch) => ({ title: watch.title || '相关推荐', items: watch.links }))
        ]"
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
          v-for="watch in getGalleryWatches(gallery)"
          :key="`${gallery.title}-${watch.title}`"
          v-show="watch.links?.length"
          :title="watch.title"
          :description="watch.description"
          :links="watch.links"
          :accent="gallery.accent"
        />
      </HorizontalGallery>
    </section>

    <!-- Standalone News Section -->
    <section ref="newsSection" class="news-section" aria-label="Latest News" v-if="homeContentStore.newsData">
      <GalleryNewsCard :data="homeContentStore.newsData" />
    </section>

    <MotionFooter />
    <FloatingPanel
      v-model="showComments"
      title="评论"
      eyebrow="AWESOME XCPC"
      :is-dark="themeStore.isDarkMode"
      panel-class="comments-panel-shell"
    >
      <ArtalkComments :active="showComments" :is-dark="themeStore.isDarkMode" />
    </FloatingPanel>
    <FloatingActionMenu :visible="isMenuVisible" @action="handleFloatingAction" />
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
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='22' fill='%23ffffff' fill-opacity='0.5' stroke='%23000000' stroke-opacity='0.22' stroke-width='1'/%3E%3Ccircle cx='24' cy='24' r='2.5' fill='%23000000' fill-opacity='0.36'/%3E%3C/svg%3E") 24 24, auto;
}

.tilt-section :deep(*) {
  cursor: inherit;
}

:global(.is-day) .tilt-section {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='22' fill='%231d1d1f' fill-opacity='0.3' stroke='%23ffffff' stroke-opacity='0.65' stroke-width='1'/%3E%3Ccircle cx='24' cy='24' r='2.5' fill='%23ffffff' fill-opacity='0.72'/%3E%3C/svg%3E") 24 24, auto;
}

:global(.is-night) .tilt-section {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='22' fill='%23ffffff' fill-opacity='0.5' stroke='%23000000' stroke-opacity='0.22' stroke-width='1'/%3E%3Ccircle cx='24' cy='24' r='2.5' fill='%23000000' fill-opacity='0.36'/%3E%3C/svg%3E") 24 24, auto;
}

.theme-segment {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--soft-line);
  border-radius: 999px;
  background: var(--panel-bg);
  box-shadow: var(--dock-shadow);
}

.theme-option {
  min-width: 54px;
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted-fg);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.theme-option:hover,
.theme-option:focus-visible {
  color: var(--page-fg);
}

.theme-option.is-active {
  background: var(--page-fg);
  color: var(--page-bg);
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

.news-section {
  position: relative;
  z-index: 2;
  background: var(--page-bg);
  padding: 0 0 86px;
  display: flex;
  justify-content: center;
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

  .theme-segment {
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
