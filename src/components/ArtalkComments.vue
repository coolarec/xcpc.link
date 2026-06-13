<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type Artalk from 'artalk'

const props = withDefaults(defineProps<{
  active?: boolean
  isDark?: boolean
}>(), {
  active: false,
  isDark: true,
})

const COMMENT_SERVER = 'https://comment.xcpc.link'
const COMMENT_SITE = 'XCPC.LINK'

const commentRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const loadError = ref('')
const hasRendered = ref(false)

let artalkInstance: any | undefined

const renderComments = async () => {
  if (!props.active || hasRendered.value || !commentRef.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    const { default: Artalk } = await import('artalk')
    await import('artalk/Artalk.css')
    await nextTick()

    if (!commentRef.value) return

    artalkInstance = Artalk.init({
      el: commentRef.value,
      pageKey: window.location.pathname,
      pageTitle: document.title,
      server: COMMENT_SERVER,
      site: COMMENT_SITE,
      darkMode: props.isDark,
      // @ts-expect-error valid in newer/older artalk versions
      pv: true,
      countEl: '.artalk-comment-count',
    })

    hasRendered.value = true
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '评论加载失败'
  } finally {
    isLoading.value = false
  }
}

const handleRetry = () => {
  hasRendered.value = false
  void renderComments()
}

watch(() => props.isDark, (dark) => {
  artalkInstance?.setDarkMode(dark)
})

watch(() => props.active, (active) => {
  if (active) void renderComments()
}, { flush: 'post' })

onMounted(() => {
  void renderComments()
})

onBeforeUnmount(() => {
  artalkInstance?.destroy()
  artalkInstance = undefined
})
</script>

<template>
  <div class="artalk-comment-panel">
    <div v-if="isLoading" class="comment-status-box">
      <span class="loading-dot"></span>
      <span>评论加载中...</span>
    </div>

    <div v-else-if="loadError" class="comment-status-box is-error">
      <p class="error-msg">{{ loadError }}</p>
      <button class="retry-btn" @click="handleRetry">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        重新获取
      </button>
    </div>

    <div ref="commentRef" class="artalk-host"></div>
  </div>
</template>

<style scoped>
.artalk-comment-panel {
  min-height: 400px;
}

.comment-status-box {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 24px;
  padding: 0 18px;
  border-radius: 14px;
  color: var(--muted-fg);
  background: color-mix(in srgb, var(--page-fg) 4%, transparent);
  font-size: 14px;
  font-weight: 600;
}

.comment-status-box.is-error {
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 20px;
  gap: 14px;
  background: color-mix(in srgb, #ff3b30 8%, transparent);
}

.error-msg {
  margin: 0;
  color: #ff3b30;
  font-weight: 700;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 99px;
  border: 0;
  background: var(--page-fg);
  color: var(--page-bg);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.retry-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.retry-btn:active {
  transform: scale(0.98);
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #34c759;
  box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.45);
  animation: comment-pulse 1.15s ease-out infinite;
}

.artalk-host {
  color: var(--page-fg);
}

:deep(.atk-main-editor) {
  border-radius: 16px !important;
}

@keyframes comment-pulse {
  100% {
    box-shadow: 0 0 0 12px rgba(52, 199, 89, 0);
  }
}
</style>
