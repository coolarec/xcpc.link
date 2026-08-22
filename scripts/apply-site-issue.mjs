#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolveSubmissionAvatar } from './site-submission/download-icon.mjs'
import { parseSiteSubmission } from './site-submission/parse-site-submission.mjs'
import { applySiteSubmission } from './site-submission/update-gallery.mjs'

const issueLabels = (issue) => (issue.labels || []).map((label) =>
  typeof label === 'string' ? label : label.name,
)

export const runSiteIssueEvent = async (event, options = {}) => {
  const issue = event?.issue
  if (!issue) throw new Error('事件中缺少 issue 数据')
  if (!issueLabels(issue).includes('data:site')) throw new Error('Issue 缺少 data:site 标签')
  if (!issue.body?.trim()) throw new Error('Issue 正文为空')

  const submission = parseSiteSubmission(issue.body)
  const avatarUrl = await resolveSubmissionAvatar(submission.avatarUrl, options)
  return applySiteSubmission({ ...submission, avatarUrl }, options)
}

const main = async () => {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) throw new Error('缺少 GITHUB_EVENT_PATH 环境变量')

  const event = JSON.parse(await readFile(eventPath, 'utf8'))
  const result = await runSiteIssueEvent(event)
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  main().catch((error) => {
    process.stderr.write(`site submission failed: ${error.message}\n`)
    process.exitCode = 1
  })
}
