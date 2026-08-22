// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { applySiteSubmission } from './update-gallery.mjs'

const galleryDir = 'src/modules/home/home-galleries'
let rootDir = ''

const gallery = (title: string, cards: unknown[] = [], watches: unknown[] = []) => ({
  eyebrow: 'FOR',
  title,
  accent: '#007aff',
  cards,
  watches,
})

const writeGallery = async (fileName: string, value: unknown) => {
  const filePath = path.join(rootDir, galleryDir, fileName)
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const readGallery = async (fileName: string) =>
  JSON.parse(await readFile(path.join(rootDir, galleryDir, fileName), 'utf8'))

const submission = {
  websiteTitle: 'Example Site',
  websiteUrl: 'https://example.com/',
  websiteDescription: '示例简介。',
  category: '初学者',
  targetGroup: '',
  avatarUrl: '',
} as const

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), 'xcpc-site-submission-'))
  await mkdir(path.join(rootDir, galleryDir), { recursive: true })
  await writeGallery('beginners.json', gallery('初学者'))
  await writeGallery('advanced.json', gallery('算竞高手', [], [
    { title: 'OJ 平台', description: '常用 OJ', links: [] },
  ]))
  await writeGallery('coaches.json', gallery('学生教练 & 出题人'))
  await writeGallery('authors.json', gallery('退役选手'))
})

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true })
})

describe('applySiteSubmission', () => {
  it('appends an ungrouped submission to cards', async () => {
    const result = await applySiteSubmission(submission, { rootDir })
    const data = await readGallery('beginners.json')

    expect(result.relativePath).toBe('src/modules/home/home-galleries/beginners.json')
    expect(data.cards).toEqual([{
      avatarUrl: '',
      websiteUrl: 'https://example.com/',
      websiteTitle: 'Example Site',
      websiteDescription: '示例简介。',
    }])
  })

  it('appends to an existing watch group', async () => {
    await applySiteSubmission({
      ...submission,
      category: '算竞高手',
      targetGroup: 'OJ 平台',
    }, { rootDir })

    const data = await readGallery('advanced.json')
    expect(data.watches[0].links[0].websiteUrl).toBe('https://example.com/')
  })

  it('rejects a target group that does not exist', async () => {
    await expect(applySiteSubmission({
      ...submission,
      category: '算竞高手',
      targetGroup: '不存在的分组',
    }, { rootDir })).rejects.toThrow('目标分组不存在：不存在的分组')
  })

  it('rejects a URL already present in another gallery', async () => {
    await writeGallery('authors.json', gallery('退役选手', [{
      avatarUrl: '',
      websiteUrl: 'https://example.com',
      websiteTitle: 'Existing',
      websiteDescription: 'Existing entry',
    }]))

    await expect(applySiteSubmission(submission, { rootDir }))
      .rejects.toThrow('网站链接已存在于 authors.json：https://example.com/')
  })

  it('allows different hash-routed pages on the same origin', async () => {
    await writeGallery('authors.json', gallery('退役选手', [{
      avatarUrl: '',
      websiteUrl: 'https://example.com/#/one',
      websiteTitle: 'Existing Tool',
      websiteDescription: 'Existing entry',
    }]))

    await expect(applySiteSubmission({
      ...submission,
      websiteUrl: 'https://example.com/#/two',
    }, { rootDir })).resolves.toMatchObject({
      entry: { websiteUrl: 'https://example.com/#/two' },
    })
  })

  it('preserves two-space JSON formatting and a trailing newline', async () => {
    await applySiteSubmission(submission, { rootDir })
    const content = await readFile(path.join(rootDir, galleryDir, 'beginners.json'), 'utf8')

    expect(content).toContain('\n  "cards": [\n    {')
    expect(content.endsWith('\n')).toBe(true)
  })
})
