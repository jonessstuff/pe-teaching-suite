// Pure participation-grade math — no AI, no server. Exempt statuses (absent /
// medical) drop out of BOTH numerator and denominator; zero statuses (no
// participation) stay in the denominator (scored 0). "Meetings" are inferred
// from the records themselves (a date with a non-exempt record = a graded meeting).

export function summarize(records, maxPoints) {
  const all = records ?? []
  const graded = all.filter((r) => !r.exempt)
  const earned = graded.reduce((s, r) => s + Number(r.points || 0), 0)
  const possible = graded.length * Number(maxPoints || 0)
  return {
    earned,
    possible,
    meetings: graded.length,               // graded meetings only
    exemptCount: all.length - graded.length, // absent / medical
    percent: possible > 0 ? Math.round((earned / possible) * 100) : null, // null = nothing graded yet
  }
}

// ── Date helpers (local time, 'YYYY-MM-DD' strings) ──────────────────────────
export function todayStr() {
  const d = new Date()
  return toDateStr(d)
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

// Monday–Sunday range containing the given date.
export function weekRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayNr = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  const monday = new Date(d)
  monday.setDate(d.getDate() - dayNr)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: toDateStr(monday), to: toDateStr(sunday) }
}

// ISO-8601 week key (e.g. "2026-W36") for grouping/labeling.
export function isoWeekKey(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3) // nearest Thursday
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  const year = new Date(firstThursday).getFullYear()
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function groupByWeek(records) {
  const out = {}
  for (const r of records ?? []) (out[isoWeekKey(r.date)] ??= []).push(r)
  return out
}
