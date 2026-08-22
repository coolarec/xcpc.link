// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  parseIssueFields,
  parseSiteSubmission,
} from './parse-site-submission.mjs'

const completeBody = `### 网站名称

Example Site

### 网站链接

https://example.com

### 网站简介

面向算法竞赛选手的示例网站。

### 一级分类

算竞高手

### 目标分组（可选）

OJ 平台

### 图标地址（可选）

https://example.com/favicon.png

### 投稿确认

- [x] 链接当前可以正常访问
- [X] 内容与 XCPC 或算法竞赛相关
- [x] 内容不含恶意代码，并允许在本站公开展示
`

describe('parseIssueFields', () => {
  it('parses GitHub Issue Form headings and removes empty placeholders', () => {
    const fields = parseIssueFields(`### 网站名称\n\nExample\n\n### 目标分组（可选）\n\n_No response_\n`)

    expect(fields).toEqual({
      网站名称: 'Example',
      '目标分组（可选）': '',
    })
  })
})

describe('parseSiteSubmission', () => {
  it('returns normalized values for a complete submission', () => {
    expect(parseSiteSubmission(completeBody)).toEqual({
      websiteTitle: 'Example Site',
      websiteUrl: 'https://example.com/',
      websiteDescription: '面向算法竞赛选手的示例网站。',
      category: '算竞高手',
      targetGroup: 'OJ 平台',
      avatarUrl: 'https://example.com/favicon.png',
    })
  })

  it('accepts an empty target group and icon', () => {
    const body = completeBody
      .replace('OJ 平台', '_No response_')
      .replace('https://example.com/favicon.png', '_No response_')

    expect(parseSiteSubmission(body)).toMatchObject({
      targetGroup: '',
      avatarUrl: '',
    })
  })

  it('preserves hash-routed functional page URLs', () => {
    const body = completeBody.replace('https://example.com', 'https://example.com/#/tool')

    expect(parseSiteSubmission(body).websiteUrl).toBe('https://example.com/#/tool')
  })

  it('rejects unknown categories', () => {
    expect(() => parseSiteSubmission(completeBody.replace('算竞高手', '友情链接')))
      .toThrow('未知一级分类：友情链接')
  })

  it('rejects unsafe website URL protocols', () => {
    expect(() => parseSiteSubmission(completeBody.replace('https://example.com', 'javascript:alert(1)')))
      .toThrow('网站链接只允许使用 http:// 或 https://')
  })

  it('rejects unsafe icon locations', () => {
    expect(() => parseSiteSubmission(completeBody.replace('https://example.com/favicon.png', 'http://example.com/icon.png')))
      .toThrow('图标地址必须为空、/assets/ 路径或完整的 https:// URL')
  })

  it('requires all confirmation checkboxes', () => {
    const body = completeBody.replace('- [x] 链接当前可以正常访问', '- [ ] 链接当前可以正常访问')

    expect(() => parseSiteSubmission(body)).toThrow('投稿确认未全部勾选')
  })
})
