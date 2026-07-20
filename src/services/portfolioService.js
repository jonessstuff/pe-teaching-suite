import { supabase } from '../lib/supabaseClient'

export async function createPortfolio({ title, teachingPhilosophy, selectedLessonIds, reflections, studentWorkExamples, professionalGoals }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      teacher_id: user.id,
      title: title || 'My Teaching Portfolio',
      teaching_philosophy: teachingPhilosophy ?? null,
      selected_lesson_ids: selectedLessonIds ?? [],
      reflections: reflections ?? {},
      student_work_examples: studentWorkExamples ?? null,
      professional_goals: professionalGoals ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePortfolio(id, updates = {}) {
  const row = {}
  if (updates.title !== undefined) row.title = updates.title
  if (updates.teachingPhilosophy !== undefined) row.teaching_philosophy = updates.teachingPhilosophy
  if (updates.selectedLessonIds !== undefined) row.selected_lesson_ids = updates.selectedLessonIds
  if (updates.reflections !== undefined) row.reflections = updates.reflections
  if (updates.studentWorkExamples !== undefined) row.student_work_examples = updates.studentWorkExamples
  if (updates.professionalGoals !== undefined) row.professional_goals = updates.professionalGoals

  const { data, error } = await supabase
    .from('portfolios')
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listPortfolios() {
  const { data, error } = await supabase
    .from('portfolios')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPortfolio(id) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deletePortfolio(id) {
  const { error } = await supabase.from('portfolios').delete().eq('id', id)
  if (error) throw error
}
