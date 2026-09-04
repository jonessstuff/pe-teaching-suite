import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.js'
import { callClaudeForJson } from '../_shared/anthropic.js'

const schema = {
  type: 'object', additionalProperties: false,
  required: ['executive_summary','needs_statement','goals_objectives','project_design','evaluation_plan','sustainability','budget_narrative','timeline','compliance_checklist','questions_to_resolve'],
  properties: {
    executive_summary: { type: 'string' }, needs_statement: { type: 'string' },
    goals_objectives: { type: 'array', minItems: 3, items: { type: 'string' } }, project_design: { type: 'string' },
    evaluation_plan: { type: 'string' }, sustainability: { type: 'string' }, budget_narrative: { type: 'string' },
    timeline: { type: 'array', minItems: 3, items: { type: 'object', additionalProperties: false, required: ['period','action'], properties: { period: { type: 'string' }, action: { type: 'string' } } } },
    compliance_checklist: { type: 'array', minItems: 5, items: { type: 'string' } }, questions_to_resolve: { type: 'array', items: { type: 'string' } },
  },
}

function limited(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : value
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)
  if (!req.headers.get('Authorization')) return errorResponse('Missing Authorization header', 401)
  let body: any
  try { body = await req.json() } catch { return errorResponse('Invalid JSON body', 400) }

  const opportunity = body?.opportunity ?? {}
  const inputs = body?.inputs ?? {}
  if (!limited(inputs.needStatement, 8000) || !limited(inputs.activities, 8000)) return errorResponse('Need statement and planned activities are required.', 400)

  const safe = {
    opportunity: {
      title: limited(opportunity.title, 500), funder: limited(opportunity.agency || opportunity.funder, 300),
      number: limited(opportunity.opportunityNumber, 120), deadline: limited(opportunity.closeDate, 40),
      eligibility: Array.isArray(opportunity.eligibility) ? opportunity.eligibility.slice(0, 20).map((item: unknown) => limited(item, 300)) : [],
      officialRequirements: limited(opportunity.officialRequirements, 30000), sourceUrl: limited(opportunity.sourceUrl, 1000),
    },
    inputs: {
      projectTitle: limited(inputs.projectTitle, 500), organization: limited(inputs.organization, 300), projectLead: limited(inputs.projectLead, 200),
      gradeBand: limited(inputs.gradeBand, 80), schoolType: limited(inputs.schoolType, 80), titleIStatus: limited(inputs.titleIStatus, 80),
      freeReducedLunchPercent: limited(String(inputs.freeReducedLunchPercent ?? ''), 20),
      studentsServed: limited(inputs.studentsServed, 1000), requestedAmount: limited(String(inputs.requestedAmount || inputs.budgetTotal || ''), 80), targetDate: limited(inputs.targetDate, 100),
      needStatement: limited(inputs.needStatement, 8000), evidence: limited(inputs.evidence, 8000), activities: limited(inputs.activities, 10000),
      measurement: limited(inputs.measurement, 5000), sustainability: limited(inputs.sustainability, 5000), partners: limited(inputs.partners, 3000),
      officialPriorities: limited(inputs.officialPriorities, 6000), budgetItems: Array.isArray(inputs.budgetItems) ? inputs.budgetItems.slice(0, 50) : [],
    },
  }

  const system = `You are an education grant-writing assistant. Produce a strong working draft grounded ONLY in the supplied official notice and educator facts.
Never invent statistics, partners, credentials, eligibility, dates, costs, outcomes, research citations, or commitments. If information is missing, use careful non-factual framing in the narrative and add a specific question to questions_to_resolve.
Use grade band, school type, Title I status, and free/reduced-lunch percentage only when supplied. Treat them as applicant-provided context that must be verified, never as proof of eligibility.
Do not claim the applicant is eligible. Do not guarantee funding. The official notice always controls.
Make objectives measurable when the inputs support it. Tie every budget statement to described activities. Keep the application persuasive, specific, concise, and easy to edit.
The compliance checklist must remind the applicant to verify eligibility, allowable costs, required match, attachments, approvals, deadline/time zone, and every factual claim.`
  const user = `Create the editable application packet from this JSON:\n${JSON.stringify(safe)}`

  try {
    return jsonResponse(await callClaudeForJson(system, user, 9000, undefined, schema))
  } catch (error) {
    return errorResponse((error as Error)?.message || String(error), 500)
  }
})
