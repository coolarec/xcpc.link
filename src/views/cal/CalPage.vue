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
  setter: boolean
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
  total: number
  cap: number
}
type Station = (typeof data.meta.stations)[number] & { key: StationKey }

const themeStore = useThemeStore()
const stations = data.meta.stations as Station[]
const stationKeys: StationKey[] = ['xian', 'chengdu', 'wuhan', 'nanjing', 'shenyang', 'shanghai', 'nanchang']
const search = ref('')
const selected = ref<{ school: CalculatedSchool; station: Station } | null>(null)
const showScope = ref(false)

const worldFinalists = new Set(data.meta.specialSchools.worldFinalists)
// 承办高校奖励按第 51 届 EC 全部区域赛承办高校计算；香港站不展示名额列，
// 但香港大学作为香港站承办高校，仍应在其余七站的承办奖励中计入。
const stationHosts = new Set([...Object.values(data.meta.specialSchools.stationHosts), '香港大学'])
const networkSetters = new Set(data.meta.specialSchools.networkSetter.split('、'))
const xianInvitationSchools = new Set(data.meta.invitationSchools.xianTop100)
const wuhanInvitationSchools = new Set(data.meta.invitationSchools.wuhanTop60)
const nanchangSilverSchools = data.meta.invitationSchools.nanchangSilver
const shanghaiHost = data.meta.specialSchools.stationHosts.shanghai

const flagsFor = (school: RawSchool): SchoolFlags => ({
  worldFinalist: worldFinalists.has(school.school),
  host: stationHosts.has(school.school),
  setter: networkSetters.has(school.school),
  xianInvitation: xianInvitationSchools.has(school.school),
  wuhanInvitation: wuhanInvitationSchools.has(school.school),
  nanchangSilver: nanchangSilverSchools[school.school as keyof typeof nanchangSilverSchools] ?? 0,
})

