<script setup lang="ts">
import { X } from '@lucide/vue'
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  eyebrow?: string
  panelClass?: string
}>(), {
  eyebrow: '',
  panelClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const overlayRef = ref<HTMLElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const backdropRef = ref<HTMLElement | null>(null)
const titleId = computed(() => `floating-panel-${props.title.replace(/\W+/g, '-').toLowerCase()}`)

const close = () => {
  emit('update:modelValue', false)
}

const isMounted = ref(false)
const isVisible = ref(false)

// Use GSAP for the entire transition to eliminate Vue Transition component flashes
watch(() => props.modelValue, async (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
  
  if (isOpen) {
    isVisible.value = true
    await nextTick()
    
    if (overlayRef.value && shellRef.value && backdropRef.value) {
      const tl = gsap.timeline({
        onComplete: () => {
          overlayRef.value?.focus()
        }
      })
      
      // Reset state
      gsap.set(overlayRef.value, { display: 'grid', opacity: 1 })
      gsap.set(backdropRef.value, { opacity: 0, backdropFilter: 'blur(0px) saturate(1)', webkitBackdropFilter: 'blur(0px) saturate(1)' })
      gsap.set(shellRef.value, { opacity: 0, y: 30, scale: 0.95 })
      
      tl.to(backdropRef.value, {
        opacity: 1,
        backdropFilter: 'blur(20px) saturate(1.8)',
        webkitBackdropFilter: 'blur(20px) saturate(1.8)',
        duration: 0.5,
        ease: 'power2.out'
      })
      
      tl.to(shellRef.value, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power3.out'
      }, 0.05)
    }
  } else {
    if (overlayRef.value && shellRef.value && backdropRef.value) {
      const tl = gsap.timeline({
        onComplete: () => {
          isVisible.value = false
        }
      })
      
      tl.to(shellRef.value, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.3,
        ease: 'power2.in'
      })
      
      tl.to(backdropRef.value, {
        opacity: 0,
        backdropFilter: 'blur(0px) saturate(1)',
        webkitBackdropFilter: 'blur(0px) saturate(1)',
        duration: 0.35,
        ease: 'power2.inOut'
      }, 0.1)
    } else {
      isVisible.value = false
    }
  }
})

import { onMounted } from 'vue'
onMounted(() => {
  isMounted.value = true
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport v-if="isMounted" to=".motion-page">
    <div
      v-if="isVisible"
      ref="overlayRef"
      class="floating-panel-overlay"
      tabindex="-1"
      @keydown.esc="close"
    >
      <div 
        ref="backdropRef" 
        class="floating-panel-backdrop" 
        @click="close"
      ></div>

      <section
        ref="shellRef"
        class="floating-panel-shell"
        :class="panelClass"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="floating-panel-header">
          <div class="floating-panel-titles">
            <p v-if="eyebrow">{{ eyebrow }}</p>
            <h3 :id="titleId">{{ title }}</h3>
          </div>
          <button class="floating-panel-close" type="button" aria-label="Close panel" @click="close">
            <X :size="18" :stroke-width="2.3" aria-hidden="true" />
          </button>
        </header>

        <div class="floating-panel-body">
          <slot />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.floating-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  outline: none;
}

.floating-panel-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.floating-panel-shell {
  position: relative;
  z-index: 1;
  width: min(720px, calc(100vw - 40px));
  height: min(800px, calc(100dvh - 80px));
  min-height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 32px;
  color: var(--page-fg);
  background: var(--card-bg);
  box-shadow:
    0 32px 84px rgba(0, 0, 0, 0.5),
    0 0 0 1px var(--soft-line);
}

.floating-panel-header {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 32px;
  border-bottom: 1px solid var(--soft-line);
  background: var(--card-bg);
  position: relative;
  z-index: 10;
}

.floating-panel-titles p {
  margin: 0;
  color: var(--muted-fg) !important;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.floating-panel-titles h3 {
  margin: 2px 0 0;
  color: var(--page-fg) !important;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.floating-panel-close {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  color: var(--page-fg) !important;
  background: color-mix(in srgb, var(--page-fg) 10%, transparent);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 0;
  cursor: pointer;
}

.floating-panel-close:hover {
  background: color-mix(in srgb, var(--page-fg) 18%, transparent);
  transform: scale(1.05);
}

.floating-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px;
}

@media (max-width: 720px) {
  .floating-panel-overlay {
    align-items: end;
    padding: 12px;
    padding-bottom: max(12px, calc(env(safe-area-inset-bottom) + 12px));
  }

  .floating-panel-shell {
    width: 100%;
    height: min(720px, calc(100dvh - 24px));
    border-radius: 28px;
  }

  .floating-panel-header {
    padding: 0 20px;
  }

  .floating-panel-body {
    padding: 24px 20px;
  }
}
</style>
