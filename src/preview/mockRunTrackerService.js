const completedSession = {
  id: 'run-preview-1', class_period_id: 'period-4x', distance_label: '½ Mile', distance_miles: 0.5,
  laps_required: 2, run_date: '2026-08-27', started_at: '2026-08-27T13:00:00.000Z', completed_at: '2026-08-27T13:20:00.000Z', notes: 'Preview run',
}
const sessions = [completedSession]
const results = [
  ['student-1', 681000], ['student-2', 694000], ['student-3', 702000], ['student-4', 715000], ['student-5', 688000], ['student-6', 706000],
].map(([student_id, finish_ms], index) => ({ id: `run-result-${index}`, session_id: completedSession.id, student_id, laps_completed: 2, lap_times_ms: [Math.round(finish_ms / 2), finish_ms], finish_ms, status: 'finished' }))
const goals = []

export async function getActiveRunSession() { return sessions.find((item) => !item.completed_at) ?? null }
export async function listRunSessions(classPeriodId) { return sessions.filter((item) => item.class_period_id === classPeriodId) }
export async function listRunResults(sessionId) { return results.filter((item) => item.session_id === sessionId) }
export async function listRunResultsForSessions(ids) { return results.filter((item) => ids.includes(item.session_id)) }
export async function listRunGoals(studentId) { return goals.filter((item) => item.student_id === studentId) }
export async function createRunSession(values) { const row = { id: `run-${Date.now()}`, class_period_id: values.classPeriodId, distance_label: values.distanceLabel, distance_miles: values.distanceMiles, laps_required: Number(values.lapsRequired), notes: values.notes, run_date: new Date().toISOString().slice(0, 10), started_at: new Date().toISOString(), completed_at: null }; sessions.unshift(row); return row }
export async function saveRunResult(values) { const row = { id: `run-result-${Date.now()}`, session_id: values.sessionId, student_id: values.studentId, laps_completed: values.lapsCompleted, lap_times_ms: values.lapTimesMs, finish_ms: values.finishMs, status: values.status }; const index = results.findIndex((item) => item.session_id === row.session_id && item.student_id === row.student_id); if (index >= 0) results[index] = row; else results.push(row); return row }
export async function completeRunSession(id) { const row = sessions.find((item) => item.id === id); row.completed_at = new Date().toISOString(); return row }
export async function createPastRun(values) { const row = { id: `run-${Date.now()}`, class_period_id: values.classPeriodId, run_date: values.runDate, distance_label: values.distanceLabel, distance_miles: values.distanceMiles, laps_required: Number(values.lapsRequired), notes: values.notes, started_at: `${values.runDate}T12:00:00.000Z`, completed_at: `${values.runDate}T12:00:00.000Z` }; sessions.unshift(row); return row }
export async function createRunGoal(values) { const row = { id: `run-goal-${Date.now()}`, student_id: values.studentId, distance_label: values.distanceLabel, baseline_ms: values.baselineMs, target_ms: values.targetMs, target_date: values.targetDate, status: 'active', progress_status: 'on_track', created_at: new Date().toISOString() }; goals.unshift(row); return row }
export async function updateRunGoalProgress(id, progressStatus) { const row = goals.find((item) => item.id === id); row.progress_status = progressStatus; row.status = progressStatus === 'achieved' ? 'achieved' : 'active'; return row }
