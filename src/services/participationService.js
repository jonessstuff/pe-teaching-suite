import { supabase } from '../lib/supabaseClient'

export const DEFAULT_DEDUCTIONS = [
  { key: 'wrong_shoes', label: 'Incorrect Shoes', points: 5 },
  { key: 'wrong_clothing', label: 'Incorrect Clothing', points: 5 },
  { key: 'no_participation', label: 'No Participation', points: 50 },
]
export const DEFAULT_MAX_POINTS = 100

async function uid() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

function normalizeConfig(data) {
  if (!data) return data
  const deductions = Array.isArray(data.deductions) && data.deductions.length ? data.deductions : DEFAULT_DEDUCTIONS
  return { ...data, deductions, max_points: Number(data.max_points) === 100 ? 100 : DEFAULT_MAX_POINTS }
}

export async function getConfig() {
  const teacher_id = await uid()
  const { data, error } = await supabase.from('participation_config').select('*').eq('teacher_id', teacher_id).maybeSingle()
  if (error) throw error
  if (data) return normalizeConfig(data)

  const { data: created, error: insErr } = await supabase
    .from('participation_config')
    .insert({ teacher_id, deductions: DEFAULT_DEDUCTIONS, max_points: DEFAULT_MAX_POINTS })
    .select().single()
  if (insErr) {
    const { data: refetched } = await supabase.from('participation_config').select('*').eq('teacher_id', teacher_id).maybeSingle()
    if (refetched) return normalizeConfig(refetched)
    throw insErr
  }
  return normalizeConfig(created)
}

export async function saveConfig({ deductions, max_points }) {
  const teacher_id = await uid()
  const { data, error } = await supabase
    .from('participation_config')
    .upsert({ teacher_id, deductions, max_points, updated_at: new Date().toISOString() }, { onConflict: 'teacher_id' })
    .select().single()
  if (error) throw error
  return normalizeConfig(data)
}

export async function listRecords(classPeriodId, { from, to } = {}) {
  const teacher_id = await uid()
  let q = supabase.from('participation_records').select('*').eq('teacher_id', teacher_id).eq('class_period_id', classPeriodId)
  if (from) q = q.gte('date', from)
  if (to) q = q.lte('date', to)
  const { data, error } = await q.order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertRecord({ classPeriodId, studentId, date, deductions, points, exemptReason = null }) {
  const teacher_id = await uid()
  const exempt = Boolean(exemptReason)
  const { data, error } = await supabase
    .from('participation_records')
    .upsert({
      teacher_id, class_period_id: classPeriodId, student_id: studentId, date,
      status: exemptReason || 'deductions', deductions, points: exempt ? 0 : points,
      exempt, exempt_reason: exemptReason, updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,date' })
    .select().single()
  if (error) throw error
  return data
}

export async function upsertRecords(rows) {
  const teacher_id = await uid()
  const payload = (rows ?? []).map((r) => ({
    teacher_id, class_period_id: r.classPeriodId, student_id: r.studentId, date: r.date,
    status: r.exemptReason || 'deductions', deductions: r.deductions,
    points: r.exemptReason ? 0 : r.points, exempt: Boolean(r.exemptReason),
    exempt_reason: r.exemptReason || null, updated_at: new Date().toISOString(),
  }))
  if (payload.length === 0) return []
  const { data, error } = await supabase.from('participation_records').upsert(payload, { onConflict: 'student_id,date' }).select()
  if (error) throw error
  return data
}
