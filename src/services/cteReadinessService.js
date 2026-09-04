import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listCteReadinessKits() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('cte_readiness_kits').select('*').eq('teacher_id', teacher_id).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createCteReadinessKit(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('cte_readiness_kits').insert({ teacher_id, tool_type: values.toolType, title: values.title, inputs: values.inputs, output: values.output }).select().single()
  if (error) throw error
  return data
}

export async function updateCteReadinessKit(id, values) {
  const { data, error } = await supabase.from('cte_readiness_kits').update({ title: values.title, inputs: values.inputs, output: values.output, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}
