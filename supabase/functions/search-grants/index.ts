import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.js'

const API = 'https://api.grants.gov/v1/api'

const ALL_MODULES = ['General / Schoolwide']

const CURATED_SOURCES = [
  {
    id: 'nea-student-success-2026', opportunityNumber: 'NEA-STUDENT-SUCCESS-2026',
    title: 'Student Success Grants', agency: 'The NEA Foundation', sourceType: 'private', sourceKind: 'direct',
    sourceUrl: 'https://www.neafoundation.org/educator-grants-and-fellowships/student-success-grants/',
    openDate: '2026-06-15', closeDate: '2026-09-15', status: 'posted', amountText: 'Up to $5,000',
    schoolTypes: ['Public School'], modules: ALL_MODULES,
    eligibility: ['Current NEA members who are public-school educators or specialized instructional support personnel'],
    categories: ['Student programs', 'Equipment & supplies', 'Technology', 'Field trips & events'],
    description: 'Supports educator-led projects that deepen student learning, problem solving, collaboration, and real-world learning. Funds may support materials, supplies, equipment, transportation, technology, or educational experiences.',
    officialRequirements: 'Active NEA membership is required. Register in the application system by September 10; the application period closes September 15. Verify all current requirements on the official page.',
  },
  {
    id: 'nea-learning-leadership-2026', opportunityNumber: 'NEA-LEADERSHIP-2026',
    title: 'Learning & Leadership Grants', agency: 'The NEA Foundation', sourceType: 'private', sourceKind: 'direct',
    sourceUrl: 'https://www.neafoundation.org/educator-grants-and-fellowships/learning-leadership-grants/',
    openDate: '2026-06-15', closeDate: '2026-09-15', status: 'posted', amountText: 'Up to $5,000',
    schoolTypes: ['Public School'], modules: ALL_MODULES,
    eligibility: ['Current NEA members who are public-school educators or specialized instructional support personnel'],
    categories: ['Professional development'],
    description: 'Funds high-quality professional learning for individual educators or educator groups, including conferences, institutes, action research, lesson development, and collegial study.',
    officialRequirements: 'Active NEA membership is required. Register in the application system by September 10; the application period closes September 15. Verify all current requirements on the official page.',
  },
  {
    id: 'good-sports-school-equipment', opportunityNumber: 'GOOD-SPORTS-SCHOOLS',
    title: 'School Equipment Support', agency: 'Good Sports', sourceType: 'private', sourceKind: 'direct',
    sourceUrl: 'https://www.goodsports.org/school-info/',
    openDate: null, closeDate: null, status: 'posted', amountText: 'Sports and physical-activity equipment support',
    schoolTypes: ['Public School', 'Private School'], modules: ['PE & Health', 'Adaptive PE'],
    eligibility: ['Schools apply as a whole; individual teams or programs are not considered'],
    categories: ['Equipment & supplies', 'Health & wellness', 'Accessibility & inclusion'],
    description: 'Schools can apply for equipment support that expands access to physical activity. Schools with PE programs provide demographic information for the entire student population.',
    officialRequirements: 'The school—not an individual team—must apply. Confirm current intake, eligibility, service area, and documentation on the official application page.',
  },
  {
    id: 'donorschoose-educator-projects', opportunityNumber: 'DONORSCHOOSE-PROJECT',
    title: 'Educator Classroom Project Funding', agency: 'DonorsChoose', sourceType: 'private', sourceKind: 'direct',
    sourceUrl: 'https://help.donorschoose.org/hc/en-us/articles/202000407-Which-teachers-are-eligible-to-use-DonorsChoose',
    openDate: null, closeDate: null, status: 'posted', amountText: 'Project-based crowdfunding',
    schoolTypes: ['Public School'], modules: ALL_MODULES,
    eligibility: ['Eligible full-time public or charter school educators who work directly with students'],
    categories: ['Equipment & supplies', 'Student programs', 'Technology', 'Arts & performances', 'Health & wellness'],
    description: 'Eligible teachers, librarians, therapists, speech-language pathologists, counselors, nurses, and other front-line educators can create projects for classroom and student needs.',
    officialRequirements: 'Public or charter school employment and role requirements apply. Review the official eligibility page before creating a project.',
  },
  {
    id: 'afhk-future-school-grants', opportunityNumber: 'AFHK-GRANT-ALERTS',
    title: 'School Health Grant Alerts', agency: 'Action for Healthy Kids', sourceType: 'private', sourceKind: 'monitor',
    sourceUrl: 'https://actionforhealthykids.org/grants-support/',
    openDate: null, closeDate: null, status: 'monitor', amountText: 'No open grant currently',
    schoolTypes: ['Public School', 'Private School'], modules: ['PE & Health', 'Adaptive PE', 'School Counselors'],
    eligibility: ['Future opportunities are posted for schools and districts'],
    categories: ['Health & wellness', 'Family engagement', 'Student programs'],
    description: 'Action for Healthy Kids currently has no open grant opportunity, but this official page posts future school health, physical activity, active play, nutrition, and whole-child funding.',
    officialRequirements: 'This is a verified watch-list source, not a currently open grant. Subscribe on the official page for future opportunity alerts.',
  },
]

