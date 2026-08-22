export const CATEGORY_FILES = Object.freeze({
  初学者: 'beginners.json',
  算竞高手: 'advanced.json',
  '学生教练 & 出题人': 'coaches.json',
  退役选手: 'authors.json',
})

export const ISSUE_FIELD_LABELS = Object.freeze({
  websiteTitle: '网站名称',
  websiteUrl: '网站链接',
  websiteDescription: '网站简介',
  category: '一级分类',
  targetGroup: '目标分组（可选）',
  avatarUrl: '图标地址（可选）',
  confirmations: '投稿确认',
})

export const REQUIRED_CONFIRMATIONS = Object.freeze([
  '链接当前可以正常访问',
  '内容与 XCPC 或算法竞赛相关',
  '内容不含恶意代码，并允许在本站公开展示',
])

const emptyResponses = new Set(['_No response_', 'No response'])

export const parseIssueFields = (body) => {
  const fields = {}
  let currentHeading = ''

  for (const rawLine of String(body || '').split(/\r?\n/)) {
    const heading = rawLine.match(/^###\s+(.+?)\s*$/)

    if (heading) {
      currentHeading = heading[1]
      fields[currentHeading] = ''
      continue
    }

    if (!currentHeading) continue
    fields[currentHeading] = fields[currentHeading]
      ? `${fields[currentHeading]}\n${rawLine}`
      : rawLine
  }

  for (const key of Object.keys(fields)) {
    const value = fields[key].trim()
    fields[key] = emptyResponses.has(value) ? '' : value
  }

  return fields
}

const requireField = (fields, label) => {
  const value = fields[label]?.trim()
  if (!value) throw new Error(`缺少必填字段：${label}`)
  return value
}

const normalizeWebsiteUrl = (value) => {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('网站链接不是有效 URL')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('网站链接只允许使用 http:// 或 https://')
  }

  url.hash = ''
  return url.toString()
}

const normalizeAvatarUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/assets/')) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.protocol === 'https:') return url.toString()
  } catch {
    // The shared error below is intentionally used for malformed URLs.
  }

  throw new Error('图标地址必须为空、/assets/ 路径或完整的 https:// URL')
}

const validateConfirmations = (value) => {
  const checkedLines = value
    .split(/\r?\n/)
    .filter((line) => /^\s*-\s*\[[xX]\]/.test(line))

  const allChecked = REQUIRED_CONFIRMATIONS.every((confirmation) =>
    checkedLines.some((line) => line.includes(confirmation)),
  )

  if (!allChecked) throw new Error('投稿确认未全部勾选')
}

export const parseSiteSubmission = (body) => {
  const fields = parseIssueFields(body)
  const category = requireField(fields, ISSUE_FIELD_LABELS.category)

  if (!Object.hasOwn(CATEGORY_FILES, category)) {
    throw new Error(`未知一级分类：${category}`)
  }

  validateConfirmations(requireField(fields, ISSUE_FIELD_LABELS.confirmations))

  return {
    websiteTitle: requireField(fields, ISSUE_FIELD_LABELS.websiteTitle),
    websiteUrl: normalizeWebsiteUrl(requireField(fields, ISSUE_FIELD_LABELS.websiteUrl)),
    websiteDescription: requireField(fields, ISSUE_FIELD_LABELS.websiteDescription),
    category,
    targetGroup: fields[ISSUE_FIELD_LABELS.targetGroup]?.trim() || '',
    avatarUrl: normalizeAvatarUrl(fields[ISSUE_FIELD_LABELS.avatarUrl] || ''),
  }
}
