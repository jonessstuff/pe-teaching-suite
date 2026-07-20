import { supabase } from '../lib/supabaseClient'

export async function createPlan({ name, planData }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('field_day_plans')
    .insert({ teacher_id: user.id, name: name || 'Field Day Plan', plan_data: planData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlan(id, { name, planData } = {}) {
  const updates = {}
  if (name !== undefined) updates.name = name
  if (planData !== undefined) updates.plan_data = planData
  const { data, error } = await supabase
    .from('field_day_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listPlans() {
  const { data, error } = await supabase
    .from('field_day_plans')
    .select('id, name, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPlan(id) {
  const { data, error } = await supabase
    .from('field_day_plans')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deletePlan(id) {
  const { error } = await supabase.from('field_day_plans').delete().eq('id', id)
  if (error) throw error
}
