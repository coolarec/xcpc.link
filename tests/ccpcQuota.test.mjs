import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildCcpcHostRewards, calculateCcpcQuota, finalRewardFor } from '../src/modules/ccpcQuota.ts'
import { seasonScheduleRows } from '../src/modules/home/seasonSchedule.ts'

const team = (id, school, rank = id, schoolRank = rank) => ({
  id: String(id), school, name: `队伍 ${id}`, rank, schoolRank, solved: 5, penalty: id,
})

test('总决赛奖励档位的边界', () => {
  assert.deepEqual([1, 10, 11, 30, 31, 60, 61, 107].map(finalRewardFor), [4, 4, 3, 3, 2, 2, 1, 1])
})

test('已知承办奖励合计 79，荆州站承办和出题总计 16', () => {
  const rewards = buildCcpcHostRewards(seasonScheduleRows)
  assert.equal(rewards.reduce((sum, reward) => sum + reward.amount, 0), 79)
  const jingzhou = rewards.filter((reward) => reward.event === '荆州站')
  assert.deepEqual(jingzhou.map((reward) => [reward.school, reward.amount]), [
    ['长江大学', 8], ['南京大学', 8],
  ])
  assert.equal(jingzhou.reduce((sum, reward) => sum + reward.amount, 0), 16)
  assert.ok(!jingzhou.some((reward) => reward.school === '武汉大学'))
  assert.ok(rewards.every((reward) => reward.school !== '线上'))
  assert.deepEqual(rewards.find((reward) => reward.event === '2025 总决赛'), {
    school: '南阳理工学院', event: '2025 总决赛', role: '承办', amount: 4,
  })
})

test('每校最多六队，首轮获名额的队伍仍参与次轮，原始队伍排名不用于截取 326 队', () => {
  const teams = Array.from({ length: 8 }, (_, index) => team(index + 1, 'A 校', index + 1000, 1))
  const result = calculateCcpcQuota(teams, [{ school: 'A 校', rank: 1 }])
  const school = result.schools[0]
  assert.equal(school.teamCount, 8)
  assert.equal(school.effectiveTeams.length, 6)
  assert.equal(school.firstRound, 1)
  assert.equal(school.secondRound, 6)
  assert.equal(school.preliminary, 7)
  assert.equal(school.total, 11)
  assert.equal(school.effectiveTeams[0].allocated, true)
})

test('首轮按学校去重，次轮按有效队伍重新排序，共 566 个', () => {
  const teams = []
  for (let school = 1; school <= 250; school++) {
    for (let local = 0; local < 8; local++) teams.push(team(teams.length + 1, `学校 ${school}`, teams.length + 1, school))
  }
  const result = calculateCcpcQuota(teams, [])
  assert.equal(result.firstRound, 240)
  assert.equal(result.secondRound, 326)
  assert.equal(result.effectiveTeamCount, 1500)
  assert.equal(result.schools.find((row) => row.school === '学校 240').firstRound, 1)
  assert.equal(result.schools.find((row) => row.school === '学校 241').firstRound, 0)
  assert.equal(result.schools.find((row) => row.school === '学校 55').secondRound, 2)
  assert.equal(result.schools.find((row) => row.school === '学校 56').secondRound, 0)
})

test('未参加网络赛的学校保留总决赛奖励，不混淆校区名称', () => {
  const result = calculateCcpcQuota([team(1, '山东大学（威海）')], [{ school: '山东大学', rank: 34 }])
  const finalist = result.schools.find((row) => row.school === '山东大学')
  assert.equal(finalist.total, 2)
  assert.equal(finalist.networkRank, null)
  assert.equal(finalist.preliminary, 0)
  assert.equal(result.schools.find((row) => row.school === '山东大学（威海）').finalReward, 0)
})

test('承办奖励影响有效队伍上限，达到 12 的学校不占首轮、次轮名额', () => {
  const teams = Array.from({ length: 242 }, (_, i) => team(i + 1, `学校 ${i + 1}`))
  const result = calculateCcpcQuota(teams, [{ school: '学校 1', rank: 1 }], [
    { school: '学校 1', event: '分站赛', role: '承办', amount: 8 },
    { school: '学校 2', event: '分站赛', role: '出题', amount: 8 },
  ])
  const full = result.schools.find((row) => row.school === '学校 1')
  assert.equal(full.rewardTotal, 12)
  assert.equal(full.effectiveLimit, 0)
  assert.equal(full.preliminary, 0)
  assert.equal(full.firstRoundOrder, null)
  assert.equal(result.schools.find((row) => row.school === '学校 241').firstRound, 1)
  assert.equal(result.firstRound, 240)
  assert.equal(result.schools.find((row) => row.school === '学校 2').effectiveLimit, 4)
})

