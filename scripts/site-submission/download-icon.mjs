import { createHash } from 'node:crypto'
import { lookup as dnsLookup } from 'node:dns/promises'
import { mkdir, realpath, stat, writeFile } from 'node:fs/promises'
import { isIP } from 'node:net'
import path from 'node:path'
import { DOMParser } from '@xmldom/xmldom'
import { Agent, fetch as undiciFetch } from 'undici'

const MAX_BYTES = 1024 * 1024
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

const isWithin = (parent, candidate) =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const resolveLocalAsset = async (avatarUrl, rootDir) => {
  let decoded
  try {
    decoded = decodeURIComponent(avatarUrl)
  } catch {
    throw new Error('本地图标路径不安全')
  }

  if (
    !decoded.startsWith('/assets/')
    || decoded.includes('\\')
    || decoded.includes('\0')
    || decoded.includes('?')
    || decoded.includes('#')
    || decoded.split('/').some((segment) => segment === '.' || segment === '..')
    || path.posix.normalize(decoded) !== decoded
  ) {
    throw new Error('本地图标路径不安全')
  }

  const publicDir = path.resolve(rootDir, 'public')
  const candidate = path.resolve(publicDir, `.${decoded}`)
  if (!isWithin(publicDir, candidate)) throw new Error('本地图标路径不安全')

  try {
    const [publicRealPath, candidateRealPath, fileStat] = await Promise.all([
      realpath(publicDir),
      realpath(candidate),
      stat(candidate),
    ])
    if (!isWithin(publicRealPath, candidateRealPath)) {
      throw new Error('本地图标路径不安全')
    }
    if (!fileStat.isFile()) throw new Error('本地图标不存在')
  } catch (error) {
    if (error?.message === '本地图标路径不安全' || error?.message === '本地图标不存在') {
      throw error
    }
    throw new Error(`本地图标不存在：${avatarUrl}`)
  }

  return avatarUrl
}

const parseIPv4 = (address) => {
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const numbers = parts.map(Number)
  if (numbers.some((part, index) => (
    !Number.isInteger(part)
    || part < 0
    || part > 255
    || String(part) !== parts[index]
  ))) return null
  return numbers
}

const isDisallowedIPv4 = (address) => {
  const octets = parseIPv4(address)
  if (!octets) return true
  const [a, b, c] = octets

  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && (c === 0 || c === 2))
    || (a === 192 && b === 88 && c === 99)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
}

const expandIPv6 = (address) => {
  const zoneIndex = address.indexOf('%')
  const withoutZone = (zoneIndex === -1 ? address : address.slice(0, zoneIndex)).toLowerCase()
  const mappedMatch = withoutZone.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
  let normalized = withoutZone
  if (mappedMatch) {
    const ipv4 = parseIPv4(mappedMatch[2])
    if (!ipv4) return null
    normalized = `${mappedMatch[1]}${((ipv4[0] << 8) | ipv4[1]).toString(16)}:${((ipv4[2] << 8) | ipv4[3]).toString(16)}`
  }

  const halves = normalized.split('::')
  if (halves.length > 2) return null
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves[1] ? halves[1].split(':') : []
  const missing = 8 - left.length - right.length
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null
  const groups = halves.length === 2
    ? [...left, ...Array(missing).fill('0'), ...right]
    : left
  if (groups.length !== 8 || groups.some((group) => !/^[a-f0-9]{1,4}$/.test(group))) return null
  return groups.map((group) => Number.parseInt(group, 16))
}

