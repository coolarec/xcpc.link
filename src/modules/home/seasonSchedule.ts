export interface SeasonScheduleRow {
  time: string
  category: string
  venue: string
  organizer: string
}

export const seasonScheduleRows: SeasonScheduleRow[] = [
  { time: '9.6', category: 'ICPC', venue: '', organizer: '线上' },
  { time: '9.12', category: 'ICPC', venue: '', organizer: '线上' },
  { time: '9.19', category: 'CCPC', venue: '', organizer: '线上' },
  { time: '10.10–11', category: 'ICPC', venue: '西安', organizer: '西北工业大学' },
  { time: '10.17–18', category: 'ICPC', venue: '沈阳', organizer: '东北大学' },
  { time: '', category: 'CCPC', venue: '长春', organizer: '东北师范大学' },
  { time: '10.24–25', category: 'ICPC', venue: '成都', organizer: '电子科技大学' },
  { time: '', category: 'CCPC', venue: '女赛（成都）', organizer: '' },
  { time: '10.31–11.1', category: 'ICPC', venue: '武汉', organizer: '武汉大学' },
  { time: '11.7–8', category: 'ICPC', venue: '南京', organizer: '南京航空航天大学' },
  { time: '', category: 'CCPC', venue: '荆州', organizer: '长江大学' },
  { time: '11.14–15', category: 'CCPC', venue: '乐山', organizer: '乐山师范学院' },
  { time: '11.21–22', category: 'CCPC', venue: '厦门', organizer: '厦门大学' },
  { time: '11.28–29', category: 'ICPC', venue: '南昌', organizer: '江西师范大学' },
  { time: '12.5–6', category: 'ICPC', venue: '上海', organizer: '上海大学' },
  { time: '1.9–10', category: 'ICPC', venue: '香港', organizer: '香港大学' },
  { time: '1.26–1.28', category: 'ICPC', venue: 'ECF（杭州）', organizer: '杭州师范大学（浙江大学）' },
]

export const seasonScheduleCredit = 'Schedule compiled by thedyingkai_ (TDK)'
