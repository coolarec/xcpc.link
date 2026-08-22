// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const readRepositoryFile = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
  'utf8',
)

describe('website submission Issue Form', () => {
  it('defines the routing label and every parser heading', () => {
    const template = readRepositoryFile('.github/ISSUE_TEMPLATE/add-site.yml')

    expect(template).toContain("name: '添加网站'")
    expect(template).toContain("- 'data:site'")
    for (const label of [
      '网站名称',
      '网站链接',
      '网站简介',
      '一级分类',
      '目标分组（可选）',
      '图标地址（可选）',
      '投稿确认',
    ]) {
      expect(template).toContain(`label: '${label}'`)
    }
  })
})

describe('website submission workflow', () => {
  it('processes opened and edited labeled Issues into one restricted PR branch', () => {
    const workflow = readRepositoryFile('.github/workflows/issue-to-site-pr.yml')

    expect(workflow).toContain('types: [opened, edited]')
    expect(workflow).toContain("contains(github.event.issue.labels.*.name, 'data:site')")
    expect(workflow).toContain('contents: write')
    expect(workflow).toContain('pull-requests: write')
    expect(workflow).toContain('node-version: 24')
    expect(workflow).toContain('node scripts/apply-site-issue.mjs')
    expect(workflow).toContain('peter-evans/create-pull-request@v8')
    expect(workflow).toContain('issue/${{ github.event.issue.number }}-add-site')

    for (const fileName of ['beginners.json', 'advanced.json', 'coaches.json', 'authors.json']) {
      expect(workflow).toContain(`src/modules/home/home-galleries/${fileName}`)
    }
  })
})
