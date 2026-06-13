<script setup lang="ts">
import { MessageCircle, Plus, Search, Settings, Sparkles } from '@lucide/vue'
import { ref, type Component } from 'vue'

type FloatingAction = {
  id: string
  label: string
  icon: Component
  angle: number
  distance: number
}

const actions: FloatingAction[] = [
  { id: 'comments', label: '评论', icon: MessageCircle, angle: -92, distance: 94 },
  { id: 'discover', label: '搜索', icon: Search, angle: -138, distance: 92 },
  { id: 'settings', label: 'Settings', icon: Settings, angle: -184, distance: 88 },
]

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
    '--delay': `${index * 34}ms`,
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
  <div class="floating-action-menu" :class="{ 'is-open': isOpen }">
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
      <component :is="action.icon" :size="20" :stroke-width="2.2" aria-hidden="true" />
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
      <Sparkles class="trigger-sparkles" :size="21" :stroke-width="2.15" aria-hidden="true" />
      <Plus class="trigger-plus" :size="24" :stroke-width="2.4" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.floating-action-menu {
  position: fixed;
  right: max(24px, calc(env(safe-area-inset-right) + 20px));
  bottom: max(24px, calc(env(safe-area-inset-bottom) + 20px));
  z-index: 80;
  width: 64px;
  height: 64px;
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
  color: var(--page-fg);
  pointer-events: auto;
  will-change: transform, opacity;
}

.radial-trigger {
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.55), transparent 28%),
    linear-gradient(135deg, #34c759 0%, #00b4d8 52%, #7c5cff 100%);
  box-shadow:
    0 22px 70px rgba(0, 0, 0, 0.36),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  transition:
    transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.36s ease;
}

.radial-trigger:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow:
    0 28px 84px rgba(0, 0, 0, 0.42),
    inset 0 0 0 1px rgba(255, 255, 255, 0.32);
}

.radial-trigger:active {
  transform: translateY(0) scale(0.97);
}

.trigger-halo {
  position: absolute;
  inset: 7px;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.26);
}

.trigger-sparkles,
.trigger-plus {
  position: absolute;
  color: #ffffff;
  transition:
    transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.26s ease;
}

.trigger-sparkles {
  transform: translate(-8px, -8px) scale(0.78);
  opacity: 0.9;
}

.trigger-plus {
  transform: translate(7px, 7px) rotate(0deg);
}

.is-open .trigger-sparkles {
  transform: translate(-2px, -2px) scale(0.72);
  opacity: 0;
}

.is-open .trigger-plus {
  transform: translate(0, 0) rotate(135deg);
}

.radial-action {
  right: 8px;
  bottom: 8px;
  width: 48px;
  height: 48px;
  opacity: 0;
  color: var(--panel-fg);
  background: color-mix(in srgb, var(--panel-bg), transparent 7%);
  box-shadow:
    0 16px 46px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px var(--soft-line);
  backdrop-filter: blur(18px) saturate(1.25);
  transform: translate(0, 0) scale(0.54) rotate(-18deg);
  transition:
    opacity 0.18s ease var(--delay),
    transform 0.42s cubic-bezier(0.19, 1, 0.22, 1) var(--delay),
    background-color 0.26s ease;
}

.is-open .radial-action {
  opacity: 1;
  transform: translate(var(--x), var(--y)) scale(1) rotate(0deg);
}

.radial-action:hover {
  background: color-mix(in srgb, var(--panel-bg), #ffffff 10%);
  transform: translate(var(--x), var(--y)) scale(1.08);
}

.radial-action:disabled {
  pointer-events: none;
}

.action-label {
  position: absolute;
  right: 58px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 11px;
  border-radius: 999px;
  color: var(--panel-fg);
  background: color-mix(in srgb, var(--panel-bg), transparent 2%);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.22),
    inset 0 0 0 1px var(--soft-line);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(8px) scale(0.96);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.22s ease;
}

.radial-action:hover .action-label,
.radial-action:focus-visible .action-label {
  opacity: 1;
  transform: translateX(0) scale(1);
}

@media (max-width: 640px) {
  .floating-action-menu {
    right: max(16px, calc(env(safe-area-inset-right) + 14px));
    bottom: max(16px, calc(env(safe-area-inset-bottom) + 14px));
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
