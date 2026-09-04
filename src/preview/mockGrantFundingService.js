const opportunities = [
  {
    id: 'nea-student-success-2026', externalId: 'nea-student-success-2026', opportunityNumber: 'NEA-STUDENT-SUCCESS-2026',
    title: 'Student Success Grants', agency: 'The NEA Foundation',
    openDate: '2026-06-15', closeDate: '2026-09-15', status: 'posted', sourceType: 'private', sourceKind: 'direct', sourceUrl: 'https://www.neafoundation.org/educator-grants-and-fellowships/student-success-grants/',
    amountText: 'Up to $5,000', schoolTypes: ['Public School'], modules: ['all'], eligibility: ['Current NEA members who are public-school educators or specialized instructional support personnel'],
    description: 'Supports educator-led projects and can fund materials, supplies, equipment, transportation, technology, or student educational experiences.', categories: ['Student programs', 'Equipment & supplies', 'Technology', 'Field trips & events'], lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'good-sports-school-equipment', externalId: 'good-sports-school-equipment', opportunityNumber: 'GOOD-SPORTS-SCHOOLS',
    title: 'School Equipment Support', agency: 'Good Sports',
    openDate: null, closeDate: null, status: 'posted', sourceType: 'private', sourceKind: 'direct', sourceUrl: 'https://www.goodsports.org/school-info/',
    amountText: 'Sports and physical-activity equipment support', schoolTypes: ['Public School', 'Private School'], modules: ['PE & Health', 'Adaptive PE'], eligibility: ['Schools apply as a whole; individual teams or programs are not considered'],
    description: 'Schools can apply for equipment support that expands access to physical activity and PE.', categories: ['Equipment & supplies', 'Health & wellness'], lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'donorschoose-educator-projects', externalId: 'donorschoose-educator-projects', opportunityNumber: 'DONORSCHOOSE-PROJECT',
    title: 'Educator Classroom Project Funding', agency: 'DonorsChoose',
    openDate: null, closeDate: null, status: 'posted', sourceType: 'private', sourceKind: 'direct', sourceUrl: 'https://help.donorschoose.org/hc/en-us/articles/202000407-Which-teachers-are-eligible-to-use-DonorsChoose',
    amountText: 'Project-based crowdfunding', schoolTypes: ['Public School'], modules: ['all'], eligibility: ['Eligible full-time public or charter school educators who work directly with students'],
    description: 'Eligible teachers and specialists can create projects for classroom equipment, materials, programs, and student needs.', categories: ['Equipment & supplies', 'Student programs', 'Technology', 'Health & wellness'], lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'afhk-future-school-grants', externalId: 'afhk-future-school-grants', opportunityNumber: 'AFHK-GRANT-ALERTS',
    title: 'School Health Grant Alerts', agency: 'Action for Healthy Kids',
    openDate: null, closeDate: null, status: 'monitor', sourceType: 'private', sourceKind: 'monitor', sourceUrl: 'https://actionforhealthykids.org/grants-support/',
    amountText: 'No open grant currently', schoolTypes: ['Public School', 'Private School'], modules: ['PE & Health', 'Adaptive PE', 'School Counselors'], eligibility: ['Future opportunities are posted for schools and districts'],
    description: 'Verified watch-list page for future school health, physical activity, active play, and whole-child funding.', categories: ['Health & wellness', 'Family engagement'], lastVerifiedAt: new Date().toISOString(),
  },
]

let projects = []
const clone = (value) => structuredClone(value)

export async function searchGrantOpportunities({ keyword = '', moduleLabel = '', need = '', schoolType = 'Public School' } = {}) {
  const terms = `${keyword} ${need}`.toLowerCase().split(/\s+/).filter((term) => term.length > 2)
  const matches = opportunities.filter((item) => item.schoolTypes.includes(schoolType) && (item.modules.includes('all') || item.modules.includes(moduleLabel)))
    .filter((item) => !terms.length || terms.some((term) => `${item.title} ${item.description} ${item.categories.join(' ')}`.toLowerCase().includes(term)))
  return { opportunities: clone(matches), hitCount: matches.length, source: 'Verified educator funding preview data' }
}

export async function fetchGrantOpportunity(opportunityId) {
  return { opportunity: clone(opportunities.find((item) => item.id === String(opportunityId)) ?? opportunities[0]) }
}

export async function listGrantProjects() { return clone(projects) }

