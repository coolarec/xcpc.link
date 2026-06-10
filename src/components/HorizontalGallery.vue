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
})

const root = ref(null)
const wrapper = ref(null)
const strip = ref(null)
let context
let removeRefreshListener

onMounted(async () => {
  await nextTick()

  if (!root.value || !wrapper.value || !strip.value) return

  context = gsap.context(() => {
    let pinWrapWidth = 0
    let horizontalScrollLength = 0

    const refresh = () => {
      pinWrapWidth = strip.value.scrollWidth
      horizontalScrollLength = Math.max(0, pinWrapWidth - window.innerWidth)
    }

    refresh()

    const tween = gsap.to(strip.value, {
      scrollTrigger: {
        scrub: true,
        trigger: root.value,
        pin: root.value,
        start: 'top top',
        end: () => `+=${pinWrapWidth}`,
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
})

onBeforeUnmount(() => {
  removeRefreshListener?.()
  context?.revert()
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
  gap: 44px;
  padding: 76px max(22px, calc((100vw - 1180px) / 2));
  color: #f5f5f7;
  background:
    radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--accent), transparent 70%), transparent 26%),
    linear-gradient(180deg, rgba(18, 19, 24, 0.98), rgba(6, 7, 10, 0.98));
}

.gallery-heading {
  width: min(720px, 100%);
}

.gallery-heading p {
  margin: 0 0 12px;
  color: color-mix(in srgb, var(--accent), white 34%);
  font-size: 14px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.gallery-heading h2 {
  margin: 0;
  font-size: clamp(42px, 8vw, 94px);
  line-height: 0.95;
  letter-spacing: 0;
}

.horiz-gallery-wrapper,
.horiz-gallery-strip {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  will-change: transform;
}

.horiz-gallery-strip {
  width: 132vw;
  min-width: max-content;
  gap: 18px;
}

.gallery-card {
  position: relative;
  width: clamp(320px, 30vw, 520px);
  min-height: 420px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05)),
    rgba(255, 255, 255, 0.06);
  box-shadow: 0 32px 92px rgba(0, 0, 0, 0.28);
}

.gallery-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(130deg, color-mix(in srgb, var(--accent), transparent 58%), transparent 42%),
    radial-gradient(circle at 75% 18%, rgba(255, 255, 255, 0.18), transparent 24%);
  opacity: 0.9;
}

.gallery-index {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 1;
  color: rgba(245, 245, 247, 0.54);
  font-size: 14px;
  font-weight: 850;
}

.gallery-orbit {
  position: absolute;
  inset: 18% 14% auto auto;
  width: 210px;
  aspect-ratio: 1;
  border: 1px dashed rgba(255, 255, 255, 0.22);
  border-radius: 999px;
}

.gallery-card h3,
.gallery-card p,
.gallery-tags {
  position: relative;
  z-index: 1;
}

.gallery-card h3 {
  margin: 0;
  font-size: clamp(30px, 4.2vw, 58px);
  line-height: 1;
  letter-spacing: 0;
}

.gallery-card p {
  max-width: 390px;
  margin: 16px 0 0;
  color: rgba(245, 245, 247, 0.68);
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
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(245, 245, 247, 0.78);
  font-size: 12px;
  font-weight: 750;
}

@media (max-width: 720px) {
  .horizontal-gallery {
    padding: 58px 18px;
    gap: 30px;
  }

  .gallery-card {
    width: min(84vw, 360px);
    min-height: 370px;
    padding: 22px;
  }

  .horiz-gallery-strip {
    gap: 12px;
  }
}
</style>
