import { supabase } from '../lib/supabaseClient'

export async function getProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single()

  if (error) throw error
  return data
}

/**
 * Record that the user has seen the What's New notes for `version`, so the
 * banner doesn't show again until a newer release bumps WHATS_NEW.version.
 */
export async function dismissWhatsNew(version) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const { error } = await supabase
    .from('profiles')
    .update({ whats_new_version: version })
    .eq('id', userData.user.id)

  if (error) throw error
}

export async function updateProfile({ full_name, school_name, district_name, default_subject, state, teaching_areas, cte_pathways, teaching_other }) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, school_name, district_name, default_subject, state, teaching_areas, cte_pathways, teaching_other })
    .eq('id', userData.user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
