import { supabase } from '../lib/supabaseClient'

export async function createGuide({ name, guideData }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('pacing_guides')
    .insert({ teacher_id: user.id, name, guide_data: guideData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGuide(id, { name, guideData } = {}) {
  const updates = {}
  if (name !== undefined) updates.name = name
  if (guideData !== undefined) updates.guide_data = guideData
  const { data, error } = await supabase
    .from('pacing_guides')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listGuides() {
  const { data, error } = await supabase
    .from('pacing_guides')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getGuide(id) {
  const { data, error } = await supabase
    .from('pacing_guides')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteGuide(id) {
  const { error } = await supabase.from('pacing_guides').delete().eq('id', id)
  if (error) throw error
}
