<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
  eyebrow: {
    type: String,
    default: 'Horizontal gallery',
  },
  title: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  accent: {
    type: String,
    default: '#007aff',
  },
  direction: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value),
  },
  scrollDistanceRatio: {
    type: Number,
    default: 0.58,
  },
})

const root = ref(null)
const wrapper = ref(null)
const strip = ref(null)
let motionMedia

onMounted(async () => {
  await nextTick()

  if (!root.value || !wrapper.value || !strip.value) return

  motionMedia = gsap.matchMedia()

  motionMedia.add('(min-width: 721px)', () => {
    let removeRefreshListener

    const context = gsap.context(() => {
      let pinWrapWidth = 0
      let horizontalScrollLength = 0

      const refresh = () => {
        pinWrapWidth = strip.value.scrollWidth
        horizontalScrollLength = Math.max(0, pinWrapWidth - wrapper.value.clientWidth)
      }

      const getScrollDistance = () => horizontalScrollLength * 1.05

      refresh()

      const tween = gsap.to(strip.value, {
        scrollTrigger: {
          scrub: true,
          trigger: root.value,
          pin: root.value,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
        },
        x: () => (props.direction === 'left' ? -horizontalScrollLength : horizontalScrollLength),
        ease: 'none',
      })

      gsap.from('.gallery-card', {
        autoAlpha: 0,
        y: 42,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: root.value,
          start: 'top 70%',
          once: true,
        },
      })

      ScrollTrigger.addEventListener('refreshInit', refresh)
      removeRefreshListener = () => ScrollTrigger.removeEventListener('refreshInit', refresh)
      requestAnimationFrame(() => {
        tween.scrollTrigger?.refresh()
        ScrollTrigger.refresh()
      })
    }, root.value)

    return () => {
      removeRefreshListener?.()
      context.revert()
    }
  })

  motionMedia.add('(max-width: 720px)', () => {
    const context = gsap.context(() => {
      gsap.set(strip.value, { clearProps: 'transform' })

      gsap.from('.gallery-card', {
        autoAlpha: 0,
        y: 28,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: root.value,
          start: 'top 78%',
          once: true,
        },
      })

      requestAnimationFrame(() => ScrollTrigger.refresh())
    }, root.value)

    return () => context.revert()
  })
})

onBeforeUnmount(() => {
  motionMedia?.revert()
})
</script>

<template>
  <section ref="root" class="horizontal-gallery" :style="{ '--accent': accent }">
    <div class="gallery-heading">
      <p>{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>

    <div ref="wrapper" class="horiz-gallery-wrapper">
      <div ref="strip" class="horiz-gallery-strip">
        <article
          v-for="(item, index) in items"
          :key="`${item.title}-${index}`"
          class="gallery-card"
        >
          <span class="gallery-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="gallery-orbit" aria-hidden="true"></div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <div class="gallery-tags" aria-label="tags">
            <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.horizontal-gallery {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  display: grid;
  align-content: center;
  gap: 42px;
  padding: 86px max(24px, calc((100vw - 1240px) / 2));
  color: var(--page-fg);
  background: var(--page-bg);
}

.gallery-heading {
  width: min(860px, 100%);
  padding: 0 6px;
}

.gallery-heading p {
  margin: 0 0 12px;
  color: color-mix(in srgb, var(--accent), #ffffff 18%);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gallery-heading h2 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(52px, 8.8vw, 112px);
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.horiz-gallery-wrapper,
.horiz-gallery-strip {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  will-change: transform;
}

.horiz-gallery-wrapper {
  width: 100%;
  min-width: 0;
}

.horiz-gallery-strip {
  width: 118vw;
  min-width: max-content;
  gap: 50px;
}

.gallery-card {
  position: relative;
  width: clamp(360px, 32vw, 600px);
  min-height: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
  border: 0;
  border-radius: 18px;
  background:
    radial-gradient(circle at 78% 20%, color-mix(in srgb, var(--accent), transparent 78%), transparent 34%),
    var(--card-bg);
  color: var(--page-fg);
  box-shadow: var(--gallery-card-shadow);
}

.gallery-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffffff, var(--accent), #ffffff);
}

.gallery-index {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 1;
  color: color-mix(in srgb, var(--muted-fg), transparent 18%);
  font-size: 14px;
  font-family: "Sora", sans-serif;
  font-weight: 700;
}

.gallery-orbit {
  position: absolute;
  inset: 18% 14% auto auto;
  width: 210px;
  aspect-ratio: 1;
  border: 0;
  border-radius: 18px;
  background: color-mix(in srgb, var(--panel-bg), var(--page-fg) 8%);
  opacity: 0.9;
}

.gallery-card h3,
.gallery-card p,
.gallery-tags {
  position: relative;
  z-index: 1;
}

.gallery-card h3 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-weight: 800;
  font-size: clamp(34px, 4.8vw, 66px);
  line-height: 0.96;
  letter-spacing: -0.03em;
}

.gallery-card p {
  max-width: 390px;
  margin: 18px 0 0;
  color: var(--muted-fg);
  font-size: 16px;
  line-height: 1.6;
}

.gallery-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
}

.gallery-tags span {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-bg), var(--page-fg) 8%);
  color: var(--muted-fg);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 720px) {
  .horizontal-gallery {
    min-height: auto;
    padding: 64px 18px;
    gap: 28px;
  }

  .gallery-heading {
    width: 100%;
  }

  .gallery-heading h2 {
    font-size: clamp(42px, 13vw, 58px);
  }

  .horiz-gallery-wrapper,
  .horiz-gallery-strip {
    display: grid;
    width: 100%;
    min-width: 0;
    transform: none !important;
  }

  .horiz-gallery-strip {
    grid-template-columns: 1fr;
    gap: 50px;
  }

  .gallery-card {
    width: 100%;
    min-height: 340px;
    padding: 20px;
  }
}
</style>
