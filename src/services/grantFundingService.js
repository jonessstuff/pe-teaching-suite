import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user?.id) throw new Error('Please sign in to use the funding workspace.')
  return data.user.id
}

async function functionError(error, fallback) {
  try {
    const body = await error?.context?.json?.()
    if (body?.error) return new Error(body.error)
  } catch { /* use the safe fallback below */ }
  return new Error(error?.message || fallback)
}

export async function searchGrantOpportunities(filters) {
  const { data, error } = await supabase.functions.invoke('search-grants', { body: { action: 'search', ...filters } })
  if (error) throw await functionError(error, 'Grant search is temporarily unavailable.')
  return data
}

export async function fetchGrantOpportunity(opportunityId) {
  const { data, error } = await supabase.functions.invoke('search-grants', { body: { action: 'details', opportunityId } })
  if (error) throw await functionError(error, 'The official opportunity details could not be loaded.')
  return data
}

export async function listGrantProjects() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('grant_projects').select('*').eq('teacher_id', teacher_id).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createGrantProject(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('grant_projects').insert({
    teacher_id, module_label: values.moduleLabel || 'General / Schoolwide', grade_band: values.gradeBand || 'K–12',
    school_type: values.schoolType || 'Public School', title_i_status: values.titleIStatus || 'Not specified',
    free_reduced_lunch_percent: values.freeReducedLunchPercent === '' ? null : values.freeReducedLunchPercent,
    source_type: values.sourceType || 'manual',
    external_id: values.externalId || null, opportunity_number: values.opportunityNumber || null, title: values.title,
    funder: values.funder || '', source_url: values.sourceUrl || '', open_date: values.openDate || null, close_date: values.closeDate || null,
    amount_text: values.amountText || '', eligibility_summary: values.eligibilitySummary || '', official_requirements: values.officialRequirements || '',
    status: values.status || 'saved', finder_data: values.finderData || {}, application_inputs: values.applicationInputs || {}, draft: values.draft || {},
  }).select().single()
  if (error) throw error
  return data
}

export async function updateGrantProject(id, updates) {
  const { data, error } = await supabase.from('grant_projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function generateGrantDraft(input) {
  const { data, error } = await supabase.functions.invoke('generate-grant-draft', { body: input })
  if (error) throw await functionError(error, 'The grant draft could not be generated.')
  return data
}
