<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
  confirm: []
}>()

const confirmButton = ref<HTMLButtonElement | null>(null)
const previousBodyOverflow = ref('')

const confirmNotice = () => {
  emit('confirm')
}

onMounted(async () => {
  previousBodyOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  confirmButton.value?.focus()
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow.value
})
</script>

<template>
  <div class="migration-notice" role="presentation">
    <div class="migration-notice__backdrop" aria-hidden="true"></div>

    <section
      class="migration-notice__dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="migration-notice-title"
      aria-describedby="migration-notice-description"
    >
      <p class="migration-notice__eyebrow">站点公告</p>
      <h2 id="migration-notice-title">十月域名停止解析说明</h2>
      <div id="migration-notice-description" class="migration-notice__content">
        <p>
          目前国内访问速度堪忧，所以准备对 xcpc.link 进行备案后将站点转移到国内，但是备案耗时会比较长期间无法通过该域名访问网站，所以考虑留出一个月的时间再开始备案流程。
        </p>
        <p>
          预计十月一日开始备案，十月一到备案结束期间可通过访问
          <a href="https://xcpc.ink" target="_blank" rel="noopener noreferrer">xcpc.ink</a>
          进入该网站
        </p>
      </div>
      <button ref="confirmButton" type="button" class="migration-notice__confirm" @click="confirmNotice">
        我已知晓
      </button>
    </section>
  </div>
</template>

<style scoped>
.migration-notice {
  position: fixed;
  inset: 0;
  z-index: 10010;
  display: grid;
  place-items: center;
  padding: 24px;
}

.migration-notice__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.66);
  backdrop-filter: blur(4px);
}

.migration-notice__dialog {
  position: relative;
  width: min(560px, 100%);
  max-height: calc(100dvh - 48px);
  overflow: auto;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 16px;
  color: var(--text);
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.migration-notice__eyebrow {
  margin: 0 0 6px;
  color: var(--secondary);
  font-size: 12px;
  font-weight: 750;
}

.migration-notice h2 {
  margin: 0;
  font-family: "Sora", sans-serif;
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  line-height: 1.12;
}

.migration-notice__content {
  margin-top: 16px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

.migration-notice__content p {
  margin: 0;
}

.migration-notice__content p + p {
  margin-top: 12px;
}

.migration-notice__content a {
  color: var(--text);
  font-weight: 700;
  text-underline-offset: 3px;
}

.migration-notice__content a:hover,
.migration-notice__content a:focus-visible {
  color: var(--muted);
}

.migration-notice__confirm {
  width: 100%;
  min-height: 42px;
  margin-top: 20px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--surface);
  background: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 750;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.migration-notice__confirm:hover {
  color: var(--text);
  background: var(--surface-hover);
  border-color: color-mix(in srgb, var(--text) 18%, transparent);
}

.migration-notice__confirm:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 3px;
}

@media (max-width: 560px) {
  .migration-notice {
    padding: 16px;
  }

  .migration-notice__dialog {
    max-height: calc(100dvh - 32px);
    padding: 20px;
  }
}
</style>
