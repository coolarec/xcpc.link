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
    expect(template).toContain('HTTPS 图片会自动下载到仓库现有的 public/assets/icons/ 目录')
    expect(template).toMatch(/- type: input\n\s+id: website_description/)
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
    expect(workflow).toContain('issues: write')
    expect(workflow).toContain('node-version: 24')
    expect(workflow).toContain('node scripts/apply-site-issue.mjs')
    expect(workflow).toContain('id: apply')
    expect(workflow).toContain('continue-on-error: true')
    expect(workflow).toContain('gh pr ready "$pr_number" --undo')
    expect(workflow).toContain('id: create_pr')
    expect(workflow).toContain('gh pr ready "$pr_number"')
    expect(workflow).toContain('peter-evans/create-pull-request@v8')
    expect(workflow).toContain('issue/${{ github.event.issue.number }}-add-site')

    for (const fileName of ['beginners.json', 'advanced.json', 'coaches.json', 'authors.json']) {
      expect(workflow).toContain(`src/modules/home/home-galleries/${fileName}`)
    }
    expect(workflow).toContain('public/assets/icons/*')
  })
})

describe('website submission preview comment workflow', () => {
  it('comments successful Vercel previews on the source Issue without duplicates', () => {
    const workflow = readRepositoryFile('.github/workflows/comment-site-preview.yml')

    expect(workflow).toContain('deployment_status:')
    expect(workflow).toContain('deployments: read')
    expect(workflow).toContain('pull-requests: read')
    expect(workflow).toContain('issues: write')
    expect(workflow).toContain("state !== 'success'")
    expect(workflow).toContain('^issue\\/([0-9]+)-add-site$')
    expect(workflow).toContain("previewUrl.protocol !== 'https:'")
    expect(workflow).toContain('pulls.list')
    expect(workflow).toContain('site-preview-deployment')
    expect(workflow).toContain('issues.updateComment')
    expect(workflow).toContain('issues.createComment')
  })
})
