export interface LinkVisit {
  url: string
  total: number
  lastOpened: number
  days: Record<string, number>
}

export const ACTIVITY_MAX_ENTRIES = 20
export const ACTIVITY_TIME_ZONE = 'Asia/Shanghai'

export interface ActivityEntry {
  url: string
  weekCount: number
  lastOpened: number
}

export interface ActivitySnapshot {
  version: 1
  timeZone: typeof ACTIVITY_TIME_ZONE
  generatedAt: number
  popular: ActivityEntry[]
  recent: ActivityEntry[]
}

const dayKey = (now: number) => new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)

// 全站统一按北京时间统计今天及之前六个自然日。
export const activityDays = (now: number): string[] =>
  Array.from({ length: 7 }, (_, offset) => dayKey(now - offset * 24 * 60 * 60 * 1000))

export const recordVisit = (visits: LinkVisit[], url: string, now: number): LinkVisit[] => {
  const previous = visits.find((visit) => visit.url === url)
  const today = dayKey(now)
  const days = Object.fromEntries(activityDays(now).flatMap((key) =>
    previous?.days[key] ? [[key, previous.days[key]]] : [],
  ))
  days[today] = (days[today] ?? 0) + 1
  return [
    ...visits.filter((visit) => visit.url !== url),
    { url, total: (previous?.total ?? 0) + 1, lastOpened: Math.max(previous?.lastOpened ?? 0, now), days },
  ]
}

export const rankActivity = (visits: LinkVisit[], now: number, limit = ACTIVITY_MAX_ENTRIES) => {
  const validDays = activityDays(now)
  const ranked = visits.map((visit) => ({
    ...visit,
    weekCount: validDays.reduce((count, day) => count + (visit.days[day] ?? 0), 0),
  }))
  return {
    popular: ranked.filter((visit) => visit.weekCount > 0)
      .sort((a, b) => b.weekCount - a.weekCount || b.lastOpened - a.lastOpened || a.url.localeCompare(b.url))
      .slice(0, limit),
    recent: ranked.sort((a, b) => b.lastOpened - a.lastOpened || a.url.localeCompare(b.url)).slice(0, limit),
  }
}
