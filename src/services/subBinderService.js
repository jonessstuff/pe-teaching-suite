import { supabase } from '../lib/supabaseClient'

export async function createBinder({ name, subject, binderData }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('sub_binders')
    .insert({ teacher_id: user.id, name, subject, binder_data: binderData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBinder(id, { name, binderData } = {}) {
  const updates = {}
  if (name !== undefined) updates.name = name
  if (binderData !== undefined) updates.binder_data = binderData
  const { data, error } = await supabase
    .from('sub_binders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listBinders() {
  const { data, error } = await supabase
    .from('sub_binders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getBinder(id) {
  const { data, error } = await supabase
    .from('sub_binders')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteBinder(id) {
  const { error } = await supabase.from('sub_binders').delete().eq('id', id)
  if (error) throw error
}
