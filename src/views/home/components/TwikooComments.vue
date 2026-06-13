<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  active?: boolean
}>(), {
  active: false,
})

const COMMENT_ENV_ID = 'https://xcpc-link-comment.vercel.app/'
const TWIKOO_SCRIPT_ID = 'twikoo-script'
const TWIKOO_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js'
const COMMENT_SERVICE_TIMEOUT = 8000

declare global {
  interface Window {
    twikoo?: {
      init: (options: {
        envId: string
        el: string | HTMLElement
        path?: string
        lang?: string
      }) => void
    }
  }
}

const commentRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const loadError = ref('')
const hasRendered = ref(false)

let scriptPromise: Promise<void> | undefined

const assertCommentServiceReady = async () => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), COMMENT_SERVICE_TIMEOUT)

  try {
    await fetch(COMMENT_ENV_ID, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    })
  } catch (error) {
    throw new Error(error instanceof DOMException && error.name === 'AbortError'
      ? '评论服务连接超时'
      : '评论服务暂时无法连接')
  } finally {
    window.clearTimeout(timeout)
  }
}

const loadTwikooScript = () => {
  if (window.twikoo) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TWIKOO_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Twikoo script failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = TWIKOO_SCRIPT_ID
    script.src = TWIKOO_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Twikoo script failed to load'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

const renderComments = async () => {
  if (!props.active || hasRendered.value || !commentRef.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    await assertCommentServiceReady()
    await loadTwikooScript()
    await nextTick()

    if (!window.twikoo || !commentRef.value) {
      throw new Error('Twikoo is unavailable')
    }

    window.twikoo.init({
      envId: COMMENT_ENV_ID,
      el: commentRef.value,
      path: window.location.pathname,
      lang: 'zh-CN',
    })

    hasRendered.value = true
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Twikoo failed to load'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.active, () => {
  void renderComments()
})

onMounted(() => {
  void renderComments()
})
</script>

<template>
  <div class="twikoo-comment-panel">
    <div v-if="isLoading" class="comment-loading">
      <span class="loading-dot"></span>
      <span>评论加载中</span>
    </div>

    <p v-if="loadError" class="comment-error">{{ loadError }}</p>
    <div ref="commentRef" class="twikoo-host"></div>
  </div>
</template>

<style scoped>
.twikoo-comment-panel {
  min-height: 360px;
}

.comment-loading,
.comment-error {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--muted-fg);
  background: color-mix(in srgb, var(--page-fg) 6%, transparent);
  font-size: 14px;
  font-weight: 700;
}

.comment-error {
  color: #ff6b6b;
}

.loading-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #34c759;
  box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.45);
  animation: comment-pulse 1.15s ease-out infinite;
}

.twikoo-host {
  color: var(--page-fg);
}

.twikoo-host :deep(.tk-comments-container),
.twikoo-host :deep(.tk-submit) {
  color: var(--page-fg);
}

.twikoo-host :deep(.tk-input),
.twikoo-host :deep(.tk-textarea),
.twikoo-host :deep(.tk-preview-container) {
  color: var(--page-fg);
  background: color-mix(in srgb, var(--page-fg) 5%, transparent);
  border-color: var(--soft-line);
}

.twikoo-host :deep(.tk-submit .el-button) {
  border-radius: 999px;
}

@keyframes comment-pulse {
  100% {
    box-shadow: 0 0 0 12px rgba(52, 199, 89, 0);
  }
}
</style>
