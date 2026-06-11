<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AlgorithmBackground from '../components/AlgorithmBackground.vue'
import GalleryLinkCard from '../components/GalleryLinkCard.vue'
import HeroDock from '../components/HeroDock.vue'
import HeroTiltCards from '../components/HeroTiltCards.vue'
import HorizontalGallery from '../components/HorizontalGallery.vue'
import MotionFooter from '../components/MotionFooter.vue'
import WatchFaceLink from '../components/WatchFaceLink.vue'
import WatchFaceLinkCard from '../components/WatchFaceLinkCard.vue'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const gallerySection = ref(null)
const modeToggle = ref(null)
const isDayMode = ref(false)
const isHeroMotionActive = ref(false)

const dockItems = [
  { label: 'Graph', glyph: 'G' },
  { label: 'String', glyph: 'S' },
  { label: 'Struct', glyph: 'D' },
]

let context
let removePreloaderListener

const toggleTheme = () => {
  isDayMode.value = !isDayMode.value

  if (!modeToggle.value) return

  gsap.fromTo(
    modeToggle.value,
    { scale: 0.94 },
    {
      scale: 1,
      duration: 0.34,
      ease: 'back.out(2)',
      overwrite: true,
    },
  )
}

const scrollToGallery = (index) => {
  const target = gallerySection.value?.querySelectorAll('.horizontal-gallery')[index]

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

onMounted(async () => {
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
          { scale: 1, autoAlpha: 1 },
          {
            scale: 0.7,
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
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          tilt,
          { scale: 1, autoAlpha: 1 },
          {
            scale: 0.92,
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
        eyebrow="Graph toolkit"
        title="初学者"
        accent="#007aff"
        direction="left"
      >
        <GalleryLinkCard
          avatar="D"
          title="Dijkstra"
          description="Priority queue relaxation for non-negative weighted graphs."
          href="https://cp-algorithms.com/graph/dijkstra.html"
          :tags="['graph', 'heap', 'single-source']"
          :index="0"
          accent="#007aff"
        />
        <GalleryLinkCard
          avatar="F"
          title="Dinic"
          description="Level graph plus blocking flow for maximum-flow routines."
          href="https://cp-algorithms.com/graph/dinic.html"
          :tags="['flow', 'bfs', 'dfs']"
          :index="1"
          accent="#007aff"
        />
        <GalleryLinkCard
          avatar="T"
          title="Tarjan"
          description="Low-link structure for SCC, bridges, and articulation points."
          href="https://cp-algorithms.com/graph/bridge-searching.html"
          :tags="['lowlink', 'scc', 'dfs']"
          :index="2"
          accent="#007aff"
        />
        <WatchFaceLinkCard
          title="Graph links"
          description="Quick graph references arranged as a draggable watch face."
          accent="#007aff"
        >
          <WatchFaceLink
            icon="D"
            title="Dijkstra Notes"
            description="Priority-queue relaxation templates and edge-case reminders."
            href="https://cp-algorithms.com/graph/dijkstra.html"
          />
          <WatchFaceLink
            icon="F"
            title="Flow Models"
            description="Max-flow reductions, level graphs, and blocking-flow patterns."
            href="https://cp-algorithms.com/graph/dinic.html"
          />
          <WatchFaceLink
            icon="T"
            title="Tarjan Index"
            description="Low-link recipes for SCC, bridges, and articulation points."
            href="https://cp-algorithms.com/graph/bridge-searching.html"
          />
          <WatchFaceLink
            icon="L"
            title="LCA Jumps"
            description="Binary lifting and Euler tour references for tree queries."
            href="https://cp-algorithms.com/graph/lca_binary_lifting.html"
          />
          <WatchFaceLink
            icon="M"
            title="Matching"
            description="Bipartite matching and alternating-path review material."
            href="https://cp-algorithms.com/graph/kuhn_maximum_bipartite_matching.html"
          />
          <WatchFaceLink
            icon="S"
            title="Shortest Path Set"
            description="A compact jump point for shortest-path variants."
            href="https://cp-algorithms.com/graph/01_bfs.html"
          />
        </WatchFaceLinkCard>
      </HorizontalGallery>

      <HorizontalGallery
        eyebrow="String lab"
        title="算竞高手"
        accent="#34c759"
        reverse
      >
        <GalleryLinkCard
          avatar="K"
          title="KMP"
          description="Prefix-function matching with linear scanning guarantees."
          href="https://cp-algorithms.com/string/prefix-function.html"
          :tags="['string', 'prefix', 'linear']"
          :index="0"
          accent="#34c759"
        />
        <GalleryLinkCard
          avatar="S"
          title="Suffix Array"
          description="Sorted suffix indices for substring ordering and LCP queries."
          href="https://cp-algorithms.com/string/suffix-array.html"
          :tags="['suffix', 'lcp', 'sort']"
          :index="1"
          accent="#34c759"
        />
        <GalleryLinkCard
          avatar="M"
          title="Manacher"
          description="Palindrome radii expansion in linear time."
          href="https://cp-algorithms.com/string/manacher.html"
          :tags="['palindrome', 'radius', 'linear']"
          :index="2"
          accent="#34c759"
        />
        <WatchFaceLinkCard
          title="String links"
          description="Pattern matching references arranged as a draggable watch face."
          accent="#34c759"
        >
          <WatchFaceLink
            icon="K"
            title="KMP Prefix"
            description="Prefix function derivation, implementation, and matching notes."
            href="https://cp-algorithms.com/string/prefix-function.html"
          />
          <WatchFaceLink
            icon="Z"
            title="Z Function"
            description="Linear Z-array construction and substring matching patterns."
            href="https://cp-algorithms.com/string/z-function.html"
          />
          <WatchFaceLink
            icon="S"
            title="Suffix Array"
            description="Sorted suffixes, LCP, and substring ordering reference."
            href="https://cp-algorithms.com/string/suffix-array.html"
          />
          <WatchFaceLink
            icon="A"
            title="Aho-Corasick"
            description="Trie failure links for multi-pattern matching workflows."
            href="https://cp-algorithms.com/string/aho_corasick.html"
          />
          <WatchFaceLink
            icon="M"
            title="Manacher"
            description="Palindrome radii with linear expansion boundaries."
            href="https://cp-algorithms.com/string/manacher.html"
          />
          <WatchFaceLink
            icon="H"
            title="Hashing"
            description="Rolling hash setup, collision tradeoffs, and substring checks."
            href="https://cp-algorithms.com/string/string-hashing.html"
          />
        </WatchFaceLinkCard>
      </HorizontalGallery>

      <HorizontalGallery
        eyebrow="For"
        title="学生教练"
        accent="#ff9f0a"
        direction="left"
      >
        <GalleryLinkCard
          avatar="S"
          title="Segment Tree"
          description="Range aggregation and lazy propagation for mutable arrays."
          href="https://cp-algorithms.com/data_structures/segment_tree.html"
          :tags="['range', 'lazy', 'merge']"
          :index="0"
          accent="#ff9f0a"
        />
        <GalleryLinkCard
          avatar="F"
          title="Fenwick"
          description="Compact prefix sums with logarithmic updates."
          href="https://cp-algorithms.com/data_structures/fenwick.html"
          :tags="['bit', 'prefix', 'log']"
          :index="1"
          accent="#ff9f0a"
        />
        <GalleryLinkCard
          avatar="T"
          title="Treap"
          description="Randomized balanced binary search tree with split and merge."
          href="https://cp-algorithms.com/data_structures/treap.html"
          :tags="['bst', 'random', 'merge']"
          :index="2"
          accent="#ff9f0a"
        />
        <WatchFaceLinkCard
          title="有价值的"
          description="Data-structure references arranged as a draggable watch face."
          accent="#ff9f0a"
        >
          <WatchFaceLink
            icon="S"
            title="Segment Tree"
            description="Range queries, lazy propagation, and merge patterns."
            href="https://cp-algorithms.com/data_structures/segment_tree.html"
          />
          <WatchFaceLink
            icon="F"
            title="Fenwick Tree"
            description="Prefix sums, binary indexed tree tricks, and order statistics."
            href="https://cp-algorithms.com/data_structures/fenwick.html"
          />
          <WatchFaceLink
            icon="T"
            title="Treap"
            description="Split, merge, implicit keys, and randomized balancing."
            href="https://cp-algorithms.com/data_structures/treap.html"
          />
          <WatchFaceLink
            icon="H"
            title="Heavy-Light"
            description="Path decomposition for tree range-query pipelines."
            href="https://cp-algorithms.com/graph/hld.html"
          />
          <WatchFaceLink
            icon="D"
            title="DSU"
            description="Union-find patterns, rollback ideas, and component tracking."
            href="https://cp-algorithms.com/data_structures/disjoint_set_union.html"
          />
          <WatchFaceLink
            icon="Q"
            title="Sparse Table"
            description="Static range minimum queries and idempotent operations."
            href="https://cp-algorithms.com/data_structures/sparse-table.html"
          />
        </WatchFaceLinkCard>
      </HorizontalGallery>
        <HorizontalGallery
        eyebrow="For"
        title="出题人"
        accent="#ff9f0a"
        reverse
      >
      <GalleryLinkCard
          avatar="F"
          title="Fenwick"
          description="Compact prefix sums with logarithmic updates."
          href="https://cp-algorithms.com/data_structures/fenwick.html"
          :tags="['bit', 'prefix', 'log']"
          :index="1"
          accent="#ff9f0a"
        />
        <GalleryLinkCard
          avatar="T"
          title="Treap"
          description="Randomized balanced binary search tree with split and merge."
          href="https://cp-algorithms.com/data_structures/treap.html"
          :tags="['bst', 'random', 'merge']"
          :index="2"
          accent="#ff9f0a"
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
