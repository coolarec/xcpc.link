<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HorizontalGallery from '../components/HorizontalGallery.vue'

gsap.registerPlugin(ScrambleTextPlugin, ScrollToPlugin, ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const tiltLayer = ref(null)
const tiltCore = ref(null)
const dockBar = ref(null)
const gallerySection = ref(null)
const footerBar = ref(null)
const footerPath = ref(null)

const tiltPanels = ['01', '02', '03', '04', '05', '06']
const algorithmWords = [
  'DIJKSTRA',
  'BELLMAN-FORD',
  'FLOYD',
  'SPFA',
  'A*',
  'KMP',
  'Z-ALGORITHM',
  'MANACHER',
  'AC-AUTOMATON',
  'SUFFIX ARRAY',
  'SAM',
  'LCP',
  'FFT',
  'NTT',
  'FWT',
  'MILLER-RABIN',
  'POLLARD-RHO',
  'CRT',
  'GAUSS',
  'DSU',
  'LCT',
  'HLD',
  'SEGMENT TREE',
  'FENWICK',
  'SPARSE TABLE',
  'TREAP',
  'SPLAY',
  'DINIC',
  'ISAP',
  'MCMF',
  'HOPCROFT-KARP',
  'TARJAN',
  'KOSARAJU',
  'TOPO SORT',
  'LCA',
  'CENTROID',
  'MO ALGORITHM',
  'CDQ',
  'KNUTH',
  'MONOTONE QUEUE',
  'CONVEX HULL',
  'MIN-COST FLOW',
]
const backgroundRows = Array.from({ length: 12 }, (_, rowIndex) => ({
  words: Array.from({ length: 10 }, (_, columnIndex) => {
    const index = rowIndex * 10 + columnIndex

    return {
      word: algorithmWords[index % algorithmWords.length],
      size: `${12 + ((index * 7) % 9)}px`,
      opacity: `${0.37 - rowIndex * 0.026}`,
      repeatDelay: `${5 + ((index * 47) % 501) / 100}`,
      tone: index % 4,
    }
  }),
}))
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

let motionMedia

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

  motionMedia = gsap.matchMedia()
  const setupMotion = (isSmall) => {
    const root = pageRoot.value
    const tilt = tiltSection.value
    const layer = tiltLayer.value
    const core = tiltCore.value
    const dock = dockBar.value
    const second = gallerySection.value
    const footer = footerBar.value
    const footerShape = footerPath.value
    const cleanup = []

    if (!root) return undefined

    const context = gsap.context(() => {
      if (tilt && layer && core) {
        const rotationRange = isSmall ? 6 : 15
        const coreShift = isSmall ? 12 : 30

        gsap.set(tilt, { perspective: isSmall ? 520 : 760 })
        gsap.set(layer, {
          transformStyle: 'preserve-3d',
          transformOrigin: isSmall ? '50% 58%' : '50% 50%',
        })

        gsap.utils.toArray('.algorithm-word').forEach((word, index) => {
          const text = word.dataset.word || ''
          const repeatDelay = Number.parseFloat(word.dataset.repeatDelay || '7')
          word.textContent = ''

          gsap.to(word, {
            duration: 1.4 + (index % 5) * 0.18,
            delay: (index % 12) * 0.035,
            repeat: -1,
            repeatDelay,
            ease: 'none',
            scrambleText: {
              text,
              chars: '01[]{}+-*/',
              speed: 0.35,
              revealDelay: 0.12,
            },
          })
        })

        const rotateX = gsap.quickTo(layer, 'rotationX', {
          duration: 0.25,
          ease: 'power3.out',
        })
        const rotateY = gsap.quickTo(layer, 'rotationY', {
          duration: 0.25,
          ease: 'power3.out',
        })
        const coreX = gsap.quickTo(core, 'x', {
          duration: 0.25,
          ease: 'power3.out',
        })
        const coreY = gsap.quickTo(core, 'y', {
          duration: 0.25,
          ease: 'power3.out',
        })

        const handlePointerMove = (event) => {
          const rect = tilt.getBoundingClientRect()
          const pointerX = event.clientX - rect.left
          const pointerY = event.clientY - rect.top

          rotateX(gsap.utils.interpolate(rotationRange, -rotationRange, pointerY / rect.height))
          rotateY(gsap.utils.interpolate(-rotationRange, rotationRange, pointerX / rect.width))
          coreX(gsap.utils.interpolate(-coreShift, coreShift, pointerX / rect.width))
          coreY(gsap.utils.interpolate(-coreShift, coreShift, pointerY / rect.height))
          tilt.style.setProperty('--cursor-x', `${(pointerX / rect.width) * 100}%`)
          tilt.style.setProperty('--cursor-y', `${(pointerY / rect.height) * 100}%`)
        }

        const handlePointerLeave = () => {
          rotateX(0)
          rotateY(0)
          coreX(0)
          coreY(0)
          tilt.style.setProperty('--cursor-x', '50%')
          tilt.style.setProperty('--cursor-y', '50%')
        }

        tilt.addEventListener('mousemove', handlePointerMove)
        tilt.addEventListener('pointermove', handlePointerMove)
        tilt.addEventListener('mouseleave', handlePointerLeave)
        tilt.addEventListener('pointerleave', handlePointerLeave)
        cleanup.push(() => {
          tilt.removeEventListener('mousemove', handlePointerMove)
          tilt.removeEventListener('pointermove', handlePointerMove)
          tilt.removeEventListener('mouseleave', handlePointerLeave)
          tilt.removeEventListener('pointerleave', handlePointerLeave)
        })

        if (isSmall) {
          gsap.from('.tilt-panel', {
            autoAlpha: 0,
            scale: 0.82,
            y: 28,
            duration: 0.72,
            ease: 'back.out(1.4)',
            stagger: {
              amount: 0.34,
              from: 'center',
            },
          })
        } else {
          gsap.from('.tilt-panel', {
            autoAlpha: 0,
            z: -180,
            y: 44,
            duration: 0.9,
            ease: 'power3.out',
            stagger: {
              amount: 0.42,
              from: 'center',
            },
          })
        }

        gsap.to('.tilt-panel', {
          y: isSmall ? 8 : 14,
          delay: isSmall ? 0.72 : 0.9,
          duration: isSmall ? 2.4 : 3.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          stagger: {
            each: isSmall ? 0.12 : 0.18,
            from: 'random',
          },
        })

        gsap.from('.tilt-core', {
          autoAlpha: 0,
          scale: 0.9,
          duration: 0.75,
          ease: 'power3.out',
        })
      }

      if (dock) {
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
          const offset = dock.getBoundingClientRect().left + firstIcon.offsetLeft
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

        dock.addEventListener('pointermove', updateDock)
        dock.addEventListener('pointerleave', resetDock)
        cleanup.push(() => {
          dock.removeEventListener('pointermove', updateDock)
          dock.removeEventListener('pointerleave', resetDock)
        })
      }

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

    return () => {
      cleanup.forEach((remove) => remove())
      context.revert()
    }
  }

  motionMedia.add('(max-width: 760px)', () => setupMotion(true))
  motionMedia.add('(min-width: 761px)', () => setupMotion(false))
})

onBeforeUnmount(() => {
  motionMedia?.revert()
})
</script>

<template>
  <main ref="pageRoot" class="motion-page">
    <section ref="tiltSection" class="tilt-section" aria-label="Cursor-driven perspective tilt">
      <div class="algorithm-band" aria-hidden="true">
        <div
          v-for="(row, rowIndex) in backgroundRows"
          :key="`row-${rowIndex}`"
          class="algorithm-row"
        >
          <span
            v-for="(item, columnIndex) in row.words"
            :key="`${item.word}-${rowIndex}-${columnIndex}`"
            class="algorithm-word"
            :class="`algorithm-word-${item.tone}`"
            :data-word="item.word"
            :data-repeat-delay="item.repeatDelay"
            :style="{
              '--word-size': item.size,
              '--word-opacity': item.opacity,
            }"
          >
            {{ item.word }}
          </span>
        </div>
      </div>

      <p class="demo-label">XCPC.LINK</p>

      <div ref="tiltLayer" class="tilt-layer">
        <div class="tilt-orbit" aria-hidden="true"></div>
        <div ref="tiltCore" class="tilt-core">
          <span>ALGORITHM COLLECTION</span>
          <strong>XCPC</strong>
        </div>
        <div
          v-for="(panel, index) in tiltPanels"
          :key="panel"
          class="tilt-panel"
          :class="`tilt-panel-${index + 1}`"
        >
          <span>{{ panel }}</span>
        </div>
      </div>

      <div ref="dockBar" class="hero-dock" aria-label="Jump to algorithm sections">
        <button
          v-for="(item, index) in dockItems"
          :key="item.label"
          class="hero-dock-item"
          type="button"
          :aria-label="`Jump to ${item.label}`"
          @click="scrollToGallery(index)"
        >
          <span>{{ item.glyph }}</span>
        </button>
      </div>
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
  --cursor-x: 50%;
  --cursor-y: 50%;
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

