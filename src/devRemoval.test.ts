// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryPath = (relativePath: string) => fileURLToPath(new URL(`../${relativePath}`, import.meta.url))
const readRepositoryFile = (relativePath: string) => readFileSync(repositoryPath(relativePath), 'utf8')

describe('legacy DEV experience removal', () => {
  it('removes the DEV route, sitemap entry, page files, and DEV-only data loaders', () => {
    const router = readRepositoryFile('src/router/index.ts')
    const sitemap = readRepositoryFile('public/sitemap.xml')
    const homeApi = readRepositoryFile('src/modules/home/api.ts')
    const homeStore = readRepositoryFile('src/stores/homeContent.ts')

    expect(router).not.toContain("path: '/dev'")
    expect(sitemap).not.toContain('https://xcpc.link/dev')
    expect(existsSync(repositoryPath('src/views/dev'))).toBe(false)
    expect(existsSync(repositoryPath('src/components/MotionFooter.vue'))).toBe(false)
    expect(existsSync(repositoryPath('src/composables/useWatchDrag.ts'))).toBe(false)
    expect(homeApi).not.toContain('fetchHeroDockItems')
    expect(homeApi).not.toContain('fetchHeroPanelEmojis')
    expect(homeApi).not.toContain('fetchAlgorithmWords')
    expect(homeStore).not.toContain('dockItems')
  })
})
