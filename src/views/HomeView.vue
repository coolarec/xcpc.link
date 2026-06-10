<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AlgorithmBackground from '../components/AlgorithmBackground.vue'
import HeroDock from '../components/HeroDock.vue'
import HeroTiltCards from '../components/HeroTiltCards.vue'
import HorizontalGallery from '../components/HorizontalGallery.vue'
import MotionFooter from '../components/MotionFooter.vue'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const gallerySection = ref(null)
const modeToggle = ref(null)
const isDayMode = ref(false)

const galleryGroups = [
  {
    eyebrow: 'Graph toolkit',
    title: 'Shortest paths and cuts',
    accent: '#007aff',
    items: [
      {
        title: 'Dijkstra',
        description: 'Priority queue relaxation for non-negative weighted graphs.',
        tags: ['graph', 'heap', 'single-source'],
      },
      {
        title: 'Dinic',
        description: 'Level graph plus blocking flow for maximum-flow routines.',
        tags: ['flow', 'bfs', 'dfs'],
      },
      {
        title: 'Tarjan',
        description: 'Low-link structure for SCC, bridges, and articulation points.',
        tags: ['lowlink', 'scc', 'dfs'],
      },
      {
        title: 'LCA',
        description: 'Binary lifting and tree jumps for path queries.',
        tags: ['tree', 'sparse', 'query'],
      },
    ],
  },
  {
    eyebrow: 'String lab',
    title: 'Pattern matching systems',
    accent: '#34c759',
    items: [
      {
        title: 'KMP',
        description: 'Prefix-function matching with linear scanning guarantees.',
        tags: ['string', 'prefix', 'linear'],
      },
      {
        title: 'Suffix Array',
        description: 'Sorted suffix indices for substring ordering and LCP queries.',
        tags: ['suffix', 'lcp', 'sort'],
      },
      {
        title: 'Manacher',
        description: 'Palindrome radii expansion in linear time.',
        tags: ['palindrome', 'radius', 'linear'],
      },
      {
        title: 'AC Automaton',
        description: 'Trie failure links for multi-pattern matching.',
        tags: ['trie', 'fail', 'multi-match'],
      },
    ],
  },
  {
    eyebrow: 'Data structures',
    title: 'Dynamic query engines',
    accent: '#ff9f0a',
    items: [
      {
        title: 'Segment Tree',
        description: 'Range aggregation and lazy propagation for mutable arrays.',
        tags: ['range', 'lazy', 'merge'],
      },
      {
        title: 'Fenwick',
        description: 'Compact prefix sums with logarithmic updates.',
        tags: ['bit', 'prefix', 'log'],
      },
      {
        title: 'Treap',
        description: 'Randomized balanced binary search tree with split and merge.',
        tags: ['bst', 'random', 'merge'],
      },
      {
        title: 'HLD',
        description: 'Path decomposition for tree range queries.',
        tags: ['tree', 'path', 'segment'],
      },
    ],
  },
]

const dockItems = [
  { label: 'Graph', glyph: 'G' },
  { label: 'String', glyph: 'S' },
  { label: 'Struct', glyph: 'D' },
]

let context

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

onMounted(async () => {
  await nextTick()

  const root = pageRoot.value
  const tilt = tiltSection.value
  const second = gallerySection.value

  if (!root) return

  context = gsap.context(() => {
    if (tilt && second) {
      gsap
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
    }

    ScrollTrigger.refresh()
  }, root)
})

onBeforeUnmount(() => {
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
      <HeroTiltCards />
      <HeroDock :items="dockItems" @select="scrollToGallery" />
    </section>

    <section ref="gallerySection" class="gallery-section" aria-label="Horizontal algorithm galleries">
      <HorizontalGallery
        v-for="group in galleryGroups"
        :key="group.title"
        :eyebrow="group.eyebrow"
        :title="group.title"
        :items="group.items"
        :accent="group.accent"
        direction="left"
      />
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
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ffffff'/%3E%3C/svg%3E") 50 50, auto;
}

.tilt-section :deep(*) {
  cursor: inherit;
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
  .demo-label {
    top: 22px;
    left: 22px;
  }
}

@media (max-width: 560px) {
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
