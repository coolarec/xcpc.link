import { schoolIdFor, type SchoolFacts } from './schools.ts'

export const stationKeys = ['xian', 'chengdu', 'wuhan', 'nanjing', 'shenyang', 'shanghai', 'nanchang'] as const
export type StationKey = (typeof stationKeys)[number]

export type StationDefinition = {
  key: StationKey
  name: string
  rule: string
  pdf: string
}

export type QuotaItem = {
  ruleId: string
  matched: boolean
  /** The contribution before the limits below are applied. */
  amount: number
  text: string
}

export type QuotaLimit = {
  ruleId: string
  before: number
  after: number
  text: string
}

export type QuotaResult = {
  items: QuotaItem[]
  limits: QuotaLimit[]
  rawTotal: number
  cap: number
  total: number
}

export type CalculatedSchool = SchoolFacts & {
  quotas: Record<StationKey, QuotaResult>
  allocations: Record<StationKey, number>
  total: number
}

export type QuotaMeta = {
  specialSchools: {
    worldFinalists2024: readonly string[]
    worldFinalists2025: readonly string[]
    worldFinalists2026: readonly string[]
    ecHosts2026: readonly string[]
    ecHosts2025: readonly string[]
    ecfHosts50: readonly string[]
    networkSetter: string
    stationHosts: { shanghai: string }
    shanghaiSchools: readonly string[]
  }
  invitationSchools: {
    xianTop100: readonly string[]
    wuhanTop60: readonly string[]
    nanchangSilver: Readonly<Record<string, number>>
  }
}

type StationRule = {
  networkBands: readonly (readonly [through: number, amount: number])[]
  networkLabel: string
  finalistLabel: string
  hostLabel: string
  setterLabel: string
  uncounted: readonly (readonly [ruleId: string, text: string])[]
}

// Only ordinary differences belong in this table. Group limits and reward
// exceptions remain explicit below so their order is visible when reviewing.
const stationRules: Record<StationKey, StationRule> = {
  xian: {
    networkBands: [[80, 2], [150, 1]],
    networkLabel: '第 1 条（网络预选赛）',
    finalistLabel: '第 3(1) 条（近届 WF）',
    hostLabel: '第 3(2) 条（承办高校）',
    setterLabel: '第 3(2) 条（命题高校）',
    uncounted: [
      ['recommendation', '第 4 条（专属省赛/区域高校推荐）：需要专属省赛或相关高校联系组委会推荐，当前不作推测。'],
      ['remaining', '第 6 条（剩余名额/打星）：规则要求赛后按成绩补发或申请，当前不作推测。'],
    ],
  },
  chengdu: {
    networkBands: [[160, 1]],
    networkLabel: '第 1 条（网络预选赛）',
    finalistLabel: '第 3 条（近届 WF）',
    hostLabel: '第 4 条（承办高校）',
    setterLabel: '第 4 条（命题高校）',
    uncounted: [
      ['province', '第 5 条（四川省贡献名额）：需要申请或由组委会另行分配，当前不作推测。'],
      ['remaining', '剩余名额：规则要求赛后开放申请，当前不作推测。'],
    ],
  },
  wuhan: {
    networkBands: [[80, 2], [180, 1]],
    networkLabel: '第 1 条（网络预选赛）',
    finalistLabel: '第 3 条（近届 WF）',
    hostLabel: '第 2 条（主办高校）',
    setterLabel: '第 2 条（命题高校）',
    uncounted: [
      ['province', '第 5 条（湖北省/武汉大学活动贡献）：需要报名后申请剩余正式名额，当前不作推测。'],
      ['unofficial', '第 6 条（打星名额）：非正式参赛名额，规则未给出学校确定性条件。'],
    ],
  },
  nanjing: {
    networkBands: [[160, 1]],
    networkLabel: '第 1 条（网络预选赛）',
    finalistLabel: '第 3 条（近届 WF）',
    hostLabel: '第 4 条（承办高校）',
    setterLabel: '第 4 条（命题高校）',
    uncounted: [
      ['overseas', '第 5 条（非中国大陆高校）：该类名额需要申请，当前不作地域归属推测。'],
      ['province', '第 6 条（江苏省赛/南航活动贡献）：需要申请或由组委会分配，当前不作推测。'],
      ['remaining', '剩余名额：规则要求赛后开放申请，当前不作推测。'],
    ],
  },
  shenyang: {
    networkBands: [[100, 2], [220, 1]],
    networkLabel: '网络赛名额 1a/1b',
    finalistLabel: '贡献名额 2a（近届 WF）',
    hostLabel: '贡献名额 2b（承办高校）',
    setterLabel: '贡献名额 2b（命题高校）',
    uncounted: [
      ['women', '女队名额 3：需要学校申请，且不计入本站高校正式队伍上限，当前不作推测。'],
      ['province', '省内贡献名额 4：需要申请或由组委会另行分配，当前不作推测。'],
      ['remaining', '剩余名额/打星队伍：规则要求报名指南或赛站条件允许后申请，当前不作推测。'],
    ],
  },
  shanghai: {
    networkBands: [[50, 2], [200, 1]],
    networkLabel: '正式名额 1(1)/1(2)（网络预选赛）',
    finalistLabel: '奖励和外卡 2(1)（近届 WF）',
    hostLabel: '奖励和外卡 2(2)（承办高校）',
    setterLabel: '奖励和外卡 2(2)（命题高校）',
    uncounted: [
      ['overseas', '奖励和外卡 2(3)：非中国大陆高校外卡需要申请，当前不作地域归属推测。'],
      ['province', '奖励和外卡 2(4)：上海市赛帮助外卡需要申请，当前不作推测。'],
      ['remaining', '奖励和外卡 2(5)：剩余名额作为外卡并由高校申请、组委会审核，当前不作推测。'],
      ['unofficial', '打星队伍：需要申请并经组委会审核，不计入正式名额。'],
      ['interpretation', '相关说明：未列事项由上海站组委会解释，页面不据此新增名额。'],
    ],
  },
  nanchang: {
    networkBands: [[60, 2], [160, 1]],
    networkLabel: '具体分发 1（网络预选赛）',
    finalistLabel: '具体分发 3(1)（近届 WF）',
    hostLabel: '具体分发 3(2)（承办高校）',
    setterLabel: '具体分发 3(2)（命题高校）',
    uncounted: [
      ['support', '具体分发 4（支持与激励）：规则 1–3 发放后如有剩余，可联系组委会申请，当前不作推测。'],
      ['remaining', '其他说明 2（空余名额）：按网络预选赛和邀请赛成绩优先补发给尚未获得名额的高校，当前不作推测。'],
    ],
  },
}

