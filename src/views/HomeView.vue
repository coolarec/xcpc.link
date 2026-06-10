<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const pageRoot = ref(null)
const tiltSection = ref(null)
const tiltLayer = ref(null)
const overscrollSection = ref(null)
const waypointSection = ref(null)
const activeWaypoint = ref(0)

const tiltPanels = ['01', '02', '03', '04', '05', '06']
const waypoints = [
  {
    label: '01',
    title: 'Waypoint One',
    tone: 'blue',
    rows: ['Alpha', 'Beta', 'Gamma'],
  },
  {
    label: '02',
    title: 'Waypoint Two',
    tone: 'green',
    rows: ['Delta', 'Epsilon', 'Zeta'],
  },
  {
    label: '03',
    title: 'Waypoint Three',
    tone: 'amber',
    rows: ['Eta', 'Theta', 'Iota'],
  },
]

let motionMedia

function activateWaypoint(index) {
  if (activeWaypoint.value === index) return

  activeWaypoint.value = index
  nextTick(() => {
    const current = pageRoot.value?.querySelector(`[data-waypoint-card="${index}"]`)

    if (!current) return

    gsap.fromTo(
      current.querySelectorAll('.waypoint-card-line, .waypoint-token'),
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.06,
        overwrite: 'auto',
      },
    )
  })
}

