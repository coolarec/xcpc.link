// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runSiteIssueEvent } from './apply-site-issue.mjs'

let rootDir = ''
const galleryDirectory = 'src/modules/home/home-galleries'

const issueBody = `### 网站名称

Example Site

### 网站链接

https://example.com

### 网站简介

示例简介。

### 一级分类

初学者

### 目标分组（可选）

_No response_

### 图标地址（可选）

_No response_

### 投稿确认

- [x] 链接当前可以正常访问
- [x] 内容与 XCPC 或算法竞赛相关
- [x] 内容不含恶意代码，并允许在本站公开展示
`

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), 'xcpc-site-event-'))
  await mkdir(path.join(rootDir, galleryDirectory), { recursive: true })

  for (const [fileName, title] of [
    ['beginners.json', '初学者'],
    ['advanced.json', '算竞高手'],
    ['coaches.json', '学生教练 & 出题人'],
    ['authors.json', '退役选手'],
  ]) {
    await writeFile(
      path.join(rootDir, galleryDirectory, fileName),
      `${JSON.stringify({ eyebrow: 'FOR', title, accent: '#000', cards: [], watches: [] }, null, 2)}\n`,
      'utf8',
    )
  }
})

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true })
})

describe('runSiteIssueEvent', () => {
  it('applies a labeled Issue submission', async () => {
    const result = await runSiteIssueEvent({
      issue: {
        body: issueBody,
        labels: [{ name: 'data:site' }],
      },
    }, { rootDir })

    const updated = JSON.parse(await readFile(
      path.join(rootDir, galleryDirectory, 'beginners.json'),
      'utf8',
    ))

    expect(result.relativePath).toBe('src/modules/home/home-galleries/beginners.json')
    expect(updated.cards[0].websiteTitle).toBe('Example Site')
  })

  it('rejects events without the routing label', async () => {
    await expect(runSiteIssueEvent({
      issue: { body: issueBody, labels: [] },
    }, { rootDir })).rejects.toThrow('Issue 缺少 data:site 标签')
  })

  it('rejects events without an Issue body', async () => {
    await expect(runSiteIssueEvent({
      issue: { body: '', labels: [{ name: 'data:site' }] },
    }, { rootDir })).rejects.toThrow('Issue 正文为空')
  })

  it('downloads an HTTPS icon and stores its local path in gallery data', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    )
    const body = issueBody.replace(
      '### 图标地址（可选）\n\n_No response_',
      '### 图标地址（可选）\n\nhttps://icons.example.com/favicon.png',
    )

    await runSiteIssueEvent({
      issue: {
        body,
        labels: [{ name: 'data:site' }],
      },
    }, {
      rootDir,
      fetchImpl: async () => new Response(png, {
        status: 200,
        headers: { 'content-type': 'image/png' },
      }),
      lookupImpl: async () => [{ address: '93.184.216.34', family: 4 }],
    })

    const updated = JSON.parse(await readFile(
      path.join(rootDir, galleryDirectory, 'beginners.json'),
      'utf8',
    ))
    const iconFiles = await readdir(path.join(rootDir, 'public/assets/icons'))

    expect(updated.cards[0].avatarUrl).toMatch(/^\/assets\/icons\/icons-example-com-[a-f0-9]{10}\.png$/)
    expect(iconFiles).toHaveLength(1)
  })
})