const isDisallowedIPv6 = (address) => {
  const groups = expandIPv6(address)
  if (!groups) return true

  const isMappedIPv4 = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff
  if (isMappedIPv4) {
    const mapped = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`
    return isDisallowedIPv4(mapped)
  }

  const isUnspecifiedOrLoopback = groups.slice(0, 7).every((group) => group === 0)
    && (groups[7] === 0 || groups[7] === 1)
  const first = groups[0]
  const isGlobalUnicast = first >= 0x2000 && first <= 0x3fff
  const isDocumentation = first === 0x2001 && groups[1] === 0x0db8
  const isSixToFour = first === 0x2002

  return isUnspecifiedOrLoopback
    || !isGlobalUnicast
    || isDocumentation
    || isSixToFour
}

const isDisallowedAddress = (address) => {
  const family = isIP(address)
  if (family === 4) return isDisallowedIPv4(address)
  if (family === 6) return isDisallowedIPv6(address)
  return true
}

const normalizeLookupResults = (result) => {
  const results = Array.isArray(result) ? result : [result]
  return results
    .map((entry) => {
      const address = typeof entry === 'string' ? entry : entry?.address
      const family = typeof entry === 'string' ? isIP(entry) : entry?.family || isIP(address)
      return address && family ? { address, family } : null
    })
    .filter(Boolean)
}

const validateRemoteUrl = async (url, lookupImpl) => {
  if (url.protocol !== 'https:') throw new Error('图标地址只允许使用 https://')
  if (url.username || url.password) throw new Error('图标地址不能包含用户名或密码')

  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  let addresses
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) }]
  } else {
    const lookupResult = await lookupImpl(hostname, { all: true, verbatim: true })
    addresses = normalizeLookupResults(lookupResult)
  }

  if (addresses.length === 0) throw new Error(`图标地址无法解析：${hostname}`)
  if (addresses.some(({ address }) => isDisallowedAddress(address))) {
    throw new Error(`图标地址解析到了不允许的 IP：${hostname}`)
  }

  return addresses
}

const createPinnedDispatcher = (addresses) => new Agent({
  connect: {
    lookup: (_hostname, options, callback) => {
      const requestedFamily = typeof options === 'number' ? options : options?.family
      const candidates = requestedFamily && requestedFamily !== 0
        ? addresses.filter(({ family }) => family === requestedFamily)
        : addresses

      if (candidates.length === 0) {
        const error = new Error('没有可用的已校验公网地址')
        error.code = 'ENOTFOUND'
        callback(error)
        return
      }

      if (typeof options === 'object' && options?.all) {
        callback(null, candidates)
        return
      }

      callback(null, candidates[0].address, candidates[0].family)
    },
  },
})

const readLimitedBody = async (response) => {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
    throw new Error('图标大小不能超过 1 MiB')
  }
  if (!response.body) throw new Error('图标响应内容为空')

  const reader = response.body.getReader()
  const chunks = []
  let totalLength = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalLength += value.byteLength
      if (totalLength > MAX_BYTES) {
        await reader.cancel()
        throw new Error('图标大小不能超过 1 MiB')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalLength)
}

const forbiddenSvgTags = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
  'canvas',
  'link',
  'meta',
  'animate',
  'animatemotion',
  'animatetransform',
  'discard',
  'set',
  'mpath',
])

const normalizeCssEscapes = (value) => value
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\\([a-f0-9]{1,6})(?:\r\n|[\t\n\f\r ])?/gi, (_match, codePoint) => {
    const value = Number.parseInt(codePoint, 16)
    return value === 0 || value > 0x10ffff ? '\uFFFD' : String.fromCodePoint(value)
  })
  .replace(/\\([^\n\r\f])/g, '$1')

const hasUnsafeCssUrl = (value) => {
  const normalized = normalizeCssEscapes(value)
  const matches = normalized.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)
  return [...matches].some((match) => !match[2].trim().startsWith('#'))
}

const hasUnsafeCss = (value) => {
  const normalized = normalizeCssEscapes(value)
  return /@import|expression\s*\(|javascript:|vbscript:/i.test(normalized)
    || hasUnsafeCssUrl(normalized)
}

const isSafeEmbeddedImage = (value) => /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value)

const validateSvgContent = (content) => {
  try {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(content)
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('unsafe declaration')
    const withoutXmlDeclaration = source.replace(/^\uFEFF?\s*<\?xml\s+[^?]*\?>/i, '')
    if (/<\?/.test(withoutXmlDeclaration)) throw new Error('unsafe processing instruction')

    const parseErrors = []
    const document = new DOMParser({
      errorHandler: {
        warning: (message) => parseErrors.push(message),
        error: (message) => parseErrors.push(message),
        fatalError: (message) => parseErrors.push(message),
      },
    }).parseFromString(source, 'image/svg+xml')

    const root = document.documentElement
    if (parseErrors.length > 0 || root?.localName?.toLowerCase() !== 'svg') {
      throw new Error('invalid svg')
    }

    const elements = [root, ...Array.from(root.getElementsByTagName('*'))]
    for (const element of elements) {
      const tagName = element.localName.toLowerCase()
      if (forbiddenSvgTags.has(tagName)) throw new Error('unsafe element')

      if (tagName === 'style') {
        const css = element.textContent || ''
        if (hasUnsafeCss(css)) throw new Error('unsafe style')
      }

      for (const attribute of Array.from(element.attributes || [])) {
        const name = attribute.name.toLowerCase()
        const value = attribute.value.trim()
        const lowerValue = value.toLowerCase()

        if (name.startsWith('on')) throw new Error('event handler')
        if (lowerValue.includes('javascript:') || lowerValue.includes('vbscript:')) {
          throw new Error('unsafe protocol')
        }

        if (['href', 'xlink:href', 'src'].includes(name)) {
          const isEmbeddedRasterImage = tagName === 'image' && isSafeEmbeddedImage(value)
          if (value && !value.startsWith('#') && !isEmbeddedRasterImage) {
            throw new Error('external reference')
          }
        }

        if (name === 'style' && hasUnsafeCss(value)) {
          throw new Error('unsafe style')
        }

        if (hasUnsafeCssUrl(value)) throw new Error('external url')
      }
    }
  } catch {
    throw new Error('SVG 图标包含不安全内容')
  }
}

const detectImageExtension = (content) => {
  if (
    content.length >= 8
    && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'png'
  if (content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff) return 'jpg'
  if (
    content.length >= 12
    && content.subarray(0, 4).toString('ascii') === 'RIFF'
    && content.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'webp'
  if (
    content.length >= 6
    && content[0] === 0x00
    && content[1] === 0x00
    && content[2] === 0x01
    && content[3] === 0x00
  ) return 'ico'

  const textPrefix = content.subarray(0, Math.min(content.length, 1024)).toString('utf8').trimStart()
  if (textPrefix.startsWith('<')) {
    validateSvgContent(content)
    return 'svg'
  }

  throw new Error('仅支持 PNG、JPEG、WebP、ICO 或安全 SVG 图片')
}

const normalizedHostname = (hostname) => {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return normalized || 'site'
}

const waitForAbortable = (operation, signal) => new Promise((resolve, reject) => {
  if (signal.aborted) {
    reject(signal.reason)
    return
  }

  const abort = () => reject(signal.reason)
  signal.addEventListener('abort', abort, { once: true })
  Promise.resolve(operation).then(
    (value) => {
      signal.removeEventListener('abort', abort)
      resolve(value)
    },
    (error) => {
      signal.removeEventListener('abort', abort)
      reject(error)
    },
  )
})

const downloadRemoteIcon = async ({ avatarUrl, rootDir, fetchImpl, lookupImpl, dispatcherFactory }) => {
  let currentUrl
  try {
    currentUrl = new URL(avatarUrl)
  } catch {
    throw new Error('图标地址只允许使用 https://')
  }

  const sourceHostname = currentUrl.hostname
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort(new Error('图标下载超时（10 秒）'))
  }, TIMEOUT_MS)

  try {
    for (let redirectCount = 0; ; redirectCount += 1) {
      const addresses = await waitForAbortable(validateRemoteUrl(currentUrl, lookupImpl), controller.signal)
      const dispatcher = dispatcherFactory(addresses)
      try {
        const response = await waitForAbortable(
          fetchImpl(currentUrl.href, {
            redirect: 'manual',
            signal: controller.signal,
            dispatcher,
            headers: { accept: 'image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml' },
          }),
          controller.signal,
        )

        if (REDIRECT_STATUSES.has(response.status)) {
          if (redirectCount >= MAX_REDIRECTS) {
            throw new Error(`图标下载重定向次数超过 ${MAX_REDIRECTS} 次`)
          }
          const location = response.headers.get('location')
          if (!location) throw new Error('图标下载重定向缺少 Location')
          await response.body?.cancel()
          currentUrl = new URL(location, currentUrl)
          continue
        }

        if (!response.ok) throw new Error(`图标下载失败：HTTP ${response.status}`)
        const content = await waitForAbortable(readLimitedBody(response), controller.signal)
        const extension = detectImageExtension(content)
        const digest = createHash('sha256').update(content).digest('hex').slice(0, 10)
        const fileName = `${normalizedHostname(sourceHostname)}-${digest}.${extension}`
        const iconsDir = path.resolve(rootDir, 'public/assets/icons')
        const filePath = path.resolve(iconsDir, fileName)
        if (!isWithin(iconsDir, filePath)) throw new Error('生成的图标路径不安全')
        await mkdir(iconsDir, { recursive: true })
        await writeFile(filePath, content)
        return `/assets/icons/${fileName}`
      } finally {
        await dispatcher.close()
      }
    }
  } catch (error) {
    if (controller.signal.aborted) throw new Error('图标下载超时（10 秒）')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const resolveSubmissionAvatar = async (avatarUrl, options = {}) => {
  const value = String(avatarUrl || '').trim()
  if (!value) return ''

  const {
    rootDir = process.cwd(),
    fetchImpl = undiciFetch,
    lookupImpl = dnsLookup,
    dispatcherFactory = createPinnedDispatcher,
  } = options

  if (value.startsWith('/assets/')) return resolveLocalAsset(value, rootDir)
  return downloadRemoteIcon({
    avatarUrl: value,
    rootDir,
    fetchImpl,
    lookupImpl,
    dispatcherFactory,
  })
}
