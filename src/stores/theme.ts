import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'system' | 'day' | 'night'

const STORAGE_KEY = 'xcpc-link-theme-mode'
const DEFAULT_THEME_MODE: ThemeMode = 'system'

const readStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return DEFAULT_THEME_MODE

  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'day' || value === 'night' || value === 'system' ? value : DEFAULT_THEME_MODE
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readStoredMode())
  const systemPrefersDark = ref(false)
  let mediaQuery: MediaQueryList | undefined

  const isDarkMode = computed(() => (mode.value === 'system' ? systemPrefersDark.value : mode.value === 'night'))
  const isDayMode = computed(() => !isDarkMode.value)

  const setMode = (nextMode: ThemeMode) => {
    mode.value = nextMode
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextMode)
    }
  }

  const syncSystemTheme = () => {
    if (!mediaQuery) return
    systemPrefersDark.value = mediaQuery.matches
  }

  const initTheme = () => {
    if (typeof window === 'undefined' || mediaQuery) return

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    syncSystemTheme()
    mediaQuery.addEventListener('change', syncSystemTheme)
  }

  initTheme()

  return {
    mode,
    isDayMode,
    isDarkMode,
    setMode,
    initTheme,
  }
})
