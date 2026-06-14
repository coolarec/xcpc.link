<script setup lang="ts">
import { ArrowUp, MessageCircle, Plus, Sparkles } from '@lucide/vue'
import { ref, type Component } from 'vue'

type FloatingAction = {
  id: string
  label: string
  icon: Component
  angle: number
  distance: number
}

const actions: FloatingAction[] = [
  { id: 'top', label: '顶部', icon: ArrowUp, angle: -96, distance: 92 },
  { id: 'comments', label: '评论', icon: MessageCircle, angle: -156, distance: 92 },
]

const props = withDefaults(defineProps<{
  visible?: boolean
}>(), {
  visible: true
})

const emit = defineEmits<{
  action: [id: string]
}>()

const isOpen = ref(false)

const getActionStyle = (action: FloatingAction, index: number) => {
  const radians = (action.angle * Math.PI) / 180
  const x = Math.cos(radians) * action.distance
  const y = Math.sin(radians) * action.distance

  return {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--delay': `${index * 40}ms`,
  }
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const handleAction = (action: FloatingAction) => {
  isOpen.value = false
  emit('action', action.id)
}
</script>

<template>
  <div 
    class="floating-action-menu" 
    :class="{ 
      'is-open': isOpen,
      'is-hidden': !visible 
    }"
  >
    <button
      v-for="(action, index) in actions"
      :key="action.id"
      class="radial-action"
      type="button"
      :style="getActionStyle(action, index)"
      :aria-label="action.label"
      :aria-hidden="!isOpen"
      :disabled="!isOpen"
      :tabindex="isOpen ? 0 : -1"
      @click="handleAction(action)"
    >
      <component :is="action.icon" :size="22" :stroke-width="2.4" aria-hidden="true" />
      <span class="action-label">{{ action.label }}</span>
    </button>

    <button
      class="radial-trigger"
      type="button"
      :aria-expanded="isOpen"
      aria-label="Open quick actions"
      @click="toggleMenu"
    >
      <span class="trigger-halo" aria-hidden="true"></span>
      <Sparkles class="trigger-sparkles" :size="22" :stroke-width="2.2" aria-hidden="true" />
      <Plus class="trigger-plus" :size="26" :stroke-width="2.5" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.floating-action-menu {
  position: fixed;
  right: max(32px, calc(env(safe-area-inset-right) + 24px));
  bottom: max(32px, calc(env(safe-area-inset-bottom) + 24px));
  z-index: 9999;
  width: 56px;
  height: 56px;
  pointer-events: none;
  overflow: visible;
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.2);
}

.floating-action-menu.is-hidden {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  pointer-events: none;
}

.radial-trigger,
.radial-action {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  pointer-events: auto;
  will-change: transform, opacity;
}

.radial-trigger {
  inset: 0;
  overflow: hidden;
  color: var(--page-fg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--page-fg) 12%, transparent), transparent 58%),
    color-mix(in srgb, var(--panel-bg, var(--card-bg)) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--page-fg) 13%, transparent);
  backdrop-filter: blur(24px) saturate(1.55);
  -webkit-backdrop-filter: blur(24px) saturate(1.55);
  box-shadow:
    0 10px 26px color-mix(in srgb, var(--page-fg) 12%, transparent),
    inset 0 1px 0 color-mix(in srgb, #ffffff 38%, transparent);
  transition:
    transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.1),
    background 0.25s ease,
    box-shadow 0.4s ease;
}

.radial-trigger:hover {
  transform: translateY(-2px) scale(1.04);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--page-fg) 16%, transparent), transparent 58%),
    color-mix(in srgb, var(--panel-bg, var(--card-bg)) 82%, transparent);
  box-shadow:
    0 14px 30px color-mix(in srgb, var(--page-fg) 15%, transparent),
    inset 0 1px 0 color-mix(in srgb, #ffffff 46%, transparent);
}

.radial-trigger:active {
  transform: translateY(0) scale(0.96);
}

.trigger-sparkles,
.trigger-plus {
  position: absolute;
  transition:
    transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.2),
    opacity 0.2s ease;
}

.trigger-sparkles {
  transform: translate(-6px, -6px) scale(0.8);
  opacity: 1;
}

.trigger-plus {
  transform: translate(6px, 6px) rotate(0deg) scale(0.75);
  opacity: 0.8;
}

.is-open .trigger-sparkles {
  transform: translate(0, 0) scale(0.5);
  opacity: 0;
}

.is-open .trigger-plus {
  transform: translate(0, 0) rotate(135deg) scale(1);
  opacity: 1;
}

.radial-action {
  right: 4px;
  bottom: 4px;
  width: 48px;
  height: 48px;
  opacity: 0;
  color: var(--page-fg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--page-fg) 10%, transparent), transparent 54%),
    color-mix(in srgb, var(--panel-bg, var(--card-bg)) 88%, transparent);
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid color-mix(in srgb, var(--page-fg) 12%, transparent);
  box-shadow:
    0 10px 26px color-mix(in srgb, var(--page-fg) 12%, transparent),
    inset 0 1px 0 color-mix(in srgb, #ffffff 34%, transparent);
  transform: translate(0, 0) scale(0.4) rotate(-15deg);
  transition:
    opacity 0.2s ease var(--delay),
    transform 0.4s cubic-bezier(0.17, 0.89, 0.32, 1.28) var(--delay),
    background-color 0.2s ease,
    backdrop-filter 0.3s ease var(--delay),
    -webkit-backdrop-filter 0.3s ease var(--delay);
}

.is-open .radial-action {
  opacity: 1;
  transform: translate(var(--x), var(--y)) scale(1) rotate(0deg);
}

.radial-action:hover {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--page-fg) 15%, transparent), transparent 54%),
    color-mix(in srgb, var(--panel-bg, var(--card-bg)) 82%, transparent);
  transform: translate(var(--x), var(--y)) scale(1.1);
}

.radial-action:active {
  transform: translate(var(--x), var(--y)) scale(0.95);
}

.action-label {
  position: absolute;
  right: 62px;
  top: 50%;
  /* Move higher: -50% centers vertically, -14px pushes it up above the button's center line */
  transform: translateY(-50%) translateY(-14px) translateX(10px) scale(0.9);
  opacity: 0;
  padding: 6px 12px;
  border-radius: 12px;
  color: var(--page-fg);
  background: color-mix(in srgb, var(--card-bg) 85%, transparent);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  border: 1px solid color-mix(in srgb, var(--page-fg) 10%, transparent);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--page-fg) 10%, transparent);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    backdrop-filter 0.2s ease,
    -webkit-backdrop-filter 0.2s ease;
}

.radial-action:hover .action-label {
  opacity: 1;
  transform: translateY(-50%) translateY(-14px) translateX(0) scale(1);
}

@media (max-width: 640px) {
  .floating-action-menu {
    right: max(16px, calc(env(safe-area-inset-right) + 12px));
    bottom: max(16px, calc(env(safe-area-inset-bottom) + 12px));
    width: 48px;
    height: 48px;
  }

  .radial-trigger {
    box-shadow:
      0 10px 24px color-mix(in srgb, var(--page-fg) 14%, transparent),
      inset 0 1px 0 color-mix(in srgb, #ffffff 32%, transparent);
  }

  .radial-action {
    width: 38px;
    height: 38px;
  }

  .action-label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .radial-trigger,
  .radial-action,
  .trigger-sparkles,
  .trigger-plus,
  .action-label {
    transition: none;
  }
}
</style>
