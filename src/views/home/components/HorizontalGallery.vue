<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import type { SiteLink } from '../../../types/home'

gsap.registerPlugin(ScrollTrigger, Flip)

const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  accent?: string
  direction?: 'left' | 'right'
  reverse?: boolean
  scrollDistanceRatio?: number
  links?: SiteLink[]
}>(), {
  eyebrow: 'Horizontal gallery',
  accent: '#007aff',
  direction: 'left',
  reverse: false,
  scrollDistanceRatio: 0.58,
  links: () => [],
})

const showAllLinks = ref(false)
const btnRef = ref<HTMLElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)
const modalContentRef = ref<HTMLElement | null>(null)
const gridItemsRef = ref<HTMLElement[]>([])

const toggleAllLinks = async () => {
  if (showAllLinks.value) {
    // Closing
    if (modalRef.value) {
      gsap.to(modalRef.value, { 
        opacity: 0, 
        duration: 0.3, 
        ease: 'power2.in',
        onComplete: () => {
          showAllLinks.value = false
        }
      })
    } else {
      showAllLinks.value = false
    }
  } else {
    // Opening
    const btnState = Flip.getState(btnRef.value)
    showAllLinks.value = true
    await nextTick()

    if (modalRef.value && modalContentRef.value) {
      gsap.set(modalRef.value, { opacity: 1 })
      
      Flip.from(btnState, {
        targets: modalContentRef.value,
        duration: 0.5,
        ease: 'power3.inOut',
        scale: true,
        onComplete: () => {
          gsap.fromTo(gridItemsRef.value, 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.03, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
          )
        }
      })
      
      gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.4 })
      gsap.fromTo('.modal-header', { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.2 })
    }
  }
}

const root = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLDivElement | null>(null)
const strip = ref<HTMLDivElement | null>(null)
let motionMedia: gsap.MatchMedia | undefined

const isReversed = () => props.reverse || props.direction === 'right'

onMounted(async () => {
  await nextTick()

  const rootElement = root.value
  const wrapperElement = wrapper.value
  const stripElement = strip.value
  if (!rootElement || !wrapperElement || !stripElement) return

  motionMedia = gsap.matchMedia()

  motionMedia.add('(min-width: 721px)', () => {
    let removeRefreshListener: (() => void) | undefined
    let tween: gsap.core.Tween | undefined
    let lastWrapperWidth = 0

    const context = gsap.context(() => {
      let horizontalScrollLength = 0

      const refresh = () => {
        horizontalScrollLength = Math.max(0, stripElement.scrollWidth - wrapperElement.clientWidth)
      }

      const getScrollDistance = () => horizontalScrollLength * 1.05
      const cards = () => gsap.utils.toArray<HTMLElement>(stripElement.children)
      const getStartX = () => (isReversed() ? -horizontalScrollLength : 0)
      const getEndX = () => (isReversed() ? 0 : -horizontalScrollLength)

      refresh()
      lastWrapperWidth = wrapperElement.clientWidth

      gsap.set(stripElement, { x: getStartX, force3D: true })

      tween = gsap.fromTo(stripElement, {
        x: getStartX,
      }, {
        scrollTrigger: {
          scrub: 1,
          trigger: rootElement,
          pin: rootElement,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
        },
        x: getEndX,
        force3D: true,
        ease: 'none',
      })

      const cardNodes = cards()
      if (cardNodes.length) {
        gsap.from(cardNodes, {
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: rootElement,
            start: 'top 70%',
            once: true,
          },
        })
      }

      ScrollTrigger.addEventListener('refreshInit', refresh)
      removeRefreshListener = () => ScrollTrigger.removeEventListener('refreshInit', refresh)
    }, rootElement)

    return () => {
      removeRefreshListener?.()
      context.revert()
    }
  })

  motionMedia.add('(max-width: 720px)', () => {
    const context = gsap.context(() => {
      gsap.set(stripElement, { clearProps: 'transform' })

      const cardNodes = gsap.utils.toArray<HTMLElement>(stripElement.children)
      if (cardNodes.length) {
        gsap.from(cardNodes, {
          autoAlpha: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: rootElement,
            start: 'top 78%',
            once: true,
          },
        })
      }
    }, rootElement)

    return () => context.revert()
  })
})

onBeforeUnmount(() => {
  motionMedia?.revert()
})
</script>

