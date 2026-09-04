import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listAdvancedThinkersCurricula() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('advanced_thinkers_curricula').select('*').eq('teacher_id', teacher_id).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createAdvancedThinkersCurriculum(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('advanced_thinkers_curricula').insert({ teacher_id, title: values.title, grade_band: values.gradeBand, weeks: values.weeks, inputs: values.inputs, curriculum: values.curriculum }).select().single()
  if (error) throw error
  return data
}
