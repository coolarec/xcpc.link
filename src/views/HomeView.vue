<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HorizontalGallery from '../components/HorizontalGallery.vue'

gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const tiltLayer = ref(null)
const tiltCore = ref(null)
const gallerySection = ref(null)

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

let motionMedia

onMounted(async () => {
  await nextTick()

  motionMedia = gsap.matchMedia()
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const root = pageRoot.value
    const tilt = tiltSection.value
    const layer = tiltLayer.value
    const core = tiltCore.value
    const second = gallerySection.value
    const cleanup = []

    if (!root) return undefined

    const context = gsap.context(() => {
      if (tilt && layer && core) {
        gsap.set(tilt, { perspective: 650 })
        gsap.set(layer, { transformStyle: 'preserve-3d' })

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

          rotateX(gsap.utils.interpolate(15, -15, pointerY / rect.height))
          rotateY(gsap.utils.interpolate(-15, 15, pointerX / rect.width))
          coreX(gsap.utils.interpolate(-30, 30, pointerX / rect.width))
          coreY(gsap.utils.interpolate(-30, 30, pointerY / rect.height))
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

        gsap.from('.tilt-core', {
          autoAlpha: 0,
          scale: 0.9,
          duration: 0.75,
          ease: 'power3.out',
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

      ScrollTrigger.refresh()
    }, root)

    return () => {
      cleanup.forEach((remove) => remove())
      context.revert()
    }
  })
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

      <p class="demo-label">Cursor-driven perspective tilt</p>

      <div ref="tiltLayer" class="tilt-layer">
        <div class="tilt-orbit" aria-hidden="true"></div>
        <div ref="tiltCore" class="tilt-core">
          <span>FULL SCREEN</span>
          <strong>TILT</strong>
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
    </section>

    <section ref="gallerySection" class="gallery-section" aria-label="Horizontal algorithm galleries">
      <HorizontalGallery
        v-for="group in galleryGroups"
        :key="group.title"
        :eyebrow="group.eyebrow"
        :title="group.title"
        :items="group.items"
        :accent="group.accent"
      />
    </section>
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
  background:
    radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(255, 255, 255, 0.82), transparent 24%),
    linear-gradient(135deg, #eef7ff 0%, #ffffff 46%, #f3fbef 100%);
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
  color: rgba(0, 122, 255, 0.24);
  font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
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
  color: rgba(52, 199, 89, 0.24);
}

.algorithm-word-2 {
  color: rgba(255, 45, 85, 0.18);
}

.algorithm-word-3 {
  color: rgba(255, 149, 0, 0.22);
}

.demo-label {
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 5;
  margin: 0;
  color: rgba(29, 29, 31, 0.58);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tilt-layer {
  position: relative;
  z-index: 1;
  width: min(76vw, 980px);
  aspect-ratio: 1.55;
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
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow:
    0 34px 90px rgba(29, 29, 31, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px) saturate(1.2);
}

.tilt-core {
  inset: 18% 23%;
  display: grid;
  place-items: center;
  text-align: center;
  transform: translateZ(90px);
  will-change: transform;
}

.tilt-core span {
  color: rgba(29, 29, 31, 0.55);
  font-size: 14px;
  font-weight: 800;
}

.tilt-core strong {
  color: #1d1d1f;
  font-size: 92px;
  line-height: 1;
  letter-spacing: 0;
}

.tilt-panel {
  width: 170px;
  height: 112px;
  display: grid;
  place-items: center;
  color: #1d1d1f;
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

.gallery-section {
  position: relative;
  z-index: 2;
  background: #08090b;
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
    width: 94vw;
    aspect-ratio: 0.72;
  }

  .tilt-core {
    inset: 28% 10%;
  }

  .tilt-core span {
    font-size: 11px;
  }

  .tilt-core strong {
    font-size: 46px;
  }

  .tilt-panel {
    width: 86px;
    height: 62px;
    font-size: 20px;
  }

  .tilt-panel-1 {
    top: 6%;
    left: 6%;
  }

  .tilt-panel-2 {
    top: 8%;
    right: 4%;
  }

  .tilt-panel-3 {
    top: 38%;
    left: -2%;
  }

  .tilt-panel-4 {
    top: 39%;
    right: -2%;
  }

  .tilt-panel-5 {
    bottom: 11%;
    left: 8%;
  }

  .tilt-panel-6 {
    right: 8%;
    bottom: 6%;
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
