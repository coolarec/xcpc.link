<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(MotionPathPlugin, ScrambleTextPlugin, ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const tiltLayer = ref(null)
const tiltCore = ref(null)
const waypointSection = ref(null)
const waypointBox = ref(null)
const activeWaypoint = ref(0)

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
const backgroundWords = Array.from({ length: 118 }, (_, index) => ({
  word: algorithmWords[index % algorithmWords.length],
  x: `${((index * 37) % 108) - 5}%`,
  y: `${(index * 53) % 94}%`,
  rotate: `${((index * 29) % 38) - 19}deg`,
  size: `${12 + ((index * 7) % 17)}px`,
  opacity: `${0.16 + (index % 6) * 0.035}`,
}))
const waypoints = [
  { label: '01', title: 'Waypoint One', tone: 'blue' },
  { label: '02', title: 'Waypoint Two', tone: 'green' },
  { label: '03', title: 'Waypoint Three', tone: 'amber' },
]

let motionMedia

function activateWaypoint(index) {
  if (activeWaypoint.value === index) return
  activeWaypoint.value = index
}

onMounted(async () => {
  await nextTick()

  motionMedia = gsap.matchMedia()
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const root = pageRoot.value
    const tilt = tiltSection.value
    const layer = tiltLayer.value
    const core = tiltCore.value
    const second = waypointSection.value
    const movingBox = waypointBox.value
    const cleanup = []

    if (!root) return undefined

    const context = gsap.context(() => {
      if (tilt && layer && core) {
        gsap.set(tilt, { perspective: 650 })
        gsap.set(layer, { transformStyle: 'preserve-3d' })

        gsap.utils.toArray('.algorithm-word').forEach((word, index) => {
          const text = word.dataset.word || ''
          word.textContent = ''

          gsap.to(word, {
            duration: 1.4 + (index % 5) * 0.18,
            delay: (index % 12) * 0.035,
            repeat: -1,
            repeatDelay: 2 + (index % 7) * 0.16,
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

      if (second && movingBox) {
        let waypointTween

        const buildWaypointTween = () => {
          waypointTween?.scrollTrigger?.kill()
          waypointTween?.kill()
          gsap.set(movingBox, { clearProps: 'transform' })

          const boxRect = movingBox.getBoundingClientRect()
          const boxCenter = {
            x: boxRect.left + boxRect.width / 2,
            y: boxRect.top + boxRect.height / 2,
          }
          const markers = gsap.utils.toArray('.waypoint-marker')
          const path = markers.map((marker) => {
            const markerRect = marker.getBoundingClientRect()

            return {
              x: markerRect.left + markerRect.width / 2 - boxCenter.x,
              y: markerRect.top + markerRect.height / 2 - boxCenter.y,
            }
          })

          waypointTween = gsap.to(movingBox, {
            ease: 'none',
            duration: 1,
            motionPath: {
              path,
              curviness: 1.5,
            },
            scrollTrigger: {
              trigger: '.waypoint-start',
              start: 'clamp(top center)',
              endTrigger: '.waypoint-final',
              end: 'clamp(top center)',
              scrub: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                activateWaypoint(Math.min(waypoints.length - 1, Math.floor(self.progress * waypoints.length)))
              },
            },
          })
        }

        buildWaypointTween()
        window.addEventListener('resize', buildWaypointTween)
        cleanup.push(() => {
          window.removeEventListener('resize', buildWaypointTween)
          waypointTween?.scrollTrigger?.kill()
          waypointTween?.kill()
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
        <span
          v-for="(item, index) in backgroundWords"
          :key="`${item.word}-${index}`"
          class="algorithm-word"
          :class="`algorithm-word-${index % 4}`"
          :data-word="item.word"
          :style="{
            '--word-x': item.x,
            '--word-y': item.y,
            '--word-rotate': item.rotate,
            '--word-size': item.size,
            '--word-opacity': item.opacity,
          }"
        >
          {{ item.word }}
        </span>
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

    <section ref="waypointSection" class="waypoint-section" aria-label="Scroll waypoints">
      <p class="demo-label">Scroll waypoints</p>

      <div class="waypoint-field">
        <article class="waypoint-node waypoint-start">
          <div ref="waypointBox" class="waypoint-box">
            <span>{{ waypoints[activeWaypoint].label }}</span>
          </div>
          <h2>{{ waypoints[activeWaypoint].title }}</h2>
        </article>

        <article
          v-for="(waypoint, index) in waypoints"
          :key="waypoint.label"
          class="waypoint-node waypoint-target"
          :class="[`waypoint-target-${index + 1}`, `tone-${waypoint.tone}`, { 'is-active': activeWaypoint === index }]"
        >
          <span class="waypoint-marker"></span>
          <small>{{ waypoint.label }}</small>
          <h3>{{ waypoint.title }}</h3>
        </article>

        <span class="waypoint-path-line" aria-hidden="true"></span>
        <span class="waypoint-final" aria-hidden="true"></span>
      </div>
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
  overflow: hidden;
  padding: 0;
  pointer-events: none;
  mask-image: linear-gradient(180deg, #000 0%, #000 72%, transparent 100%);
}

.algorithm-word {
  position: absolute;
  top: var(--word-y);
  left: var(--word-x);
  opacity: var(--word-opacity);
  transform: rotate(var(--word-rotate));
  transform-origin: center;
  color: rgba(0, 122, 255, 0.24);
  font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
  font-size: var(--word-size);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
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

.waypoint-section {
  position: relative;
  z-index: 2;
  min-height: 320svh;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(18, 19, 24, 0.96), rgba(6, 7, 10, 0.98)),
    #0b0c10;
  color: #f5f5f7;
}

.waypoint-section .demo-label {
  color: rgba(245, 245, 247, 0.62);
}

.waypoint-field {
  position: relative;
  min-height: 320svh;
}

.waypoint-node {
  position: absolute;
  width: min(32vw, 360px);
  min-height: 220px;
  display: grid;
  align-content: center;
  gap: 14px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 84px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(24px) saturate(1.2);
}

.waypoint-start {
  top: 16svh;
  left: 50%;
  transform: translateX(-50%);
  justify-items: center;
  text-align: center;
}

.waypoint-box {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #101114;
  background: #f5f5f7;
  box-shadow: 0 20px 54px rgba(0, 0, 0, 0.34);
  will-change: transform;
}

.waypoint-box span {
  font-size: 22px;
  font-weight: 850;
}

.waypoint-start h2 {
  margin: 0;
  color: #f5f5f7;
  font-size: 42px;
  line-height: 1.1;
  letter-spacing: 0;
}

.waypoint-target {
  opacity: 0.45;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    border-color 180ms ease;
}

.waypoint-target.is-active {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.24);
  transform: translateY(-4px);
}

.waypoint-target-1 {
  top: 36%;
  left: 9%;
}

.waypoint-target-2 {
  top: 57%;
  right: 9%;
}

.waypoint-target-3 {
  top: 79%;
  left: 34%;
}

.waypoint-marker {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #1d1d1f;
}

.tone-blue .waypoint-marker {
  background: #007aff;
}

.tone-green .waypoint-marker {
  background: #34c759;
}

.tone-amber .waypoint-marker {
  background: #ff9f0a;
}

.waypoint-target small {
  color: rgba(245, 245, 247, 0.5);
  font-size: 14px;
  font-weight: 850;
}

.waypoint-target h3 {
  margin: 0;
  color: #f5f5f7;
  font-size: 38px;
  line-height: 1.08;
  letter-spacing: 0;
}

.waypoint-path-line {
  position: absolute;
  top: 20%;
  left: 8%;
  right: 8%;
  height: 70%;
  border: 1px dashed rgba(245, 245, 247, 0.14);
  border-radius: 50%;
  pointer-events: none;
}

.waypoint-final {
  position: absolute;
  left: 50%;
  bottom: 14svh;
  width: 1px;
  height: 1px;
}

@media (max-width: 860px) {
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

  .waypoint-node {
    width: min(78vw, 360px);
  }

  .waypoint-target-1 {
    top: 34%;
    left: 8%;
  }

  .waypoint-target-2 {
    top: 56%;
    right: 8%;
  }

  .waypoint-target-3 {
    top: 78%;
    left: 12%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tilt-section,
  .tilt-layer,
  .tilt-core,
  .tilt-panel,
  .waypoint-box,
  .waypoint-target {
    transition: none;
    transform: none;
  }
}
</style>
