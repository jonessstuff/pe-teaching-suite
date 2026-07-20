import { supabase } from '../lib/supabaseClient'

export async function createAssessment({ title, subject, gradeBands, assessmentType, content, lessonId }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      teacher_id: user.id,
      title,
      subject,
      grade_bands: gradeBands ?? [],
      assessment_type: assessmentType,
      content,
      lesson_id: lessonId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listAssessments() {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAssessment(id) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteAssessment(id) {
  const { error } = await supabase.from('assessments').delete().eq('id', id)
  if (error) throw error
}
