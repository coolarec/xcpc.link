<script setup lang="ts">
import { X } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'

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
const titleId = computed(() => `floating-panel-${props.title.replace(/\W+/g, '-').toLowerCase()}`)

const close = () => {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (isOpen) {
      await nextTick()
      overlayRef.value?.focus()
    }
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="floating-panel">
    <div
      v-if="modelValue"
      ref="overlayRef"
      class="floating-panel-overlay"
      tabindex="-1"
      @keydown.esc="close"
    >
      <button class="floating-panel-backdrop" type="button" aria-label="Close panel" @click="close"></button>

      <section
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
  </Transition>
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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
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
    0 32px 84px rgba(0, 0, 0, 0.45),
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
  background: color-mix(in srgb, var(--card-bg) 85%, transparent);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
}

.floating-panel-titles p {
  margin: 0;
  color: var(--muted-fg);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.floating-panel-titles h3 {
  margin: 2px 0 0;
  color: var(--page-fg);
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
  color: var(--page-fg);
  background: color-mix(in srgb, var(--page-fg) 10%, transparent);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
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

/* Fixed Transition to eliminate flash */
.floating-panel-enter-active,
.floating-panel-leave-active {
  transition: opacity 0.3s ease;
}

.floating-panel-enter-active .floating-panel-shell,
.floating-panel-leave-active .floating-panel-shell {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.floating-panel-enter-from,
.floating-panel-leave-to {
  opacity: 0;
}

.floating-panel-enter-from .floating-panel-shell {
  transform: translateY(20px) scale(0.96);
}

.floating-panel-leave-to .floating-panel-shell {
  transform: translateY(12px) scale(0.98);
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

@media (prefers-reduced-motion: reduce) {
  .floating-panel-enter-active,
  .floating-panel-leave-active,
  .floating-panel-enter-active .floating-panel-shell,
  .floating-panel-leave-active .floating-panel-shell {
    transition: none;
  }
}
</style>
