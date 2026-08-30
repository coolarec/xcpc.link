<script setup lang="ts">
import { ArrowUp } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Component } from 'vue'

type FloatingAction = {
  id: string
  label: string
  icon: Component
}

const actions: FloatingAction[] = [
  { id: 'top', label: '顶部', icon: ArrowUp },
]

const showScrollAction = ref(false)
const scrollRevealOffset = 320

const props = withDefaults(defineProps<{
  visible?: boolean
}>(), {
  visible: true
})

const emit = defineEmits<{
  action: [id: string]
}>()

const updateScrollAction = () => {
  showScrollAction.value = window.scrollY >= scrollRevealOffset
}

onMounted(() => {
  updateScrollAction()
  window.addEventListener('scroll', updateScrollAction, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollAction)
})

const handleAction = (action: FloatingAction) => {
  emit('action', action.id)
}
</script>

<template>
  <div 
    class="floating-action-menu" 
    :class="{ 'is-hidden': !visible }"
  >
    <button
      v-for="action in actions"
      :key="action.id"
      class="stack-action"
      :class="{ 'is-scroll-action': action.id === 'top', 'is-visible': action.id !== 'top' || showScrollAction }"
      type="button"
      :aria-label="action.label"
      :aria-hidden="action.id === 'top' && !showScrollAction"
      :tabindex="action.id === 'top' && !showScrollAction ? -1 : 0"
      @click="handleAction(action)"
    >
      <component :is="action.icon" :size="22" :stroke-width="2.4" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.floating-action-menu {
  position: fixed;
  right: max(32px, calc(env(safe-area-inset-right) + 24px));
  bottom: max(32px, calc(env(safe-area-inset-bottom) + 24px));
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.2);
}

.floating-action-menu.is-hidden {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  pointer-events: none;
}

.stack-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--line, var(--soft-line));
  border-radius: 8px;
  color: var(--text, var(--page-fg));
  background: var(--surface, var(--panel-bg, var(--card-bg)));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  opacity: 1;
  pointer-events: auto;
  transition:
    opacity 0.28s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.stack-action.is-scroll-action {
  opacity: 0;
  pointer-events: none;
  transform: translateY(12px) scale(0.92);
}

.stack-action.is-scroll-action.is-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}

.stack-action:hover {
  transform: translateY(-1px);
  background: var(--surface-hover, var(--surface, var(--panel-bg, var(--card-bg))));
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
}

.stack-action.is-scroll-action:hover {
  transform: translateY(-1px);
}

.stack-action:active {
  transform: translateY(0) scale(0.96);
}

@media (max-width: 640px) {
  .floating-action-menu {
    right: max(16px, calc(env(safe-area-inset-right) + 12px));
    bottom: max(16px, calc(env(safe-area-inset-bottom) + 12px));
    gap: 8px;
  }

}

@media (prefers-reduced-motion: reduce) {
  .stack-action {
    transition: none;
  }
}
</style>
