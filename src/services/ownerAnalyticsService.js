import { supabase } from '../lib/supabaseClient'

export async function getOwnerAnalytics() {
  const { data, error } = await supabase.functions.invoke('owner-dashboard', { body: {} })
  if (error) {
    let message = error.message || 'Could not load owner analytics.'
    try { message = (await error.context?.json?.())?.error || message } catch { /* keep message */ }
    throw new Error(message)
  }
  return data
}

export async function saveCancellationFeedback(reason, detail) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const { error } = await supabase.from('cancellation_feedback').insert({
    user_id: userData.user.id,
    reason,
    detail: detail.trim() || null,
  })
  if (error) throw error
}
