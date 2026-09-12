import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const networkRankingDevPlugin = (): Plugin => ({
  name: 'network-ranking-dev-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url?.split('?')[0]
      if (url !== '/api/network-ranking') {
        next()
        return
      }
      try {
        const { fetchNetworkRankingSnapshot } = await import('./scripts/update-network-ranking.mjs')
        const payload = await fetchNetworkRankingSnapshot()
        res.statusCode = 200
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(payload))
      } catch (error) {
        res.statusCode = 502
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({
          error: error instanceof Error ? error.message : '拉取网络赛榜单失败',
        }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cdnBaseUrl = env.VITE_CDN_BASE_URL?.trim()
  const base = cdnBaseUrl ? `${cdnBaseUrl.replace(/\/+$/, '')}/` : '/'

  return {
    plugins: [vue(), networkRankingDevPlugin()],
    base,
  }
})
