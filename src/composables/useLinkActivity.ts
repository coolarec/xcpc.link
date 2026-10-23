import { computed, onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import { createActivityClient } from '../modules/home/activityApi'
import type { ActivityEntry, ActivitySnapshot } from '../modules/home/linkActivity'
import type { SiteLink } from '../types/home'

export const useLinkActivity = (catalog: Ref<Map<string, SiteLink>>) => {
  const snapshot = shallowRef<ActivitySnapshot | null>(null)
  const error = ref('')
  const client = createActivityClient()
  let timer: number | undefined
  let active = false
  let pending: Promise<void> | undefined
  let controller: AbortController | undefined
  let lastRefresh = 0

  const refresh = (force = false): Promise<void> => {
    if (!active || document.visibilityState === 'hidden') return Promise.resolve()
    if (pending) return pending
    if (!force && Date.now() - lastRefresh < 5000) return Promise.resolve()
    lastRefresh = Date.now()
    controller = new AbortController()
    pending = client.getSnapshot(controller.signal).then((result) => {
      if (!active) return
      if (!snapshot.value || result.generatedAt >= snapshot.value.generatedAt) snapshot.value = result
      error.value = ''
    }).catch((reason: unknown) => {
      if (active) error.value = reason instanceof Error ? reason.message : '访问统计暂不可用'
      // 仅保留已取得的全站列表，不在客户端生成个人排行或写入本地存储。
    }).finally(() => { pending = undefined })
    return pending
  }

  const record = (url: string) => {
    if (!catalog.value.has(url)) return
    void client.record(url).then(() => refresh(true)).catch(() => {
      // 上报失败不重试，避免超时重试导致重复计数，也不阻断网站打开。
    })
  }

  const onVisible = () => { void refresh() }
  onMounted(() => {
    active = true
    void refresh()
    timer = window.setInterval(onVisible, 60_000)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    active = false
    controller?.abort()
    window.clearInterval(timer)
    window.removeEventListener('focus', onVisible)
    document.removeEventListener('visibilitychange', onVisible)
  })

  const lists = computed(() => {
    const withLinks = (entries: ActivityEntry[]) => entries
      .filter((entry) => catalog.value.has(entry.url))
      .map((entry) => ({ ...entry, link: catalog.value.get(entry.url)! }))
    return {
      popular: withLinks(snapshot.value?.popular ?? []),
      recent: withLinks(snapshot.value?.recent ?? []),
    }
  })

  return { record, lists, refresh, error }
}
