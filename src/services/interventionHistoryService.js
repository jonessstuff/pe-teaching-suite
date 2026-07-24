import { supabase } from '../lib/supabaseClient'

// Intervention history is keyed by student INITIALS / a teacher-chosen code
// only — never a full name (see migration 0028). RLS scopes every row to the
// authenticated teacher.

export async function saveInterventionHistory({ initials, intervention }) {
  const { data: { user } } = await supabase.auth.getUser()
  const pm = intervention?.progress_monitoring ?? {}
  const { data, error } = await supabase
    .from('intervention_history')
    .insert({
      teacher_id: user.id,
      student_initials: (initials ?? '').trim(),
      domain: intervention?.domain ?? null,
      title: intervention?.title ?? null,
      tier: intervention?.tier ?? null,
      targeted_skill: intervention?.targeted_skill ?? null,
      recheck_frequency: pm.recheck_frequency ?? null,
      what_to_watch: pm.what_to_watch ?? null,
      success_indicators: pm.success_indicators ?? null,
      intervention_object: intervention,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Returns the teacher's past entries for a set of initials, newest first.
export async function getInterventionHistory(initials) {
  const q = (initials ?? '').trim()
  if (!q) return []
  const { data, error } = await supabase
    .from('intervention_history')
    .select('*')
    .ilike('student_initials', q)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
