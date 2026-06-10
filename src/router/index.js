import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/LibraryView.vue'),
  },
  {
    path: '/collections',
    name: 'collections',
    component: () => import('../views/CollectionsView.vue'),
  },
  {
    path: '/radar',
    name: 'radar',
    component: () => import('../views/RadarView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
