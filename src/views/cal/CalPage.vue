<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ExternalLink, FileText, Search, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { useThemeStore } from '../../stores/theme'
import data from '../../modules/cal-data.json'

type StationKey = 'xian' | 'chengdu' | 'wuhan' | 'nanjing' | 'shenyang' | 'shanghai' | 'nanchang'
type RawSchool = (typeof data.schools)[number]
type SchoolFlags = {
  worldFinalist: boolean
  host: boolean
  host50: boolean
  setter: boolean
  shanghai: boolean
  xianInvitation: boolean
  wuhanInvitation: boolean
  nanchangSilver: number
}
type AllocationMap = Record<StationKey, number>
type RuleReason = { text: string; matched: boolean }
type CalculatedSchool = RawSchool & {
  flags: SchoolFlags
  allocations: AllocationMap
  rawAllocations: AllocationMap
  caps: AllocationMap
  total: number
}
type Station = (typeof data.meta.stations)[number] & { key: StationKey }

const themeStore = useThemeStore()
const stations = data.meta.stations as Station[]
const stationKeys: StationKey[] = ['xian', 'chengdu', 'wuhan', 'nanjing', 'shenyang', 'shanghai', 'nanchang']
type SortKey = 'rank' | 'round1Rank' | 'round2Rank' | 'total'
const search = ref('')
const sortKey = ref<SortKey>('total')
const selected = ref<{ school: CalculatedSchool; station: Station } | null>(null)
const showScope = ref(false)
const rankingTable = ref<HTMLTableElement | null>(null)
let headerFrame = 0
let tableObserver: ResizeObserver | undefined
const schools = data.schools
const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'rank', label: '总校排' },
  { key: 'round1Rank', label: '网络赛 1' },
  { key: 'round2Rank', label: '网络赛 2' },
  { key: 'total', label: '总名额' },
]
const specialSchoolLists = [
  { title: '晋级2024年世界总决赛的高校（第 48 届）', schools: data.meta.specialSchools.worldFinalists2024 },
  { title: '晋级2025年世界总决赛的高校（第 49 届）', schools: data.meta.specialSchools.worldFinalists2025 },
  { title: '晋级2026年世界总决赛的高校（第 50 届）', schools: data.meta.specialSchools.worldFinalists2026 },
  { title: '2026年亚洲区域赛EC承办高校', schools: data.meta.specialSchools.ecHosts2026 },
  { title: '2025年亚洲区域赛EC承办高校', schools: data.meta.specialSchools.ecHosts2025 },
]

const worldFinalistsXian = new Set([
  ...data.meta.specialSchools.worldFinalists2025,
  ...data.meta.specialSchools.worldFinalists2026,
])
const worldFinalistsOther = new Set([
  ...data.meta.specialSchools.worldFinalists2024,
  ...data.meta.specialSchools.worldFinalists2025,
  ...data.meta.specialSchools.worldFinalists2026,
])
const isWorldFinalist = (school: string, key: StationKey) =>
  (key === 'xian' ? worldFinalistsXian : worldFinalistsOther).has(school)
// 第 51 届：西安 PDF 公布的 2026 年亚洲区域赛 EC 承办高校完整名单（含网络预选赛、香港站、ECF）。
// 第 50 届：仅南京、上海奖励；名单含 2025 EC 承办高校，以及第 50 届 ECF 联合承办的浙江大学。
const hosts2026 = new Set(data.meta.specialSchools.ecHosts2026)
const hosts2025 = new Set([
  ...data.meta.specialSchools.ecHosts2025,
  ...data.meta.specialSchools.ecfHosts50,
])
const networkSetters = new Set(data.meta.specialSchools.networkSetter.split('、'))
const xianInvitationSchools = new Set(data.meta.invitationSchools.xianTop100)
const wuhanInvitationSchools = new Set(data.meta.invitationSchools.wuhanTop60)
const nanchangSilverSchools = data.meta.invitationSchools.nanchangSilver
const shanghaiHost = data.meta.specialSchools.stationHosts.shanghai
const shanghaiSchools = new Set(data.meta.specialSchools.shanghaiSchools)
const ecfCoHosts = new Set(data.meta.specialSchools.ecfHosts50)

