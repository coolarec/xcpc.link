export interface SchoolFacts {
  schoolId: string
  school: string
  sourceNames: string[]
  rank: number | null
  round1Rank: number | null
  round2Rank: number | null
  teams: number
  top500Teams: number
}

interface SchoolSource {
  school: string
  sourceNames?: readonly string[]
  rank?: number | null
  round1Rank?: number | null
  round2Rank?: number | null
  teams?: number
  top500Teams?: number
}

export interface SchoolFactsSource {
  schools: readonly SchoolSource[]
  meta?: {
    specialSchools?: {
      worldFinalists2024?: readonly string[]
      worldFinalists2025?: readonly string[]
      worldFinalists2026?: readonly string[]
      ecHosts2026?: readonly string[]
      ecHosts2025?: readonly string[]
      ecfHosts50?: readonly string[]
      networkSetter?: string
    }
    invitationSchools?: {
      xianTop100?: readonly string[]
      wuhanTop60?: readonly string[]
      nanchangSilver?: Readonly<Record<string, number>>
    }
  }
}

// Only verified aliases belong here. Campus suffixes must remain distinct until
// the source explicitly identifies them as the same participating institution.
const schoolAliases: Readonly<Record<string, string>> = {
  齐鲁工业大学: '齐鲁工业大学（山东省科学院）',
  信息工程大学: '中国人民解放军网络空间部队信息工程大学',
}

export const normalizeSchoolName = (name: string): string => {
  const trimmed = name.trim()
  return Object.prototype.hasOwnProperty.call(schoolAliases, trimmed) ? schoolAliases[trimmed] : trimmed
}

// Canonical names are stable identifiers shared by rankings and award lists.
// A future display-name change should be added as an alias to this identifier.
export const schoolIdFor = (name: string): string => normalizeSchoolName(name)

const positiveRank = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null

const minimumRank = (left: number | null, right: number | null): number | null =>
  left === null ? right : right === null ? left : Math.min(left, right)

const teamCount = (value: number | undefined): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0

export const buildSchoolFacts = (data: SchoolFactsSource): SchoolFacts[] => {
  const schools = new Map<string, SchoolFacts>()
  const includeSchool = (name: string): SchoolFacts | undefined => {
    const sourceName = name.trim()
    if (!sourceName) return undefined
    const schoolId = schoolIdFor(sourceName)
    let school = schools.get(schoolId)
    if (!school) {
      school = {
        schoolId,
        school: normalizeSchoolName(sourceName),
        sourceNames: [schoolId],
        rank: null,
        round1Rank: null,
        round2Rank: null,
        teams: 0,
        top500Teams: 0,
      }
      schools.set(schoolId, school)
    }
    if (!school.sourceNames.includes(sourceName)) school.sourceNames.push(sourceName)
    return school
  }

  for (const source of data.schools) {
    const school = includeSchool(source.school)
    if (!school) continue
    for (const name of source.sourceNames || []) {
      if (schoolIdFor(name) === school.schoolId) includeSchool(name)
    }
    school.rank = minimumRank(school.rank, positiveRank(source.rank))
    school.round1Rank = minimumRank(school.round1Rank, positiveRank(source.round1Rank))
    school.round2Rank = minimumRank(school.round2Rank, positiveRank(source.round2Rank))
    // Existing snapshots contain per-school maxima across rounds. They cannot
    // safely be summed again; the importer merges aliases before counting teams.
    school.teams = Math.max(school.teams, teamCount(source.teams))
    school.top500Teams = Math.max(school.top500Teams, teamCount(source.top500Teams))
  }

  const special = data.meta?.specialSchools
  const invitation = data.meta?.invitationSchools
  const awardLists = [
    special?.worldFinalists2024, special?.worldFinalists2025, special?.worldFinalists2026,
    special?.ecHosts2026, special?.ecHosts2025, special?.ecfHosts50,
    special?.networkSetter?.split('、'), invitation?.xianTop100, invitation?.wuhanTop60,
    Object.entries(invitation?.nanchangSilver ?? {}).filter(([, count]) => count > 0).map(([name]) => name),
  ]
  // Lists that only affect caps (such as Shanghai schools) do not award places.
  for (const names of awardLists) names?.forEach(includeSchool)
  return [...schools.values()]
}
