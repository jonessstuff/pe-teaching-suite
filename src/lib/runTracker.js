export function elapsedMs(startedAt, now = Date.now()) {
  return Math.max(0, now - new Date(startedAt).getTime())
}

export function formatRunTime(ms, { tenths = true } = {}) {
  if (ms == null || Number.isNaN(Number(ms))) return '—'
  const totalTenths = Math.floor(Number(ms) / 100)
  const minutes = Math.floor(totalTenths / 600)
  const seconds = Math.floor((totalTenths % 600) / 10)
  const tenth = totalTenths % 10
  return `${minutes}:${String(seconds).padStart(2, '0')}${tenths ? `.${tenth}` : ''}`
}

export function parseRunTime(value) {
  const match = String(value ?? '').trim().match(/^(\d+):([0-5]?\d)(?:\.(\d))?$/)
  if (!match) return null
  return (Number(match[1]) * 60 + Number(match[2])) * 1000 + Number(match[3] ?? 0) * 100
}

export function nextLapResult(result, lapsRequired, capturedMs) {
  const current = result?.laps_completed ?? 0
  if (result?.status === 'finished' || current >= lapsRequired) return result
  const lapsCompleted = current + 1
  const finished = lapsCompleted === lapsRequired
  return {
    ...result,
    laps_completed: lapsCompleted,
    lap_times_ms: [...(result?.lap_times_ms ?? []), capturedMs],
    finish_ms: finished ? capturedMs : null,
    status: finished ? 'finished' : 'active',
  }
}

export function undoLapResult(result) {
  const lapTimes = [...(result?.lap_times_ms ?? [])]
  lapTimes.pop()
  return {
    ...result,
    laps_completed: Math.max(0, (result?.laps_completed ?? 0) - 1),
    lap_times_ms: lapTimes,
    finish_ms: null,
    status: 'active',
  }
}

export function sessionSummary(results) {
  return (results ?? []).reduce((summary, result) => {
    summary[result.status] = (summary[result.status] ?? 0) + 1
    return summary
  }, { active: 0, finished: 0, absent: 0, medical: 0, dnf: 0 })
}

export function csvCell(value) {
  const text = value == null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function runResultsCsv({ session, students, results, classLabel }) {
  const byStudent = new Map((results ?? []).map((result) => [result.student_id, result]))
  const rows = (students ?? []).map((student) => {
    const result = byStudent.get(student.id)
    return [
      student.name_or_initials,
      classLabel,
      new Date(session.started_at).toLocaleDateString(),
      session.distance_label,
      session.laps_required,
      result?.laps_completed ?? 0,
      result?.status ?? 'No result',
      result?.finish_ms == null ? '' : formatRunTime(result.finish_ms),
      result?.finish_ms ?? '',
    ].map(csvCell).join(',')
  })
  return [
    ['Student', 'Class', 'Date', 'Distance', 'Required Laps', 'Completed Laps', 'Status', 'Finish Time', 'Finish Milliseconds'].join(','),
    ...rows,
  ].join('\n')
}

export function studentRunProgress(studentId, sessions, results) {
  const sessionById = new Map((sessions ?? []).map((session) => [session.id, session]))
  return (results ?? [])
    .filter((result) => result.student_id === studentId && result.status === 'finished' && result.finish_ms != null)
    .map((result) => ({ ...result, session: sessionById.get(result.session_id) }))
    .filter((record) => record.session)
    .sort((a, b) => new Date(a.session.started_at) - new Date(b.session.started_at))
}

export function progressStats(records) {
  if (!records?.length) return null
  const first = records[0]
  const latest = records.at(-1)
  const previous = records.length > 1 ? records.at(-2) : null
  const best = records.reduce((winner, record) => record.finish_ms < winner.finish_ms ? record : winner, records[0])
  return {
    first,
    latest,
    previous,
    best,
    improvementFromFirstMs: first.finish_ms - latest.finish_ms,
    improvementFromPreviousMs: previous ? previous.finish_ms - latest.finish_ms : null,
  }
}
