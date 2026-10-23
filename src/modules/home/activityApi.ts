import { ACTIVITY_LIMIT, ACTIVITY_TIME_ZONE, type ActivityEntry, type ActivitySnapshot } from './linkActivity.ts'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const parseEntries = (value: unknown): ActivityEntry[] => {
  if (!Array.isArray(value) || value.length > ACTIVITY_LIMIT) throw new Error('访问统计列表格式错误')
  const seen = new Set<string>()
  return value.map((item: unknown) => {
    if (!isObject(item) || typeof item.url !== 'string' || !isCount(item.weekCount)
      || !isCount(item.lastOpened) || seen.has(item.url)) throw new Error('访问统计条目格式错误')
    const protocol = new URL(item.url).protocol
    if (protocol !== 'https:' && protocol !== 'http:') throw new Error('访问统计链接格式错误')
    seen.add(item.url)
    return { url: item.url, weekCount: item.weekCount, lastOpened: item.lastOpened }
  })
}

export const createActivityClient = ({
  endpoint = import.meta.env?.VITE_ACTIVITY_API_BASE_URL?.trim() || '/api/activity',
  fetchImpl = fetch,
  timeoutMs = 5000,
}: { endpoint?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {}) => {
  // 点击记录仅发送到同源接口，密钥和 KV 绑定均留在边缘函数中。
  if (!endpoint.startsWith('/') || endpoint.startsWith('//') || /[?#\\]/.test(endpoint)) {
    throw new Error('访问统计接口必须为同源路径')
  }
  const base = endpoint.replace(/\/+$/, '')

  const request = async <T>(path: string, options: RequestInit, consume: (response: Response) => Promise<T>, signal?: AbortSignal): Promise<T> => {
    const controller = new AbortController()
    const abort = () => controller.abort()
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) controller.abort()
    const timer = setTimeout(abort, timeoutMs)
    try {
      const response = await fetchImpl(`${base}${path}`, {
        ...options, credentials: 'omit', signal: controller.signal,
      })
      if (!response.ok) throw new Error(`访问统计请求失败：HTTP ${response.status}`)
      return await consume(response)
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
    }
  }

  const getSnapshot = async (signal?: AbortSignal): Promise<ActivitySnapshot> => {
    const payload: unknown = await request('', { method: 'GET' }, async (response) => {
      if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('访问统计接口未就绪')
      return await response.json()
    }, signal)
    if (!isObject(payload) || payload.version !== 1 || payload.timeZone !== ACTIVITY_TIME_ZONE
      || !isCount(payload.generatedAt)) throw new Error('访问统计响应格式错误')
    return {
      version: 1, timeZone: ACTIVITY_TIME_ZONE, generatedAt: payload.generatedAt,
      popular: parseEntries(payload.popular), recent: parseEntries(payload.recent),
    }
  }

  const record = async (url: string) => {
    await request('/click', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }, async (response) => {
      if (response.status !== 204) throw new Error('访问统计上报接口未就绪')
    })
  }

  return { getSnapshot, record }
}
