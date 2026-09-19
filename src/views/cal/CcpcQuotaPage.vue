<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowUpRight, ExternalLink, FileText, Search, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import data from '../../modules/ccpc-data.json'
import { buildCcpcHostRewards, calculateCcpcQuota, QUOTA_POOLS, type QuotaSchool } from '../../modules/ccpcQuota'
import { seasonScheduleRows } from '../../modules/home/seasonSchedule'
import { useThemeStore } from '../../stores/theme'

type Detail = { school: QuotaSchool; kind: 'preliminary' | 'finalReward' | 'hostReward' | 'total' }
const hostRewards = buildCcpcHostRewards(seasonScheduleRows)
const allocation = calculateCcpcQuota(data.teams, data.finalSchools, hostRewards)
const search = ref('')
const sort = ref<'network' | 'total'>('total')
const sortOptions = [
  { key: 'network', label: '网络赛' },
  { key: 'total', label: '总名额' },
] as const
const themeStore = useThemeStore()
const rankingTable = ref<HTMLTableElement | null>(null)
let headerFrame = 0
let tableObserver: ResizeObserver | undefined

// 与 ICPC 页一致：随整页滚动固定表头，表格只做横向滚动。
function updateFrozenHeader() {
  headerFrame = 0
  const table = rankingTable.value
  if (!table?.tHead) return
  const bounds = table.getBoundingClientRect()
  const offset = Math.max(0, Math.min(-bounds.top, bounds.height - table.tHead.offsetHeight))
  table.style.setProperty('--header-offset', `${offset}px`)
}
function scheduleFrozenHeader() {
  if (!headerFrame) headerFrame = requestAnimationFrame(updateFrozenHeader)
}
onMounted(() => {
  window.addEventListener('scroll', scheduleFrozenHeader, { passive: true, capture: true })
  window.addEventListener('resize', scheduleFrozenHeader)
  tableObserver = new ResizeObserver(scheduleFrozenHeader)
  if (rankingTable.value) tableObserver.observe(rankingTable.value)
  updateFrozenHeader()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleFrozenHeader, true)
  window.removeEventListener('resize', scheduleFrozenHeader)
  tableObserver?.disconnect()
  cancelAnimationFrame(headerFrame)
})
const onlyAllocated = ref(false)
const detail = ref<Detail | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const showRules = ref(false)
const preliminaryTotal = allocation.firstRound + allocation.secondRound
const countedTotal = preliminaryTotal + allocation.finalReward + allocation.hostReward
const hostSchoolCount = new Set(hostRewards.map((reward) => reward.school)).size
const generatedAt = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(new Date(data.meta.generatedAt))
const snapshotInProgress = Date.parse(data.meta.generatedAt) < Date.parse(data.meta.network.endAt)
const snapshotFrozen = data.meta.network.freezeAt && Date.parse(data.meta.generatedAt) >= Date.parse(data.meta.network.freezeAt)
const status = snapshotInProgress ? (snapshotFrozen ? '封榜期间快照' : '比赛中快照') : '赛后榜单快照'
const filteredSchools = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return allocation.schools.filter((row) =>
    row.school.toLocaleLowerCase().includes(keyword) && (!onlyAllocated.value || row.total > 0),
  ).sort((a, b) => {
    if (sort.value === 'total' && a.total !== b.total) return b.total - a.total
    return (a.networkOrder ?? Infinity) - (b.networkOrder ?? Infinity)
      || (a.finalRank ?? Infinity) - (b.finalRank ?? Infinity)
      || a.school.localeCompare(b.school, 'zh-CN')
  })
})
const detailTitle = computed(() => detail.value?.kind === 'preliminary' ? '预选赛分配名额'
  : detail.value?.kind === 'finalReward' ? '2025 总决赛奖励'
  : detail.value?.kind === 'hostReward' ? '2026 年赛事承办奖励' : '已计入名额')

