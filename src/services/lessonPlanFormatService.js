import { supabase } from '../lib/supabaseClient'
export { LESSON_FORMAT_SECTIONS, starterSections, starterFormat, parseMtssGoalBank, normalizeMtssGoalNumber } from '../lib/lessonPlanFormats'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Please sign in to save a lesson plan format.')
  return data.user.id
}

export async function listLessonPlanFormats() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('lesson_plan_formats').select('*').eq('teacher_id', teacher_id).order('is_default', { ascending: false }).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getDefaultLessonPlanFormat() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('lesson_plan_formats').select('*').eq('teacher_id', teacher_id).eq('is_default', true).maybeSingle()
  if (error) throw error
  return data
}

async function clearDefault(teacher_id) {
  const { error } = await supabase.from('lesson_plan_formats').update({ is_default: false, updated_at: new Date().toISOString() }).eq('teacher_id', teacher_id).eq('is_default', true)
  if (error) throw error
}

export async function createLessonPlanFormat(values) {
  const teacher_id = await teacherId()
  if (values.is_default) await clearDefault(teacher_id)
  const { data, error } = await supabase.from('lesson_plan_formats').insert({
    teacher_id,
    name: values.name.trim(),
    detail_level: values.detail_level,
    sections: values.sections,
    mtss_goal_bank: values.mtss_goal_bank ?? [],
    instructional_practice_bank: values.instructional_practice_bank ?? [],
    requirement_notes: values.requirement_notes?.trim() || null,
    is_default: Boolean(values.is_default),
  }).select().single()
  if (error) throw error
  return data
}

export async function updateLessonPlanFormat(id, values) {
  const teacher_id = await teacherId()
  if (values.is_default) await clearDefault(teacher_id)
  const { data, error } = await supabase.from('lesson_plan_formats').update({
    name: values.name.trim(),
    detail_level: values.detail_level,
    sections: values.sections,
    mtss_goal_bank: values.mtss_goal_bank ?? [],
    instructional_practice_bank: values.instructional_practice_bank ?? [],
    requirement_notes: values.requirement_notes?.trim() || null,
    is_default: Boolean(values.is_default),
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('teacher_id', teacher_id).select().single()
  if (error) throw error
  return data
}

export async function setDefaultLessonPlanFormat(id) {
  const teacher_id = await teacherId()
  await clearDefault(teacher_id)
  const { data, error } = await supabase.from('lesson_plan_formats').update({ is_default: true, updated_at: new Date().toISOString() }).eq('id', id).eq('teacher_id', teacher_id).select().single()
  if (error) throw error
  return data
}

export async function deleteLessonPlanFormat(id) {
  const teacher_id = await teacherId()
  const { error } = await supabase.from('lesson_plan_formats').delete().eq('id', id).eq('teacher_id', teacher_id)
  if (error) throw error
}

export async function getLessonPlanFormatValues(lessonId, formatId) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('lesson_plan_format_values').select('*').eq('teacher_id', teacher_id).eq('lesson_id', lessonId).eq('format_id', formatId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveLessonPlanFormatValues(lessonId, formatId, values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('lesson_plan_format_values').upsert({
    teacher_id,
    lesson_id: lessonId,
    format_id: formatId,
    mtss_goal_numbers: values.mtss_goal_numbers ?? [],
    mtss_notes: values.mtss_notes?.trim() || null,
    instructional_practice_ids: values.instructional_practice_ids ?? [],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'teacher_id,lesson_id,format_id' }).select().single()
  if (error) throw error
  return data
}
