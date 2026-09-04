import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listSpecialtyExperiences(experienceType, moduleLabel = null) {
  const teacher_id = await teacherId()
  let query = supabase
    .from('specialty_event_plans')
    .select('*')
    .eq('teacher_id', teacher_id)
    .eq('experience_type', experienceType)
  if (moduleLabel) query = query.eq('module_label', moduleLabel)
  const { data, error } = await query.order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSpecialtyExperience(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase
    .from('specialty_event_plans')
    .insert({
      teacher_id,
      experience_type: values.experienceType,
      module_label: values.moduleLabel,
      title: values.title,
      inputs: values.inputs,
      plan: values.plan,
      status: values.status ?? 'active',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSpecialtyExperience(id, values) {
  const { data, error } = await supabase
    .from('specialty_event_plans')
    .update({ title: values.title, inputs: values.inputs, plan: values.plan, status: values.status ?? 'active', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
