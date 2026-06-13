<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch as vueWatch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import FloatingPanel from './FloatingPanel.vue'
import type { SiteLink } from '../../../types/home'

gsap.registerPlugin(ScrollTrigger, Flip)

interface LinkGroup {
  title: string
  items: SiteLink[]
}

const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  accent?: string
  direction?: 'left' | 'right'
  reverse?: boolean
  scrollDistanceRatio?: number
  links?: LinkGroup[]
}>(), {
  eyebrow: 'Horizontal gallery',
  accent: '#007aff',
  direction: 'left',
  reverse: false,
  scrollDistanceRatio: 0.58,
  links: () => [],
})

const showAllLinks = ref(false)
const isMounted = ref(false)
const isModalVisible = ref(false) // Use a separate flag to control DOM insertion

const modalRef = ref<HTMLElement | null>(null)
const modalContentRef = ref<HTMLElement | null>(null)
const gridItemsRef = ref<HTMLElement[]>([])

vueWatch(showAllLinks, async (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
  
  if (val) {
    isModalVisible.value = true
    await nextTick()
    
    if (modalRef.value && modalContentRef.value) {
      const tl = gsap.timeline()
      const backdrop = modalRef.value.querySelector('.modal-backdrop')
      
      // Force initial state to prevent flash
      gsap.set(modalRef.value, { opacity: 1, visibility: 'visible' })
      gsap.set(backdrop, { opacity: 0, backdropFilter: 'blur(0px) saturate(1)', webkitBackdropFilter: 'blur(0px) saturate(1)' })
      gsap.set(modalContentRef.value, { opacity: 0, scale: 0.95, y: 20 })
      
      tl.to(backdrop, {
        opacity: 1,
        backdropFilter: 'blur(16px) saturate(1.5)',
        webkitBackdropFilter: 'blur(16px) saturate(1.5)',
        duration: 0.4,
        ease: 'power2.out'
      })
      
      tl.to(modalContentRef.value, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.45,
        ease: 'power3.out'
      }, 0.05)
      
      if (gridItemsRef.value.length) {
        tl.fromTo(gridItemsRef.value, 
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.012, duration: 0.35, ease: 'power2.out', clearProps: 'all' },
          0.2
        )
      }
    }
  } else {
    if (modalRef.value && modalContentRef.value) {
      const tl = gsap.timeline({
        onComplete: () => {
          isModalVisible.value = false
        }
      })
      
      tl.to(modalContentRef.value, {
        opacity: 0,
        scale: 0.95,
        y: 15,
        duration: 0.3,
        ease: 'power2.inOut'
      })
      
      tl.to(modalRef.value.querySelector('.modal-backdrop'), {
        opacity: 0,
        backdropFilter: 'blur(0px) saturate(1)',
        webkitBackdropFilter: 'blur(0px) saturate(1)',
        duration: 0.3,
        ease: 'power2.inOut'
      }, 0.1)
    } else {
      isModalVisible.value = false
    }
  }
})

const toggleAllLinks = () => {
  showAllLinks.value = !showAllLinks.value
}

const root = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLDivElement | null>(null)
const strip = ref<HTMLDivElement | null>(null)
let motionMedia: gsap.MatchMedia | undefined

const isReversed = () => props.reverse || props.direction === 'right'

onMounted(async () => {
  isMounted.value = true
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
  document.body.style.overflow = ''
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
          <button class="view-all-btn" @click="toggleAllLinks">
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

    <Teleport v-if="isMounted" to=".motion-page">
      <div 
        v-if="isModalVisible" 
        ref="modalRef" 
        class="links-grid-overlay"
        style="opacity: 0; visibility: hidden;"
      >
        <div class="modal-backdrop" @click="toggleAllLinks"></div>
        
        <div ref="modalContentRef" class="modal-content">
          <header class="modal-header">
            <div class="header-titles">
              <h3>{{ title }}</h3>
              <p>{{ eyebrow }}</p>
            </div>
            <button class="close-modal" @click="toggleAllLinks">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </header>

          <div class="links-grid-body">
            <div 
              v-for="group in links" 
              :key="group.title" 
              class="mac-group-box"
            >
              <h4 v-if="group.title" class="group-title">{{ group.title }}</h4>
              
              <div class="links-grid">
                <a 
                  v-for="link in group.items" 
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

.links-grid-body {
  padding: 24px 32px 40px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.mac-group-box {
  background: color-mix(in srgb, var(--page-fg) 2.5%, transparent);
  border: 1px solid var(--soft-line);
  border-radius: 18px;
  padding: 20px;
}

.group-title {
  margin: 0 0 16px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-fg) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.grid-link-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.grid-link-item:hover {
  background: color-mix(in srgb, var(--page-fg) 6%, transparent);
}

.item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #ffffff;
  display: grid;
  place-items: center;
  overflow: hidden;
  flex-shrink: 0;
  color: #000000 !important;
  font-size: 15px;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.item-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h4 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 600;
  color: var(--page-fg) !important;
  line-height: 1.3;
}

.item-info p {
  margin: 0;
  font-size: 13px;
  color: var(--muted-fg) !important;
  line-height: 1.4;
  word-break: break-word;
}

.links-grid-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.modal-content {
  position: relative;
  width: min(960px, calc(100% - 40px));
  height: min(720px, calc(100dvh - 40px));
  background: var(--card-bg);
  border-radius: 24px;
  box-shadow: 
    0 24px 64px rgba(0, 0, 0, 0.5),
    0 0 0 1px var(--soft-line);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--soft-line);
  background: var(--card-bg);
  position: relative;
  z-index: 10;
}

.header-titles {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-titles h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--page-fg) !important;
  letter-spacing: -0.01em;
}

.header-titles p {
  margin: 0;
  color: var(--muted-fg) !important;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.close-modal {
  background: color-mix(in srgb, var(--page-fg) 10%, transparent);
  border: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--page-fg) !important;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.close-modal svg {
  width: 16px;
  height: 16px;
}

.close-modal:hover {
  background: color-mix(in srgb, var(--page-fg) 18%, transparent);
  transform: scale(1.05);
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

  .links-grid-body {
    padding: 16px 12px 32px;
    gap: 20px;
  }

  .mac-group-box {
    padding: 12px;
    border-radius: 16px;
  }

  .modal-header {
    padding: 20px 16px;
  }

  .header-titles h3 {
    font-size: 20px;
  }

  .links-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .grid-link-item {
    padding: 10px;
  }

  .item-info h4 {
    font-size: 14px;
  }

  .item-info p {
    font-size: 12px;
  }
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
</style>
