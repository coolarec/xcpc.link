import { ref } from 'vue'
import { defineStore } from 'pinia'

export type LiteViewMode = 'compact' | 'detail'

const STORAGE_KEY = 'xcpc-link-lite-view-mode'

const readStoredViewMode = (): LiteViewMode => {
  if (typeof window === 'undefined') return 'compact'

  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'detail' || value === 'compact' ? value : 'compact'
}

export const useLitePreferencesStore = defineStore('lite-preferences', () => {
  const viewMode = ref<LiteViewMode>(readStoredViewMode())

  const setViewMode = (mode: LiteViewMode) => {
    viewMode.value = mode
    window.localStorage.setItem(STORAGE_KEY, mode)
  }

  return {
    viewMode,
    setViewMode,
  }
})
