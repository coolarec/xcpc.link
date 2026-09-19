import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '../views/home/HomePage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    // 首页是默认入口。直接纳入主入口，避免首屏挂载后再等待一个懒加载 chunk。
    component: HomePage,
  },
  {
    path: '/quota',
    name: 'quota',
    component: () => import('../views/cal/CalPage.vue'),
  },
  {
    path: '/quota-cc',
    name: 'quota-cc',
    component: () => import('../views/cal/CcpcQuotaPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
