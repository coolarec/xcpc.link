import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CATEGORY_FILES } from './parse-site-submission.mjs'

const galleryDirectory = 'src/modules/home/home-galleries'

const normalizeUrlForComparison = (value) => {
  const url = new URL(value)
  return url.toString()
}

const readGallery = async (rootDir, fileName) => {
  const relativePath = path.posix.join(galleryDirectory, fileName)
  const filePath = path.join(rootDir, ...relativePath.split('/'))
  const data = JSON.parse(await readFile(filePath, 'utf8'))
  return { data, filePath, relativePath }
}

const allLinks = (gallery) => [
  ...(Array.isArray(gallery.cards) ? gallery.cards : []),
  ...(Array.isArray(gallery.watches)
    ? gallery.watches.flatMap((watch) => Array.isArray(watch.links) ? watch.links : [])
    : []),
  ...(gallery.watch && Array.isArray(gallery.watch.links) ? gallery.watch.links : []),
]

export const applySiteSubmission = async (submission, options = {}) => {
  const rootDir = options.rootDir || process.cwd()
  const galleries = await Promise.all(
    Object.values(CATEGORY_FILES).map((fileName) => readGallery(rootDir, fileName)),
  )

  const submittedUrl = normalizeUrlForComparison(submission.websiteUrl)

  for (const gallery of galleries) {
    const duplicate = allLinks(gallery.data).find((link) => {
      try {
        return normalizeUrlForComparison(link.websiteUrl) === submittedUrl
      } catch {
        return false
      }
    })

    if (duplicate) {
      throw new Error(`网站链接已存在于 ${path.basename(gallery.filePath)}：${submittedUrl}`)
    }
  }

  const targetFileName = CATEGORY_FILES[submission.category]
  if (!targetFileName) throw new Error(`未知一级分类：${submission.category}`)

  const targetGallery = galleries.find(({ filePath }) => path.basename(filePath) === targetFileName)
  if (!targetGallery) throw new Error(`找不到分类数据文件：${targetFileName}`)

  let targetList
  if (submission.targetGroup) {
    const group = Array.isArray(targetGallery.data.watches)
      ? targetGallery.data.watches.find((watch) => watch.title === submission.targetGroup)
      : undefined

    if (!group) throw new Error(`目标分组不存在：${submission.targetGroup}`)
    if (!Array.isArray(group.links)) throw new Error(`目标分组缺少 links 数组：${submission.targetGroup}`)
    targetList = group.links
  } else {
    if (!Array.isArray(targetGallery.data.cards)) {
      throw new Error(`分类 ${submission.category} 缺少 cards 数组`)
    }
    targetList = targetGallery.data.cards
  }

  const entry = {
    avatarUrl: submission.avatarUrl,
    websiteUrl: submission.websiteUrl,
    websiteTitle: submission.websiteTitle,
    websiteDescription: submission.websiteDescription,
  }

  targetList.push(entry)
  await writeFile(targetGallery.filePath, `${JSON.stringify(targetGallery.data, null, 2)}\n`, 'utf8')

  return {
    filePath: targetGallery.filePath,
    relativePath: targetGallery.relativePath,
    entry,
  }
}
