import { supabase } from '../lib/supabaseClient'

// Public "School/District Interest" lead form on the landing page (see migration
// 0041). Submitters are anonymous (not logged in); RLS allows anon INSERT only,
// and a DB trigger emails the review inbox. Owner reviews rows out-of-band.
export async function submitSchoolInterest({
  name,
  organization,
  email,
  role,
  location,
  organizationScope,
  teacherCount,
  specialties,
  interestType,
  timeline,
  primaryGoal,
  preferredNextStep,
  note,
}) {
  const clean = (v) => (v ?? '').trim()
  const cleanSpecialties = [...new Set((specialties ?? []).map(clean).filter(Boolean))].slice(0, 20)
  const leadTier = ['pilot_conversation', 'walkthrough'].includes(preferredNextStep) && timeline !== 'unsure'
    ? 'hot'
    : interestType === 'exploring' && preferredNextStep === 'email_information'
      ? 'exploring'
      : 'warm'
  const row = {
    name: clean(name),
    organization: clean(organization),
    email: clean(email),
    role: clean(role),
    location: clean(location),
    organization_scope: clean(organizationScope),
    specialties: cleanSpecialties,
    interest_type: clean(interestType),
    timeline: clean(timeline),
    primary_goal: clean(primaryGoal),
    preferred_next_step: clean(preferredNextStep),
    lead_tier: leadTier,
    note: clean(note) || null,
  }
  if (!row.name || !row.organization || !row.email || !row.role || !row.location) {
    throw new Error('Please add your name, role, school or district, location, and email.')
  }
  if (!row.organization_scope || !row.interest_type || !row.timeline || !row.primary_goal || !row.preferred_next_step) {
    throw new Error('Please complete the school-interest questions so we know how to help.')
  }
  if (!row.specialties.length) {
    throw new Error('Please select at least one specialty area.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    throw new Error('Please enter a valid email address.')
  }
  // Approximate teacher count is required for useful school-level follow-up.
  const n = parseInt(String(teacherCount ?? '').replace(/[^\d]/g, ''), 10)
  row.teacher_count = Number.isFinite(n) ? n : null
  if (!row.teacher_count || row.teacher_count < 1) {
    throw new Error('Please add the approximate number of teachers who may need access.')
  }

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
