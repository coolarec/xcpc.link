import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

const preloader = document.getElementById('app-preloader')

if (preloader) {
  const progress = preloader.querySelector('.preloader-progress span')

  const removePreloader = () => {
    preloader.remove()
  }

  const hidePreloader = () => {
    preloader.classList.add('is-hidden')
    window.dispatchEvent(new CustomEvent('app-preloader:hidden'))
    preloader.addEventListener('transitionend', removePreloader, { once: true })
  }

  const finishPreloader = () => {
    preloader.classList.add('is-finishing')

    if (progress) {
      progress.addEventListener('animationend', hidePreloader, { once: true })
      return
    }

    requestAnimationFrame(hidePreloader)
  }

  if (document.readyState === 'complete') {
    requestAnimationFrame(finishPreloader)
  } else {
    window.addEventListener('load', () => requestAnimationFrame(finishPreloader), { once: true })
  }
}
