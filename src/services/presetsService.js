import { supabase } from '../lib/supabaseClient'

export async function listPresets() {
  const { data, error } = await supabase
    .from('lesson_presets')
    .select('id, name, settings, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function savePreset(name, settings) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('lesson_presets')
    .insert({ user_id: user.id, name, settings })
    .select('id, name, settings, created_at')
    .single()
  if (error) throw error
  return data
}

export async function deletePreset(id) {
  const { error } = await supabase
    .from('lesson_presets')
    .delete()
    .eq('id', id)
  if (error) throw error
}
