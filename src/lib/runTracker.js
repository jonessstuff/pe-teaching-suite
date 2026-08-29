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