async function openDetail(school: QuotaSchool, kind: Detail['kind']) {
  detail.value = { school, kind }
  showRules.value = false
  await nextTick()
  dialog.value?.showModal()
}
async function openRules() {
  detail.value = null
  showRules.value = true
  await nextTick()
  dialog.value?.showModal()
}
function onBackdropClick(event: MouseEvent) {
  const element = dialog.value
  if (!element || event.target !== element) return
  const rect = element.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    element.close()
  }
}
</script>

<template>
  <main class="cal-page lite-page" :class="{ 'is-night': themeStore.isDarkMode }">
    <div class="cal-shell">
      <header class="cal-header">
        <div class="cal-topline">
          <RouterLink class="back-link" to="/"><ArrowLeft :size="16" /> 返回导航</RouterLink>
          <div class="cal-source-links">
            <RouterLink to="/quota">ICPC 名额计算</RouterLink>
            <a :href="data.meta.network.url" target="_blank" rel="noopener noreferrer">网络赛榜单 <ExternalLink :size="14" /></a>
            <a :href="data.meta.finalSourceUrl" target="_blank" rel="noopener noreferrer">总决赛榜单 <ExternalLink :size="14" /></a>
          </div>
        </div>
        <div class="cal-title-row">
          <div>
            <h1>CCPC 分站赛名额计算</h1>
            <p class="cal-subtitle">按名额来源汇总各校分配，计入预选赛、总决赛奖励与已知承办奖励。</p>
            <button class="scope-trigger" type="button" @click="openRules">查看计算口径说明</button>
          </div>
          <div class="cal-summary" aria-label="分配汇总">
            <div class="cal-summary-item"><strong>{{ allocation.schools.length }}</strong><span>所学校</span></div>
            <div class="cal-summary-item"><strong>{{ countedTotal }}</strong><span>个已计入名额</span></div>
          </div>
        </div>
        <div class="cal-toolbar">
          <label class="cal-search">
            <Search :size="17" aria-hidden="true" />
            <input v-model="search" type="search" placeholder="搜索学校名称" aria-label="搜索学校名称" />
          </label>
          <div class="cal-sort" role="group" aria-label="排序">
            <span class="sort-label">排序顺序</span>
            <button v-for="option in sortOptions" :key="option.key" type="button" :class="['sort-button', { active: sort === option.key }]" :aria-pressed="sort === option.key" @click="sort = option.key">{{ option.label }}</button>
          </div>
        </div>
      </header>

      <section class="rules-strip ccpc-rules" aria-label="分配规则">
        <a :href="data.meta.rulesPdf" target="_blank" rel="noopener noreferrer" class="rule-chip"><FileText :size="15" /> 2026 名额分配规则 PDF</a>
        <label class="allocated-filter"><input v-model="onlyAllocated" type="checkbox" /> 仅看有名额学校</label>
        <span v-if="search.trim() || onlyAllocated" class="result-count" aria-live="polite">{{ filteredSchools.length }} 所学校</span>
      </section>

      <section class="table-card" aria-label="学校名额列表">
        <div class="table-scroll" tabindex="0" role="region" aria-label="学校名额表，可横向滚动">
          <table ref="rankingTable">
            <thead>
              <tr>
                <th scope="col" class="school-head">#网络赛 - 学校</th>
                <th scope="col" class="total-head" title="当前已计入的名额合计">总名额</th>
                <th v-for="pool in QUOTA_POOLS" :key="pool.key" scope="col" class="category-head" :class="{ 'pending-column': !pool.counted }">
                  <span>{{ pool.label }}</span><small>共 {{ pool.budget }} 个{{ pool.counted ? '' : ' · 暂不计入' }}</small>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="school in filteredSchools" :key="school.school">
                <td class="school-cell"><span class="school-index">#{{ school.networkRank ?? '—' }}</span><span class="school-name">{{ school.school }}</span></td>
                <td class="total-cell"><button type="button" class="total-button" :aria-label="`${school.school}已计入合计 ${school.total} 个，查看明细`" @click="openDetail(school, 'total')">{{ school.total }}</button></td>
                <td class="quota-cell"><button type="button" class="quota-button" :class="{ muted: !school.preliminary }" :aria-label="`${school.school}预选赛 ${school.preliminary} 个，查看明细`" @click="openDetail(school, 'preliminary')">{{ school.preliminary }}</button></td>
                <td class="quota-cell"><button type="button" class="quota-button" :class="{ muted: !school.finalReward }" :aria-label="`${school.school}总决赛奖励 ${school.finalReward} 个，查看明细`" @click="openDetail(school, 'finalReward')">{{ school.finalReward }}</button></td>
                <td class="quota-cell"><button type="button" class="quota-button" :class="{ muted: !school.hostReward }" :aria-label="`${school.school}赛事承办奖励 ${school.hostReward} 个，查看明细`" @click="openDetail(school, 'hostReward')">{{ school.hostReward }}</button></td>
                <td v-for="key in ['provincialReward', 'wildcard']" :key="key" class="pending-cell"><span aria-label="暂不计入">—</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!filteredSchools.length" class="empty-state">没有找到匹配的学校。试试其他关键词或取消筛选。</p>
      </section>

      <footer class="cal-footer">
        <p>{{ status }} · {{ generatedAt }}（北京时间）<span v-if="snapshotInProgress"> · 非最终分配结果</span>。点击名额可查看分配明细。</p>
        <p>预选赛公布 566 个，实际计入 {{ preliminaryTotal }} 个（首轮 {{ allocation.firstRound }} + 次轮 {{ allocation.secondRound }}）；总决赛奖励计入 {{ allocation.finalReward }} 个；承办及出题奖励计入 {{ allocation.hostReward }} / 91 个。</p>
        <p>承办及出题奖励按首页赛程及已知总决赛举办方计算。教练论坛 2 个、冬季会议 1 个暂不计；网络赛出题、高职赛承办共 9 个待补充。省赛、邀请赛奖励及外卡暂不计。</p>
        <p v-if="allocation.cappedQuota">次轮入围名额按每校 12 个上限截取，合计扣减 {{ allocation.cappedQuota }} 个；PDF 未说明这些名额的递补方式，本页未额外递补。</p>
        <p v-if="allocation.firstRoundTied || allocation.secondRoundTied">{{ [allocation.firstRoundTied ? '首轮第 240 校' : '', allocation.secondRoundTied ? '次轮第 326 队' : ''].filter(Boolean).join('、') }}处存在同分并列。规则未说明截线处理，本页暂按源榜顺序取满固定名额，待官方确认。</p>
        <p>网络赛 {{ data.teams.length }} 支正式队伍，已排除 {{ data.meta.network.excludedTeams }} 支打星队伍。学校按源榜名称匹配，未参加网络赛的总决赛学校仍保留奖励名额。</p>
        <p>本页依据公开榜单与规则 v1 测算，名额只表示学校报名上限；具体分站安排及最终名额以组委会公布为准。</p>
      </footer>
    </div>

    <dialog ref="dialog" class="detail-dialog" :class="{ 'scope-dialog': showRules }" :aria-label="showRules ? '名额计算口径说明' : `${detail?.school.school} · ${detailTitle}`" @click="onBackdropClick">
      <button type="button" class="close-button" aria-label="关闭说明" autofocus @click="dialog?.close()"><X :size="20" /></button>
      <template v-if="showRules">
        <p class="eyebrow">计算口径 · 规则 v1</p>
        <h2>名额如何分配</h2>
        <div class="rules-copy">
          <h3>2025 总决赛奖励 · 207 个</h3>
          <p>按正式参赛学校排名，1–10 名每校 4 个，11–30 名每校 3 个，31–60 名每校 2 个，其余参赛学校每校 1 个。总决赛榜单由 RankLand 所链接的 Pintia 原始榜单获取。</p>
          <h3>预选赛首轮 · 240 个</h3>
          <p>排除打星队伍及奖励已达 12 个、没有有效队伍的学校，按各校最好队伍的成绩确定学校顺序，前 240 所学校各获 1 个名额。</p>
          <h3>预选赛次轮 · 326 个</h3>
          <p>每校取前 max(0, min(6, 12 − 奖励名额)) 支队伍作为有效队伍。奖励为总决赛奖励与已知承办、出题奖励之和。奖励与首轮之和已达 12 的学校不参加次轮；对剩余有效队伍重新排序，前 326 队各获 1 个名额。首轮获名额的队伍仍参与次轮，每校已计入合计不超过 12。按 PDF 的 B 校示例，超过上限的次轮名额截去，未另行递补。</p>
          <h3>赛事承办及出题奖励 · 已计入 {{ allocation.hostReward }} / 91 个</h3>
          <p>名单取自首页赛程，共 {{ hostSchoolCount }} 所学校。四个分站每站承办 8 个、出题 8 个，共 64 个；女生赛承办 5 个，女生与高职专场合并出题 6 个。荆州站的 8 个承办奖励全部分配给长江大学，武汉大学不计该项奖励；出题方南京大学另获 8 个。</p>
          <ul class="host-list"><li v-for="reward in hostRewards" :key="`${reward.event}-${reward.role}-${reward.school}`">{{ reward.school }} · {{ reward.event }}{{ reward.role }} +{{ reward.amount }}</li></ul>
          <p>上届总决赛承办方南阳理工学院已计入 4 个。教练论坛举办方 +2、冬季会议承办方 +1 暂不计入；首页尚缺网络赛出题方 +6、高职赛承办方 +3，待补充后更新计算。</p>
          <h3>当前范围与并列处理</h3>
          <p>当前计入预选赛、总决赛奖励与已知承办、出题奖励，省赛、邀请赛奖励和外卡尚未计入。补齐奖励后，有效队伍和预选赛分配可能变化。五类公布容量合计 1,180 个；预选赛公布容量为 566 个，实际计入数还受每校 12 个上限影响。</p>
          <p>保留源榜校排的并列名次。PDF 未规定预选赛截线并列时的处理，本页暂按源榜返回顺序选取前 240 校、前 326 支有效队伍，不因并列扩容；若截线有并列，页面会提示。数据不足时仅分配实际可得名额。</p>
          <p>数据为 {{ generatedAt }}（北京时间）的固定快照，刷新页面不会实时拉取新榜单。</p>
        </div>
      </template>
      <template v-else-if="detail">
        <p class="eyebrow">{{ detailTitle }}</p>
        <h2>{{ detail.school.school }}</h2>
        <div class="detail-total"><strong>{{ detail.kind === 'preliminary' ? detail.school.preliminary : detail.kind === 'finalReward' ? detail.school.finalReward : detail.kind === 'hostReward' ? detail.school.hostReward : detail.school.total }}</strong><span>个已计入名额</span></div>
        <div v-if="detail.kind === 'finalReward' || detail.kind === 'total'" class="detail-block">
          <h3>总决赛奖励 <span>+{{ detail.school.finalReward }}</span></h3>
          <p v-if="detail.school.finalRank !== null">2025 总决赛校排第 {{ detail.school.finalRank }}，按{{ detail.school.finalRank <= 10 ? '1–10 名' : detail.school.finalRank <= 30 ? '11–30 名' : detail.school.finalRank <= 60 ? '31–60 名' : '其余参赛学校' }}档位，获得 {{ detail.school.finalReward }} 个奖励名额。</p>
          <p v-else>未在总决赛正式参赛学校名单中匹配到该校，总决赛奖励计 0。</p>
        </div>
        <div v-if="detail.kind === 'hostReward' || detail.kind === 'total'" class="detail-block">
          <h3>赛事承办及出题奖励 <span>+{{ detail.school.hostReward }}</span></h3>
          <ul v-if="detail.school.hostReasons.length" class="host-list"><li v-for="reward in detail.school.hostReasons" :key="`${reward.event}-${reward.role}`">{{ reward.event }}{{ reward.role }}，获得 {{ reward.amount }} 个名额。</li></ul>
          <p v-else>未在首页已记录的承办、出题名单中匹配到该校，当前计 0。</p>
        </div>
        <template v-if="detail.kind === 'preliminary' || detail.kind === 'total'">
          <div class="detail-block">
            <h3>预选赛首轮 <span>+{{ detail.school.firstRound }}</span></h3>
            <p v-if="detail.school.networkOrder === null">未在当前网络赛正式榜单中匹配到该校。</p>
            <p v-else-if="detail.school.effectiveLimit === 0">已获奖励 {{ detail.school.rewardTotal }} 个，达到每校 12 个上限，不参加预选赛名额分配。</p>
            <p v-else>网络赛校排第 {{ detail.school.networkRank }}，剔除无有效队伍学校后分配顺序第 {{ detail.school.firstRoundOrder }}，{{ detail.school.firstRound ? '进入前 240 校，获得 1 个名额' : '未进入前 240 校，首轮未获名额' }}。</p>
          </div>
          <div class="detail-block">
            <h3>预选赛次轮 <span>+{{ detail.school.secondRound }}</span></h3>
            <p>已计入奖励 {{ detail.school.finalReward }} + {{ detail.school.hostReward }} = {{ detail.school.rewardTotal }} 个。本校 {{ detail.school.teamCount }} 支正式队伍，有效队伍上限 max(0, min(6, 12 − {{ detail.school.rewardTotal }})) = {{ detail.school.effectiveLimit }}，实际取 {{ detail.school.validTeamCount }} 支。</p>
            <p v-if="detail.school.rewardTotal + detail.school.firstRound >= 12">奖励与首轮名额之和已达 12，不参加次轮排名。</p>
            <p v-else>其中 {{ detail.school.secondRoundRaw }} 支进入有效队伍前 326，按每校总计 12 个上限，实际计入 {{ detail.school.secondRound }} 个次轮名额。</p>
            <ul v-if="detail.school.effectiveTeams.length" class="team-list">
              <li v-for="team in detail.school.effectiveTeams" :key="team.id">
                <span class="effective-rank">#{{ team.effectiveOrder }}</span><span class="team-name">{{ team.name }}<small>源榜队排 {{ team.rank }}</small></span><span :class="{ awarded: team.allocated }">{{ team.allocated ? '+1' : team.withinCutoff ? '达上限' : '—' }}</span>
              </li>
            </ul>
          </div>
        </template>
        <p class="detail-footnote">当前计入预选赛、总决赛奖励与已知承办奖励；承办奖励尚有待补充项，省赛、邀请赛奖励和外卡暂不计入。{{ allocation.firstRoundTied || allocation.secondRoundTied ? '当前截线有并列，暂按源榜顺序测算。' : '' }}</p>
      </template>
      <a class="dialog-source" :href="data.meta.rulesPdf" target="_blank" rel="noopener noreferrer"><FileText :size="16" /> 查看完整分配规则 <ArrowUpRight :size="14" /></a>
    </dialog>
  </main>
