<script setup lang="ts">
import { ChevronDown, ExternalLink, Maximize2, X } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { SeasonScheduleRow } from '../../../modules/home/seasonSchedule'

const props = defineProps<{
  rows: SeasonScheduleRow[]
  credit: string
}>()

const isPreviewOpen = ref(false)
const expandedDetails = ref<Record<string, boolean>>({})

const parseDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getEventDate = (row: SeasonScheduleRow) => row.endDate ?? row.startDate
const formatEventDate = (row: SeasonScheduleRow) => {
  const date = parseDate(getEventDate(row))
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const monthGroups = computed(() => {
  const groups = new Map<string, { key: string; label: string; rows: SeasonScheduleRow[] }>()
  props.rows.forEach((row) => {
    const eventDate = getEventDate(row)
    const key = eventDate.slice(0, 7)
    if (!groups.has(key)) {
      const date = parseDate(eventDate)
      groups.set(key, { key, label: `${date.getFullYear()}年${date.getMonth() + 1}月`, rows: [] })
    }
    groups.get(key)?.rows.push(row)
  })
  return [...groups.values()]
})

const getMonthClass = (row: SeasonScheduleRow) => `month-${getEventDate(row).slice(5, 7)}`
const getWeekday = (row: SeasonScheduleRow) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parseDate(getEventDate(row)).getDay()]
const isFirstEventOnDate = (rows: SeasonScheduleRow[], index: number) =>
  index === 0 || getEventDate(rows[index - 1]) !== getEventDate(rows[index])
const getEventDateRowSpan = (rows: SeasonScheduleRow[], index: number) => {
  const date = getEventDate(rows[index])
  let span = 0
  let cursor = index
  while (cursor < rows.length && getEventDate(rows[cursor]) === date) {
    span += 1
    if (expandedDetails.value[getRowKey(rows[cursor])] === true) span += 1
    cursor += 1
  }
  return span
}
const getDetailColspan = (rows: SeasonScheduleRow[], index: number) => {
  const date = getEventDate(rows[index])
  const sameDateCount = rows.filter((row) => getEventDate(row) === date).length
  return sameDateCount > 1 ? 3 : 4
}
const getEventName = (row: SeasonScheduleRow) => {
  if (!row.venue) return row.category
  if (row.venue === '网络赛' || row.venue.includes('赛')) return `${row.category} ${row.venue}`
  return `${row.category} ${row.venue}站`
}
const getEventSuffix = (row: SeasonScheduleRow) => {
  if (!row.venue) return ''
  if (row.venue === '网络赛' || row.venue.includes('赛')) return row.venue
  return `${row.venue}站`
}
const getCategoryIcon = (category: string) => {
  if (category.includes('ICPC') || category.includes('ECF')) return '/assets/icons/icpc-foundation-logo.svg'
  if (category.includes('CCPC')) return '/assets/icons/ccpc-official-logo.png'
  return ''
}
const getAllocationLines = (row: SeasonScheduleRow) => row.allocationPlan?.split('\n') ?? []
const getRowKey = (row: SeasonScheduleRow) => `${row.startDate}-${row.category}-${row.venue}`
const toggleDetail = (row: SeasonScheduleRow) => {
  if (!window.matchMedia('(max-width: 760px)').matches) return
  const key = getRowKey(row)
  expandedDetails.value[key] = !expandedDetails.value[key]
}

