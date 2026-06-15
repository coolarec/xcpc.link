<script setup lang="ts">
defineProps<{
  placement: 'top' | 'bottom'
  text: string
  x: number
  y: number
}>()
</script>

<template>
  <div
    class="lite-tooltip"
    :class="`is-${placement}`"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="tooltip"
  >
    {{ text }}
  </div>
</template>

<style scoped>
.lite-tooltip {
  position: fixed;
  z-index: 200;
  width: max-content;
  max-width: min(280px, calc(100vw - 40px));
  padding: 8px 10px;
  border: 1px solid var(--tooltip-border);
  border-radius: 10px;
  background: var(--tooltip-bg);
  box-shadow: 0 10px 30px var(--tooltip-shadow);
  color: var(--text);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.45;
  pointer-events: none;
  text-align: left;
  transform: translate(-50%, -100%);
  white-space: pre-line;
}

.lite-tooltip.is-bottom {
  transform: translate(-50%, 0);
}
</style>
