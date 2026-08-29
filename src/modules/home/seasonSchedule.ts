export interface SeasonScheduleRow {
  startDate: string
  endDate?: string
  category: string
  venue: string
  organizer: string
  problemSetter?: string
  officialWebsite?: string
  allocationPlan?: string
}

export const seasonScheduleRows: SeasonScheduleRow[] = [
  { startDate: '2026-09-06', category: 'ICPC', venue: '网络赛', organizer: '线上', problemSetter: '北京大学' },
  { startDate: '2026-09-12', category: 'ICPC', venue: '网络赛', organizer: '线上', problemSetter: '杭州师范大学（浙江大学）' },
  { startDate: '2026-09-19', category: 'CCPC', venue: '网络赛', organizer: '线上' },
  { startDate: '2026-10-17', endDate: '2026-10-18', category: 'ICPC', venue: '西安', organizer: '西北工业大学' },
  { startDate: '2026-10-17', endDate: '2026-10-18', category: 'CCPC', venue: '长春', organizer: '东北师范大学' },
  { startDate: '2026-10-24', endDate: '2026-10-25', category: 'ICPC', venue: '成都', organizer: '电子科技大学' },
  { startDate: '2026-10-24', endDate: '2026-10-25', category: 'CCPC', venue: '女赛', organizer: '成都信息工程大学' },
  { startDate: '2026-10-31', endDate: '2026-11-01', category: 'ICPC', venue: '武汉', organizer: '武汉大学' },
  { startDate: '2026-11-07', endDate: '2026-11-08', category: 'ICPC', venue: '南京', organizer: '南京航空航天大学' },
  { startDate: '2026-11-07', endDate: '2026-11-08', category: 'CCPC', venue: '荆州', organizer: '长江大学' },
  { startDate: '2026-11-14', endDate: '2026-11-15', category: 'ICPC', venue: '沈阳', organizer: '东北大学' },
  { startDate: '2026-11-14', endDate: '2026-11-15', category: 'CCPC', venue: '乐山', organizer: '乐山师范学院' },
  { startDate: '2026-11-21', endDate: '2026-11-22', category: 'CCPC', venue: '厦门', organizer: '厦门大学' },
  { startDate: '2026-12-05', endDate: '2026-12-06', category: 'ICPC', venue: '上海', organizer: '上海大学' },
  { startDate: '2026-12-19', endDate: '2026-12-20', category: 'ICPC', venue: '南昌', organizer: '江西师范大学' },
  { startDate: '2027-01-09', endDate: '2027-01-10', category: 'ICPC', venue: '香港', organizer: '香港大学' },
  { startDate: '2027-01-26', endDate: '2027-01-28', category: 'ECF（杭州）', venue: '', organizer: '杭州师范大学（浙江大学）' },
]

export const seasonScheduleCredit = 'Schedule compiled by thedyingkai_ (TDK)'
