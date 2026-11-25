import { computed, onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import { createActivityClient } from '../modules/home/activityApi'
import type { ActivityEntry, ActivitySnapshot } from '../modules/home/linkActivity'
import type { SiteLink } from '../types/home'

export const useLinkActivity = (catalog: Ref<Map<string, SiteLink>>) => {
  const snapshot = shallowRef<ActivitySnapshot | null>(null)
  const error = ref('')
  const loading = ref(true)
  const ready = computed(() => snapshot.value !== null)
  const client = createActivityClient()
  let active = false
  let pending: Promise<void> | undefined
  let controller: AbortController | undefined

  const refresh = (): Promise<void> => {
    if (!active) return Promise.resolve()
    if (pending) return pending
    loading.value = true
    error.value = ''
    controller = new AbortController()
    pending = client.getSnapshot(controller.signal).then((result) => {
      if (!active) return
      if (!snapshot.value || result.generatedAt >= snapshot.value.generatedAt) snapshot.value = result
    }).catch((reason: unknown) => {
      if (!active) return
      error.value = reason instanceof Error ? reason.message : '访问统计暂不可用'
    }).finally(() => {
      loading.value = false
      pending = undefined
    })
    return pending
  }

  const record = (url: string) => {
    if (!catalog.value.has(url)) return
    void client.record(url).catch(() => {
      // 上报失败不重试，避免超时重试导致重复计数，也不阻断网站打开。
    })
  }

  onMounted(() => {
    active = true
    void refresh()
  })
  onBeforeUnmount(() => {
    active = false
    controller?.abort()
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

  return { record, lists, refresh, error, loading, ready }
}
