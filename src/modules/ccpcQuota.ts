export type NetworkTeam = {
  id: string
  school: string
  name: string
  rank: number
  schoolRank: number
  solved: number
  penalty: number
}

export type FinalSchool = { school: string; rank: number }
export type HostReward = { school: string; event: string; role: string; amount: number }
export type QuotaSchool = {
  school: string
  networkRank: number | null
  networkOrder: number | null
  firstRoundOrder: number | null
  finalRank: number | null
  finalReward: number
  hostReward: number
  hostReasons: HostReward[]
  rewardTotal: number
  teamCount: number
  effectiveLimit: number
  validTeamCount: number
  effectiveTeams: (NetworkTeam & { effectiveOrder: number; withinCutoff: boolean; allocated: boolean })[]
  firstRound: number
  secondRoundRaw: number
  secondRound: number
  preliminary: number
  total: number
}

export const QUOTA_POOLS = [
  { key: 'preliminary', label: '预选赛分配名额', budget: 566, counted: true },
  { key: 'finalReward', label: '2025 总决赛奖励', budget: 207, counted: true },
  { key: 'hostReward', label: '2026 年赛事承办奖励', budget: 91, counted: true },
  { key: 'provincialReward', label: '2026 年省赛、邀请赛奖励', budget: 256, counted: false },
  { key: 'wildcard', label: '2026 年外卡', budget: 60, counted: false },
] as const

export const finalRewardFor = (rank: number) => rank <= 10 ? 4 : rank <= 30 ? 3 : rank <= 60 ? 2 : 1
const sameScore = (a: NetworkTeam, b: NetworkTeam) => a.solved === b.solved && a.penalty === b.penalty

export function buildCcpcHostRewards(schedule: { category: string; venue: string; organizer: string; problemSetter?: string }[]): HostReward[] {
  const rewards: HostReward[] = []
  const add = (names: string | undefined, event: string, role: string, budget: number) => {
    if (!names || names === '线上') return
    const schools = [...new Set(names.split('、').map((name) => name.trim()).filter(Boolean))]
    if (!schools.length || budget % schools.length !== 0) throw new Error(`${event}${role}名额无法均分，请核对名单`)
    for (const school of schools) rewards.push({ school, event,
      role: schools.length > 1 ? `${role}（共 ${budget} 个，${schools.length} 校均分）` : role,
      amount: budget / schools.length })
  }
  for (const row of schedule.filter((row) => row.category === 'CCPC')) {
    if (['长春', '荆州', '乐山', '厦门'].includes(row.venue)) {
      // 荆州站虽由两校联合举办，承办奖励明确全部分配给长江大学。
      add(row.venue === '荆州' ? '长江大学' : row.organizer, `${row.venue}站`, '承办', 8)
      add(row.problemSetter, `${row.venue}站`, '出题', 8)
    } else if (row.venue === '女生赛') {
      add(row.organizer, '女生专场', '承办', 5)
      add(row.problemSetter, '女生、高职专场', '合并出题', 6)
    } else if (row.venue === '网络赛') {
      add(row.problemSetter, '网络预选赛', '出题', 6)
    } else if (row.venue === '高职赛') {
      add(row.organizer, '高职专场', '承办', 3)
    }
  }
  add('南阳理工学院', '2025 总决赛', '承办', 4)
  return rewards
}

// 输入为源榜顺序的正式队伍；并列截线暂按源榜顺序取满固定容量，不额外扩容。
export function calculateCcpcQuota(teams: NetworkTeam[], finalists: FinalSchool[], hostRewards: HostReward[] = []) {
  const schools = new Map<string, QuotaSchool>()
  const getSchool = (school: string) => {
    let entry = schools.get(school)
    if (!entry) {
      entry = {
        school, networkRank: null, networkOrder: null, firstRoundOrder: null, finalRank: null, finalReward: 0,
        hostReward: 0, hostReasons: [], rewardTotal: 0,
        teamCount: 0, effectiveLimit: 6, validTeamCount: 0, effectiveTeams: [], firstRound: 0,
        secondRoundRaw: 0, secondRound: 0, preliminary: 0, total: 0,
      }
      schools.set(school, entry)
    }
    return entry
  }
  for (const finalist of finalists) {
    const entry = getSchool(finalist.school)
    entry.finalRank = finalist.rank
    entry.finalReward = finalRewardFor(finalist.rank)
  }
  for (const reward of hostRewards) {
    if (!reward.school.trim() || !Number.isInteger(reward.amount) || reward.amount < 0) {
      throw new Error('赛事承办奖励必须包含学校名称和非负整数名额')
    }
    const entry = getSchool(reward.school)
    entry.hostReward += reward.amount
    entry.hostReasons.push(reward)
  }
  for (const entry of schools.values()) {
    entry.rewardTotal = entry.finalReward + entry.hostReward
    entry.effectiveLimit = Math.max(0, Math.min(6, 12 - entry.rewardTotal))
  }

  let networkSchoolCount = 0
  const schoolLeaders: NetworkTeam[] = []
  const effectiveTeams: NetworkTeam[] = []
  for (const team of teams) {
    const entry = getSchool(team.school)
    entry.teamCount += 1
    if (entry.networkOrder === null) {
      entry.networkOrder = ++networkSchoolCount
      entry.networkRank = team.schoolRank
      if (entry.effectiveLimit > 0) {
        schoolLeaders.push(team)
        entry.firstRoundOrder = schoolLeaders.length
        entry.firstRound = entry.firstRoundOrder <= 240 ? 1 : 0
      }
    }
    if (entry.validTeamCount < entry.effectiveLimit) {
      entry.validTeamCount += 1
      if (entry.rewardTotal + entry.firstRound < 12) effectiveTeams.push(team)
    }
  }
  effectiveTeams.forEach((team, index) => {
    const entry = getSchool(team.school)
    const withinCutoff = index < 326
    if (withinCutoff) entry.secondRoundRaw += 1
    const allocated = withinCutoff && entry.rewardTotal + entry.firstRound + entry.secondRound < 12
    if (allocated) entry.secondRound += 1
    entry.effectiveTeams.push({ ...team, effectiveOrder: index + 1, withinCutoff, allocated })
  })
  for (const entry of schools.values()) {
    entry.preliminary = entry.firstRound + entry.secondRound
    entry.total = entry.preliminary + entry.rewardTotal
  }
  const rows = [...schools.values()]
  return {
    schools: rows,
    firstRound: rows.reduce((sum, row) => sum + row.firstRound, 0),
    secondRound: rows.reduce((sum, row) => sum + row.secondRound, 0),
    finalReward: rows.reduce((sum, row) => sum + row.finalReward, 0),
    hostReward: rows.reduce((sum, row) => sum + row.hostReward, 0),
    cappedQuota: rows.reduce((sum, row) => sum + row.secondRoundRaw - row.secondRound, 0),
    effectiveTeamCount: effectiveTeams.length,
    firstRoundTied: schoolLeaders.length > 240 && sameScore(schoolLeaders[239], schoolLeaders[240]),
    secondRoundTied: effectiveTeams.length > 326 && sameScore(effectiveTeams[325], effectiveTeams[326]),
  }
}
