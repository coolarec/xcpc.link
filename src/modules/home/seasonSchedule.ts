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
  {
    startDate: '2026-10-17',
    endDate: '2026-10-18',
    category: 'ICPC',
    venue: '西安',
    organizer: '西北工业大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/a9259fcfb12d4087b31bc1eef3490e79.htm',
    allocationPlan: '容量：380（预选赛230+邀请赛100+EC 贡献30）\n规则：网络赛前80名各2队，前150名1队；邀请赛前100名各1队。',
  },
  { startDate: '2026-10-17', endDate: '2026-10-18', category: 'CCPC', venue: '长春', organizer: '东北师范大学' },
  {
    startDate: '2026-10-24',
    endDate: '2026-10-25',
    category: 'ICPC',
    venue: '成都',
    organizer: '电子科技大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/19c9af66a6184e29a863547a2f83cc74.htm',
    allocationPlan: '容量：320（160 网络赛+ 80 队排 + 贡献/奖励）\n规则：网络赛前 160 各一个，三支队伍500 以内拿到第二个名额',
  },
  { startDate: '2026-10-24', endDate: '2026-10-25', category: 'CCPC', venue: '女赛', organizer: '成都信息工程大学' },
  {
    startDate: '2026-10-31',
    endDate: '2026-11-01',
    category: 'ICPC',
    venue: '武汉',
    organizer: '武汉大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/35fbb9f94ae841dfbd64bcd332ef4f86.htm',
    allocationPlan: '容量：400（网络赛260+主办/命题25+WF 30+武汉邀请赛60）\n规则：网络赛前80名各2队，81–180名各1队；武汉邀请赛校排前60名各1队。',
  },
  {
    startDate: '2026-11-07',
    endDate: '2026-11-08',
    category: 'ICPC',
    venue: '南京',
    organizer: '南京航空航天大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/276a166ac0c34db0af139941fbf2323c.htm',
    allocationPlan: '容量：约320（预选赛160+多队76+WF30+承办/命题24+境外10+江苏贡献20）\n规则：预选赛前160校各1个；同校≥3队进前500再1个。',
  },
  { startDate: '2026-11-07', endDate: '2026-11-08', category: 'CCPC', venue: '荆州', organizer: '长江大学' },
  {
    startDate: '2026-11-14',
    endDate: '2026-11-15',
    category: 'ICPC',
    venue: '沈阳',
    organizer: '东北大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/2b4f6bc1a27d4b4c91b6b5a4c78f97f3.htm',
    allocationPlan: '容量：400（网络赛320+贡献50+女队10+省内贡献20）\n规则：网络赛前100校各2个、101–220校各1个。',
  },
  { startDate: '2026-11-14', endDate: '2026-11-15', category: 'CCPC', venue: '乐山', organizer: '乐山师范学院' },
  { startDate: '2026-11-21', endDate: '2026-11-22', category: 'CCPC', venue: '厦门', organizer: '厦门大学' },
  {
    startDate: '2026-12-05',
    endDate: '2026-12-06',
    category: 'ICPC',
    venue: '上海',
    organizer: '上海大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/7d3cbb4896de4774873be489d780a82b.htm',
    allocationPlan: '容量：336（网络赛250+奖励/外卡86）\n规则：前50名高校各2队，51–200名高校各1队。',
  },
  {
    startDate: '2026-12-19',
    endDate: '2026-12-20',
    category: 'ICPC',
    venue: '南昌',
    organizer: '江西师范大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/b4d55e13589b47d384b6c854702acc86.htm',
    allocationPlan: '容量：约360（预选赛220+邀请赛100+EC奖励57+激励）\n规则：预选赛1–60名各2个、61–160名各1个；邀请赛银牌各一个。',
  },
  {
    startDate: '2027-01-09',
    endDate: '2027-01-10',
    category: 'ICPC',
    venue: '香港',
    organizer: '香港大学',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/374c9f5210bd4ff287068ec82d56dde2.htm',
    allocationPlan: '容量：120（95 内地+20 港澳+5 打星）\n规则：先到先得',
  },
  {
    startDate: '2027-01-26',
    endDate: '2027-01-28',
    category: 'ECF（杭州）',
    venue: '',
    organizer: '杭州师范大学（浙江大学）',
    officialWebsite: 'https://icpc.pku.edu.cn/tzgg/109d767bb4464b24a5aa18563b65238e.htm',
    allocationPlan: '容量：280（区域赛排名240+贡献奖励40以内+激励10以内）\n规则：按各区域赛队伍成绩排名提取名额。',
  },
]
