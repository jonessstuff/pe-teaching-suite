import { supabase } from "../lib/supabaseClient";

export async function listStudents() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", userData.user.id)
    .order("name_or_initials", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listStudentsByPeriod(classPeriodId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", userData.user.id)
    .eq("class_period_id", classPeriodId)
    .order("name_or_initials", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createStudent({ name_or_initials, grade, accommodation_type, accommodation_notes, class_period_id }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("students")
    .insert({
      teacher_id: userData.user.id,
      name_or_initials,
      grade: grade != null ? Number(grade) : null,
      accommodation_type: accommodation_type || 'None',
      accommodation_notes: accommodation_notes || null,
      class_period_id: class_period_id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Bulk-create — one round-trip for a whole pasted class list. Each row shares
// the batch's grade + class period; caller de-dupes before calling.
export async function createStudents(rows) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const teacher_id = userData.user.id;

  const payload = (rows ?? []).map((r) => ({
    teacher_id,
    name_or_initials: r.name_or_initials,
    grade: r.grade != null && r.grade !== '' ? Number(r.grade) : null,
    accommodation_type: r.accommodation_type || 'None',
    accommodation_notes: r.accommodation_notes || null,
    class_period_id: r.class_period_id || null,
  }));
  if (payload.length === 0) return [];

  const { data, error } = await supabase.from("students").insert(payload).select();
  if (error) throw error;
  return data;
}

export async function updateStudent(id, { name_or_initials, grade, accommodation_type, accommodation_notes, class_period_id }) {
  const { data, error } = await supabase
    .from("students")
    .update({
      name_or_initials,
      grade: grade != null ? Number(grade) : null,
      accommodation_type: accommodation_type || 'None',
      accommodation_notes: accommodation_notes || null,
      class_period_id: class_period_id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}