<template>
  <section ref="root" class="horizontal-gallery-pin-wrapper">
    <div
      class="horizontal-gallery"
      :class="{ 'is-reversed': isReversed() }"
      :style="{ '--accent': accent }"
    >
      <div class="gallery-heading">
        <p>{{ eyebrow }}</p>
        <div class="heading-flex">
          <h2>{{ title }}</h2>
          <button ref="btnRef" class="view-all-btn" @click="toggleAllLinks">
            全部链接
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div ref="wrapper" class="horiz-gallery-wrapper">
        <div ref="strip" class="horiz-gallery-strip">
          <slot />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAllLinks" ref="modalRef" class="links-grid-overlay">
        <div class="modal-backdrop" @click="toggleAllLinks"></div>
        
        <div ref="modalContentRef" class="modal-content">
          <header class="modal-header">
            <div class="header-titles">
              <p>{{ eyebrow }}</p>
              <h3>{{ title }}</h3>
            </div>
            <button class="close-modal" @click="toggleAllLinks">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </header>

          <div class="links-grid">
            <a 
              v-for="link in links" 
              :key="link.websiteUrl"
              ref="gridItemsRef"
              :href="link.websiteUrl"
              target="_blank"
              rel="noreferrer"
              class="grid-link-item"
            >
              <div class="item-avatar">
                <img v-if="link.avatarUrl" :src="link.avatarUrl" :alt="link.websiteTitle" />
                <span v-else>{{ link.websiteTitle.charAt(0) }}</span>
              </div>
              <div class="item-info">
                <h4>{{ link.websiteTitle }}</h4>
                <p>{{ link.websiteDescription }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.horizontal-gallery-pin-wrapper {
  width: 100%;
  position: relative;
}

.horizontal-gallery {
  --gallery-card-width: clamp(360px, 32vw, 600px);
  --gallery-card-height: 480px;
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
  width: min(1080px, 100%);
  padding: 0 6px;
}

.heading-flex {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 99px;
  border: 1px solid color-mix(in srgb, var(--accent), transparent 60%);
  background: color-mix(in srgb, var(--accent), transparent 90%);
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: var(--accent);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent), transparent 70%);
}

.links-grid-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--page-bg), transparent 30%);
  backdrop-filter: blur(32px) saturate(1.2);
  -webkit-backdrop-filter: blur(32px) saturate(1.2);
}

.modal-content {
  position: relative;
  width: min(1200px, 100%);
  max-height: 90vh;
  background: var(--card-bg);
  border-radius: 32px;
  box-shadow: 
    0 32px 84px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--page-fg) 12%, transparent);
}

.modal-header {
  padding: 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid color-mix(in srgb, var(--page-fg) 8%, transparent);
  background: color-mix(in srgb, var(--card-bg) 80%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: relative;
  z-index: 10;
}

.header-titles p {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.header-titles h3 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: var(--page-fg);
  letter-spacing: -0.01em;
}

.close-modal {
  background: color-mix(in srgb, var(--page-fg) 6%, transparent);
  border: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--muted-fg);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--page-fg) 4%, transparent);
}

.close-modal:hover {
  background: color-mix(in srgb, var(--page-fg) 12%, transparent);
  color: var(--page-fg);
  transform: scale(1.05);
}

.links-grid {
  padding: 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  overflow-y: auto;
  flex: 1;
}

.grid-link-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: color-mix(in srgb, var(--page-fg) 3%, transparent);
  border-radius: 24px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 1px solid transparent;
}

.grid-link-item:hover {
  background: color-mix(in srgb, var(--page-fg) 5%, transparent);
  border-color: color-mix(in srgb, var(--page-fg) 10%, transparent);
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.item-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #ffffff;
  display: grid;
  place-items: center;
  overflow: hidden;
  flex-shrink: 0;
  color: var(--page-bg);
  font-size: 20px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid color-mix(in srgb, var(--page-fg) 10%, transparent);
}

.item-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info h4 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--page-fg);
}

.item-info p {
  margin: 0;
  font-size: 13px;
  color: var(--muted-fg);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.horizontal-gallery.is-reversed .gallery-heading {
  justify-self: end;
  text-align: right;
}

.horizontal-gallery.is-reversed .heading-flex {
  flex-direction: row-reverse;
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
  align-items: stretch;
  gap: 50px;
}

.horizontal-gallery.is-reversed .horiz-gallery-strip {
  flex-direction: row-reverse;
}

.horiz-gallery-strip :deep(.gallery-card) {
  box-sizing: border-box;
  flex: 0 0 var(--gallery-card-width);
  width: var(--gallery-card-width);
  height: var(--gallery-card-height);
  min-height: var(--gallery-card-height);
  max-height: var(--gallery-card-height);
  align-self: stretch;
}

@media (max-width: 720px) {
  .horizontal-gallery {
    --gallery-card-width: 100%;
    --gallery-card-height: clamp(300px, 76svh, 330px);
    min-height: auto;
    overflow: visible;
    padding: 52px 20px;
    gap: 24px;
  }

  .gallery-heading {
    width: 100%;
  }

  .gallery-heading h2 {
    font-size: clamp(34px, 11vw, 50px);
  }

  .horiz-gallery-wrapper {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: visible;
    transform: none !important;
  }

  .horiz-gallery-strip {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    gap: 28px;
  }

  .horizontal-gallery.is-reversed .horiz-gallery-strip {
    flex-direction: column;
  }

  .horizontal-gallery.is-reversed .gallery-heading {
    justify-self: start;
    text-align: left;
  }

  .horiz-gallery-strip :deep(.gallery-card) {
    flex-basis: auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
}
</style>