const flagsFor = (school: RawSchool): SchoolFlags => ({
  worldFinalist: worldFinalistsOther.has(school.school),
  host: hosts2026.has(school.school),
  host50: hosts2025.has(school.school),
  setter: networkSetters.has(school.school),
  shanghai: shanghaiSchools.has(school.school),
  xianInvitation: xianInvitationSchools.has(school.school),
  wuhanInvitation: wuhanInvitationSchools.has(school.school),
  nanchangSilver: nanchangSilverSchools[school.school as keyof typeof nanchangSilverSchools] ?? 0,
})

const hostRewardApplies = (school: { school: string }, flags: Pick<SchoolFlags, 'host' | 'host50'>, key: StationKey) => {
  if (key === 'shanghai' && school.school === shanghaiHost) return false
  if (flags.host) return true
  return Boolean(flags.host50 && (key === 'nanjing' || key === 'shanghai'))
}

const hostRewardAmount = (school: { school: string }, flags: Pick<SchoolFlags, 'host' | 'host50'>, key: StationKey) => {
  if (!hostRewardApplies(school, flags, key)) return 0
  if (key === 'wuhan' && ecfCoHosts.has(school.school)) return 1
  return 2
}

const hostYearText = (flags: Pick<SchoolFlags, 'host' | 'host50'>) => {
  if (flags.host && flags.host50) return '第 50、51 届'
  if (flags.host50) return '第 50 届'
  return '第 51 届'
}

const capFor = (schoolName: string, flags: Pick<SchoolFlags, 'host' | 'setter' | 'shanghai'>, key: StationKey) => {
  if (key === 'chengdu' || key === 'nanjing') return 4
  if (key === 'shanghai') return flags.host || flags.setter || flags.shanghai ? 4 : 3
  return isWorldFinalist(schoolName, key) || flags.host || flags.setter ? 4 : 3
}

const hostSetterHit = (flags: SchoolFlags, hostApplies: boolean, hostLabel: string, amount = 2) => {
  const parts: string[] = []
  if (hostApplies) parts.push(`${hostLabel} +${amount}`)
  if (flags.setter) parts.push('命题高校 +2')
  return `${parts.join('、')}。`
}

const calculateSchool = (school: RawSchool): CalculatedSchool => {
  const flags = flagsFor(school)
  const rank = school.rank
  const rawAllocations = stationKeys.reduce((result, key) => {
    let amount = 0
    const hostReward = hostRewardAmount(school, flags, key)
    const contributionReward = (isWorldFinalist(school.school, key) ? 1 : 0) + hostReward + (flags.setter ? 2 : 0)

    if (key === 'xian') {
      if (rank <= 80) amount += 2
      else if (rank <= 150) amount += 1
      // 西安规则 5(2)：全国邀请赛、专属省赛、EC 贡献/支持名额合计原则上不超过 2 个。
      amount += Math.min((flags.xianInvitation ? 1 : 0) + contributionReward, 2)
    } else if (key === 'chengdu') {
      if (rank <= 160) amount += 1
      if (school.top500Teams >= 3) amount += 1
      amount += contributionReward
    } else if (key === 'wuhan') {
      if (rank <= 80) amount += 2
      else if (rank <= 180) amount += 1
      if (flags.wuhanInvitation) amount += 1
      amount += contributionReward
    } else if (key === 'nanjing') {
      if (rank <= 160) amount += 1
      if (school.top500Teams >= 3) amount += 1
      amount += contributionReward
    } else if (key === 'shenyang') {
      if (rank <= 100) amount += 2
      else if (rank <= 220) amount += 1
      amount += contributionReward
    } else if (key === 'shanghai') {
      if (rank <= 50) amount += 2
      else if (rank <= 200) amount += 1
      amount += contributionReward
    } else if (key === 'nanchang') {
      if (rank <= 60) amount += 2
      else if (rank <= 160) amount += 1
      if (flags.nanchangSilver > 0) amount += 1
      amount += contributionReward
    }
    result[key] = amount
    return result
  }, {} as AllocationMap)
  const caps = stationKeys.reduce((result, key) => {
    result[key] = capFor(school.school, flags, key)
    return result
  }, {} as AllocationMap)
  const allocations = stationKeys.reduce((result, key) => {
    result[key] = Math.min(rawAllocations[key], caps[key])
    return result
  }, {} as AllocationMap)
  const total = stationKeys.reduce((sum, key) => sum + allocations[key], 0)

  return { ...school, flags, rawAllocations, allocations, caps, total }
}

const rankValue = (rank: number | null | undefined) => rank ?? Number.POSITIVE_INFINITY

