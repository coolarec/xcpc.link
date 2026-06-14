import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/global.scss'

createApp(App).use(createPinia()).use(router).mount('#app')

if ('serviceWorker' in navigator) {
  const serviceWorkerUrl = `${import.meta.env.BASE_URL}icon-cache-sw.js`
  navigator.serviceWorker.register(serviceWorkerUrl, { scope: import.meta.env.BASE_URL }).catch((error) => {
    console.warn('Failed to register icon cache service worker:', error)
  })
}

const preloader = document.getElementById('app-preloader')

if (preloader) {
  const progress = preloader.querySelector('.preloader-progress span')
  let isWindowLoaded = document.readyState === 'complete'
  let isAppReady = false
  let isFinishing = false

  const removePreloader = () => {
    preloader.remove()
  }

  const hidePreloader = () => {
    document.body.classList.add('is-app-visible')
    preloader.classList.add('is-hidden')
    window.dispatchEvent(new CustomEvent('app-preloader:hidden'))
    preloader.addEventListener('transitionend', removePreloader, { once: true })
  }

  const finishPreloader = () => {
    if (isFinishing || !isWindowLoaded || !isAppReady) return

    isFinishing = true
    preloader.classList.add('is-finishing')

    if (progress) {
      progress.addEventListener('animationend', hidePreloader, { once: true })
      return
    }

    requestAnimationFrame(hidePreloader)
  }

  const markAppReady = () => {
    isAppReady = true
    requestAnimationFrame(finishPreloader)
  }

  window.addEventListener('app-preloader:ready', markAppReady, { once: true })

  router.isReady().then(() => {
    requestAnimationFrame(() => {
      if (!document.querySelector('.motion-page')) markAppReady()
    })
  })

  if (isWindowLoaded) {
    requestAnimationFrame(finishPreloader)
  } else {
    window.addEventListener(
      'load',
      () => {
        isWindowLoaded = true
        requestAnimationFrame(finishPreloader)
      },
      { once: true },
    )
  }
}