onMounted(async () => {
  await nextTick()

  motionMedia = gsap.matchMedia()
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const root = pageRoot.value
    const section = tiltSection.value
    const layer = tiltLayer.value
    const cleanup = []

    if (!root) return undefined

    const context = gsap.context(() => {
      if (section && layer) {
        gsap.set(layer, {
          transformPerspective: 1100,
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
        })

        gsap.from('.tilt-panel', {
          z: -160,
          y: 42,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: {
            amount: 0.42,
            from: 'center',
          },
        })

        gsap.from('.tilt-core', {
          scale: 0.9,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
        })

        gsap.to('.tilt-ring', {
          rotation: 360,
          duration: 34,
          repeat: -1,
          ease: 'none',
        })

        const rotateX = gsap.quickTo(layer, 'rotationX', {
          duration: 0.55,
          ease: 'power3.out',
        })
        const rotateY = gsap.quickTo(layer, 'rotationY', {
          duration: 0.55,
          ease: 'power3.out',
        })
        const moveX = gsap.quickTo(layer, 'x', {
          duration: 0.55,
          ease: 'power3.out',
        })
        const moveY = gsap.quickTo(layer, 'y', {
          duration: 0.55,
          ease: 'power3.out',
        })

        const handlePointerMove = (event) => {
          const bounds = section.getBoundingClientRect()
          const x = (event.clientX - bounds.left) / bounds.width - 0.5
          const y = (event.clientY - bounds.top) / bounds.height - 0.5

          rotateY(x * 22)
          rotateX(y * -16)
          moveX(x * 24)
          moveY(y * 18)
          section.style.setProperty('--cursor-x', `${(x + 0.5) * 100}%`)
          section.style.setProperty('--cursor-y', `${(y + 0.5) * 100}%`)
        }

        const handlePointerLeave = () => {
          rotateX(0)
          rotateY(0)
          moveX(0)
          moveY(0)
          section.style.setProperty('--cursor-x', '50%')
          section.style.setProperty('--cursor-y', '50%')
        }

        section.addEventListener('pointermove', handlePointerMove)
        section.addEventListener('pointerleave', handlePointerLeave)
        cleanup.push(() => {
          section.removeEventListener('pointermove', handlePointerMove)
          section.removeEventListener('pointerleave', handlePointerLeave)
        })
      }

      if (overscrollSection.value) {
        const pin = overscrollSection.value.querySelector('.overscroll-pin')
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: overscrollSection.value,
            start: 'top top',
            end: '+=165%',
            pin,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        timeline
          .to(
            '.panel-a',
            {
              yPercent: -34,
              scale: 0.82,
              autoAlpha: 0.28,
              duration: 0.72,
              ease: 'none',
            },
            0,
          )
          .fromTo(
            '.panel-b',
            { yPercent: 118, scale: 0.94 },
            {
              yPercent: -8,
              scale: 1.02,
              duration: 0.76,
              ease: 'none',
            },
            0,
          )
          .to('.panel-b', {
            yPercent: 0,
            scale: 1,
            duration: 0.24,
            ease: 'none',
          })
      }

      if (waypointSection.value) {
        gsap.utils.toArray('.waypoint-step').forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => activateWaypoint(index),
            onEnterBack: () => activateWaypoint(index),
          })
        })

        gsap.to('.waypoint-progress-fill', {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: waypointSection.value,
            start: 'top center',
            end: 'bottom center',
            scrub: true,
          },
        })
      }

      ScrollTrigger.refresh()
    }, root)

    return () => {
      cleanup.forEach((removeListener) => removeListener())
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
      <p class="demo-label">Cursor-driven perspective tilt</p>

      <div ref="tiltLayer" class="tilt-layer">
        <div class="tilt-ring" aria-hidden="true"></div>
        <div class="tilt-core">
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

    <section
      ref="overscrollSection"
      class="overscroll-section"
      aria-label="Pinned panels with overscroll"
    >
      <div class="overscroll-pin">
        <article class="overscroll-panel panel-a">
          <span>Pinned panel</span>
          <strong>A</strong>
        </article>
        <article class="overscroll-panel panel-b">
          <span>Overscroll panel</span>
          <strong>B</strong>
        </article>
      </div>
    </section>

    <section ref="waypointSection" class="waypoint-section" aria-label="Scroll waypoints">
      <div class="waypoint-layout">
        <div class="waypoint-stage">
          <p class="demo-label">Scroll waypoints</p>
          <div class="waypoint-card-stack">
            <article
              v-for="(waypoint, index) in waypoints"
              :key="waypoint.label"
              class="waypoint-card"
              :class="[`tone-${waypoint.tone}`, { 'is-active': activeWaypoint === index }]"
              :data-waypoint-card="index"
            >
              <span class="waypoint-token">{{ waypoint.label }}</span>
              <h2>{{ waypoint.title }}</h2>
              <div class="waypoint-card-lines">
                <span
                  v-for="row in waypoint.rows"
                  :key="row"
                  class="waypoint-card-line"
                >
                  {{ row }}
                </span>
              </div>
            </article>
          </div>
        </div>

        <div class="waypoint-progress" aria-hidden="true">
          <span class="waypoint-progress-fill"></span>
        </div>

        <div class="waypoint-steps">
          <article
            v-for="(waypoint, index) in waypoints"
            :key="waypoint.title"
            class="waypoint-step"
            :class="{ 'is-active': activeWaypoint === index }"
          >
            <span>{{ waypoint.label }}</span>
            <h3>{{ waypoint.title }}</h3>
          </article>
        </div>
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
  min-height: 100svh;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(255, 255, 255, 0.76), transparent 25%),
    linear-gradient(135deg, #f5f5f7 0%, #ffffff 44%, #e8eef8 100%);
  isolation: isolate;
}