const calculatedSchools = computed(() => {
  const rankedSchools = schools.map(calculateSchool)
  const key = sortKey.value
  return rankedSchools.sort((a, b) => {
    if (key === 'total') return b.total - a.total || a.rank - b.rank
    if (key === 'rank') return a.rank - b.rank
    if (key === 'round1Rank') return rankValue(a.round1Rank) - rankValue(b.round1Rank) || a.rank - b.rank
    return rankValue(a.round2Rank) - rankValue(b.round2Rank) || a.rank - b.rank
  })
})

const filteredSchools = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return calculatedSchools.value
  return calculatedSchools.value.filter((school) => school.school.toLowerCase().includes(keyword))
})

const totalQuota = computed(() => calculatedSchools.value.reduce((sum, school) => sum + school.total, 0))

const stationName = (key: StationKey) => stations.find((station) => station.key === key)?.name ?? key

const invitationBoardUrl = (key: StationKey) => {
  const rankId = key === 'xian'
    ? 'icpc2026invitational-xi_an'
    : key === 'wuhan'
      ? 'icpc2026invitational-wuhan'
      : key === 'nanchang'
        ? 'icpc2026invitational-nanchang'
        : ''
  return rankId ? `https://rl.algoux.cn/collection/official?rankId=${rankId}` : ''
}

const legacyReasonsFor = (school: CalculatedSchool, station: Station) => {
  const key = station.key
  const rank = school.rank
  const reasons: string[] = []

  if (key === 'xian') {
    if (rank <= 80) reasons.push(`第 1 条：网络预选赛学校排名 ${rank} ≤ 80，获得 2 个名额。`)
    else if (rank <= 150) reasons.push(`第 1 条：网络预选赛学校排名 ${rank} 位于 81–150，获得 1 个名额。`)
    if (school.flags.xianInvitation) reasons.push('第 2 条：西安邀请赛（陕西）正式队伍校排前 100，获得 1 个名额。')
  } else if (key === 'chengdu') {
    if (rank <= 160) reasons.push(`第 1 条：网络预选赛学校排名 ${rank} ≤ 160，获得 1 个名额。`)
    if (school.top500Teams >= 3) reasons.push(`第 2 条：网络预选赛前 500 队中本校有 ${school.top500Teams} 队，达到 ≥ 3 队，获得 1 个名额。`)
  } else if (key === 'wuhan') {
    if (rank <= 80) reasons.push(`第 1 条：网络预选赛学校排名 ${rank} ≤ 80，获得 2 个名额。`)
    else if (rank <= 180) reasons.push(`第 1 条：网络预选赛学校排名 ${rank} 位于 81–180，获得 1 个名额。`)
    if (school.flags.wuhanInvitation) reasons.push('第 4 条：2026 武汉邀请赛校排前 60，获得 1 个名额。')
  } else if (key === 'nanjing') {
    if (rank <= 160) reasons.push(`第 1 条：网络预选赛学校排名 ${rank} ≤ 160，获得 1 个名额。`)
    if (school.top500Teams >= 3) reasons.push(`第 2 条：网络预选赛前 500 队中本校有 ${school.top500Teams} 队，达到 ≥ 3 队，获得 1 个名额。`)
  } else if (key === 'shenyang') {
    if (rank <= 100) reasons.push(`网络赛名额 1a：网络预选赛学校排名 ${rank} ≤ 100，获得 2 个名额。`)
    else if (rank <= 220) reasons.push(`网络赛名额 1b：网络预选赛学校排名 ${rank} 位于 101–220，获得 1 个名额。`)
  } else if (key === 'shanghai') {
    if (rank <= 50) reasons.push(`正式名额 1(1)：网络预选赛学校排名 ${rank} ≤ 50，获得 2 个名额。`)
    else if (rank <= 200) reasons.push(`正式名额 1(2)：网络预选赛学校排名 ${rank} 位于 51–200，获得 1 个名额。`)
  } else if (key === 'nanchang') {
    if (rank <= 60) reasons.push(`具体分发 1：网络预选赛学校排名 ${rank} ≤ 60，获得 2 个名额。`)
    else if (rank <= 160) reasons.push(`具体分发 1：网络预选赛学校排名 ${rank} 位于 61–160，获得 1 个名额。`)
    if (school.flags.nanchangSilver) reasons.push(`具体分发 2：南昌邀请赛本校有 ${school.flags.nanchangSilver} 队获得银牌及以上，按“每高校”计 1 个名额。`)
  }

  const contributionClause: Record<StationKey, string> = {
    xian: '第 3 条',
    chengdu: '第 3 条',
    wuhan: '第 3 条',
    nanjing: '第 3 条',
    shenyang: '贡献名额 2a',
    shanghai: '奖励和外卡 2(1)',
    nanchang: '具体分发 3(1)',
  }
  const hostClause: Record<StationKey, string> = {
    xian: '第 3 条',
    chengdu: '第 4 条',
    wuhan: '第 2 条',
    nanjing: '第 4 条',
    shenyang: '贡献名额 2b',
    shanghai: '奖励和外卡 2(2)',
    nanchang: '具体分发 3(2)',
  }
  if (isWorldFinalist(school.school, key)) reasons.push(`${contributionClause[key]}：PDF 明列的近届 ICPC 世界总决赛高校，获得 1 个名额。`)
  if (hostRewardApplies(school, school.flags, key)) reasons.push(`${hostClause[key]}：属于${key === 'nanjing' || key === 'shanghai' ? hostYearText(school.flags) : ' 2026 年亚洲区域赛 EC '}承办高校，获得 2 个名额。`)
  if (school.flags.setter) reasons.push(`${hostClause[key]}：PDF 明列的网络预选赛命题高校，获得 2 个名额。`)

  if (!reasons.length) reasons.push('未符合本页已整理的公开、确定性分配条款。')
  if (school.rawAllocations[key] > school.allocations[key]) {
    reasons.push(`上限说明：原始累计 ${school.rawAllocations[key]} 个，按该站高校上限 ${school.caps[key]} 个截取，实际计入 ${school.allocations[key]} 个。`)
  }
  return reasons
}

