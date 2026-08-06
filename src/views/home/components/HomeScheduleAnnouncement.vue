<script setup lang="ts">
import { ChevronLeft, ChevronRight, Maximize2, X } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { SeasonScheduleRow } from '../../../modules/home/seasonSchedule'

interface CalendarDay {
  day: number | null
  isoDate: string | null
  events: SeasonScheduleRow[]
}

interface CalendarMonth {
  key: string
  label: string
  year: number
  month: number
  weeks: CalendarDay[][]
}

interface CalendarEventSpan {
  event: SeasonScheduleRow
  startColumn: number
  columnSpan: number
  lane: number
}

const props = defineProps<{
  rows: SeasonScheduleRow[]
  credit: string
}>()

const isPreviewOpen = ref(false)
const activeMonthIndex = ref(0)
const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

const parseDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const eventDateKeys = (row: SeasonScheduleRow) => {
  const dates: string[] = []
  const cursor = parseDate(row.startDate)
  const end = parseDate(row.endDate ?? row.startDate)

  while (cursor <= end) {
    dates.push(formatIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const calendarMonths = computed<CalendarMonth[]>(() => {
  if (!props.rows.length) return []

  const eventMap = new Map<string, SeasonScheduleRow[]>()
  props.rows.forEach((row) => {
    eventDateKeys(row).forEach((dateKey) => {
      eventMap.set(dateKey, [...(eventMap.get(dateKey) ?? []), row])
    })
  })

  const firstDate = parseDate(props.rows.reduce((earliest, row) => row.startDate < earliest ? row.startDate : earliest, props.rows[0].startDate))
  const lastDate = parseDate(props.rows.reduce((latest, row) => (row.endDate ?? row.startDate) > latest ? (row.endDate ?? row.startDate) : latest, props.rows[0].endDate ?? props.rows[0].startDate))
  const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
  const lastMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
  const months: CalendarMonth[] = []

  while (cursor <= lastMonth) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth() + 1
    const leadingEmptyDays = (cursor.getDay() + 6) % 7
    const daysInMonth = new Date(year, month, 0).getDate()
    const calendarCellCount = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7
    const days: CalendarDay[] = Array.from({ length: calendarCellCount }, (_, index) => {
      const day = index - leadingEmptyDays + 1
      if (day < 1 || day > daysInMonth) return { day: null, isoDate: null, events: [] }

      const isoDate = formatIsoDate(new Date(year, month - 1, day))
      return { day, isoDate, events: eventMap.get(isoDate) ?? [] }
    })

    months.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `${year}年${month}月`,
      year,
      month,
      weeks: Array.from({ length: calendarCellCount / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
})

const activeMonth = computed(() => calendarMonths.value[activeMonthIndex.value])
const activeMonthGridColumns = computed(() => {
  const eventColumns = new Set<number>()

  activeMonth.value?.weeks.forEach((week) => {
    week.forEach((day, columnIndex) => {
      if (day.events.length) eventColumns.add(columnIndex)
    })
  })

  return Array.from({ length: 7 }, (_, columnIndex) =>
    eventColumns.has(columnIndex) ? 'minmax(0, 1.15fr)' : 'minmax(0, 0.9fr)',
  ).join(' ')
})
const getEventLabel = (row: SeasonScheduleRow) =>
  [row.category, row.venue, row.organizer].filter(Boolean).join('，')

const getWeekEventSpans = (week: CalendarDay[]): CalendarEventSpan[] => {
  const datedDays = week.filter((day) => day.isoDate)
  const weekStart = datedDays[0]?.isoDate
  const weekEnd = datedDays.at(-1)?.isoDate
  if (!weekStart || !weekEnd) return []

  const laneEnds: number[] = []

  return props.rows
    .filter((event) => event.startDate <= weekEnd && (event.endDate ?? event.startDate) >= weekStart)
    .map((event) => {
      const visibleStart = event.startDate < weekStart ? weekStart : event.startDate
      const eventEnd = event.endDate ?? event.startDate
      const visibleEnd = eventEnd > weekEnd ? weekEnd : eventEnd
      const startColumn = week.findIndex((day) => day.isoDate === visibleStart)
      const endColumn = week.findIndex((day) => day.isoDate === visibleEnd)

      return { event, startColumn, endColumn }
    })
    .filter(({ startColumn, endColumn }) => startColumn >= 0 && endColumn >= startColumn)
    .sort((a, b) => a.startColumn - b.startColumn || b.endColumn - a.endColumn)
    .map(({ event, startColumn, endColumn }) => {
      let lane = laneEnds.findIndex((laneEnd) => startColumn > laneEnd)
      if (lane === -1) lane = laneEnds.length
      laneEnds[lane] = endColumn

      return {
        event,
        startColumn,
        columnSpan: endColumn - startColumn + 1,
        lane,
      }
    })
}

const getWeekStyle = (week: CalendarDay[]) => {
  const laneCount = Math.max(0, ...getWeekEventSpans(week).map((span) => span.lane + 1))
  return {
    gridTemplateColumns: activeMonthGridColumns.value,
    gridTemplateRows: laneCount ? `20px repeat(${laneCount}, minmax(28px, auto))` : 'minmax(48px, auto)',
    minHeight: '48px',
  }
}

const showPreviousMonth = () => {
  activeMonthIndex.value = Math.max(0, activeMonthIndex.value - 1)
}

const showNextMonth = () => {
  activeMonthIndex.value = Math.min(calendarMonths.value.length - 1, activeMonthIndex.value + 1)
}

const openPreview = () => {
  activeMonthIndex.value = 0
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
      aria-label="2026XCPC 赛程日历预览"
      @click.self="isPreviewOpen = false"
    >
      <div v-if="activeMonth" class="schedule-preview-content" data-density="compact">
        <button class="schedule-preview-close" type="button" aria-label="关闭赛程日历预览" @click="isPreviewOpen = false">
          <X :size="20" :stroke-width="2.25" aria-hidden="true" />
        </button>
        <div class="calendar-toolbar">
          <button
            class="calendar-nav-button"
            type="button"
            aria-label="查看上个月"
            :disabled="activeMonthIndex === 0"
            @click="showPreviousMonth"
          >
            <ChevronLeft :size="20" aria-hidden="true" />
          </button>
          <h2>{{ activeMonth.label }}</h2>
          <button
            class="calendar-nav-button"
            type="button"
            aria-label="查看下个月"
            :disabled="activeMonthIndex === calendarMonths.length - 1"
            @click="showNextMonth"
          >
            <ChevronRight :size="20" aria-hidden="true" />
          </button>
        </div>

        <div
          class="calendar-grid"
          role="grid"
          :aria-label="`${activeMonth.label}赛程`"
          data-column-density="adaptive"
          data-horizontal-gutter="roomy"
        >
          <div
            class="calendar-week calendar-weekdays"
            :style="{ gridTemplateColumns: activeMonthGridColumns }"
            role="row"
          >
            <span v-for="weekday in weekdayLabels" :key="weekday" role="columnheader">{{ weekday }}</span>
          </div>
          <div
            v-for="(week, weekIndex) in activeMonth.weeks"
            :key="weekIndex"
            class="calendar-week"
            :style="getWeekStyle(week)"
            role="row"
          >
            <div
              v-for="(day, dayIndex) in week"
              :key="day.isoDate ?? `empty-${weekIndex}-${dayIndex}`"
              class="calendar-day"
              :class="{ 'is-empty': !day.day, 'has-events': day.events.length > 0 }"
              :style="{ gridColumn: dayIndex + 1, gridRow: '1 / -1' }"
              role="gridcell"
              :aria-label="day.day ? `${activeMonth.month}月${day.day}日` : undefined"
              :aria-hidden="day.day ? undefined : true"
            >
              <span v-if="day.day" class="calendar-day-number">{{ day.day }}</span>
            </div>
            <div
              v-for="span in getWeekEventSpans(week)"
              :key="`${span.event.startDate}-${span.event.category}-${span.event.venue}`"
             class="calendar-event"
              :class="[
                `is-${span.event.category.toLowerCase()}`,
                { 'is-multiday': span.columnSpan > 1 },
              ]"
              :style="{
                gridColumn: `${span.startColumn + 1} / span ${span.columnSpan}`,
                gridRow: span.lane + 2,
              }"
              :aria-label="getEventLabel(span.event)"
              :title="getEventLabel(span.event)"
              data-mobile-layout="wide-wrap"
              data-content-flow="inline-first"
            >
              <strong>{{ span.event.category }}</strong>
              <span class="calendar-event-venue">{{ span.event.venue }}</span>
              <span v-if="span.event.organizer" class="calendar-event-organizer">{{ span.event.organizer }}</span>
            </div>
          </div>
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
  padding: 40px;
  background: rgba(0, 0, 0, 0.52);
}

.schedule-preview-content {
  position: relative;
  width: min(720px, 100%);
  max-height: calc(100dvh - 80px);
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
}

.calendar-toolbar {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;
  padding: 0 48px 0 0;
  margin-bottom: 8px;
}

.calendar-toolbar h2 {
  margin: 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 750;
  line-height: 1.3;
  text-align: center;
}

.calendar-nav-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  background: var(--surface);
  cursor: pointer;
}

.calendar-nav-button:hover:not(:disabled) {
  background: var(--surface-hover);
}

.calendar-nav-button:disabled {
  opacity: 0.35;
  cursor: default;
}

.calendar-nav-button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.calendar-grid {
  min-width: 0;
  margin-inline: 18px;
  overflow: hidden;
  border-top: 1px solid var(--line);
  border-left: 1px solid var(--line);
  color: var(--text);
}

.calendar-week {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-weekdays span {
  min-width: 0;
  padding: 5px 3px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  color: var(--secondary);
  background: var(--surface-subtle);
  font-size: 11px;
  font-weight: 750;
  line-height: 1;
  text-align: center;
}

.calendar-day {
  position: relative;
  z-index: 0;
  min-width: 0;
  min-height: 0;
  padding: 3px;
  overflow: hidden;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.calendar-day.is-empty {
  background: var(--surface-subtle);
}

.calendar-day.has-events {
  background: color-mix(in srgb, var(--surface) 94%, #007aff 6%);
}

.calendar-day-number {
  display: block;
  margin-bottom: 3px;
  color: var(--secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}

.calendar-events {
  display: grid;
  gap: 3px;
}

.calendar-event {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 5px;
  align-content: center;
  padding: 4px 6px;
  overflow: hidden;
  border-left: 3px solid #007aff;
  border-radius: 4px;
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 84%, #007aff 16%);
  font-size: 10px;
  line-height: 1.2;
  margin: 0 2px 3px;
}

.calendar-event.is-ccpc {
  border-left-color: #ff3b30;
  background: color-mix(in srgb, var(--surface) 84%, #ff3b30 16%);
}

.calendar-event strong,
.calendar-event span {
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: normal;
  white-space: nowrap;
}

.calendar-event-organizer {
  color: var(--secondary);
  font-size: 9px;
  overflow-wrap: anywhere;
  white-space: normal;
}

.calendar-event.is-multiday {
  text-align: left;
}

.calendar-event.is-multiday strong,
.calendar-event.is-multiday .calendar-event-venue,
.calendar-event.is-multiday .calendar-event-organizer {
  flex: 0 0 auto;
  max-width: 100%;
  overflow: visible;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}

.schedule-credit {
  margin: 5px 0 0;
  color: var(--secondary);
  font-size: 10px;
  line-height: 1.25;
  text-align: right;
}

.schedule-preview-close {
  position: absolute;
  z-index: 1;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 6px;
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
    padding: 6px;
  }

  .schedule-preview-content {
    width: 90%;
    max-height: calc(100dvh - 12px);
    padding: 8px;
  }

  .schedule-preview-close {
    top: 8px;
    right: 8px;
  }

  .calendar-toolbar {
    margin-bottom: 8px;
  }

  .calendar-toolbar h2 {
    font-size: 15px;
  }

  .calendar-day {
    min-height: 0;
    padding: 4px 2px;
  }

  .calendar-day-number {
    margin-bottom: 3px;
    font-size: 10px;
  }

  .calendar-event {
    gap: 2px 4px;
    align-self: stretch;
    align-items: center;
    align-content: center;
    padding: 4px 3px;
    border-left-width: 2px;
    font-size: 9px;
    line-height: 1.15;
    text-align: left;
  }

  .calendar-event-venue {
    font-size: 9px;
  }

  .calendar-event-organizer {
    font-size: 8px;
    line-height: 1.15;
  }

  .calendar-grid {
    margin-inline: 10px;
  }

}

@media (max-width: 360px) {
  .schedule-preview {
    padding: 4px;
  }

  .schedule-preview-content {
    max-height: calc(100dvh - 8px);
  }

  .calendar-grid {
    margin-inline: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    width: 100%;
    padding-left: 0;
    animation: none;
  }
}
</style>
