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

export function classRunStats(results, rosterSize = 0) {
  const finished = (results ?? []).filter((result) => result.status === 'finished' && result.finish_ms != null)
  const totalMs = finished.reduce((sum, result) => sum + result.finish_ms, 0)
  return {
    finished: finished.length,
    averageMs: finished.length ? Math.round(totalMs / finished.length) : null,
    fastestMs: finished.length ? Math.min(...finished.map((result) => result.finish_ms)) : null,
    completionRate: rosterSize ? Math.round((finished.length / rosterSize) * 100) : 0,
  }
}

export function seasonLabel(dateValue) {
  const date = new Date(dateValue)
  const month = date.getMonth() + 1
  const year = month === 12 ? date.getFullYear() + 1 : date.getFullYear()
  if (month >= 8 && month <= 11) return `Fall ${date.getFullYear()}`
  if (month === 12 || month <= 2) return `Winter ${year}`
  if (month >= 3 && month <= 5) return `Spring ${date.getFullYear()}`
  return `Summer ${date.getFullYear()}`
}

export function seasonalProgress(records) {
  const groups = new Map()
  for (const record of records ?? []) {
    const label = seasonLabel(record.session.started_at)
    const group = groups.get(label) ?? { label, records: [] }
    group.records.push(record); groups.set(label, group)
  }
  return [...groups.values()].map((group) => ({
    label: group.label,
    count: group.records.length,
    averageMs: Math.round(group.records.reduce((sum, record) => sum + record.finish_ms, 0) / group.records.length),
    bestMs: Math.min(...group.records.map((record) => record.finish_ms)),
  }))
}

export function parseBulkRunTimes(text, students) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const entries = {}
  const errors = []
  let sequentialIndex = 0
  const normalizedStudents = (students ?? []).map((student) => ({
    student,
    normalized: student.name_or_initials.toLowerCase().replace(/[^a-z0-9]/g, ''),
  }))
  lines.forEach((line, index) => {
    const timeMatch = line.match(/(\d+:[0-5]?\d(?:\.\d)?)\s*$/)
    if (!timeMatch || !parseRunTime(timeMatch[1])) { errors.push(`Line ${index + 1}: add a time like 10:42`); return }
    const namePart = line.slice(0, timeMatch.index).replace(/[\t,;:-]+$/g, '').trim()
    let student
    if (namePart) {
      const normalizedName = namePart.toLowerCase().replace(/[^a-z0-9]/g, '')
      student = normalizedStudents.find((item) => item.normalized === normalizedName)?.student
      if (!student) { errors.push(`Line ${index + 1}: student name not found`); return }
    } else {
      student = students?.[sequentialIndex]
      sequentialIndex += 1
      if (!student) { errors.push(`Line ${index + 1}: more times than students`); return }
    }
    entries[student.id] = { time: timeMatch[1], status: '' }
  })
  return { entries, errors }
}