const openPreview = () => {
  isPreviewOpen.value = true
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') isPreviewOpen.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <section class="schedule-announcement" aria-label="2026 赛季赛程">
    <button class="ticker-banner" type="button" aria-label="查看 2026XCPC 赛程安排" @click="openPreview">
      <span class="ticker-label">XCPC</span>
      <span class="ticker-window">
        <span class="ticker-track">
          <span class="ticker-content">
            <span>点击查看 2026XCPC 赛程安排</span>
            <Maximize2 :size="15" :stroke-width="2.2" aria-hidden="true" />
          </span>
        </span>
      </span>
    </button>

    <div
      v-if="isPreviewOpen"
      class="schedule-preview"
      role="dialog"
      aria-modal="true"
      aria-label="2026XCPC 赛程列表"
      @click.self="isPreviewOpen = false"
    >
      <div class="schedule-preview-content" data-density="compact">
        <header class="schedule-preview-header">
          <div>
            <h1>2026 赛季赛程</h1>
          </div>
          <button class="schedule-preview-close" type="button" aria-label="关闭赛程列表" @click="isPreviewOpen = false">
            <X :size="20" :stroke-width="2.25" aria-hidden="true" />
          </button>
        </header>
        <div class="schedule-table-wrap" aria-label="2026XCPC赛程列表">
          <table class="schedule-table">
            <colgroup>
              <col class="schedule-col-weekday">
              <col class="schedule-col-event">
              <col class="schedule-col-organizer">
              <col class="schedule-col-detail">
            </colgroup>
            <thead>
              <tr>
                <th scope="col">星期</th>
                <th scope="col">比赛</th>
                <th scope="col">主办方</th>
                <th scope="col">详细信息</th>
              </tr>
            </thead>
            <tbody v-for="group in monthGroups" :key="group.key" class="schedule-month-group">
              <tr class="schedule-month-divider">
                <th colspan="4" class="schedule-month-title">{{ group.label }}</th>
              </tr>
                <template v-for="(row, rowIndex) in group.rows" :key="getRowKey(row)">
                <tr
                  class="schedule-table-row"
                  :class="[getMonthClass(row), { 'is-last-row': rowIndex === group.rows.length - 1 }]"
                  @click="toggleDetail(row)"
                >
                  <td v-if="isFirstEventOnDate(group.rows, rowIndex)" class="schedule-weekday" data-label="星期" :rowspan="getEventDateRowSpan(group.rows, rowIndex)">
                    {{ getWeekday(row) }}
                  </td>
                  <td class="schedule-event" data-label="比赛">
                    <div class="schedule-event-content">
                      <span class="schedule-date">{{ formatEventDate(row) }}</span>
                      <strong class="schedule-event-name">
                        <img v-if="getCategoryIcon(row.category)" class="schedule-event-icon" :src="getCategoryIcon(row.category)" alt="" aria-hidden="true" />
                        {{ row.category }}<template v-if="getEventSuffix(row)"> {{ getEventSuffix(row) }}</template>
                      </strong>
                    </div>
                  </td>
                  <td class="schedule-organizer-cell" data-label="主办方">
                    <div class="schedule-organizer-content">
                      <span class="schedule-date schedule-problem-setter">出题组：{{ row.problemSetter || '暂无' }}</span>
                      <span class="schedule-organizer">
                        <a v-if="row.officialWebsite" class="schedule-organizer-link" :href="row.officialWebsite" target="_blank" rel="noopener noreferrer" aria-label="打开官方网站" @click.stop>{{ row.organizer || '暂无' }} <ExternalLink :size="15" :stroke-width="2.25" aria-hidden="true" /></a>
                        <template v-else>{{ row.organizer || '暂无' }}</template>
                      </span>
                    </div>
                  </td>
                  <td class="schedule-detail-cell" data-label="详细信息">
                    <div class="schedule-detail-desktop">
                      <span v-if="row.allocationPlan" class="schedule-allocation"><template v-for="(line, lineIndex) in getAllocationLines(row)" :key="line"><template v-if="lineIndex > 0"><br /></template>{{ line }}</template></span>
                      <span v-if="!row.allocationPlan" class="schedule-detail">暂无</span>
                    </div>
                    <button class="schedule-detail-toggle" type="button" :aria-label="`${expandedDetails[getRowKey(row)] === true ? '收起' : '展开'}${getEventName(row)}详细信息`" :aria-expanded="expandedDetails[getRowKey(row)] === true" @click.stop="toggleDetail(row)">
                      <ChevronDown :size="15" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedDetails[getRowKey(row)]" class="schedule-detail-expanded-row">
                  <td :colspan="getDetailColspan(group.rows, rowIndex)">
                    <div class="schedule-detail-mobile-content">
                      <span v-if="row.allocationPlan" class="schedule-allocation"><template v-for="(line, lineIndex) in getAllocationLines(row)" :key="line"><template v-if="lineIndex > 0"><br /></template>{{ line }}</template></span>
                      <span v-if="!row.allocationPlan" class="schedule-detail">暂无</span>
                    </div>
                  </td>
                </tr>
                </template>
            </tbody>
          </table>
        </div>

        <p class="schedule-credit">{{ credit }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.schedule-announcement {
  min-width: 0;
}

.ticker-banner {
  width: 100%;
  min-height: 40px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  overflow: hidden;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
  touch-action: manipulation;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.ticker-banner:hover,
.ticker-banner:focus-visible {
  background: var(--surface-hover);
}

.ticker-banner:focus-visible,
.schedule-preview-close:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.ticker-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  color: var(--surface);
  background: var(--text);
  font-size: 12px;
  font-weight: 750;
  line-height: 1;
}

.ticker-window {
  min-width: 0;
  overflow: hidden;
}

.ticker-track {
  width: max-content;
  display: inline-flex;
  align-items: center;
  padding-left: 100%;
  animation: ticker-scroll 10s linear infinite;
}

.ticker-banner:hover .ticker-track,
.ticker-banner:focus-visible .ticker-track {
  animation-play-state: paused;
}

.ticker-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.2;
}

.ticker-content svg {
  flex: 0 0 auto;
  color: var(--secondary);
}

@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

.schedule-preview {
  position: fixed;
  z-index: 10010;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.66);
  backdrop-filter: blur(4px);
}

