// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { resolveSubmissionAvatar } from './download-icon.mjs'

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d,
])

const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }]
let rootDir = ''

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), 'xcpc-download-icon-'))
})

afterEach(async () => {
  vi.useRealTimers()
  await rm(rootDir, { recursive: true, force: true })
})

describe('resolveSubmissionAvatar', () => {
  it('returns an empty string without fetching when no icon was submitted', async () => {
    const fetchImpl = vi.fn()

    await expect(resolveSubmissionAvatar('  ', { rootDir, fetchImpl }))
      .resolves.toBe('')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('keeps an existing safe /assets/ path unchanged', async () => {
    const relativeUrl = '/assets/icons/existing.png'
    const filePath = path.join(rootDir, 'public/assets/icons/existing.png')
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, PNG)

    await expect(resolveSubmissionAvatar(relativeUrl, { rootDir }))
      .resolves.toBe(relativeUrl)
  })

  it('rejects missing and path-traversing /assets/ paths', async () => {
    await expect(resolveSubmissionAvatar('/assets/icons/missing.png', { rootDir }))
      .rejects.toThrow('本地图标不存在')
    await expect(resolveSubmissionAvatar('/assets/../secret.png', { rootDir }))
      .rejects.toThrow('本地图标路径不安全')
    await expect(resolveSubmissionAvatar('/assets/%2e%2e/secret.png', { rootDir }))
      .rejects.toThrow('本地图标路径不安全')
  })

  it('downloads a PNG into public/assets/icons using domain and content hash', async () => {
    const fetchImpl = vi.fn(async () => new Response(PNG, {
      status: 200,
      headers: { 'content-type': 'image/png' },
    }))

    const avatarUrl = await resolveSubmissionAvatar(
      'https://CDN.Example.com/path/favicon?version=2',
      { rootDir, fetchImpl, lookupImpl: publicLookup },
    )

    expect(avatarUrl).toMatch(/^\/assets\/icons\/cdn-example-com-[a-f0-9]{10}\.png$/)
    expect(await readFile(path.join(rootDir, 'public', avatarUrl))).toEqual(Buffer.from(PNG))
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://cdn.example.com/path/favicon?version=2',
      expect.objectContaining({ redirect: 'manual', signal: expect.any(AbortSignal) }),
    )
  })

  it('pins validated DNS results to the outbound request dispatcher', async () => {
    const dispatcher = { close: vi.fn(async () => undefined) }
    const dispatcherFactory = vi.fn(() => dispatcher)
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit & { dispatcher?: unknown }) => {
      expect(init.dispatcher).toBe(dispatcher)
      return new Response(PNG, { headers: { 'content-type': 'image/png' } })
    })

    await resolveSubmissionAvatar('https://example.com/icon.png', {
      rootDir,
      fetchImpl,
      lookupImpl: publicLookup,
      dispatcherFactory,
    })

    expect(dispatcherFactory).toHaveBeenCalledWith([
      { address: '93.184.216.34', family: 4 },
    ])
    expect(dispatcher.close).toHaveBeenCalledOnce()
  })

  it.each([
    ['JPEG', Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg', 'jpg'],
    ['WebP', Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]), 'image/webp', 'webp'],
    ['ICO', Uint8Array.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]), 'image/x-icon', 'ico'],
  ])('recognizes %s by file signature', async (_name, bytes, contentType, extension) => {
    const fetchImpl = async () => new Response(bytes, {
      status: 200,
      headers: { 'content-type': contentType },
    })

    await expect(resolveSubmissionAvatar('https://images.example.com/icon', {
      rootDir,
      fetchImpl,
      lookupImpl: publicLookup,
    })).resolves.toMatch(new RegExp(`\\.${extension}$`))
  })

  it('rejects unsupported or spoofed image content', async () => {
    const fetchImpl = async () => new Response('<svg></svg>', {
      status: 200,
      headers: { 'content-type': 'image/png' },
    })

    await expect(resolveSubmissionAvatar('https://example.com/icon.png', {
      rootDir,
      fetchImpl,
      lookupImpl: publicLookup,
    })).rejects.toThrow('仅支持 PNG、JPEG、WebP 或 ICO 图片')
  })

  it('rejects non-HTTPS URLs and private or reserved destination addresses', async () => {
    const fetchImpl = vi.fn()

    await expect(resolveSubmissionAvatar('http://example.com/icon.png', {
      rootDir,
      fetchImpl,
      lookupImpl: publicLookup,
    })).rejects.toThrow('图标地址只允许使用 https://')

    for (const address of [
      '0.0.0.0',
      '10.0.0.1',
      '100.64.0.1',
      '127.0.0.1',
      '169.254.1.1',
      '172.16.0.1',
      '192.0.2.1',
      '192.168.1.1',
      '198.18.0.1',
      '198.51.100.1',
      '203.0.113.1',
      '224.0.0.1',
      '::1',
      'fc00::1',
      'fe80::1',
      '2001:db8::1',
      'ff00::1',
      '::ffff:127.0.0.1',
    ]) {
      await expect(resolveSubmissionAvatar('https://example.com/icon.png', {
        rootDir,
        fetchImpl,
        lookupImpl: async () => [{ address, family: address.includes(':') ? 6 : 4 }],
      }), address).rejects.toThrow('图标地址解析到了不允许的 IP')
    }

    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it.each([
    '192.0.30.1',
    '198.52.100.1',
    '203.1.113.1',
  ])('does not reject public IPv4 address %s adjacent to reserved ranges', async (address) => {
    const fetchImpl = async () => new Response(PNG, {
      headers: { 'content-type': 'image/png' },
    })

    await expect(resolveSubmissionAvatar('https://example.com/icon.png', {
      rootDir,
      fetchImpl,
      lookupImpl: async () => [{ address, family: 4 }],
    })).resolves.toMatch(/\.png$/)
  })

  it('validates every redirect hop and follows at most three redirects', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const redirectNumber = Number(new URL(url).searchParams.get('redirect') || 0)
      return new Response(null, {
        status: 302,
        headers: { location: `https://redirect${redirectNumber + 1}.example.com/icon?redirect=${redirectNumber + 1}` },
      })
    })

    await expect(resolveSubmissionAvatar('https://redirect0.example.com/icon', {
      rootDir,
      fetchImpl,
      lookupImpl: publicLookup,
    })).rejects.toThrow('图标下载重定向次数超过 3 次')
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('rejects a redirect to a private host before requesting it', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: 'https://internal.example.com/icon.png' },
    }))
    const lookupImpl = vi.fn(async (hostname: string) => [{
      address: hostname === 'internal.example.com' ? '127.0.0.1' : '93.184.216.34',
      family: 4,
    }])

    await expect(resolveSubmissionAvatar('https://example.com/icon.png', {
      rootDir,
      fetchImpl,
      lookupImpl,
    })).rejects.toThrow('图标地址解析到了不允许的 IP')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('rejects responses larger than 1 MiB from the header or body', async () => {
    const tooLarge = 1024 * 1024 + 1
    const headerFetch = async () => new Response(PNG, {
      headers: { 'content-length': String(tooLarge), 'content-type': 'image/png' },
    })
    const bodyFetch = async () => new Response(new Uint8Array(tooLarge), {
      headers: { 'content-type': 'image/png' },
    })

    await expect(resolveSubmissionAvatar('https://example.com/header.png', {
      rootDir,
      fetchImpl: headerFetch,
      lookupImpl: publicLookup,
    })).rejects.toThrow('图标大小不能超过 1 MiB')
    await expect(resolveSubmissionAvatar('https://example.com/body.png', {
      rootDir,
      fetchImpl: bodyFetch,
      lookupImpl: publicLookup,
    })).rejects.toThrow('图标大小不能超过 1 MiB')
  })

  it('aborts downloads after 10 seconds', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    }))

    const result = resolveSubmissionAvatar('https://example.com/slow.png', {
      rootDir,
      fetchImpl,
      lookupImpl: publicLookup,
    })
    const expectation = expect(result).rejects.toThrow('图标下载超时（10 秒）')
    await vi.advanceTimersByTimeAsync(10_000)
    await expectation
  })

  it.each(['lookup', 'fetch'])('enforces the timeout when %s ignores abort signals', async (stage) => {
    vi.useFakeTimers()
    const never = () => new Promise<never>(() => {})
    const result = resolveSubmissionAvatar('https://example.com/slow.png', {
      rootDir,
      fetchImpl: stage === 'fetch' ? never : async () => new Response(PNG),
      lookupImpl: stage === 'lookup' ? never : publicLookup,
    })
    let rejection: unknown
    void result.catch((error) => { rejection = error })

    await vi.advanceTimersByTimeAsync(10_000)
    await Promise.resolve()

    expect(rejection).toMatchObject({ message: '图标下载超时（10 秒）' })
  })
})