const ruleLine = (label: string, matched: boolean, hit: string, miss: string): RuleReason => ({
  matched,
  text: `${label}：${matched ? hit : miss}`,
})
const notCountedLine = (label: string, text: string): RuleReason => ({ matched: false, text: `${label}：${text}` })
const plainLine = (text: string, matched = false): RuleReason => ({ matched, text })

const reasonsFor = (school: CalculatedSchool, station: Station) => {
  const key = station.key
  const rank = school.rank
  const hostApplies = hostRewardApplies(school, school.flags, key)
  const hostAmount = hostRewardAmount(school, school.flags, key)
  const isWF = isWorldFinalist(school.school, key)
  const contributionReward = (isWF ? 1 : 0) + hostAmount + (school.flags.setter ? 2 : 0)
  const rawCap = school.rawAllocations[key]
  const cap = school.caps[key]
  const capDescription = rawCap > cap
    ? `原始累计 ${rawCap} 个，超过高校上限 ${cap} 个，实际计入 ${school.allocations[key]} 个。`
    : `原始累计 ${rawCap} 个，未超过高校上限 ${cap} 个，实际计入 ${school.allocations[key]} 个。`

  if (key === 'xian') {
    const network = rank <= 80 ? 2 : rank <= 150 ? 1 : 0
    const specialRaw = (school.flags.xianInvitation ? 1 : 0) + contributionReward
    const specialUsed = Math.min(specialRaw, 2)
    return [
      ruleLine('第 1 条（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 80，获得 2 个名额。` : `校排 ${rank} 位于 81–150，获得 1 个名额。`, `校排 ${rank} 不在前 150，未获得该条名额。`),
      ruleLine('第 2 条（西安邀请赛）', school.flags.xianInvitation, '符合正式队伍校排前 100，原始计 1 个；最终受规则 5(2)合计上限影响。', '不在西安邀请赛正式队伍校排前 100。'),
      ruleLine('第 3(1) 条（近届 WF）', isWF, '属于 PDF 明列的 2025 或 2026 年世界总决赛高校，原始计 1 个；最终受规则 5(2)合计上限影响。', '不属于西安 PDF 公布的 2025、2026 年世界总决赛高校名单。'),
      ruleLine('第 3(2) 条（承办高校）', school.flags.host, '属于 2026 年亚洲区域赛 EC 承办高校，原始计 2 个；最终受规则 5(2)合计上限影响。', '不属于 2026 年亚洲区域赛 EC 承办高校名单。'),
      ruleLine('第 3(2) 条（命题高校）', school.flags.setter, '属于已公开核实的网络预选赛命题高校，原始计 2 个；最终受规则 5(2)合计上限影响。', '不属于已公开核实的网络预选赛命题高校名单。'),
      notCountedLine('第 4 条（专属省赛/区域高校推荐）', '需要专属省赛或相关高校联系组委会推荐，当前不作推测。'),
      plainLine(`规则 5(2) 限额：邀请赛、专属省赛与 EC 贡献/支持名额原始合计 ${specialRaw} 个，按 PDF 原则不超过 2 个，实际计入 ${specialUsed} 个。`),
      plainLine(`规则 5(1) 高校上限：${capDescription}`),
      notCountedLine('第 6 条（剩余名额/打星）', '规则要求赛后按成绩补发或申请，当前不作推测。'),
    ]
  }

  if (key === 'chengdu') {
    return [
      ruleLine('第 1 条（网络预选赛）', rank <= 160, `校排 ${rank} ≤ 160，获得 1 个名额。`, `校排 ${rank} 超过 160，未获得该条名额。`),
      ruleLine('第 2 条（前 500 队伍）', school.top500Teams >= 3, `前 500 队中本校有 ${school.top500Teams} 队，达到 ≥ 3 队，获得 1 个名额。`, `前 500 队中本校有 ${school.top500Teams} 队，未达到 ≥ 3 队。`),
      ruleLine('第 3 条（近届 WF）', isWF, '属于第 48–50 届世界总决赛中国高校，获得 1 个名额。', '不属于第 48–50 届世界总决赛中国高校名单。'),
      ruleLine('第 4 条（承办/命题高校）', hostApplies || school.flags.setter, hostSetterHit(school.flags, hostApplies, '第 51 届亚洲区域赛承办高校'), '不属于第 51 届承办或命题高校名单。'),
      notCountedLine('第 5 条（四川省贡献名额）', '需要申请或由组委会另行分配，当前不作推测。'),
      notCountedLine('剩余名额', '规则要求赛后开放申请，当前不作推测。'),
      plainLine(`高校上限：${capDescription}`),
    ]
  }

  if (key === 'wuhan') {
    const network = rank <= 80 ? 2 : rank <= 180 ? 1 : 0
    return [
      ruleLine('第 1 条（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 80，获得 2 个名额。` : `校排 ${rank} 位于 81–180，获得 1 个名额。`, `校排 ${rank} 不在前 180，未获得该条名额。`),
      ruleLine('第 2 条（主办/命题高校）', hostApplies || school.flags.setter, hostAmount === 1 ? '杭州师范大学、浙江大学共同承办 ECF，按武汉站“共同主办方平分 2 个”计 1 个。' : hostSetterHit(school.flags, hostApplies, '第 51 届网络预选赛/区域赛/决赛主办方', hostAmount), '不属于第 51 届主办方或命题方高校名单。'),
      ruleLine('第 3 条（近届 WF）', isWF, '属于第 48–50 届世界总决赛中国高校，获得 1 个名额。', '不属于第 48–50 届世界总决赛中国高校名单。'),
      ruleLine('第 4 条（武汉邀请赛）', school.flags.wuhanInvitation, '正式队伍校排前 60，获得 1 个名额。', '不在武汉邀请赛校排前 60。'),
      notCountedLine('第 5 条（湖北省/武汉大学活动贡献）', '需要报名后申请剩余正式名额，当前不作推测。'),
      notCountedLine('第 6 条（打星名额）', '非正式参赛名额，规则未给出学校确定性条件。'),
      plainLine(`高校上限：${capDescription}`),
    ]
  }

  if (key === 'nanjing') {
    return [
      ruleLine('第 1 条（网络预选赛）', rank <= 160, `校排 ${rank} ≤ 160，获得 1 个名额。`, `校排 ${rank} 超过 160，未获得该条名额。`),
      ruleLine('第 2 条（前 500 队伍）', school.top500Teams >= 3, `前 500 队中本校有 ${school.top500Teams} 队，达到 ≥ 3 队，获得 1 个名额。`, `前 500 队中本校有 ${school.top500Teams} 队，未达到 ≥ 3 队。`),
      ruleLine('第 3 条（近届 WF）', isWF, '属于第 48–50 届世界总决赛中国高校，获得 1 个名额。', '不属于第 48–50 届世界总决赛中国高校名单。'),
      ruleLine('第 4 条（承办/命题高校）', hostApplies || school.flags.setter, hostSetterHit(school.flags, hostApplies, `${hostYearText(school.flags)}承办高校`), '不属于第 50、51 届承办或命题高校名单。'),
      notCountedLine('第 5 条（非中国大陆高校）', '该类名额需要申请，当前不作地域归属推测。'),
      notCountedLine('第 6 条（江苏省赛/南航活动贡献）', '需要申请或由组委会分配，当前不作推测。'),
      notCountedLine('剩余名额', '规则要求赛后开放申请，当前不作推测。'),
      plainLine(`高校上限：${capDescription}`),
    ]
  }

  if (key === 'shenyang') {
    const network = rank <= 100 ? 2 : rank <= 220 ? 1 : 0
    return [
      plainLine(`高校限额：${isWF || school.flags.host || school.flags.setter ? '属于第 48–50 届 WF/第 51 届承办/命题高校，上限为 4 个。' : '属于一般高校，上限为 3 个。'}`),
      ruleLine('网络赛名额 1a/1b', network > 0, network === 2 ? `校排 ${rank} ≤ 100，获得 2 个名额。` : `校排 ${rank} 位于 101–220，获得 1 个名额。`, `校排 ${rank} 超过 220，未获得网络赛名额。`),
      ruleLine('贡献名额 2a/2b', isWF || hostApplies || school.flags.setter, `${isWF ? '第 48–50 届 WF +1' : ''}${isWF && (hostApplies || school.flags.setter) ? '、' : ''}${hostApplies ? '第 51 届承办高校 +2' : ''}${hostApplies && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, '不符合第 48–50 届 WF、第 51 届承办或命题高校条件。'),
      notCountedLine('女队名额 3', '需要学校申请，且不计入本站高校正式队伍上限，当前不作推测。'),
      notCountedLine('省内贡献名额 4', '需要申请或由组委会另行分配，当前不作推测。'),
      notCountedLine('剩余名额/打星队伍', '规则要求报名指南或赛站条件允许后申请，当前不作推测。'),
      plainLine(`实际计入：${capDescription}`),
    ]
  }

  if (key === 'shanghai') {
    const network = rank <= 50 ? 2 : rank <= 200 ? 1 : 0
    const hostExcluded = school.school === shanghaiHost
    return [
      ruleLine('正式名额 1(1)/1(2)（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 50，获得 2 个名额。` : `校排 ${rank} 位于 51–200，获得 1 个名额。`, `校排 ${rank} 超过 200，未获得网络赛名额。`),
      ruleLine('奖励和外卡 2(1)（近届 WF）', isWF, '参加第 48–50 届世界总决赛，获得 1 个奖励名额。', '不属于第 48–50 届世界总决赛高校名单。'),
      ruleLine('奖励和外卡 2(2)（承办/命题）', school.flags.setter || hostApplies, hostExcluded ? '本校为上海站承办高校，但 PDF 明确“除本校外”，不计承办奖励。' : hostSetterHit(school.flags, hostApplies, `${hostYearText(school.flags)}承办高校`), hostExcluded ? '本校承办奖励被 PDF 明确排除。' : '不属于第 50、51 届承办或命题高校名单。'),
      notCountedLine('奖励和外卡 2(3)', '非中国大陆高校外卡需要申请，当前不作地域归属推测。'),
      notCountedLine('奖励和外卡 2(4)', '上海市赛帮助外卡需要申请，当前不作推测。'),
      notCountedLine('奖励和外卡 2(5)', '剩余名额作为外卡并由高校申请、组委会审核，当前不作推测。'),
      plainLine(`正式队伍限额 3：${capDescription}${school.flags.shanghai ? ' 本校为上海市高校，上限 4 个。' : school.flags.host || school.flags.setter ? ' 第 51 届承办或命题高校上限 4 个。' : ' 一般高校上限 3 个。'}`),
      notCountedLine('打星队伍', '需要申请并经组委会审核，不计入正式名额。'),
      plainLine('相关说明：未列事项由上海站组委会解释，页面不据此新增名额。'),
    ]
  }

  const network = rank <= 60 ? 2 : rank <= 160 ? 1 : 0
  return [
    ruleLine('具体分发 1（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 60，获得 2 个名额。` : `校排 ${rank} 位于 61–160，获得 1 个名额。`, `校排 ${rank} 超过 160，未获得该条名额。`),
    ruleLine('具体分发 2（南昌邀请赛）', school.flags.nanchangSilver > 0, `本校有 ${school.flags.nanchangSilver} 队银牌及以上，获得 1 个名额。`, '不在南昌邀请赛银牌及以上高校名单。'),
    ruleLine('具体分发 3(1)（近届 WF）', isWF, '属于第 48–50 届世界总决赛高校，获得 1 个名额。', '不属于第 48–50 届世界总决赛高校名单。'),
    ruleLine('具体分发 3(2)（承办/命题）', hostApplies || school.flags.setter, hostSetterHit(school.flags, hostApplies, '2026 年亚洲区域赛 EC 承办高校'), '不属于 2026 年亚洲区域赛 EC 承办或命题高校名单。'),
    notCountedLine('具体分发 4（支持与激励）', '规则 1–3 发放后如有剩余，可联系组委会申请，当前不作推测。'),
    plainLine(`其他说明 1（高校上限）：${capDescription}`),
    notCountedLine('其他说明 2（空余名额）', '按网络预选赛和邀请赛成绩优先补发给尚未获得名额的高校，当前不作推测。'),
  ]
}

const openReason = (school: CalculatedSchool, station: Station) => {
  selected.value = { school, station }
}

const rankPart = (rank: number | null | undefined) => (rank ? String(rank) : '—')
const rankLabel = (school: RawSchool) => `#${school.rank}/${rankPart(school.round1Rank)}/${rankPart(school.round2Rank)}`

const closeReason = () => {
  selected.value = null
}

const closeScope = () => {
  showScope.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeReason()
    closeScope()
  }
}

const updateFrozenHeader = () => {
  headerFrame = 0
  const table = rankingTable.value
  if (!table?.tHead) return
  const bounds = table.getBoundingClientRect()
  const headerHeight = table.tHead.offsetHeight
  const offset = Math.max(0, Math.min(-bounds.top, bounds.height - headerHeight))
  table.style.setProperty('--header-offset', `${offset}px`)
}

const scheduleFrozenHeader = () => {
  if (!headerFrame) headerFrame = requestAnimationFrame(updateFrozenHeader)
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', scheduleFrozenHeader, { passive: true, capture: true })
  window.addEventListener('resize', scheduleFrozenHeader)
  tableObserver = new ResizeObserver(scheduleFrozenHeader)
  if (rankingTable.value) tableObserver.observe(rankingTable.value)
  updateFrozenHeader()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', scheduleFrozenHeader, true)
  window.removeEventListener('resize', scheduleFrozenHeader)
  tableObserver?.disconnect()
  cancelAnimationFrame(headerFrame)
})
</script>

<template>
  <div class="cal-page lite-page" :class="{ 'is-night': themeStore.isDarkMode }">
    <div class="cal-shell">
      <header class="cal-header">
        <div class="cal-topline">
          <RouterLink class="back-link" to="/">
            <ArrowLeft :size="16" /> 返回导航
          </RouterLink>
          <div class="cal-source-links">
            <RouterLink to="/quota-cc">CCPC 名额计算</RouterLink>
            <a :href="data.meta.pintiaRound1Url || data.meta.pintiaUrl" target="_blank" rel="noopener noreferrer">第一场榜单 <ExternalLink :size="14" /></a>
            <a :href="data.meta.pintiaRound2Url" target="_blank" rel="noopener noreferrer">第二场榜单 <ExternalLink :size="14" /></a>
            <a :href="data.meta.algouxUrl" target="_blank" rel="noopener noreferrer">邀请赛榜单 <ExternalLink :size="14" /></a>
          </div>
        </div>
        <div class="cal-title-row">
          <div>
            <h1>ICPC 区域赛名额计算</h1>
            <p class="cal-subtitle">按两场网络预选赛合并校排名，叠加七个赛站公开规则中的确定性名额。</p>
            <button class="scope-trigger" type="button" @click="showScope = true">查看计算口径说明</button>
          </div>
          <div class="cal-summary">
            <div class="cal-summary-item">
              <strong>{{ calculatedSchools.length }}</strong>
              <span>所学校</span>
            </div>
            <div class="cal-summary-item">
              <strong>{{ totalQuota }}</strong>
              <span>个名额</span>
            </div>
          </div>
        </div>
        <div class="cal-toolbar">
          <label class="cal-search">
            <Search :size="17" aria-hidden="true" />
            <input v-model="search" type="search" placeholder="搜索学校名称" />
          </label>
          <div class="cal-sort" role="group" aria-label="排序">
            <span class="sort-label">排序顺序</span>
            <button
              v-for="option in sortOptions"
              :key="option.key"
              type="button"
              :class="['sort-button', { active: sortKey === option.key }]"
              @click="sortKey = option.key"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </header>

      <section class="rules-strip" aria-label="赛站 PDF">
        <template v-for="station in stations" :key="station.key">
          <a :href="station.pdf" target="_blank" rel="noopener noreferrer" class="rule-chip">
            <FileText :size="15" /> {{ station.name }} PDF
          </a>
        </template>
      </section>

      <section class="table-card" aria-label="学校名额列表">
        <div class="table-scroll">
          <table ref="rankingTable">
            <thead>
              <tr>
                <th class="school-head">#总校排/1/2 - 学校</th>
                <th class="total-head">总名额</th>
                <th v-for="station in stations" :key="station.key" class="station-head">
                  {{ station.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="school in filteredSchools" :key="school.school">
                <td class="school-cell">
                  <span class="school-index">{{ rankLabel(school) }}</span>
                  <span class="school-name">{{ school.school }}</span>
                </td>
                <td class="total-cell">{{ school.total }}</td>
                <td v-for="station in stations" :key="station.key" class="quota-cell">
                  <button type="button" :class="['quota-button', { muted: school.allocations[station.key] === 0 }]" @click="openReason(school, station)">
                    {{ school.allocations[station.key] }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="search.trim() && filteredSchools.length === 0" class="empty-state">没有找到匹配的学校。</p>
      </section>

      <footer class="cal-footer">
        <p v-for="note in data.meta.notes.slice(2)" :key="note">{{ note }}</p>
      </footer>
    </div>

    <div v-if="selected" class="reason-backdrop" @click.self="closeReason" @touchmove.self.prevent>
      <section class="reason-dialog" role="dialog" aria-modal="true" :aria-label="`${selected.school.school}${selected.station.name}名额说明`" @touchstart.stop @touchmove.stop>
        <button class="dialog-close" type="button" aria-label="关闭" @click="closeReason"><X :size="20" /></button>
        <p class="dialog-eyebrow">{{ selected.station.name }} · 规则明细</p>
        <h2>{{ selected.school.school }}</h2>
        <div class="dialog-total"><strong>{{ selected.school.allocations[selected.station.key] }}</strong><span>个实际计入名额</span></div>
        <div class="reason-list" @touchmove.stop>
          <ul>
            <li v-for="reason in reasonsFor(selected.school, selected.station)" :key="reason.text" :class="{ 'is-matched': reason.matched }">{{ reason.text }}</li>
          </ul>
        </div>
        <div class="dialog-links">
          <a class="dialog-pdf" :href="selected.station.pdf" target="_blank" rel="noopener noreferrer">
            <FileText :size="17" aria-hidden="true" />
            <span>查看 {{ selected.station.name }} PDF</span>
          </a>
          <a v-if="invitationBoardUrl(selected.station.key)" class="dialog-board" :href="invitationBoardUrl(selected.station.key)" target="_blank" rel="noopener noreferrer">
            <ExternalLink :size="17" aria-hidden="true" />
            <span>查看对应邀请赛榜单</span>
          </a>
        </div>
      </section>
    </div>

    <div v-if="showScope" class="reason-backdrop" @click.self="closeScope" @touchmove.self.prevent>
      <section class="reason-dialog scope-dialog" role="dialog" aria-modal="true" aria-label="名额计算口径说明" @touchstart.stop @touchmove.stop>
        <button class="dialog-close" type="button" aria-label="关闭" @click="closeScope"><X :size="20" /></button>
        <p class="dialog-eyebrow">计算口径</p>
        <h2>名额计算说明</h2>
        <div class="scope-copy">
          <p>计算范围为西安、成都、武汉、南京、沈阳、上海、南昌七个 EC 赛站，不含香港站。网络赛校排名按两场 Pintia 公开榜单合并：每场只取每校最好队伍作为该校成绩并排名，再将两场校排名归并，同名次时第一场高校排在第二场之前，最后去掉重复高校。前 500 队伍数取两场中该校的较大值。页面按 Pintia 公开榜单快照计算，数据更新截止到该时刻。</p>
          <p v-for="group in specialSchoolLists" :key="group.title">
            <strong>{{ group.title }}</strong>
            {{ group.schools.join('、') }}。
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped src="./quota-page.css"></style>