.algorithm-band {
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: 50%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0;
  overflow: hidden;
  padding: 30px 22px 20px;
  pointer-events: none;
  background: #f5f5f7;
  mask-image: linear-gradient(180deg, #000 0%, #000 72%, transparent 100%);
}

.algorithm-row {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  align-items: baseline;
  column-gap: 18px;
  white-space: nowrap;
}

.algorithm-word {
  min-width: 0;
  opacity: var(--word-opacity);
  color: rgba(0, 113, 227, 0.2);
  font-family: "Sora", ui-monospace, "SFMono-Regular", Consolas, monospace;
  font-size: var(--word-size);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;
  will-change: contents;
}

.algorithm-word-1 {
  color: rgba(0, 180, 216, 0.18);
}

.algorithm-word-2 {
  color: rgba(255, 107, 107, 0.16);
}

.algorithm-word-3 {
  color: rgba(52, 211, 153, 0.18);
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
  border: 1px solid rgba(29, 29, 31, 0.1);
  border-radius: 999px;
  transform: translateZ(-80px) rotateX(68deg);
}

.tilt-core,
.tilt-panel {
  position: absolute;
  border: 0;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}

.tilt-core {
  inset: 16% 21%;
  z-index: 2;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
  transform: translateZ(90px);
  will-change: transform;
}

.tilt-core span {
  color: #86868b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tilt-core strong {
  color: #1d1d1f;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(72px, 9vw, 132px);
  line-height: 0.92;
  letter-spacing: -0.03em;
}

.tilt-panel {
  z-index: 1;
  width: 170px;
  height: 112px;
  display: grid;
  place-items: center;
  color: #1d1d1f;
  font-family: "Sora", sans-serif;
  font-size: 28px;
  font-weight: 800;
}

.tilt-panel-1 {
  top: 5%;
  left: 8%;
  transform: translateZ(140px) rotateZ(-8deg);
}

.tilt-panel-2 {
  top: 6%;
  right: 10%;
  transform: translateZ(118px) rotateZ(7deg);
}

.tilt-panel-3 {
  top: 42%;
  left: 0;
  transform: translateZ(78px) rotateZ(5deg);
}

.tilt-panel-4 {
  top: 42%;
  right: 1%;
  transform: translateZ(100px) rotateZ(-5deg);
}

.tilt-panel-5 {
  bottom: 5%;
  left: 18%;
  transform: translateZ(124px) rotateZ(8deg);
}

.tilt-panel-6 {
  right: 20%;
  bottom: 1%;
  transform: translateZ(152px) rotateZ(-7deg);
}

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
  .algorithm-band {
    padding: 30px 14px 18px;
  }

  .algorithm-row {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    column-gap: 12px;
  }

  .algorithm-word:nth-child(n + 8) {
    display: none;
  }

  .demo-label {
    top: 22px;
    left: 22px;
  }

  .tilt-layer {
    width: min(92vw, 620px);
    aspect-ratio: 0.78;
  }

  .tilt-core {
    inset: 24% 12%;
  }

  .tilt-core strong {
    font-size: 58px;
  }

  .tilt-panel {
    width: 116px;
    height: 86px;
  }

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
  .algorithm-band {
    padding: 28px 12px 16px;
  }

  .algorithm-row {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    column-gap: 10px;
  }

  .algorithm-word {
    font-size: min(var(--word-size), 13px);
  }

  .algorithm-word:nth-child(n + 6) {
    display: none;
  }

  .demo-label {
    max-width: calc(100vw - 44px);
    font-size: 12px;
  }

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

  .tilt-panel {
    display: none;
  }

}

@media (prefers-reduced-motion: reduce) {
  .tilt-section,
  .tilt-layer,
  .tilt-core,
  .tilt-panel {
    transition: none;
    transform: none;
  }
}
</style>
