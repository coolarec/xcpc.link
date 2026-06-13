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
  background: rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(22px) saturate(1.12);
  -webkit-backdrop-filter: blur(22px) saturate(1.12);
  transition:
    opacity 0.32s ease,
    background-color 0.32s ease,
    backdrop-filter 0.36s ease,
    -webkit-backdrop-filter 0.36s ease;
}

.floating-panel-shell {
  position: relative;
  z-index: 1;
  width: min(760px, calc(100vw - 40px));
  height: min(800px, calc(100dvh - 80px));
  min-height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  color: var(--page-fg, #f5f7fb);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--card-bg, #121722), #ffffff 3%), var(--card-bg, #121722)),
    var(--card-bg, #121722);
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.48),
    inset 0 0 0 1px var(--soft-line, rgba(255, 255, 255, 0.08));
}

.floating-panel-header {
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 28px;
  border-bottom: 1px solid var(--soft-line, rgba(255, 255, 255, 0.08));
  background: color-mix(in srgb, var(--card-bg, #121722), transparent 4%);
}

.floating-panel-titles {
  min-width: 0;
}

.floating-panel-titles p,
.floating-panel-titles h3 {
  margin: 0;
}

.floating-panel-titles p {
  color: var(--muted-fg, rgba(221, 229, 244, 0.62));
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.floating-panel-titles h3 {
  margin-top: 4px;
  color: var(--page-fg, #f5f7fb);
  font-size: clamp(21px, 3vw, 28px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: 0;
}

.floating-panel-close {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  color: var(--page-fg, #f5f7fb);
  background: color-mix(in srgb, var(--page-fg, #f5f7fb) 10%, transparent);
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.floating-panel-close:hover {
  background: color-mix(in srgb, var(--page-fg, #f5f7fb) 18%, transparent);
  transform: scale(1.05);
}

.floating-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 32px;
}

.floating-panel-enter-active,
.floating-panel-leave-active {
  transition: opacity 0.24s ease;
}

.floating-panel-enter-active .floating-panel-backdrop,
.floating-panel-leave-active .floating-panel-backdrop {
  transition:
    opacity 0.34s ease,
    background-color 0.34s ease,
    backdrop-filter 0.38s ease,
    -webkit-backdrop-filter 0.38s ease;
}

.floating-panel-enter-active .floating-panel-shell,
.floating-panel-leave-active .floating-panel-shell {
  transition:
    opacity 0.28s ease,
    transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.floating-panel-enter-from,
.floating-panel-leave-to {
  opacity: 0;
}

.floating-panel-enter-from .floating-panel-backdrop,
.floating-panel-leave-to .floating-panel-backdrop {
  opacity: 0;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0) saturate(1);
  -webkit-backdrop-filter: blur(0) saturate(1);
}

.floating-panel-enter-from .floating-panel-shell,
.floating-panel-leave-to .floating-panel-shell {
  opacity: 0;
  transform: translateY(18px) scale(0.96);
}

@media (max-width: 720px) {
  .floating-panel-overlay {
    align-items: end;
    padding: 16px;
    padding-bottom: max(16px, calc(env(safe-area-inset-bottom) + 16px));
  }

  .floating-panel-shell {
    width: 100%;
    height: min(760px, calc(100dvh - 32px));
    border-radius: 22px;
  }

  .floating-panel-header {
    min-height: 78px;
    padding: 18px 18px;
  }

  .floating-panel-body {
    padding: 18px 14px 28px;
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