.demo-label {
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 3;
  margin: 0;
  color: rgba(29, 29, 31, 0.58);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tilt-layer {
  position: relative;
  width: min(76vw, 980px);
  aspect-ratio: 1.55;
  transform-style: preserve-3d;
  will-change: transform;
}

.tilt-ring {
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
  transform: translateZ(86px);
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

.overscroll-section {
  min-height: 100svh;
  background: #08090b;
  color: #f5f5f7;
}

.overscroll-pin {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.overscroll-panel {
  position: absolute;
  width: min(74vw, 980px);
  height: min(66svh, 650px);
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  box-shadow: 0 34px 110px rgba(0, 0, 0, 0.38);
}

.overscroll-panel span {
  align-self: end;
  color: rgba(255, 255, 255, 0.62);
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
}

.overscroll-panel strong {
  align-self: start;
  font-size: 180px;
  line-height: 1;
  letter-spacing: 0;
}

.panel-a {
  z-index: 1;
  background: linear-gradient(145deg, #1d1d1f, #2c2c2e);
}

.panel-b {
  z-index: 2;
  color: #1d1d1f;
  background: linear-gradient(145deg, #ffffff, #eaf2ff);
  transform: translateY(118%);
}

.panel-b span {
  color: rgba(29, 29, 31, 0.56);
}

.waypoint-section {
  min-height: 100svh;
  padding: 12svh max(22px, calc((100vw - 1180px) / 2));
  background: #f5f5f7;
}

.waypoint-layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(420px, 0.9fr) 2px minmax(280px, 0.7fr);
  gap: 58px;
  align-items: start;
}

.waypoint-stage {
  position: sticky;
  top: 8svh;
  min-height: 84svh;
  display: grid;
  align-content: center;
}

.waypoint-stage .demo-label {
  position: static;
  margin-bottom: 22px;
}

.waypoint-card-stack {
  position: relative;
  height: 560px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 32px 90px rgba(29, 29, 31, 0.1);
}

.waypoint-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 38px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(24px) scale(0.98);
  transition:
    opacity 220ms ease,
    transform 220ms ease,
    visibility 220ms ease;
}

.waypoint-card.is-active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

.waypoint-token {
  width: 64px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  font-weight: 800;
}

.tone-blue .waypoint-token {
  background: #007aff;
}

.tone-green .waypoint-token {
  background: #34c759;
}

.tone-amber .waypoint-token {
  background: #ff9f0a;
}

.waypoint-card h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 72px;
  line-height: 1;
  letter-spacing: 0;
}

.waypoint-card-lines {
  display: grid;
  gap: 12px;
}

.waypoint-card-line {
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
  font-weight: 700;
}

.waypoint-progress {
  position: sticky;
  top: 8svh;
  width: 2px;
  height: 84svh;
  overflow: hidden;
  background: rgba(29, 29, 31, 0.08);
}

.waypoint-progress-fill {
  display: block;
  width: 100%;
  height: 0;
  background: linear-gradient(180deg, #007aff, #34c759 55%, #ff9f0a);
}

.waypoint-steps {
  padding: 18svh 0;
}

.waypoint-step {
  min-height: 70svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-top: 1px solid rgba(29, 29, 31, 0.08);
  opacity: 0.38;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.waypoint-step.is-active {
  opacity: 1;
  transform: translateX(-4px);
}

.waypoint-step span {
  color: rgba(29, 29, 31, 0.45);
  font-weight: 800;
}

.waypoint-step h3 {
  margin: 14px 0 0;
  color: #1d1d1f;
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: 0;
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

  .overscroll-panel {
    width: calc(100% - 32px);
    height: 64svh;
  }

  .overscroll-panel strong {
    font-size: 120px;
  }

  .waypoint-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .waypoint-stage,
  .waypoint-progress {
    position: relative;
    top: auto;
  }

  .waypoint-progress {
    display: none;
  }

  .waypoint-card-stack {
    height: 420px;
  }

  .waypoint-card h2 {
    font-size: 44px;
  }

  .waypoint-steps {
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tilt-layer,
  .tilt-panel,
  .overscroll-panel,
  .waypoint-card,
  .waypoint-step {
    transition: none;
    transform: none;
  }

  .overscroll-section,
  .overscroll-pin {
    min-height: auto;
  }

  .overscroll-pin {
    gap: 16px;
    padding: 80px 20px;
  }

  .overscroll-panel {
    position: relative;
  }

  .panel-b {
    transform: none;
  }
}
</style>
