import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cdnBaseUrl = env.VITE_CDN_BASE_URL?.trim()
  const base = cdnBaseUrl ? `${cdnBaseUrl.replace(/\/+$/, '')}/` : '/'

  return {
    plugins: [vue()],
    base,
  }
})
