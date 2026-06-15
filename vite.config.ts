import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(() => {
  const cdnBaseUrl = process.env.VITE_CDN_BASE_URL?.trim()
  const base = cdnBaseUrl ? `${cdnBaseUrl.replace(/\/+$/, '')}/` : '/'

  return {
    plugins: [vue()],
    base,
  }
})
