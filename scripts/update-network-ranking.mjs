#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROUND1_ID = '2094677389171486720'
const ROUND2_ID = '2097206296647036928'
const TOP_TEAM_LIMIT = 500
const LOLLIPOP = '9298cc1a3bcac2a456945faf693e3f26'
export const NETWORK_RANKING_CACHE_TTL_MS = 30_000
export const NETWORK_RANKING_CACHE_CONTROL = 'public, s-maxage=30, stale-while-revalidate=60'

let snapshotCache = {
  key: '',
  expiresAt: 0,
  payload: null,
  inflight: null,
}

const snapshotCacheKey = (options = {}) => `${options.round1Id || ROUND1_ID}:${options.round2Id || ROUND2_ID}`

const rankingUrl = (competitionId) => `https://pintia.cn/rankings/${competitionId}`
const rankingApiUrl = (competitionId) => {
  const filter = JSON.stringify({
    groupFid: '',
    teamExcluded: 'NO_FILTER',
    hideScoreboard: false,
  })
  return `https://pintia.cn/api/competitions/${competitionId}/xcpc-rankings/public?filter=${encodeURIComponent(filter)}`
}

const shanghaiStamp = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const value = (type) => parts.find((part) => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}`
}

const fetchPublicRanking = async (competitionId) => {
  const response = await fetch(rankingApiUrl(competitionId), {
    headers: {
      Accept: 'application/json;charset=UTF-8',
      'Accept-Language': 'zh-CN',
      Referer: rankingUrl(competitionId),
      'User-Agent': 'xcpc.link-network-ranking-updater',
      'X-Lollipop': LOLLIPOP,
      'X-Marshmallow': '',
    },
  })
  if (!response.ok) {
    throw new Error(`拉取 ${competitionId} 榜单失败：HTTP ${response.status}`)
  }
  const payload = await response.json()
  const rankings = payload?.xcpcRankings?.rankings
  if (!Array.isArray(rankings)) {
    throw new Error(`拉取 ${competitionId} 榜单失败：响应缺少 xcpcRankings.rankings`)
  }
  return {
    competitionId,
    name: payload.competitionBasicInfo?.name || competitionId,
    startAt: payload.competitionBasicInfo?.startAt || '',
    endAt: payload.competitionBasicInfo?.endAt || '',
    rankings,
  }
}

const schoolOrder = (rankings) => {
  const seen = new Set()
  const order = []
  for (const row of rankings) {
    const school = row.teamInfo?.schoolName?.trim()
    if (!school || seen.has(school)) continue
    seen.add(school)
    order.push(school)
  }
  return order
}

const mergeSchoolRanks = (round1, round2) => {
  const merged = []
  const seen = new Set()
  const limit = Math.max(round1.length, round2.length)
  for (let index = 0; index < limit; index += 1) {
    for (const list of [round1, round2]) {
      const school = list[index]
      if (!school || seen.has(school)) continue
      seen.add(school)
      merged.push(school)
    }
  }
  return merged
}

const schoolCounts = (rankings) => {
  const counts = new Map()
  for (const row of rankings) {
    const school = row.teamInfo?.schoolName?.trim()
    if (!school) continue
    if (!counts.has(school)) counts.set(school, { teams: 0, top500Teams: 0 })
    const entry = counts.get(school)
    entry.teams += 1
    if (Number(row.rank) <= TOP_TEAM_LIMIT) entry.top500Teams += 1
  }
  return counts
}

const collectSchoolStats = (boards) => {
  const stats = new Map()
  for (const board of boards) {
    for (const [school, count] of schoolCounts(board.rankings)) {
      const current = stats.get(school) || { teams: 0, top500Teams: 0 }
      stats.set(school, {
        teams: Math.max(current.teams, count.teams),
        top500Teams: Math.max(current.top500Teams, count.top500Teams),
      })
    }
  }
  return stats
}

const rankIndex = (order) => {
  const ranks = new Map()
  order.forEach((school, index) => ranks.set(school, index + 1))
  return ranks
}

const buildSchools = (boards) => {
  const [round1Order, round2Order] = boards.map((board) => schoolOrder(board.rankings))
  const merged = mergeSchoolRanks(round1Order, round2Order)
  const stats = collectSchoolStats(boards)
  const round1Ranks = rankIndex(round1Order)
  const round2Ranks = rankIndex(round2Order)
  return merged.map((school, index) => {
    const entry = stats.get(school) || { teams: 0, top500Teams: 0 }
    return {
      school,
      rank: index + 1,
      round1Rank: round1Ranks.get(school) ?? null,
      round2Rank: round2Ranks.get(school) ?? null,
      teams: entry.teams,
      top500Teams: entry.top500Teams,
    }
  })
}

const updateCalData = (data, boards, generatedAt) => {
  const schools = buildSchools(boards)
  const [round1, round2] = boards
  data.schools = schools
  data.meta.generatedAt = generatedAt
  data.meta.pintiaUrl = rankingUrl(round1.competitionId)
  data.meta.pintiaRound1Url = rankingUrl(round1.competitionId)
  data.meta.pintiaRound2Url = rankingUrl(round2.competitionId)
  data.meta.networkRankings = {
    rule: '每场取每校最好队伍得到校排名，再按归并合并：同名次第一场在前，然后去掉重复高校。',
    round1: {
      name: round1.name,
      competitionId: round1.competitionId,
      url: rankingUrl(round1.competitionId),
      teams: round1.rankings.length,
      schools: schoolOrder(round1.rankings).length,
    },
    round2: {
      name: round2.name,
      competitionId: round2.competitionId,
      url: rankingUrl(round2.competitionId),
      teams: round2.rankings.length,
      schools: schoolOrder(round2.rankings).length,
    },
  }
  data.meta.notes[0] = `校排名来自两场 ICPC 网络预选赛 Pintia 公开榜单快照，按归并规则合并去重；当前共 ${schools.length} 所学校。数据更新截止到 ${generatedAt}。`
  return { data, schools }
}

const boardMeta = (board) => ({
  name: board.name,
  competitionId: board.competitionId,
  url: rankingUrl(board.competitionId),
  teams: board.rankings.length,
  schools: schoolOrder(board.rankings).length,
})

export const fetchNetworkRankingSnapshot = async (options = {}) => {
  const key = snapshotCacheKey(options)
  const now = Date.now()
  if (!options.force) {
    if (snapshotCache.key === key && snapshotCache.payload && snapshotCache.expiresAt > now) {
      return snapshotCache.payload
    }
    if (snapshotCache.key === key && snapshotCache.inflight) {
      return snapshotCache.inflight
    }
  }

  const inflight = (async () => {
    const boards = await Promise.all([
      fetchPublicRanking(options.round1Id || ROUND1_ID),
      fetchPublicRanking(options.round2Id || ROUND2_ID),
    ])
    const payload = {
      generatedAt: options.generatedAt || shanghaiStamp(),
      schools: buildSchools(boards),
      round1: boardMeta(boards[0]),
      round2: boardMeta(boards[1]),
    }
    snapshotCache = {
      key,
      expiresAt: Date.now() + NETWORK_RANKING_CACHE_TTL_MS,
      payload,
      inflight: null,
    }
    return payload
  })()

  snapshotCache = { ...snapshotCache, key, inflight }

  try {
    return await inflight
  } catch (error) {
    if (snapshotCache.inflight === inflight) snapshotCache.inflight = null
    throw error
  }
}

export const updateNetworkRanking = async (options = {}) => {
  const root = options.root || resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const dataPath = options.dataPath || resolve(root, 'src/modules/cal-data.json')
  const boards = await Promise.all([
    fetchPublicRanking(options.round1Id || ROUND1_ID),
    fetchPublicRanking(options.round2Id || ROUND2_ID),
  ])
  const current = JSON.parse(await readFile(dataPath, 'utf8'))
  const generatedAt = options.generatedAt || shanghaiStamp()
  const { data, schools } = updateCalData(current, boards, generatedAt)
  await writeFile(dataPath, `${JSON.stringify(data)}\n`)
  return {
    dataPath,
    generatedAt,
    schoolCount: schools.length,
    round1: data.meta.networkRankings.round1,
    round2: data.meta.networkRankings.round2,
  }
}

const main = async () => {
  const result = await updateNetworkRanking()
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  main().catch((error) => {
    process.stderr.write(`update network ranking failed: ${error.message}\n`)
    process.exitCode = 1
  })
}
