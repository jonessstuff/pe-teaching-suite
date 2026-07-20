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
