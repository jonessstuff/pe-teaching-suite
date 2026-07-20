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

export async function updateProfile({ full_name, school_name, district_name, default_subject, state }) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, school_name, district_name, default_subject, state })
    .eq('id', userData.user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