const TOKEN_STOP_WORDS = new Set(['and', 'for', 'from', 'school', 'education', 'student', 'students', 'the', 'with'])

function keywordTerms(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !TOKEN_STOP_WORDS.has(term))
}

function curatedMatches(source: any, moduleLabel: string, schoolType: string, keyword: string, need: string) {
  if (source.schoolTypes?.length && schoolType && !source.schoolTypes.includes(schoolType)) return false
  if (source.modules !== ALL_MODULES && !source.modules.includes(moduleLabel)) return false
  const requested = keywordTerms(`${keyword} ${need}`)
  if (!requested.length) return true
  const haystack = `${source.title} ${source.agency} ${source.description} ${(source.categories || []).join(' ')}`.toLowerCase()
  return requested.some((term) => haystack.includes(term))
}

function clean(value: unknown, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function plainText(value: unknown, max = 12000) {
  return clean(String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' '), max)
}

function isoDate(value: unknown) {
  const text = clean(value, 80)
  if (!text) return null
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function money(value: unknown) {
  if (value == null || value === '') return ''
  const number = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? `$${number.toLocaleString('en-US')}` : clean(value, 80)
}

async function grantsPost(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API}/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Grants.gov returned ${response.status}. Please try again shortly.`)
  const payload = await response.json()
  if (Number(payload?.errorcode ?? 0) !== 0) throw new Error(clean(payload?.msg, 300) || 'Grants.gov could not complete the request.')
  return payload.data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)
  if (!req.headers.get('Authorization')) return errorResponse('Missing Authorization header', 401)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return errorResponse('Invalid JSON body', 400) }

  try {
    if (body.action === 'details') {
      const opportunityId = Number(body.opportunityId)
      if (!Number.isFinite(opportunityId)) return errorResponse('A valid opportunity ID is required.', 400)
      const data = await grantsPost('fetchOpportunity', { opportunityId })
      const synopsis = data?.synopsis ?? {}
      const awardFloor = money(synopsis.awardFloorFormatted || synopsis.awardFloor)
      const awardCeiling = money(synopsis.awardCeilingFormatted || synopsis.awardCeiling)
      return jsonResponse({ opportunity: {
        id: String(data.id), externalId: String(data.id), opportunityNumber: clean(data.opportunityNumber, 120),
        title: clean(data.opportunityTitle, 500), agency: clean(synopsis.agencyName || data?.agencyDetails?.agencyName, 300),
        openDate: isoDate(synopsis.postingDate || synopsis.postingDateStr), closeDate: isoDate(data.originalDueDateDesc || synopsis.responseDate),
        status: data.docType === 'forecast' ? 'forecasted' : 'posted', sourceType: 'federal',
        sourceUrl: `https://www.grants.gov/search-results-detail/${data.id}`, awardFloor, awardCeiling,
        costSharing: synopsis.costSharing === true, eligibility: (synopsis.applicantTypes || []).map((item: any) => clean(item.description, 200)).filter(Boolean),
        categories: (synopsis.fundingActivityCategories || []).map((item: any) => clean(item.description, 160)).filter(Boolean),
        description: plainText(synopsis.synopsisDesc, 12000), officialRequirements: plainText(synopsis.synopsisDesc, 12000),
        contact: { name: clean(synopsis.agencyContactName, 200), email: clean(synopsis.agencyContactEmail, 240), phone: clean(synopsis.agencyContactPhone, 100) },
        lastVerifiedAt: new Date().toISOString(),
      } })
    }

    const moduleLabel = clean(body.moduleLabel)
    const userKeyword = clean(body.keyword)
    const need = clean(body.need)
    const rows = Math.max(1, Math.min(Number(body.rows) || 18, 25))
    const schoolType = clean(body.schoolType)
    const opportunities = CURATED_SOURCES
      .filter((source) => curatedMatches(source, moduleLabel, schoolType, userKeyword, need))
      .sort((a, b) => (a.sourceKind === 'monitor' ? 1 : 0) - (b.sourceKind === 'monitor' ? 1 : 0))
      .slice(0, rows)
      .map((source) => ({ ...source, externalId: source.id, awardFloor: '', awardCeiling: '', costSharing: null, lastVerifiedAt: new Date().toISOString() }))

    return jsonResponse({
      opportunities,
      hitCount: opportunities.length,
      source: 'Verified school and educator funding sources',
      searchNote: 'Direct school and educator opportunities are shown first. Broad federal opportunities are omitted unless they clearly accept school-level applicants.',
    })
  } catch (error) {
    return errorResponse((error as Error)?.message || String(error), 502)
  }
})
