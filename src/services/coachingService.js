import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listCoachingWorkspaces() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('coaching_workspaces')
    .select('*').eq('teacher_id', teacher_id).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createCoachingWorkspace(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('coaching_workspaces').insert({
    teacher_id,
    team_name: values.teamName,
    sport: values.sport,
    season: values.season || null,
    status: 'tryouts',
    rubric: values.rubric,
    comment_tags: values.commentTags,
    comments_affect_score: values.commentsAffectScore,
    tryout_days: values.tryoutDays,
    candidates: values.candidates ?? [],
    team_tools: { practices: [], plays: [], events: [] },
  }).select().single()
  if (error) throw error
  return data
}

export async function updateCoachingWorkspace(id, updates) {
  const payload = { updated_at: new Date().toISOString() }
  const mapping = {
    teamName: 'team_name', sport: 'sport', season: 'season', status: 'status',
    rubric: 'rubric', commentTags: 'comment_tags', commentsAffectScore: 'comments_affect_score',
    tryoutDays: 'tryout_days', candidates: 'candidates', teamTools: 'team_tools',
  }
  for (const [key, column] of Object.entries(mapping)) {
    if (updates[key] !== undefined) payload[column] = updates[key]
  }
  const { data, error } = await supabase.from('coaching_workspaces')
    .update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCoachingWorkspace(id) {
  const { error } = await supabase.from('coaching_workspaces').delete().eq('id', id)
  if (error) throw error
}
