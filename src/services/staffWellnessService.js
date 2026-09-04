import { supabase } from '../lib/supabaseClient'

async function teacherId() { const { data, error } = await supabase.auth.getUser(); if (error) throw error; return data.user.id }

export async function listStaffWellnessChallenges() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('staff_wellness_challenges').select('*').eq('teacher_id', teacher_id).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createStaffWellnessChallenge(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('staff_wellness_challenges').insert({ teacher_id, title: values.title, template_id: values.templateId, public_token: values.publicToken, settings: values.settings, participants: values.participants, progress: values.progress, bingo: values.bingo, messages: values.messages }).select().single()
  if (error) throw error
  return data
}

export async function updateStaffWellnessChallenge(id, values) {
  const { data, error } = await supabase.from('staff_wellness_challenges').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function listStaffWellnessCheckIns(challengeId) {
  const { data, error } = await supabase.from('staff_wellness_checkins').select('*').eq('challenge_id', challengeId).order('submitted_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function approveStaffWellnessCheckIn(id) {
  const { data, error } = await supabase.from('staff_wellness_checkins').update({ status: 'approved' }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getPublicStaffWellnessChallenge(token) {
  const { data, error } = await supabase.rpc('get_public_staff_wellness_challenge', { p_token: token })
  if (error) throw error
  return data
}

export async function submitStaffWellnessCheckIn(token, values) {
  const { data, error } = await supabase.rpc('submit_staff_wellness_checkin', { p_token: token, p_name: values.name, p_team: values.team, p_amount: Number(values.amount), p_activity: values.activity })
  if (error) throw error
  return data
}
