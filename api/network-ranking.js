import { fetchNetworkRankingSnapshot, NETWORK_RANKING_CACHE_CONTROL } from '../scripts/update-network-ranking.mjs'

export default async function handler(_req, res) {
  try {
    const payload = await fetchNetworkRankingSnapshot()
    res.setHeader('Cache-Control', NETWORK_RANKING_CACHE_CONTROL)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).json(payload)
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store')
    res.status(502).json({
      error: error instanceof Error ? error.message : '拉取网络赛榜单失败',
    })
  }
}
