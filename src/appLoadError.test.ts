// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const indexHtml = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')
const mainSource = readFileSync(fileURLToPath(new URL('./main.ts', import.meta.url)), 'utf8')

describe('application load failure fallback', () => {
  it('lets the build environment resolve the web manifest base URL', () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(indexHtml).not.toContain('vite-ignore')
    expect(indexHtml).not.toContain('cdn.xcpc-link.algoux.cn/manifest.webmanifest')
    expect(indexHtml).not.toContain('href="https://xcpc.link/manifest.webmanifest"')
  })

  it('provides a refreshable error dialog with the developer contact', () => {
    expect(indexHtml).toContain('id="app-load-error"')
    expect(indexHtml).toContain('window.showAppLoadError')
    expect(indexHtml).toContain('刷新页面')
    expect(indexHtml).toContain('开发者 QQ 3187170085')
  })

  it('renders the application without a blocking first-page preloader', () => {
    expect(indexHtml).not.toContain('id="app-preloader"')
    expect(indexHtml).not.toContain('body:not(.is-app-visible) #app')
    expect(mainSource).not.toContain('app-preloader')
  })
})
