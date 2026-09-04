import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listSpecialtyPrograms(moduleLabel) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('specialty_programs').select('*').eq('teacher_id', teacher_id).eq('module_label', moduleLabel).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSpecialtyProgram(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('specialty_programs').insert({
    teacher_id, module_label: values.moduleLabel, title: values.title, template_id: values.templateId,
    scope: values.scope, metric_singular: values.metricSingular, metric_plural: values.metricPlural,
    goal_value: Number(values.goalValue), quick_step: Number(values.quickStep), target_mode: values.targetMode,
    grade_label: values.gradeLabel || null, class_period_ids: values.classPeriodIds ?? [], starts_on: values.startsOn,
    ends_on: values.endsOn, status: 'active', settings: values.settings, progress: {}, logs: [],
  }).select().single()
  if (error) throw error
  return data
}

export async function updateSpecialtyProgram(id, updates) {
  const { data, error } = await supabase.from('specialty_programs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}
