import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { fetchRemoteGalleries, getLocalHomeGalleries, getLocalNewsData, type GalleryRequestOptions } from '../modules/home/api.ts'

export const useHomeContentStore = defineStore('home-content', () => {
  // Content is replaced as a snapshot; nested data does not need Vue proxies.
  const galleries = shallowRef(getLocalHomeGalleries())
  const newsData = shallowRef(getLocalNewsData())
  const isRefreshing = ref(false)
  const refreshError = ref('')
  let refreshPromise: Promise<void> | undefined

  const refreshGalleries = (options?: GalleryRequestOptions): Promise<void> => {
    if (refreshPromise) return refreshPromise
    isRefreshing.value = true
    refreshError.value = ''
    refreshPromise = fetchRemoteGalleries(options)
      .then((updated) => {
        if (updated !== null) galleries.value = updated
      })
      .catch((error: unknown) => {
        // A failed refresh never replaces usable content or blocks the page.
        refreshError.value = error instanceof Error ? error.message : String(error)
      })
      .finally(() => {
        isRefreshing.value = false
        refreshPromise = undefined
      })
    return refreshPromise
  }

  return { galleries, newsData, isRefreshing, refreshError, refreshGalleries }
})
