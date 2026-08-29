import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function createRunSession({ classPeriodId, distanceLabel, distanceMiles, lapsRequired, notes }) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('run_sessions').insert({
    teacher_id,
    class_period_id: classPeriodId,
    distance_label: distanceLabel,
    distance_miles: distanceMiles || null,
    laps_required: Number(lapsRequired),
    notes: notes?.trim() || null,
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

export async function listRunResultsForSessions(sessionIds) {
  if (!sessionIds?.length) return []
  const { data, error } = await supabase.from('run_results').select('*').in('session_id', sessionIds)
  if (error) throw error
  return data ?? []
}

export async function listRunGoals(studentId) {
  const { data, error } = await supabase.from('run_goals').select('*')
    .eq('student_id', studentId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createRunGoal({ studentId, distanceLabel, baselineMs, targetMs, targetDate }) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('run_goals').insert({
    teacher_id,
    student_id: studentId,
    distance_label: distanceLabel,
    baseline_ms: baselineMs,
    target_ms: targetMs,
    target_date: targetDate,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateRunGoalProgress(goalId, progressStatus) {
  const { data, error } = await supabase.from('run_goals').update({
    progress_status: progressStatus,
    status: progressStatus === 'achieved' ? 'achieved' : 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', goalId).select().single()
  if (error) throw error
  return data
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

export async function createPastRun({ classPeriodId, runDate, distanceLabel, distanceMiles, lapsRequired, notes, entries }) {
  const teacher_id = await teacherId()
  const startedAt = new Date(`${runDate}T12:00:00`).toISOString()
  const { data: session, error: sessionError } = await supabase.from('run_sessions').insert({
    teacher_id,
    class_period_id: classPeriodId,
    run_date: runDate,
    distance_label: distanceLabel,
    distance_miles: distanceMiles || null,
    laps_required: Number(lapsRequired),
    started_at: startedAt,
    completed_at: startedAt,
    notes: notes?.trim() || null,
  }).select().single()
  if (sessionError) throw sessionError

  const rows = entries.map((entry) => ({
    teacher_id,
    session_id: session.id,
    student_id: entry.studentId,
    laps_completed: entry.status === 'finished' ? Number(lapsRequired) : 0,
    lap_times_ms: entry.status === 'finished' ? [entry.finishMs] : [],
    finish_ms: entry.status === 'finished' ? entry.finishMs : null,
    status: entry.status,
  }))
  if (rows.length) {
    const { error: resultsError } = await supabase.from('run_results').insert(rows)
    if (resultsError) throw resultsError
  }
  return session
}