export async function createGrantProject(values) {
  const row = {
    id: `grant-${Date.now()}`, module_label: values.moduleLabel || 'General / Schoolwide', grade_band: values.gradeBand || 'K–12',
    school_type: values.schoolType || 'Public School', title_i_status: values.titleIStatus || 'Not specified',
    free_reduced_lunch_percent: values.freeReducedLunchPercent === '' ? null : values.freeReducedLunchPercent,
    source_type: values.sourceType || 'manual',
    external_id: values.externalId || null, opportunity_number: values.opportunityNumber || null, title: values.title,
    funder: values.funder || '', source_url: values.sourceUrl || '', open_date: values.openDate || null, close_date: values.closeDate || null,
    amount_text: values.amountText || '', eligibility_summary: values.eligibilitySummary || '', official_requirements: values.officialRequirements || '',
    status: values.status || 'saved', finder_data: values.finderData || {}, application_inputs: values.applicationInputs || {}, draft: values.draft || {},
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
  projects = [row, ...projects]
  return clone(row)
}

export async function updateGrantProject(id, updates) {
  const row = projects.find((item) => item.id === id)
  if (!row) throw new Error('Saved grant not found.')
  Object.assign(row, clone(updates), { updated_at: new Date().toISOString() })
  return clone(row)
}

export async function generateGrantDraft({ opportunity = {}, inputs = {} }) {
  const amount = inputs.requestedAmount ? `$${Number(inputs.requestedAmount).toLocaleString()}` : 'the requested funding'
  const schoolContext = [inputs.gradeBand, inputs.schoolType].filter(Boolean).join(' ')
  const group = inputs.studentsServed || `${schoolContext || 'K–12 school'} students and educators`
  const project = inputs.projectTitle || opportunity.title || 'the proposed project'
  const needContext = [inputs.titleIStatus && inputs.titleIStatus !== 'Not specified' ? inputs.titleIStatus : '', inputs.freeReducedLunchPercent !== '' && inputs.freeReducedLunchPercent != null ? `${inputs.freeReducedLunchPercent}% of students qualify for free or reduced-price lunch` : ''].filter(Boolean).join('; ')
  return {
    executive_summary: `${inputs.organization || 'Our school'} requests ${amount} to implement ${project}. The project will serve ${group} by addressing ${inputs.needStatement || 'the documented instructional need'} through practical, measurable activities aligned with the funder’s published priorities.`,
    needs_statement: `${inputs.needStatement || 'Describe the local problem with current evidence.'}${needContext ? `\n\nSchool context supplied by the applicant: ${needContext}. Verify this information against current school or district records before submission.` : ''}\n\nCurrent resources are not sufficient to meet this need consistently. Baseline information will be documented before implementation, and the project will prioritize equitable access for the students identified in the application.`,
    goals_objectives: [`By ${inputs.targetDate || 'the end of the grant period'}, implement the planned project activities for ${group}.`, `Document measurable improvement using ${inputs.measurement || 'participation, completion, and outcome data'}.`, 'Share progress with stakeholders at agreed-upon checkpoints and adjust implementation when data show a need.'],
    project_design: `${inputs.activities || 'List the major activities, who will lead them, and when each will happen.'}\n\nImplementation will begin with preparation and purchasing, move into direct student services, and conclude with evaluation, reporting, and a sustainability handoff.`,
    evaluation_plan: `The project team will collect baseline, midpoint, and final data using ${inputs.measurement || 'participation records, student work, surveys, and outcome measures'}. Results will be reviewed by ${inputs.projectLead || 'the project lead'} and summarized for school leaders and the funder.`,
    sustainability: inputs.sustainability || 'Reusable materials, staff capacity, partnerships, and integration into existing school routines will sustain the work after the grant period.',
    budget_narrative: `${amount} will support ${inputs.budgetSummary || 'allowable materials, equipment, services, and implementation costs directly connected to the proposed activities'}. Final categories and calculations must be checked against the official notice and district purchasing rules.`,
    timeline: [{ period: 'Planning', action: 'Confirm requirements, partners, baseline data, purchasing rules, and responsibilities.' }, { period: 'Launch', action: 'Purchase approved resources, prepare staff, and begin project activities.' }, { period: 'Implementation', action: 'Deliver services, monitor participation, and review progress data.' }, { period: 'Evaluation & reporting', action: 'Analyze outcomes, document spending, report results, and continue the sustainability plan.' }],
    compliance_checklist: ['Verify applicant eligibility in the official notice.', 'Confirm the deadline, time zone, and submission system.', 'Match every expense to an allowable cost and confirm any required match.', 'Use local data and cite its source—do not submit placeholder text.', 'Obtain district approvals and required partner letters before submission.'],
    questions_to_resolve: ['What exact evidence establishes the need?', 'Which outcomes does the funder score most heavily?', 'Who owns each task and required attachment?'],
  }
}
