export const DEFAULT_DEDUCTIONS = [
  { key: 'wrong_shoes', label: 'Incorrect Shoes', points: 5 },
  { key: 'wrong_clothing', label: 'Incorrect Clothing', points: 5 },
  { key: 'no_participation', label: 'No Participation', points: 50 },
]
export const DEFAULT_MAX_POINTS = 100

let config = { max_points: DEFAULT_MAX_POINTS, deductions: DEFAULT_DEDUCTIONS }
const records = []

export async function getConfig() { return structuredClone(config) }
export async function saveConfig(next) { config = { ...config, ...next }; return structuredClone(config) }
export async function listRecords(classPeriodId, { from, to } = {}) {
  return records.filter((record) => record.class_period_id === classPeriodId && (!from || record.date >= from) && (!to || record.date <= to))
}
export async function upsertRecord(row) {
  const next = { id: `participation-${Date.now()}`, class_period_id: row.classPeriodId, student_id: row.studentId, date: row.date, deductions: row.deductions, points: row.points, exempt: Boolean(row.exemptReason), exempt_reason: row.exemptReason, status: row.exemptReason || 'deductions' }
  const index = records.findIndex((item) => item.student_id === next.student_id && item.date === next.date)
  if (index >= 0) records[index] = next
  else records.push(next)
  return next
}
export async function upsertRecords(rows) { return Promise.all(rows.map(upsertRecord)) }
