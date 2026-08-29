import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function createRunSession({ classPeriodId, distanceLabel, distanceMiles, lapsRequired }) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('run_sessions').insert({
    teacher_id,
    class_period_id: classPeriodId,
    distance_label: distanceLabel,
    distance_miles: distanceMiles || null,
    laps_required: Number(lapsRequired),
  }).select().single()
  if (error) throw error
  return data
}

export async function getActiveRunSession(classPeriodId) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('run_sessions').select('*')
    .eq('teacher_id', teacher_id).eq('class_period_id', classPeriodId)
    .is('completed_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function listRunSessions(classPeriodId, limit = 12) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('run_sessions').select('*')
    .eq('teacher_id', teacher_id).eq('class_period_id', classPeriodId)
    .order('started_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}

export async function listRunResults(sessionId) {
  const { data, error } = await supabase.from('run_results').select('*').eq('session_id', sessionId)
  if (error) throw error
  return data ?? []
}

export async function saveRunResult({ sessionId, studentId, lapsCompleted, lapTimesMs, finishMs, status }) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('run_results').upsert({
    teacher_id,
    session_id: sessionId,
    student_id: studentId,
    laps_completed: lapsCompleted,
    lap_times_ms: lapTimesMs,
    finish_ms: finishMs,
    status,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'session_id,student_id' }).select().single()
  if (error) throw error
  return data
}

export async function completeRunSession(sessionId) {
  const { data, error } = await supabase.from('run_sessions')
    .update({ completed_at: new Date().toISOString() }).eq('id', sessionId).select().single()
  if (error) throw error
  return data
}