test('奖励 11 加首轮 1 后退出次轮，奖励 8 的示例按 12 上限截取', () => {
  const teams = Array.from({ length: 12 }, (_, i) => team(i + 1, i < 6 ? 'A 校' : 'B 校'))
  const result = calculateCcpcQuota(teams, [{ school: 'A 校', rank: 11 }], [
    { school: 'A 校', event: '分站赛', role: '出题', amount: 8 },
    { school: 'B 校', event: '分站赛', role: '承办', amount: 8 },
  ])
  const a = result.schools.find((row) => row.school === 'A 校')
  assert.equal(a.effectiveLimit, 1)
  assert.equal(a.validTeamCount, 1)
  assert.equal(a.effectiveTeams.length, 0)
  assert.equal(a.total, 12)
  const b = result.schools.find((row) => row.school === 'B 校')
  assert.equal(b.validTeamCount, 4)
  assert.equal(b.secondRoundRaw, 4)
  assert.equal(b.secondRound, 3)
  assert.equal(b.total, 12)
  assert.equal(b.effectiveTeams[3].withinCutoff, true)
  assert.equal(b.effectiveTeams[3].allocated, false)
  assert.equal(result.cappedQuota, 1)
})

test('截线并列固定取满预算并提示，数据不足不虚增名额', () => {
  const tiedTeams = Array.from({ length: 327 }, (_, i) => ({ ...team(i + 1, `学校 ${i + 1}`, 1, 1), penalty: 100 }))
  const tied = calculateCcpcQuota(tiedTeams, [])
  assert.equal(tied.firstRound, 240)
  assert.equal(tied.secondRound, 326)
  assert.equal(tied.firstRoundTied, true)
  assert.equal(tied.secondRoundTied, true)
  assert.equal(tied.schools[326].total, 0)
  const empty = calculateCcpcQuota([], [])
  assert.equal(empty.firstRound + empty.secondRound, 0)
  assert.equal(empty.firstRoundTied, false)
  assert.equal(empty.secondRoundTied, false)
})

test('实际榜单快照：207 个总决赛奖励、566 个预选赛名额，逐校明细与总数一致', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../src/modules/ccpc-data.json', import.meta.url), 'utf8'))
  const result = calculateCcpcQuota(snapshot.teams, snapshot.finalSchools)
  assert.equal(snapshot.finalSchools.length, 107)
  assert.equal(result.finalReward, 207)
  assert.equal(result.firstRound, 240)
  assert.equal(result.secondRound, 326)
  assert.equal(result.schools.reduce((sum, row) => sum + row.total, 0), 773)
  for (const school of result.schools) {
    assert.ok(school.effectiveTeams.length <= 6)
    assert.ok(school.total <= 12)
    assert.equal(school.secondRound, school.effectiveTeams.filter((entry) => entry.allocated).length)
    assert.equal(school.total, school.firstRound + school.secondRound + school.finalReward)
  }
})

test('实际快照加入承办奖励：预算截取、封顶和三项合计一致', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../src/modules/ccpc-data.json', import.meta.url), 'utf8'))
  const result = calculateCcpcQuota(snapshot.teams, snapshot.finalSchools, buildCcpcHostRewards(seasonScheduleRows))
  assert.equal(result.hostReward, 79)
  assert.equal(result.finalReward, 207)
  assert.equal(result.firstRound, 240)
  assert.equal(result.secondRound + result.cappedQuota, 326)
  const tsinghua = result.schools.find((row) => row.school === '清华大学')
  assert.equal(tsinghua.total, 12)
  assert.equal(tsinghua.preliminary, 0)
  for (const school of result.schools) {
    assert.ok(school.total <= 12)
    assert.ok(school.validTeamCount <= Math.max(0, Math.min(6, 12 - school.rewardTotal)))
    assert.equal(school.total, school.preliminary + school.finalReward + school.hostReward)
  }
})
