import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/global.scss'

type AppLoadErrorHandler = (reason: unknown) => void

declare global {
  interface Window {
    showAppLoadError?: AppLoadErrorHandler
  }
}

const showAppLoadError = (reason: unknown) => {
  window.showAppLoadError?.(reason)
}

const isApplicationAsset = (target: EventTarget | null): boolean => {
  if (target instanceof HTMLScriptElement) {
    return target.type === 'module' || new URL(target.src, window.location.href).pathname.includes('/assets/')
  }

  if (target instanceof HTMLLinkElement) {
    return target.rel === 'stylesheet' && new URL(target.href, window.location.href).pathname.includes('/assets/')
  }

  return false
}

window.addEventListener(
  'error',
  (event) => {
    if (isApplicationAsset(event.target)) {
      showAppLoadError('页面资源加载失败，请检查网络后刷新页面。')
    }
  },
  true,
)

window.addEventListener('unhandledrejection', (event) => {
  showAppLoadError(event.reason)
})

const app = createApp(App)
app.config.errorHandler = (error) => {
  showAppLoadError(error)
}
app.use(createPinia()).use(router).mount('#app')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/icon-cache-sw.js', { scope: '/' }).catch((error) => {
    console.warn('Failed to register icon cache service worker:', error)
  })
}
