#!/usr/bin/env node
import { writeFile, rename } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const NETWORK_ID = '2099750481526394880'
const FINAL_ID = '2046522266744168448'
const rankingUrl = (id) => `https://pintia.cn/rankings/${id}`

async function fetchRanking(id) {
  const filter = encodeURIComponent(JSON.stringify({ groupFid: '', teamExcluded: 'NO_FILTER', hideScoreboard: false }))
  const response = await fetch(`https://pintia.cn/api/competitions/${id}/xcpc-rankings/public?filter=${filter}`, {
    signal: AbortSignal.timeout(30000),
    headers: {
      Accept: 'application/json;charset=UTF-8',
      'Accept-Language': 'zh-CN',
      Referer: rankingUrl(id),
      'X-Lollipop': '9298cc1a3bcac2a456945faf693e3f26',
      'X-Marshmallow': '',
    },
  })
  if (!response.ok) throw new Error(`${id} 榜单请求失败：HTTP ${response.status}`)
  const payload = await response.json()
  const rankings = payload?.xcpcRankings?.rankings
  const info = payload?.competitionBasicInfo
  if (!Array.isArray(rankings) || !rankings.length || !info?.name || !Number.isFinite(Date.parse(info.endAt))) {
    throw new Error(`${id} 榜单格式无效或为空，保留原快照`)
  }
  const ids = new Set()
  let previousRank = 0
  const teams = rankings.filter((row) => row.teamInfo?.excluded === false).map((row) => {
    const school = row.teamInfo.schoolName?.trim()
    if (!school || !row.teamFid || ids.has(row.teamFid)
      || !Number.isInteger(row.rank) || row.rank < 1 || row.rank < previousRank
      || !Number.isInteger(row.schoolRank) || row.schoolRank < 1
      || !Number.isInteger(row.solvedCount) || row.solvedCount < 0
      || !Number.isFinite(row.solvingTime) || row.solvingTime < 0) {
      throw new Error(`${id} 存在无效或重复的正式队伍数据，保留原快照`)
    }
    ids.add(row.teamFid)
    previousRank = row.rank
    // 只保存计算和展示所需数据，不保存队员姓名。
    return { id: String(row.teamFid), school, name: row.teamInfo.teamName || '', rank: row.rank,
      schoolRank: row.schoolRank, solved: row.solvedCount, penalty: row.solvingTime }
  })
  if (!teams.length) throw new Error(`${id} 无正式队伍，保留原快照`)
  return {
    meta: { name: info.name, url: rankingUrl(id), startAt: info.startAt, endAt: info.endAt,
      freezeAt: info.freezeAt || null, excludedTeams: rankings.length - teams.length },
    teams,
  }
}

try {
  const [network, final] = await Promise.all([fetchRanking(NETWORK_ID), fetchRanking(FINAL_ID)])
  const schools = new Map()
  for (const team of final.teams) {
    if (!schools.has(team.school)) schools.set(team.school, { school: team.school, rank: team.schoolRank })
  }
  const finalSchools = [...schools.values()]
  const finalReward = finalSchools.reduce((sum, row) => sum + (row.rank <= 10 ? 4 : row.rank <= 30 ? 3 : row.rank <= 60 ? 2 : 1), 0)
  if (finalSchools.length !== 107 || finalReward !== 207) {
    throw new Error(`总决赛校数或奖励与规则不符：${finalSchools.length} 校 / ${finalReward} 个，请核查榜单；保留原快照`)
  }
  const snapshot = {
    meta: { generatedAt: new Date().toISOString(), network: network.meta, final: final.meta,
      finalSourceUrl: 'https://rl.algoux.cn/collection/official?rankId=ccpc2025final',
      rulesPdf: '/assets/ccpc-rules/2026-quota-v1.pdf' },
    teams: network.teams,
    finalSchools,
  }
  const target = fileURLToPath(new URL('../src/modules/ccpc-data.json', import.meta.url))
  const temporary = `${target}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' })
  await rename(temporary, target)
  console.log(`CCPC 快照已更新：${network.teams.length} 支正式队伍，${new Set(network.teams.map((team) => team.school)).size} 所网赛学校，总决赛奖励 ${finalReward} 个。`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
