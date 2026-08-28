import { supabase } from '../lib/supabaseClient'

// Defaults mirror the 0042 migration — used to lazily create a config row the
// first time a teacher opens the tracker.
export const DEFAULT_STATUSES = [
  { key: 'full', label: 'Full', points: 10, exempt: false },
  { key: 'partial', label: 'Partial', points: 7, exempt: false },
  { key: 'no_dress', label: 'No Dress', points: 5, exempt: false },
  { key: 'none', label: 'No Participation', points: 0, exempt: false },
  { key: 'absent', label: 'Absent', points: 0, exempt: true },
  { key: 'medical', label: 'Medical', points: 0, exempt: true },
]
export const DEFAULT_MAX_POINTS = 10

async function uid() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function getConfig() {
  const teacher_id = await uid()
  const { data, error } = await supabase
    .from('participation_config')
    .select('*')
    .eq('teacher_id', teacher_id)
    .maybeSingle()
  if (error) throw error
  if (data) return data

  // First run — create the default scheme.
  const { data: created, error: insErr } = await supabase
    .from('participation_config')
    .insert({ teacher_id, statuses: DEFAULT_STATUSES, max_points: DEFAULT_MAX_POINTS })
    .select()
    .single()
  if (insErr) {
    // Lost a create race — refetch.
    const { data: refetched } = await supabase
      .from('participation_config').select('*').eq('teacher_id', teacher_id).maybeSingle()
    if (refetched) return refetched
    throw insErr
  }
  return created
}

export async function saveConfig({ statuses, max_points }) {
  const teacher_id = await uid()
  const { data, error } = await supabase
    .from('participation_config')
    .upsert({ teacher_id, statuses, max_points, updated_at: new Date().toISOString() }, { onConflict: 'teacher_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// Records for a period within an (optional) inclusive date range.
export async function listRecords(classPeriodId, { from, to } = {}) {
  const teacher_id = await uid()
  let q = supabase
    .from('participation_records')
    .select('*')
    .eq('teacher_id', teacher_id)
    .eq('class_period_id', classPeriodId)
  if (from) q = q.gte('date', from)
  if (to) q = q.lte('date', to)
  const { data, error } = await q.order('date', { ascending: true })
  if (error) throw error
  return data
}

// The per-tap save — one record per (student, date).
export async function upsertRecord({ classPeriodId, studentId, date, status, points, exempt }) {
  const teacher_id = await uid()
  const { data, error } = await supabase
    .from('participation_records')
    .upsert(
      { teacher_id, class_period_id: classPeriodId, student_id: studentId, date, status, points, exempt, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,date' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}
