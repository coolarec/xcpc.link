<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AlgorithmBackground from '../components/AlgorithmBackground.vue'
import HeroDock from '../components/HeroDock.vue'
import HeroTiltCards from '../components/HeroTiltCards.vue'
import HorizontalGallery from '../components/HorizontalGallery.vue'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const gallerySection = ref(null)
const footerBar = ref(null)
const footerPath = ref(null)

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

const footerDownPath = 'M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z'
const footerCenterPath = 'M0-0.3C0-0.3,464,0,1139,0S2278-0.3,2278-0.3V683H0V-0.3z'

let context

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
  const footer = footerBar.value
  const footerShape = footerPath.value

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

    if (footer && footerShape) {
      const bounceFooter = (velocity) => {
        const variation = gsap.utils.clamp(-0.35, 0.35, velocity / 10000)

        gsap.fromTo(
          footerShape,
          { attr: { d: footerDownPath } },
          {
            attr: { d: footerCenterPath },
            duration: 2,
            ease: `elastic.out(${1 + Math.abs(variation)}, ${0.55 - Math.abs(variation) * 0.3})`,
            overwrite: true,
          },
        )
      }

      gsap.set(footerShape, { attr: { d: footerCenterPath } })

      ScrollTrigger.create({
        trigger: footer,
        start: 'top bottom',
        onEnter: (self) => bounceFooter(self.getVelocity()),
        onEnterBack: (self) => bounceFooter(self.getVelocity()),
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
  <main ref="pageRoot" class="motion-page">
    <section ref="tiltSection" class="tilt-section" aria-label="Cursor-driven perspective tilt">
      <AlgorithmBackground />
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

    <footer ref="footerBar" class="motion-footer" aria-label="Page footer">
      <svg
        class="footer-wave"
        viewBox="0 0 2278 683"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path ref="footerPath" class="footer-wave-path" :d="footerCenterPath" />
      </svg>
      <div class="footer-inner">
        <span>XCPC.LINK</span>
        <strong>Algorithm collection system</strong>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.motion-page {
  min-height: 100svh;
  overflow-x: hidden;
  background: #f5f5f7;
  color: #1d1d1f;
}

.tilt-section {
  position: relative;
  z-index: 1;
  min-height: 100svh;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #f5f5f7;
  transform-origin: center bottom;
  isolation: isolate;
}

.demo-label {
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 5;
  margin: 0;
  color: #86868b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.gallery-section {
  position: relative;
  z-index: 2;
  background: #f5f5f7;
}

.motion-footer {
  position: relative;
  z-index: 3;
  min-height: 34svh;
  overflow: hidden;
  display: grid;
  align-items: end;
  background: #f5f5f7;
  color: #1d1d1f;
}

.footer-wave {
  position: absolute;
  inset: -1px 0 0;
  width: 100%;
  height: 100%;
  display: block;
}

.footer-wave-path {
  fill: #ffffff;
}

.motion-footer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #f5f5f7;
  opacity: 0.18;
  pointer-events: none;
}

.footer-inner {
  position: relative;
  z-index: 1;
  width: min(1180px, calc(100% - 44px));
  margin: 0 auto;
  padding: 0 0 42px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  color: #1d1d1f;
}

.footer-inner span,
.footer-inner strong {
  letter-spacing: 0;
}

.footer-inner span {
  font-size: 14px;
  font-weight: 700;
  color: #86868b;
}

.footer-inner strong {
  max-width: 520px;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(28px, 5vw, 64px);
  line-height: 0.96;
  text-align: right;
  letter-spacing: -0.03em;
}

@media (max-width: 860px) {
  .demo-label {
    top: 22px;
    left: 22px;
  }

  .motion-footer {
    min-height: 30svh;
  }

  .footer-inner {
    padding-bottom: 28px;
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-inner strong {
    text-align: left;
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
