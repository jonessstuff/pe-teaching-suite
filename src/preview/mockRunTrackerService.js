const completedSession = {
  id: 'run-preview-1', class_period_id: 'period-4x', distance_label: '½ Mile', distance_miles: 0.5,
  laps_required: 2, run_date: '2026-08-27', started_at: '2026-08-27T13:00:00.000Z', completed_at: '2026-08-27T13:20:00.000Z', notes: 'Preview run',
}
const sessions = [completedSession]
const results = [
  ['student-1', 681000], ['student-2', 694000], ['student-3', 702000], ['student-4', 715000], ['student-5', 688000], ['student-6', 706000],
].map(([student_id, finish_ms], index) => ({ id: `run-result-${index}`, session_id: completedSession.id, student_id, laps_completed: 2, lap_times_ms: [Math.round(finish_ms / 2), finish_ms], finish_ms, status: 'finished' }))
const goals = []
const personalRuns = [
  { id: 'personal-run-2', run_date: '2026-09-02', total_distance_miles: 1.5, intervals_used: 'Run 3 min / walk 1 min', total_running_ms: 1080000, longest_continuous_miles: 0.8, effort_rating: 'moderate', followed_suggested_plan: false, weight_lbs: null, waist_inches: null, pain_reported: false, pain_notes: null, created_at: '2026-09-02T22:00:00.000Z' },
  { id: 'personal-run-1', run_date: '2026-08-28', total_distance_miles: 1.2, intervals_used: 'Run 2 min / walk 1 min', total_running_ms: 960000, longest_continuous_miles: 0.55, effort_rating: 'moderate', followed_suggested_plan: false, weight_lbs: null, waist_inches: null, pain_reported: false, pain_notes: null, created_at: '2026-08-28T12:00:00.000Z' },
]
let personalRunPlan = { goal_distance_miles: 3.1, goal_label: '5K', movement_style: 'run-walk', current_continuous_miles: 0.5, target_date: '2026-12-15', activity_days_per_week: 4, updated_at: new Date().toISOString() }

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
export async function listPersonalRuns() { return [...personalRuns] }
export async function createPersonalRun(values) { const row = { id: `personal-run-${Date.now()}`, run_date: values.runDate, total_distance_miles: Number(values.totalDistanceMiles), intervals_used: values.intervalsUsed || null, total_running_ms: Number(values.totalRunningMs), longest_continuous_miles: Number(values.longestContinuousMiles), effort_rating: values.effortRating, followed_suggested_plan: !!values.followedSuggestedPlan, weight_lbs: values.weightLbs, waist_inches: values.waistInches, pain_reported: !!values.painReported, pain_notes: values.painNotes || null, created_at: new Date().toISOString() }; personalRuns.unshift(row); return row }
export async function deletePersonalRun(id) { const index = personalRuns.findIndex((item) => item.id === id); if (index >= 0) personalRuns.splice(index, 1) }
export async function getPersonalRunPlan() { return personalRunPlan }
export async function savePersonalRunPlan(values) { personalRunPlan = { goal_distance_miles: Number(values.goalDistanceMiles), goal_label: values.goalLabel, movement_style: values.movementStyle, current_continuous_miles: Number(values.currentContinuousMiles), target_date: values.targetDate, activity_days_per_week: Number(values.activityDaysPerWeek), updated_at: new Date().toISOString() }; return personalRunPlan }
