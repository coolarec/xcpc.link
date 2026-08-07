// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const indexHtml = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')

describe('application load failure fallback', () => {
  it('provides a refreshable error dialog with the developer contact', () => {
    expect(indexHtml).toContain('id="app-load-error"')
    expect(indexHtml).toContain('window.showAppLoadError')
    expect(indexHtml).toContain('刷新页面')
    expect(indexHtml).toContain('开发者 QQ 3187170085')
  })
})
