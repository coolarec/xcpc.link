<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const root = ref(null)

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

let context
let observer
let backgroundTweens = []
let isMounted = false

const activeWordCount = 24
const waitForIdle = () =>
  new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(resolve, { timeout: 1400 })
      return
    }

    window.setTimeout(resolve, 700)
  })

onMounted(async () => {
  isMounted = true
  await nextTick()

  if (!root.value) return
  if (window.matchMedia('(max-width: 760px), (prefers-reduced-motion: reduce)').matches) return

  await waitForIdle()
  if (!isMounted || !root.value) return

  const { ScrambleTextPlugin } = await import('gsap/ScrambleTextPlugin')
  if (!isMounted || !root.value) return

  gsap.registerPlugin(ScrambleTextPlugin)

  context = gsap.context(() => {
    gsap.utils.toArray('.algorithm-word').forEach((word, index) => {
      if (index % 5 !== 0 || index / 5 >= activeWordCount) return

      const text = word.dataset.word || ''
      const repeatDelay = Number.parseFloat(word.dataset.repeatDelay || '7')
      word.textContent = ''

      backgroundTweens.push(
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
        }),
      )
    })
  }, root.value)

  observer = new IntersectionObserver(
    ([entry]) => {
      backgroundTweens.forEach((tween) => (entry.isIntersecting ? tween.resume() : tween.pause()))
    },
    { threshold: 0.05 },
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  isMounted = false
  observer?.disconnect()
  backgroundTweens = []
  context?.revert()
})
</script>

<template>
  <div ref="root" class="algorithm-band" aria-hidden="true">
    <div v-for="(row, rowIndex) in backgroundRows" :key="`row-${rowIndex}`" class="algorithm-row">
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
</template>

<style scoped>
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
  background: transparent;
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
  color: color-mix(in srgb, var(--panel-fg), transparent 84%);
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
  color: color-mix(in srgb, #5bd6ff, transparent 84%);
}

.algorithm-word-2 {
  color: color-mix(in srgb, #ff92a6, transparent 86%);
}

.algorithm-word-3 {
  color: color-mix(in srgb, #6be6bd, transparent 85%);
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
}
</style>
