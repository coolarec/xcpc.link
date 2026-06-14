import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchHeroDockItems, fetchHomeGalleries, fetchNewsData } from '../modules/home/api'
import type { HeroDockItem, HomeGallerySection, NewsData } from '../types/home'

export const useHomeContentStore = defineStore('home-content', () => {
  const galleries = ref<HomeGallerySection[]>([])
  const dockItems = ref<HeroDockItem[]>([])
  const newsData = ref<NewsData | null>(null)
  const isLoading = ref(false)
  const loadError = ref('')
  let loadPromise: Promise<void> | undefined

  const totalLinks = computed(() =>
    galleries.value.reduce((total, gallery) => {
      const watchLinks = (gallery.watches || []).reduce((watchTotal, watch) => watchTotal + watch.links.length, 0)
      return total + gallery.cards.length + (gallery.watch?.links.length || 0) + watchLinks
    }, 0),
  )

  const load = async () => {
    if (loadPromise) return loadPromise

    isLoading.value = true
    loadError.value = ''

    loadPromise = Promise.all([fetchHeroDockItems(), fetchHomeGalleries(), fetchNewsData()])
      .then(([dockData, galleryData, news]) => {
        dockItems.value = dockData
        galleries.value = galleryData
        newsData.value = news
      })
      .catch((error) => {
        loadError.value = '资源加载失败'
        loadPromise = undefined
        throw error
      })
      .finally(() => {
        isLoading.value = false
      })

    return loadPromise
  }

  return {
    galleries,
    dockItems,
    newsData,
    isLoading,
    loadError,
    totalLinks,
    load,
  }
})