const award = (ruleId: string, label: string, amount: number, hit: string, miss: string): QuotaItem => ({
  ruleId,
  matched: amount > 0,
  amount,
  text: `${label}：${amount > 0 ? `${hit}，原始计入 ${amount} 个名额。` : miss}`,
})

const networkAward = (school: SchoolFacts, rule: StationRule) => {
  const rank = school.rank
  const band = rank !== null && Number.isInteger(rank) && rank > 0
    ? rule.networkBands.find(([through]) => rank <= through)
    : undefined
  const lastRank = rule.networkBands[rule.networkBands.length - 1][0]
  return award('network', rule.networkLabel, band?.[1] ?? 0,
    `网络预选赛校排 ${rank}，符合前 ${band?.[0]} 名条件`,
    rank === null ? '没有网络预选赛校排名，未获得该条名额。' : `校排 ${rank} 不在前 ${lastRank}，未获得该条名额。`)
}

export const createQuotaCalculator = (meta: QuotaMeta) => {
  const special = meta.specialSchools
  const invitation = meta.invitationSchools
  const ids = (names: readonly string[]) => new Set(names.map(schoolIdFor))
  const recentFinalists = ids([...special.worldFinalists2025, ...special.worldFinalists2026])
  const allFinalists = ids([...special.worldFinalists2024, ...recentFinalists])
  const hosts = ids(special.ecHosts2026)
  const previousHosts = ids([...special.ecHosts2025, ...special.ecfHosts50])
  const setters = ids(special.networkSetter.split('、').filter(Boolean))
  const coHosts = ids(special.ecfHosts50)
  const shanghaiSchools = ids(special.shanghaiSchools)
  const xianInvited = ids(invitation.xianTop100)
  const wuhanInvited = ids(invitation.wuhanTop60)
  const nanchangSilver = new Map<string, number>()
  for (const [name, count] of Object.entries(invitation.nanchangSilver)) {
    const id = schoolIdFor(name)
    nanchangSilver.set(id, Math.max(nanchangSilver.get(id) ?? 0, count))
  }

  return (school: SchoolFacts): CalculatedSchool => {
    const belongsTo = (list: ReadonlySet<string>) => list.has(school.schoolId)
    const host = belongsTo(hosts)
    const previousHost = belongsTo(previousHosts)
    const setter = belongsTo(setters)
    const shanghai = belongsTo(shanghaiSchools)
    const hostYears = host && previousHost ? '第 50、51 届' : previousHost ? '第 50 届' : '第 51 届'
    const silverTeams = nanchangSilver.get(school.schoolId) ?? 0

    const calculateStation = (key: StationKey): QuotaResult => {
      const rule = stationRules[key]
      const isFinalist = belongsTo(key === 'xian' ? recentFinalists : allFinalists)
      const hostExcluded = key === 'shanghai' && school.schoolId === schoolIdFor(special.stationHosts.shanghai)
      const hostApplies = !hostExcluded && (host || (previousHost && (key === 'nanjing' || key === 'shanghai')))
      // Wuhan shares the two host places between the two ECF co-hosts.
      const hostAmount = hostApplies ? key === 'wuhan' && belongsTo(coHosts) ? 1 : 2 : 0
      const hostReason = hostAmount === 1
        ? '共同承办 ECF，按武汉站“共同主办方平分 2 个”'
        : key === 'nanjing' || key === 'shanghai'
          ? `属于${hostYears}承办高校`
          : '属于第 51 届网络预选赛/亚洲区域赛/决赛承办高校'
      const finalistYears = key === 'xian' ? '2025、2026 年' : '第 48–50 届'
      const items: QuotaItem[] = [networkAward(school, rule)]

      if (key === 'chengdu' || key === 'nanjing') {
        items.push(award('top500', '第 2 条（前 500 队伍）', school.top500Teams >= 3 ? 1 : 0,
          `同一场网络预选赛前 500 队中本校有 ${school.top500Teams} 队，达到 ≥ 3 队`,
          `同一场网络预选赛前 500 队中本校有 ${school.top500Teams} 队，未达到 ≥ 3 队。`))
      }
      if (key === 'xian') {
        items.push(award('invitation', '第 2 条（西安邀请赛）', belongsTo(xianInvited) ? 1 : 0,
          '符合西安邀请赛正式队伍校排前 100', '不在西安邀请赛正式队伍校排前 100。'))
      } else if (key === 'wuhan') {
        items.push(award('invitation', '第 4 条（武汉邀请赛）', belongsTo(wuhanInvited) ? 1 : 0,
          '符合武汉邀请赛正式队伍校排前 60', '不在武汉邀请赛校排前 60。'))
      } else if (key === 'nanchang') {
        items.push(award('invitation', '具体分发 2（南昌邀请赛）', silverTeams > 0 ? 1 : 0,
          `本校有 ${silverTeams} 队获得银牌及以上，按每高校计`, '不在南昌邀请赛银牌及以上高校名单。'))
      }
      items.push(
        award('finalist', rule.finalistLabel, isFinalist ? 1 : 0,
          `属于已核实的${finalistYears}世界总决赛高校名单`, `不属于${finalistYears}世界总决赛高校名单。`),
        award('host', rule.hostLabel, hostAmount, hostReason,
          hostExcluded ? '本校为上海站承办高校，PDF 明确“除本校外”，不计承办奖励。' : '不属于该条适用的承办高校名单。'),
        award('setter', rule.setterLabel, setter ? 2 : 0,
          '属于已公开核实的第 51 届网络预选赛命题高校', '不属于已公开核实的命题高校名单。'),
        ...rule.uncounted.map(([ruleId, text]) => ({ ruleId, text, matched: false, amount: 0 })),
      )

      const rawTotal = items.reduce((sum, item) => sum + item.amount, 0)
      const limits: QuotaLimit[] = []
      let beforeSchoolCap = rawTotal
      if (key === 'xian') {
        // Apply the special-reward group cap before the overall school cap;
        // network places must never be consumed by this group limit.
        const before = items.filter((item) => ['invitation', 'finalist', 'host', 'setter'].includes(item.ruleId))
          .reduce((sum, item) => sum + item.amount, 0)
        const after = Math.min(before, 2)
        limits.push({
          ruleId: 'special-cap', before, after,
          text: `规则 5(2) 限额：邀请赛、专属省赛与 EC 贡献/支持名额原始合计 ${before} 个，按 PDF 原则不超过 2 个，实际计入 ${after} 个。`,
        })
        beforeSchoolCap -= before - after
      }

      const cap = key === 'chengdu' || key === 'nanjing'
        ? 4
        : (key === 'shanghai' ? shanghai || host || setter : isFinalist || host || setter) ? 4 : 3
      const total = Math.min(beforeSchoolCap, cap)
      const capBasis = key === 'chengdu' || key === 'nanjing'
        ? '所有高校上限 4 个。'
        : key === 'shanghai'
          ? shanghai ? '本校为上海市高校，上限 4 个。' : host || setter ? '第 51 届承办或命题高校上限 4 个。' : '一般高校上限 3 个。'
          : isFinalist || host || setter ? '适用 WF/第 51 届承办/命题高校上限 4 个。' : '一般高校上限 3 个。'
      const capLabel = key === 'xian' ? '规则 5(1) 高校上限' : key === 'shanghai' ? '正式队伍限额 3' : key === 'nanchang' ? '其他说明 1（高校上限）' : '高校上限'
      limits.push({
        ruleId: 'school-cap', before: beforeSchoolCap, after: total,
        text: `${capLabel}：${key === 'xian' ? '前述限额处理后' : '原始'}累计 ${beforeSchoolCap} 个，${beforeSchoolCap > cap ? '超过' : '未超过'}高校上限 ${cap} 个，实际计入 ${total} 个。${capBasis}`,
      })
      return { items, limits, rawTotal, cap, total }
    }

    const quotas = Object.fromEntries(stationKeys.map((key) => [key, calculateStation(key)])) as Record<StationKey, QuotaResult>
    const allocations = Object.fromEntries(stationKeys.map((key) => [key, quotas[key].total])) as Record<StationKey, number>
    const total = stationKeys.reduce((sum, key) => sum + allocations[key], 0)
    return { ...school, quotas, allocations, total }
  }
}
