import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listReadingChallenges() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase
    .from('library_reading_challenges')
    .select('*')
    .eq('teacher_id', teacher_id)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createReadingChallenge(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase
    .from('library_reading_challenges')
    .insert({
      teacher_id,
      title: values.title,
      theme: values.theme,
      scope: values.scope,
      metric: values.metric,
      target_mode: values.targetMode,
      goal_value: Number(values.goalValue),
      grade_label: values.gradeLabel || null,
      class_period_ids: values.classPeriodIds ?? [],
      starts_on: values.startsOn,
      ends_on: values.endsOn,
      status: 'active',
      progress: {},
      logs: [],
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateReadingChallenge(id, updates) {
  const payload = { ...updates, updated_at: new Date().toISOString() }
  const { data, error } = await supabase
    .from('library_reading_challenges')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
