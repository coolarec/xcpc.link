<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <button class="app-button" type="button">{{ label }}</button>
</template>

<style scoped>
.app-button {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  background: #1d1d1f;
  color: #fff;
}
</style>
