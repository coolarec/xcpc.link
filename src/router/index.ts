import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/home/HomePage.vue'),
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/library/LibraryPage.vue'),
  },
  {
    path: '/collections',
    name: 'collections',
    component: () => import('../views/collections/CollectionsPage.vue'),
  },
  {
    path: '/radar',
    name: 'radar',
    component: () => import('../views/radar/RadarPage.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings/SettingsPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