</template>

<style scoped src="./quota-page.css"></style>

<style scoped>
button, input { font: inherit; }
button { cursor: pointer; }
button:focus-visible, a:focus-visible, input:focus-visible, .table-scroll:focus-visible { outline: 2px solid var(--cal-text); outline-offset: 3px; }
.cal-search input { min-width: 0; }
.ccpc-rules { align-items: center; }
.allocated-filter { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; color: var(--cal-muted); font-size: 12px; cursor: pointer; }
.allocated-filter input { accent-color: var(--cal-text); }
.result-count { margin-left: 8px; color: var(--cal-muted); font-size: 12px; }
.category-head { min-width: 110px; white-space: normal; line-height: 1.5; letter-spacing: 0; }
.category-head span { display: block; }
.category-head small { display: block; margin-top: 3px; color: var(--cal-muted); font-size: 10px; font-weight: 400; }
.pending-cell { color: var(--cal-muted); }
.total-head { white-space: normal; }
.total-button { padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: inherit; }
.total-button:hover { text-decoration: underline; text-underline-offset: 4px; }
.detail-dialog { width: min(500px, calc(100vw - 40px)); max-height: calc(100dvh - 40px); box-sizing: border-box; margin: auto; padding: 28px; overflow-y: auto; border: 1px solid var(--cal-line); border-radius: 22px; color: var(--cal-text); background: var(--cal-surface-solid); box-shadow: 0 24px 80px rgba(0,0,0,.3); }
.detail-dialog.scope-dialog { width: min(680px, calc(100vw - 40px)); }
.detail-dialog::backdrop { background: rgba(0,0,0,.48); backdrop-filter: blur(8px); }
.close-button { position: absolute; top: 16px; right: 16px; display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 50%; color: var(--cal-muted); background: transparent; }
.close-button:hover { color: var(--cal-text); background: var(--cal-bg); }
.eyebrow { margin: 0 0 8px; color: var(--cal-accent); font-size: 12px; font-weight: 750; letter-spacing: .12em; }
h2 { margin: 0; padding-right: 30px; font-family: Sora, sans-serif; font-size: 25px; letter-spacing: -.04em; line-height: 1.4; }
.detail-total { display: flex; align-items: baseline; gap: 8px; margin: 18px 0; }
.detail-total strong { color: var(--cal-accent); font-family: Sora, sans-serif; font-size: 42px; line-height: 1; }
.detail-total span { font-size: 13px; color: var(--cal-muted); }
.detail-block { padding: 16px 0; border-top: 1px solid var(--cal-line); }
h3 { margin: 0 0 8px; font-size: 14px; font-weight: 750; }
.detail-block h3 { display: flex; justify-content: space-between; }
.detail-block h3 span, .awarded { color: var(--cal-success); }
.detail-block p, .rules-copy p, .detail-footnote { margin: 0; color: var(--cal-muted); font-size: 13px; line-height: 1.65; }
.rules-copy { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--cal-line); }
.rules-copy h3 { margin: 20px 0 8px; }
.rules-copy h3:first-child { margin-top: 0; }
.rules-copy p + p { margin-top: 12px; }
.host-list { padding-left: 20px; margin: 12px 0; color: var(--cal-muted); font-size: 13px; line-height: 1.65; }
.team-list { padding: 0; margin: 12px 0 0; list-style: none; }
.team-list li { display: flex; align-items: center; gap: 12px; padding: 9px 0; font-size: 12px; }
.effective-rank { min-width: 42px; color: var(--cal-muted); font-variant-numeric: tabular-nums; }
.team-name { flex: 1; overflow-wrap: anywhere; }
.team-name small { display: block; margin-top: 3px; color: var(--cal-muted); font-size: 10px; }
.awarded { font-weight: 750; }
.detail-footnote { padding-top: 12px; border-top: 1px solid var(--cal-line); font-size: 11px; }
.dialog-source { display: inline-flex; align-items: center; gap: 7px; margin-top: 18px; color: var(--cal-accent); font-size: 13px; font-weight: 700; text-decoration: none; }
@media (max-width: 900px) {
  .ccpc-rules { display: flex; flex-wrap: wrap; }
  .ccpc-rules .rule-chip { padding: 7px 10px; }
  .category-head { min-width: 78px; max-width: 100px; font-size: 10px; }
  .category-head small { font-size: 9px; }
  .detail-dialog, .detail-dialog.scope-dialog { width: calc(100vw - 24px); max-height: calc(100dvh - 24px); padding: 22px 18px; border-radius: 18px; }
  h2 { font-size: 22px; }
  .close-button { top: 11px; right: 11px; }
  .detail-total { margin: 15px 0; }
  .detail-total strong { font-size: 36px; }
}
@media (max-width: 520px) {
  .allocated-filter { font-size: 11px; }
  .result-count { margin-left: auto; font-size: 11px; }
  .category-head { min-width: 72px; }
}
</style>