.schedule-preview-content {
  position: relative;
  width: min(920px, 100%);
  max-height: calc(100dvh - 48px);
  overflow: auto;
  scrollbar-width: none;
  padding: 0 16px 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.schedule-preview-header {
  position: sticky;
  z-index: 2;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  margin: 0 -16px 12px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.schedule-preview-header h1 {
  margin: 0;
  color: var(--text);
  font-size: 20px;
  line-height: 1.2;
}

.schedule-preview-content::-webkit-scrollbar {
  display: none;
}

.schedule-table-wrap {
  margin-top: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  overflow: hidden;
}

.schedule-month-group + .schedule-month-group { border-top: 0; }
.schedule-month-title {
  width: 100% !important;
  margin: 0;
  padding: 7px 9px 6px;
  color: var(--text) !important;
  background: var(--surface) !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  text-align: left !important;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: var(--text);
  font-size: 12px;
}

.schedule-col-weekday { width: 9%; }
.schedule-col-event { width: 24%; }
.schedule-col-organizer { width: 27%; }
.schedule-col-detail { width: 40%; }

.schedule-table th,
.schedule-table td {
  padding: 5px 6px;
  border-bottom: 0;
  text-align: left;
  vertical-align: top;
  line-height: 1.25;
}

.schedule-table th {
  color: var(--secondary);
  background: var(--surface-hover);
  font-size: 10px;
  letter-spacing: 0.04em;
  font-weight: 700;
  white-space: nowrap;
}

.schedule-table-row {
  border-bottom: 1px solid var(--line);
}

.schedule-table-row.is-last-row,
.schedule-detail-expanded-row:last-child {
  border-bottom: 0;
}

.schedule-month-divider th {
  border-bottom: 1px solid var(--line);
}

.schedule-month-group + .schedule-month-group .schedule-month-divider th {
  border-top: 1px solid var(--line);
}

.schedule-weekday { width: 58px; color: var(--secondary); font-weight: 700; white-space: nowrap; vertical-align: top !important; }
.schedule-event { min-width: 0; }
.schedule-event-content,
.schedule-organizer-content,
.schedule-detail-content { display: grid; gap: 3px; }
.schedule-detail-toggle,
.schedule-detail-mobile-content { display: none; }
.schedule-detail-expanded-row { display: none; }
.schedule-date { color: var(--secondary); font-variant-numeric: tabular-nums; }
.schedule-event-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  line-height: 1.35;
  white-space: nowrap;
}
.schedule-event-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  object-fit: contain;
  object-position: center;
  vertical-align: middle;
}
.schedule-organizer-cell,
.schedule-detail-cell { min-width: 0; }
.schedule-organizer { color: var(--text); font-size: 13px; font-weight: 700; line-height: 1.35; }
.schedule-organizer-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: inherit;
  line-height: 1;
  vertical-align: -2px;
  text-decoration: none;
}
.schedule-allocation,
.schedule-detail { color: var(--secondary); font-size: 11px; line-height: 1.4; }
a.schedule-detail {
  color: var(--secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
}


.schedule-credit {
  margin: 5px 0 0;
  color: var(--secondary);
  font-size: 10px;
  line-height: 1.25;
  text-align: right;
}

.schedule-preview-close {
  position: static;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  background: var(--surface);
  cursor: pointer;
}

.schedule-preview-close:hover {
  background: var(--surface-hover);
}

@media (max-width: 760px) {
  .ticker-banner {
    min-height: 38px;
    gap: 8px;
    padding: 0 10px;
    border-radius: 12px;
  }

  .ticker-content {
    font-size: 12px;
  }

  .schedule-preview {
    padding: 8px;
  }

  .schedule-preview-content {
    width: 100%;
    max-height: calc(100dvh - 12px);
    padding: 0 8px 10px;
  }

  .schedule-table-wrap {
    border-radius: 10px;
  }

  .schedule-preview-header {
    min-height: 52px;
    margin-inline: -8px;
    padding: 8px 10px;
  }

  .schedule-preview-header h1 { font-size: 17px; }
  .schedule-preview-close { width: 32px; height: 32px; }

  .schedule-month-title {
    padding: 7px 9px 6px;
    font-size: 12px;
  }

  .schedule-table { width: 100%; min-width: 0; font-size: 11px; table-layout: fixed; }
  .schedule-table th,
  .schedule-table td { padding: 5px 6px; line-height: 1.25; }
  .schedule-table th { padding: 5px 6px; }

  .schedule-col-weekday { width: 14%; }
  .schedule-col-event { width: 30%; }
  .schedule-col-organizer { width: 48%; }
  .schedule-col-detail { width: 8%; }
  .schedule-table th:nth-child(4),
  .schedule-table td:nth-child(4) { display: table-cell; padding: 0; text-align: right; }
  .schedule-table thead th:nth-child(4) {
    color: transparent;
    font-size: 0;
  }

  .schedule-detail-desktop { display: none; }

  .schedule-detail-toggle {
    position: absolute;
    top: 50%;
    right: 2px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: 24px;
    height: 24px;
    justify-content: center;
    padding: 0;
    border: 0;
    color: var(--secondary);
    background: transparent;
    font: inherit;
    cursor: pointer;
    transform: translateY(-50%);
  }

  .schedule-detail-toggle svg {
    transition: transform 0.18s ease;
  }

  .schedule-detail-toggle[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }

  .schedule-detail-cell { position: relative; vertical-align: middle !important; }

  .schedule-detail-expanded-row { display: table-row; }
  .schedule-detail-expanded-row td { padding: 5px 8px !important; background: var(--surface-subtle); }

  .schedule-detail-mobile-content {
    display: grid;
    gap: 3px;
    margin-top: 4px;
  }

  .schedule-event-content,
  .schedule-organizer-content { gap: 1px; }
  .schedule-event-name { font-size: 11px; }
  .schedule-event-icon { width: 12px; height: 12px; flex-basis: 12px; }
  .schedule-organizer { font-size: 11px; line-height: 1.2; }

}

@media (max-width: 360px) {
  .schedule-preview {
    padding: 4px;
  }

  .schedule-preview-content {
    max-height: calc(100dvh - 8px);
  }

  .schedule-month-title { padding-inline: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    width: 100%;
    padding-left: 0;
    animation: none;
  }
}
</style>
