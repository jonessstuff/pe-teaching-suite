import { supabase } from '../lib/supabaseClient'

export async function getOwnerAnalytics(days = 7) {
  let lastError
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const body = { days }
    if (days === 0) {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      body.since = startOfToday.toISOString()
      body.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    const { data, error } = await supabase.functions.invoke('owner-dashboard', { body })
    if (!error) return data
    lastError = error
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 650))
  }
  let message = lastError?.message || 'Could not load owner analytics.'
  try { message = (await lastError?.context?.json?.())?.error || message } catch { /* keep message */ }
  throw new Error(message)
}

export async function saveOwnerContact(payload) {
  const { data, error } = await supabase.functions.invoke('owner-dashboard', { body: { action: 'save_contact', ...payload } })
  if (error) throw new Error(error.message || 'Could not save customer follow-up.')
  return data
}

export async function saveSchoolLead(payload) {
  const { data, error } = await supabase.functions.invoke('owner-dashboard', { body: { action: 'save_school_lead', ...payload } })
  if (error) throw new Error(error.message || 'Could not save school lead follow-up.')
  return data
}

export async function sendCancellationRecoveryEmail(userId) {
  const { data, error } = await supabase.functions.invoke('owner-dashboard', {
    body: { action: 'send_cancellation_recovery', userId },
  })
  if (error) {
    let message = error.message || 'Could not send the cancellation recovery email.'
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
