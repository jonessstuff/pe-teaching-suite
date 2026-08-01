import { supabase } from '../lib/supabaseClient'

// Public "School/District Interest" lead form on the landing page (see migration
// 0041). Submitters are anonymous (not logged in); RLS allows anon INSERT only,
// and a DB trigger emails the review inbox. Owner reviews rows out-of-band.
export async function submitSchoolInterest({ name, organization, email, teacherCount, note }) {
  const clean = (v) => (v ?? '').trim()
  const row = {
    name: clean(name),
    organization: clean(organization),
    email: clean(email),
    note: clean(note) || null,
  }
  if (!row.name || !row.organization || !row.email) {
    throw new Error('Please add your name, school/district, and email.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    throw new Error('Please enter a valid email address.')
  }
  // Optional approximate teacher count → integer or null.
  const n = parseInt(String(teacherCount ?? '').replace(/[^\d]/g, ''), 10)
  row.teacher_count = Number.isFinite(n) ? n : null

  // NOTE: no .select() read-back. Submitters are anonymous and the table has
  // an INSERT-only policy (no SELECT policy — leads must not be readable via the
  // anon key), so reading the row back would trip RLS. The form only needs
  // success/failure, so a bare insert (return=minimal) is exactly right.
  const { error } = await supabase
    .from('school_interest')
    .insert(row)
  if (error) throw error
  return true
}