const calculateSchool = (school: RawSchool): CalculatedSchool => {
  const flags = flagsFor(school)
  const rank = school.rank
  const rawAllocations = stationKeys.reduce((result, key) => {
    let amount = 0
    const hostReward = flags.host && !(key === 'shanghai' && school.school === shanghaiHost) ? 2 : 0
    const contributionReward = (flags.worldFinalist ? 1 : 0) + hostReward + (flags.setter ? 2 : 0)

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
  const cap = flags.worldFinalist || flags.host || flags.setter ? 4 : 3
  const allocations = stationKeys.reduce((result, key) => {
    result[key] = Math.min(rawAllocations[key], cap)
    return result
  }, {} as AllocationMap)
  const total = stationKeys.reduce((sum, key) => sum + allocations[key], 0)

  return { ...school, flags, rawAllocations, allocations, total, cap }
}

const calculatedSchools = computed(() => data.schools
  .map(calculateSchool)
  .sort((a, b) => b.total - a.total || a.rank - b.rank))

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
  if (school.flags.worldFinalist) reasons.push(`${contributionClause[key]}：PDF 明列的近届 ICPC 世界总决赛高校，获得 1 个名额。`)
  if (school.flags.host) reasons.push(`${hostClause[key]}：PDF 明列的本赛站承办高校，获得 2 个名额。`)
  if (school.flags.setter) reasons.push(`${hostClause[key]}：PDF 明列的网络预选赛命题高校，获得 2 个名额。`)

  if (!reasons.length) reasons.push('未符合本页已整理的公开、确定性分配条款。')
  if (school.rawAllocations[key] > school.allocations[key]) {
    reasons.push(`上限说明：原始累计 ${school.rawAllocations[key]} 个，按该站高校上限 ${school.cap} 个截取，实际计入 ${school.allocations[key]} 个。`)
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
  const hostRewardApplies = school.flags.host && !(key === 'shanghai' && school.school === shanghaiHost)
  const contributionReward = (school.flags.worldFinalist ? 1 : 0) + (hostRewardApplies ? 2 : 0) + (school.flags.setter ? 2 : 0)
  const rawCap = school.rawAllocations[key]
  const capDescription = rawCap > school.cap
    ? `原始累计 ${rawCap} 个，超过高校上限 ${school.cap} 个，实际计入 ${school.allocations[key]} 个。`
    : `原始累计 ${rawCap} 个，未超过高校上限 ${school.cap} 个，实际计入 ${school.allocations[key]} 个。`

  if (key === 'xian') {
    const network = rank <= 80 ? 2 : rank <= 150 ? 1 : 0
    const specialRaw = (school.flags.xianInvitation ? 1 : 0) + contributionReward
    const specialUsed = Math.min(specialRaw, 2)
    return [
      ruleLine('第 1 条（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 80，获得 2 个名额。` : `校排 ${rank} 位于 81–150，获得 1 个名额。`, `校排 ${rank} 不在前 150，未获得该条名额。`),
      ruleLine('第 2 条（西安邀请赛）', school.flags.xianInvitation, '符合正式队伍校排前 100，原始计 1 个；最终受规则 5(2)合计上限影响。', '不在西安邀请赛正式队伍校排前 100。'),
      ruleLine('第 3(1) 条（近届 WF）', school.flags.worldFinalist, '属于 PDF 明列的近届世界总决赛高校，原始计 1 个；最终受规则 5(2)合计上限影响。', '不属于 PDF 明列的近届世界总决赛高校名单。'),
      ruleLine('第 3(2) 条（承办高校）', school.flags.host, '属于已整理的 EC 赛站承办高校，原始计 2 个；最终受规则 5(2)合计上限影响。', '不属于已整理的 EC 赛站承办高校名单。'),
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
      ruleLine('第 3 条（近届 WF）', school.flags.worldFinalist, '属于近届世界总决赛中国高校，获得 1 个名额。', '不属于近届世界总决赛中国高校名单。'),
      ruleLine('第 4 条（承办/命题高校）', school.flags.host || school.flags.setter, `${school.flags.host ? '承办高校 +2' : ''}${school.flags.host && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, '不属于已整理的承办或命题高校名单。'),
      notCountedLine('第 5 条（四川省贡献名额）', '需要申请或由组委会另行分配，当前不作推测。'),
      notCountedLine('剩余名额', '规则要求赛后开放申请，当前不作推测。'),
      plainLine(`高校上限：${capDescription}`),
    ]
  }

  if (key === 'wuhan') {
    const network = rank <= 80 ? 2 : rank <= 180 ? 1 : 0
    return [
      ruleLine('第 1 条（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 80，获得 2 个名额。` : `校排 ${rank} 位于 81–180，获得 1 个名额。`, `校排 ${rank} 不在前 180，未获得该条名额。`),
      ruleLine('第 2 条（主办/命题高校）', school.flags.host || school.flags.setter, `${school.flags.host ? '主办/承办高校 +2' : ''}${school.flags.host && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, '不属于赛事主办方或命题方高校名单。'),
      ruleLine('第 3 条（近届 WF）', school.flags.worldFinalist, '属于近届世界总决赛中国高校，获得 1 个名额。', '不属于近届世界总决赛中国高校名单。'),
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
      ruleLine('第 3 条（近届 WF）', school.flags.worldFinalist, '属于近届世界总决赛中国高校，获得 1 个名额。', '不属于近届世界总决赛中国高校名单。'),
      ruleLine('第 4 条（承办/命题高校）', school.flags.host || school.flags.setter, `${school.flags.host ? '承办高校 +2' : ''}${school.flags.host && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, '不属于已整理的承办或命题高校名单。'),
      notCountedLine('第 5 条（非中国大陆高校）', '该类名额需要申请，当前不作地域归属推测。'),
      notCountedLine('第 6 条（江苏省赛/南航活动贡献）', '需要申请或由组委会分配，当前不作推测。'),
      notCountedLine('剩余名额', '规则要求赛后开放申请，当前不作推测。'),
      plainLine(`高校上限：${capDescription}`),
    ]
  }

  if (key === 'shenyang') {
    const network = rank <= 100 ? 2 : rank <= 220 ? 1 : 0
    return [
      plainLine(`高校限额：${school.flags.worldFinalist || school.flags.host || school.flags.setter ? '属于 WF/承办/命题高校，上限为 4 个。' : '属于一般高校，上限为 3 个。'}`),
      ruleLine('网络赛名额 1a/1b', network > 0, network === 2 ? `校排 ${rank} ≤ 100，获得 2 个名额。` : `校排 ${rank} 位于 101–220，获得 1 个名额。`, `校排 ${rank} 超过 220，未获得网络赛名额。`),
      ruleLine('贡献名额 2a/2b', school.flags.worldFinalist || school.flags.host || school.flags.setter, `${school.flags.worldFinalist ? '近届 WF +1' : ''}${school.flags.worldFinalist && (school.flags.host || school.flags.setter) ? '、' : ''}${school.flags.host ? '承办高校 +2' : ''}${school.flags.host && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, '不符合近届 WF、承办高校或命题高校条件。'),
      notCountedLine('女队名额 3', '需要学校申请，且不计入本站高校正式队伍上限，当前不作推测。'),
      notCountedLine('省内贡献名额 4', '需要申请或由组委会另行分配，当前不作推测。'),
      notCountedLine('剩余名额/打星队伍', '规则要求报名指南或赛站条件允许后申请，当前不作推测。'),
      plainLine(`实际计入：${capDescription}`),
    ]
  }

  if (key === 'shanghai') {
    const network = rank <= 50 ? 2 : rank <= 200 ? 1 : 0
    const hostExcluded = school.school === shanghaiHost && school.flags.host
    return [
      ruleLine('正式名额 1(1)/1(2)（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 50，获得 2 个名额。` : `校排 ${rank} 位于 51–200，获得 1 个名额。`, `校排 ${rank} 超过 200，未获得网络赛名额。`),
      ruleLine('奖励和外卡 2(1)（近届 WF）', school.flags.worldFinalist, '参加近三届世界总决赛，获得 1 个奖励名额。', '不属于近三届世界总决赛高校名单。'),
      ruleLine('奖励和外卡 2(2)（承办/命题）', school.flags.setter || (school.flags.host && !hostExcluded), hostExcluded ? '本校为上海站承办高校，但 PDF 明确“除本校外”，不计承办奖励。' : `${school.flags.host ? '承办高校 +2' : ''}${school.flags.host && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, hostExcluded ? '本校承办奖励被 PDF 明确排除。' : '不属于已整理的承办或命题高校名单。'),
      notCountedLine('奖励和外卡 2(3)', '非中国大陆高校外卡需要申请，当前不作地域归属推测。'),
      notCountedLine('奖励和外卡 2(4)', '上海市赛帮助外卡需要申请，当前不作推测。'),
      notCountedLine('奖励和外卡 2(5)', '剩余名额作为外卡并由高校申请、组委会审核，当前不作推测。'),
      plainLine(`正式队伍限额 3：${capDescription} 上海市高校的 4 队例外因榜单未提供完整地域名单，未额外推测。`),
      notCountedLine('打星队伍', '需要申请并经组委会审核，不计入正式名额。'),
      plainLine('相关说明：未列事项由上海站组委会解释，页面不据此新增名额。'),
    ]
  }

  const network = rank <= 60 ? 2 : rank <= 160 ? 1 : 0
  return [
    ruleLine('具体分发 1（网络预选赛）', network > 0, network === 2 ? `校排 ${rank} ≤ 60，获得 2 个名额。` : `校排 ${rank} 位于 61–160，获得 1 个名额。`, `校排 ${rank} 超过 160，未获得该条名额。`),
    ruleLine('具体分发 2（南昌邀请赛）', school.flags.nanchangSilver > 0, `本校有 ${school.flags.nanchangSilver} 队银牌及以上，获得 1 个名额。`, '不在南昌邀请赛银牌及以上高校名单。'),
    ruleLine('具体分发 3(1)（近届 WF）', school.flags.worldFinalist, '属于近届世界总决赛高校，获得 1 个名额。', '不属于近届世界总决赛高校名单。'),
    ruleLine('具体分发 3(2)（承办/命题）', school.flags.host || school.flags.setter, `${school.flags.host ? '承办高校 +2' : ''}${school.flags.host && school.flags.setter ? '、' : ''}${school.flags.setter ? '命题高校 +2' : ''}。`, '不属于已整理的承办或命题高校名单。'),
    notCountedLine('具体分发 4（支持与激励）', '规则 1–3 发放后如有剩余，可联系组委会申请，当前不作推测。'),
    plainLine(`其他说明 1（高校上限）：${capDescription}`),
    notCountedLine('其他说明 2（空余名额）', '按网络预选赛和邀请赛成绩优先补发给尚未获得名额的高校，当前不作推测。'),
  ]
}

const openReason = (school: CalculatedSchool, station: Station) => {
  selected.value = { school, station }
}

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

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
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
            <a :href="data.meta.pintiaUrl" target="_blank" rel="noopener noreferrer">网络赛榜单 <ExternalLink :size="14" /></a>
            <a :href="data.meta.algouxUrl" target="_blank" rel="noopener noreferrer">邀请赛榜单 <ExternalLink :size="14" /></a>
          </div>
        </div>
        <div class="cal-title-row">
          <div>
            <h1>ICPC 区域赛名额计算</h1>
            <p class="cal-subtitle">按当前网络预选赛校排名，叠加七个赛站公开规则中的确定性名额。</p>
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
          <span class="cal-hint">点击任意赛站名额查看各条规则说明</span>
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
          <table>
            <thead>
              <tr>
                <th class="school-head">网络赛校排 / 学校</th>
                <th class="total-head">总名额</th>
                <th v-for="station in stations" :key="station.key" class="station-head">
                  {{ station.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="school in filteredSchools" :key="school.school">
                <td class="school-cell">
                  <span class="school-index">#{{ school.rank }}</span>
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
        <p v-if="filteredSchools.length === 0" class="empty-state">没有找到匹配的学校。</p>
      </section>

      <footer class="cal-footer">
        <p>数据快照：{{ data.meta.generatedAt }} · 学校排名来自 Pintia，邀请赛仅取规则正文明确引用的西安、武汉、南昌榜单。</p>
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
          <p>计算范围为西安、成都、武汉、南京、沈阳、上海、南昌七个 EC 赛站，不含香港站。学校排名与前 500 队伍数来自 Pintia 当前榜单快照。</p>
          <p>邀请赛只采用规则正文明确引用的三个榜单：西安邀请赛正式队伍校排前 100、武汉邀请赛正式队伍校排前 60、南昌邀请赛银牌及以上。两场 ICPC 网络赛出题组分别为北京大学、杭州电子科技大学；近届 WF 高校、各站承办高校（含香港站承办高校香港大学）等 PDF 明确条款一并计入。七份赛站规则 PDF 只写“命题高校”类别，没有公开逐站完整名单，因此不按推测增加其他学校。</p>
          <h3>未计入的申请或审核名额</h3>
          <ul>
            <li>西安：专属省赛/区域高校推荐、支持激励及后续空余名额。</li>
            <li>成都：四川省赛贡献名额及剩余名额申请。</li>
            <li>武汉：湖北省赛或武汉大学活动贡献名额、剩余正式名额和打星名额。</li>
            <li>南京：非中国大陆高校名额、江苏省赛/南航活动贡献名额及剩余名额。</li>
            <li>沈阳：女队名额、辽宁省赛/东北大学活动贡献名额、剩余名额和打星队伍。</li>
            <li>上海：非大陆高校外卡、上海市赛帮助外卡、二轮外卡及打星队伍。</li>
            <li>南昌：支持与激励名额，以及规则 1–3 发放后的空余名额。</li>
          </ul>
          <p>上述项目需要后续申请、组委会审核或按规则另行补发，因此不计入当前确定性名额。香港站自身名额不参与计算；香港大学作为香港站承办高校，其承办奖励已计入其他七站，其他香港高校仅按各规则明确条款计入。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cal-page {
  --cal-bg: #f5f5f7;
  --cal-surface: rgba(255, 255, 255, 0.86);
  --cal-surface-solid: #fff;
  --cal-text: #1d1d1f;
  --cal-muted: #6e6e73;
  --cal-line: rgba(0, 0, 0, 0.09);
  --cal-accent: var(--text);
  --cal-success: #2f7d32;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--cal-text);
  background: var(--cal-bg);
  transition: background .2s ease, color .2s ease;
}
.cal-page.is-night { --cal-bg: #000; --cal-surface: rgba(20,20,22,.9); --cal-surface-solid: #151517; --cal-text: #f5f5f7; --cal-muted: #a1a1a6; --cal-line: rgba(255,255,255,.13); --cal-accent: var(--text); --cal-success: #7acb7f; }
.cal-shell { width: min(100% - 32px, 1320px); margin: 0 auto; padding: 22px 0 52px; }
.cal-header { display: grid; gap: 24px; padding: 4px 0 18px; }
.cal-topline, .cal-title-row, .cal-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.back-link, .cal-source-links a, .rule-chip, .dialog-pdf { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
.back-link, .cal-source-links a { color: var(--cal-muted); font-size: 13px; font-weight: 650; }
.back-link:hover, .cal-source-links a:hover, .dialog-pdf:hover { color: var(--cal-accent); }
.cal-source-links { display: flex; gap: 16px; }
.cal-eyebrow, .dialog-eyebrow { margin: 0 0 8px; color: var(--cal-accent); font-size: 12px; font-weight: 750; letter-spacing: .12em; }
h1 { margin: 0; font-family: Sora, sans-serif; font-size: clamp(34px, 5vw, 62px); line-height: 1; letter-spacing: -.05em; }
.cal-subtitle { margin: 14px 0 0; color: var(--cal-muted); font-size: 15px; }
.scope-trigger { width: fit-content; margin-top: 9px; padding: 0; border: 0; color: var(--cal-muted); background: transparent; font: inherit; font-size: 13px; font-weight: 700; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; cursor: pointer; }
.scope-trigger:hover { color: var(--cal-accent); }
.cal-summary { display: flex; align-items: baseline; gap: 20px; min-width: 150px; padding: 16px 18px; border: 1px solid var(--cal-line); border-radius: 18px; background: var(--cal-surface); backdrop-filter: blur(14px); }
.cal-summary-item { display: flex; align-items: baseline; gap: 7px; }
.cal-summary strong { font-family: Sora, sans-serif; font-size: 26px; }
.cal-summary span { color: var(--cal-muted); font-size: 12px; }
.cal-search { width: min(420px, 100%); display: flex; align-items: center; gap: 9px; padding: 11px 14px; border: 1px solid var(--cal-line); border-radius: 13px; background: var(--cal-surface-solid); color: var(--cal-muted); }
.cal-search input { width: 100%; border: 0; outline: 0; color: var(--cal-text); background: transparent; font: inherit; }
.cal-hint { color: var(--cal-muted); font-size: 13px; }
.rules-strip { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px; }
.rule-chip { padding: 8px 11px; border: 1px solid var(--cal-line); border-radius: 999px; color: var(--cal-muted); background: var(--cal-surface); font-size: 12px; font-weight: 650; }
.rule-chip:hover { color: var(--focus); border-color: var(--focus); background: var(--surface-hover); }
.table-card { overflow: hidden; border: 1px solid var(--cal-line); border-radius: 18px; background: var(--cal-surface); box-shadow: 0 12px 36px rgba(0,0,0,.06); }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 940px; border-collapse: collapse; font-size: 13px; }
th { padding: 14px 10px; border-bottom: 1px solid var(--cal-line); color: var(--cal-muted); font-size: 11px; font-weight: 750; letter-spacing: .06em; white-space: nowrap; }
td { padding: 9px 10px; border-bottom: 1px solid var(--cal-line); text-align: center; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--surface-hover); }
.school-head, .school-cell { position: sticky; left: 0; z-index: 2; text-align: left; }
.school-head { background: var(--cal-surface-solid); }
.school-cell { min-width: 230px; color: var(--cal-text); background: var(--cal-surface-solid); font-weight: 650; }
.school-index { display: inline-block; width: 34px; color: var(--cal-muted); font-size: 11px; font-variant-numeric: tabular-nums; vertical-align: top; }
.school-name { overflow-wrap: anywhere; }
.total-head, .total-cell { border-left: 1px solid var(--cal-line); }
.total-head { color: var(--cal-accent); }
.total-cell { color: var(--cal-accent); font-family: Sora, sans-serif; font-size: 16px; font-weight: 800; }
.station-head { min-width: 78px; }
.quota-button { min-width: 34px; padding: 6px 9px; border: 1px solid var(--line); border-radius: 9px; color: var(--focus); background: var(--surface); font: inherit; font-weight: 750; cursor: pointer; }
.quota-button:hover, .quota-button:focus-visible { border-color: var(--focus); background: var(--surface-hover); }
.quota-button.muted { color: var(--cal-muted); border-color: var(--cal-line); background: transparent; }
.empty-state { margin: 0; padding: 48px; color: var(--cal-muted); text-align: center; }
.cal-footer { display: grid; gap: 4px; padding: 14px 2px; color: var(--cal-muted); font-size: 12px; line-height: 1.6; }
.cal-footer p { margin: 0; }
.reason-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; overflow: hidden; overscroll-behavior: none; padding: 20px; background: rgba(0,0,0,.48); backdrop-filter: blur(8px); }
.reason-dialog { position: relative; z-index: 1; box-sizing: border-box; display: flex; flex-direction: column; width: min(100%, 500px); height: min(720px, calc(100vh - 40px)); height: min(720px, calc(100dvh - 40px)); max-height: calc(100vh - 40px); max-height: calc(100dvh - 40px); min-height: 0; overflow: hidden; overscroll-behavior: contain; touch-action: pan-y; pointer-events: auto; padding: 28px; border: 1px solid var(--cal-line); border-radius: 22px; color: var(--cal-text); background: var(--cal-surface-solid); box-shadow: 0 24px 80px rgba(0,0,0,.3); }
.scope-dialog { width: min(100%, 680px); height: auto; max-height: calc(100vh - 40px); max-height: calc(100dvh - 40px); overflow-y: auto; }
.dialog-close { position: absolute; top: 16px; right: 16px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: var(--cal-muted); background: transparent; }
.dialog-close:hover { color: var(--cal-text); background: var(--cal-bg); }
.reason-dialog h2 { margin: 0; padding-right: 30px; font-family: Sora, sans-serif; font-size: 25px; letter-spacing: -.04em; }
.dialog-total { display: flex; align-items: baseline; gap: 8px; margin: 18px 0; }
.dialog-total strong { color: var(--cal-accent); font-family: Sora, sans-serif; font-size: 42px; line-height: 1; }
.dialog-total span { color: var(--cal-muted); font-size: 13px; }
.reason-list { position: relative; z-index: 1; box-sizing: border-box; flex: 1 1 auto; min-height: 0; max-height: 100%; overflow-y: auto; overscroll-behavior-y: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch; margin: 0; padding: 16px 0 18px; border-top: 1px solid var(--cal-line); border-bottom: 1px solid var(--cal-line); color: var(--cal-muted); font-size: 14px; line-height: 1.55; scrollbar-width: thin; scrollbar-color: var(--cal-line) transparent; }
.reason-list > ul { display: grid; gap: 10px; margin: 0; padding: 0 0 0 20px; align-content: start; }
.reason-list li { min-width: 0; }
.reason-list li::marker { color: var(--cal-accent); }
.reason-list li.is-matched { color: var(--cal-success); }
.reason-list li.is-matched::marker { color: var(--cal-success); }
.dialog-links { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 18px; margin-top: 18px; }
.dialog-pdf, .dialog-board { color: var(--cal-accent); font-size: 13px; font-weight: 700; }
.dialog-board { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
.dialog-pdf:hover, .dialog-board:hover { color: var(--cal-accent); }
.scope-copy { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--cal-line); color: var(--cal-muted); font-size: 13px; line-height: 1.65; }
.scope-copy p { margin: 0 0 12px; }
.scope-copy p:last-child { margin-bottom: 0; }
.scope-copy h3 { margin: 20px 0 8px; color: var(--cal-text); font-size: 14px; }
.scope-copy ul { display: grid; gap: 7px; margin: 0 0 14px; padding-left: 20px; }
.scope-copy li::marker { color: var(--cal-accent); }

/* Keep the calculator in the same visual language as the home directory. */
.cal-page {
  --page: #f5f5f7;
  --surface: #ffffff;
  --surface-subtle: #fafafa;
  --surface-hover: #f2f2f4;
  --text: #1d1d1f;
  --muted: #6e6e73;
  --secondary: #86868b;
  --line: rgba(0, 0, 0, 0.09);
  --focus: var(--text);
  --cal-bg: var(--page);
  --cal-surface: var(--surface);
  --cal-surface-solid: var(--surface);
  --cal-text: var(--text);
  --cal-muted: var(--muted);
  --cal-line: var(--line);
  --cal-accent: var(--focus);
}
.cal-page.is-night {
  --page: #000000;
  --surface: #111113;
  --surface-subtle: #171719;
  --surface-hover: #1f1f21;
  --text: #f5f5f7;
  --muted: #a1a1a6;
  --secondary: #7e7e83;
  --line: rgba(255, 255, 255, 0.13);
  --focus: var(--text);
  --cal-bg: var(--page);
  --cal-surface: var(--surface);
  --cal-surface-solid: var(--surface);
  --cal-text: var(--text);
  --cal-muted: var(--muted);
  --cal-line: var(--line);
  --cal-accent: var(--focus);
}
.cal-shell { width: min(100% - 32px, 1240px); padding-top: 22px; }
.cal-header { gap: 12px; padding-bottom: 18px; }
.cal-topline { min-height: 40px; }
.cal-title-row { align-items: flex-end; gap: 24px; }
.cal-summary, .table-card, .rule-chip, .cal-search { box-shadow: none; backdrop-filter: none; }
.cal-summary { border-radius: 14px; }
.cal-search { border-radius: 14px; }
.table-card { border-radius: 18px; }
.rules-strip { gap: 6px; }
.rule-chip { border-radius: 999px; background: var(--cal-surface); }
.cal-footer { padding-top: 16px; }
@media (max-width: 900px) {
  .cal-shell { width: min(100% - 24px, 1240px); padding-top: 14px; padding-bottom: 36px; }
  .cal-header { gap: 16px; padding-bottom: 14px; }
  .cal-topline { align-items: center; flex-wrap: wrap; gap: 10px 16px; }
  .cal-source-links { margin-left: auto; gap: 12px; }
  .cal-title-row { align-items: stretch; flex-direction: column; gap: 16px; }
  h1 { max-width: 100%; font-size: clamp(30px, 9vw, 42px); line-height: 1.08; letter-spacing: -.045em; }
  .cal-subtitle { margin-top: 11px; font-size: 14px; line-height: 1.55; }
  .scope-trigger { margin-top: 8px; font-size: 12px; }
  .cal-summary { width: 100%; justify-content: space-between; min-width: 0; padding: 13px 15px; }
  .cal-summary strong { font-size: 23px; }
  .cal-toolbar { align-items: stretch; flex-direction: column; gap: 10px; }
  .cal-search { width: 100%; box-sizing: border-box; }
  .cal-hint { display: none; }
  .rules-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-bottom: 8px; }
  .rule-chip { justify-content: center; min-width: 0; padding: 7px 4px; font-size: 11px; }
  .table-card { border-radius: 14px; }
  .table-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
  table { min-width: 580px; }
  th, td { padding: 7px 4px; }
  .school-head { width: 124px; white-space: normal; line-height: 1.35; }
  .school-cell { width: 124px; min-width: 124px; max-width: 140px; white-space: normal; line-height: 1.35; }
  .school-index { display: block; width: auto; margin-bottom: 2px; }
  .total-head, .total-cell { width: 46px; }
  .station-head { min-width: 52px; }
  .quota-button { min-width: 28px; padding: 4px 4px; }
  .reason-backdrop { place-items: center; padding: 12px; }
  .reason-dialog { width: 100%; height: min(720px, calc(100vh - 24px)); height: min(720px, calc(100dvh - 24px)); max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); padding: 22px 18px; border-radius: 18px; }
  .scope-dialog { height: auto; max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); }
  .reason-dialog h2 { font-size: 22px; }
  .dialog-close { top: 11px; right: 11px; }
  .dialog-total { margin: 15px 0; }
  .dialog-total strong { font-size: 36px; }
  .reason-list { font-size: 13px; }
  .dialog-links { align-items: flex-start; flex-direction: column; gap: 10px; }
}
@media (max-width: 520px) {
  .cal-source-links { width: 100%; justify-content: space-between; margin-left: 0; }
  .cal-summary { justify-content: flex-start; gap: 18px; }
  .rules-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .rule-chip { justify-content: center; min-width: 0; }
  table { min-width: 550px; }
  .school-head { width: 112px; }
  .school-cell { width: 112px; min-width: 112px; max-width: 122px; }
  .total-head, .total-cell { width: 42px; }
  .station-head { min-width: 48px; }
  .scope-copy { font-size: 12px; }
}
@media (max-width: 360px) {
  .rules-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
