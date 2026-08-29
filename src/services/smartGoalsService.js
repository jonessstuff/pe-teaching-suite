import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

function sortGoal(goal) {
  return {
    ...goal,
    smart_goal_updates: [...(goal.smart_goal_updates ?? [])].sort((a, b) => String(a.observed_at).localeCompare(String(b.observed_at))),
    smart_goal_students: [...(goal.smart_goal_students ?? [])].sort((a, b) =>
      String(a.students?.name_or_initials ?? '').localeCompare(String(b.students?.name_or_initials ?? ''))),
  }
}

export async function listSmartGoals({ includeArchived = false } = {}) {
  const teacher_id = await teacherId()
  let query = supabase.from('smart_goals')
    .select('*, smart_goal_updates(*), smart_goal_students(*, students(name_or_initials, grade))')
    .eq('teacher_id', teacher_id)
    .order('target_date', { ascending: true })
  if (!includeArchived) query = query.neq('status', 'archived')
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(sortGoal)
}

export async function createSmartGoal(goal, studentIds = []) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('smart_goals').insert({
    teacher_id,
    scope: goal.scope,
    class_period_id: goal.classPeriodId || null,
    grade_label: goal.gradeLabel?.trim() || null,
    subject: goal.subject.trim(),
    title: goal.title.trim(),
    specific_statement: goal.specificStatement.trim(),
    metric_name: goal.metricName.trim(),
    metric_unit: goal.metricUnit.trim() || 'percent',
    direction: goal.direction,
    baseline_value: Number(goal.baselineValue),
    target_value: Number(goal.targetValue),
    target_date: goal.targetDate,
    source_type: goal.sourceType || 'manual',
    source_label: goal.sourceLabel?.trim() || null,
    notes: goal.notes?.trim() || null,
  }).select().single()
  if (error) throw error

  if (studentIds.length) {
    const rows = studentIds.map((student_id) => ({
      goal_id: data.id,
      student_id,
      baseline_value: Number(goal.baselineValue),
      target_value: Number(goal.targetValue),
      current_value: Number(goal.baselineValue),
    }))
    const { error: studentsError } = await supabase.from('smart_goal_students').insert(rows)
    if (studentsError) throw studentsError
  }
  return data
}

export async function addSmartGoalUpdate({ goalId, value, observedAt, note, studentId = null }) {
  const { data, error } = await supabase.from('smart_goal_updates').insert({
    goal_id: goalId,
    student_id: studentId,
    value: Number(value),
    observed_at: observedAt,
    note: note?.trim() || null,
  }).select().single()
  if (error) throw error

  if (studentId) {
    const { error: studentError } = await supabase.from('smart_goal_students').update({
      current_value: Number(value),
      updated_at: new Date().toISOString(),
    }).eq('goal_id', goalId).eq('student_id', studentId)
    if (studentError) throw studentError
  }
  return data
}

export async function updateSmartGoalStatus(goalId, status) {
  const { data, error } = await supabase.from('smart_goals').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', goalId).select().single()
  if (error) throw error
  return data
}

export async function updateStudentGoal({ goalId, studentId, currentValue, targetValue, status, notes }) {
  const { data, error } = await supabase.from('smart_goal_students').update({
    current_value: Number(currentValue),
    target_value: Number(targetValue),
    status,
    notes: notes?.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('goal_id', goalId).eq('student_id', studentId).select().single()
  if (error) throw error
  return data
}

// Pull the earliest and latest completed class runs for a distance. The shared
// goal stores seconds (human-readable and spreadsheet-friendly), while Run
// Tracker continues to store precise milliseconds.
export async function getRunTrackerClassProgress(classPeriodId, distanceLabel) {
  let query = supabase.from('run_sessions').select('id, distance_label, started_at, run_date')
    .eq('class_period_id', classPeriodId).not('completed_at', 'is', null)
    .order('started_at', { ascending: true }).limit(30)
  if (distanceLabel) query = query.eq('distance_label', distanceLabel)
  const { data: sessions, error: sessionError } = await query
  if (sessionError) throw sessionError
  if (!sessions?.length) throw new Error('No completed Run Tracker sessions were found for this class and distance.')

  const { data: results, error: resultError } = await supabase.from('run_results')
    .select('session_id, student_id, finish_ms, status')
    .in('session_id', sessions.map((session) => session.id))
    .eq('status', 'finished')
  if (resultError) throw resultError

  const averages = sessions.map((session) => {
    const finishes = (results ?? []).filter((result) => result.session_id === session.id && result.finish_ms)
    if (!finishes.length) return null
    return {
      observedAt: session.run_date || String(session.started_at).slice(0, 10),
      value: Math.round(finishes.reduce((sum, result) => sum + result.finish_ms, 0) / finishes.length / 1000),
      studentCount: finishes.length,
    }
  }).filter(Boolean)
  if (!averages.length) throw new Error('Completed sessions were found, but none had finish times to sync.')
  return { baseline: averages[0], current: averages.at(-1), observations: averages }
}
