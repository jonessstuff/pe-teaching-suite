import { supabase } from "../lib/supabaseClient";

export async function listPeriods() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("class_periods")
    .select("*")
    .eq("teacher_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createPeriod({ label, subject, grade_bands, class_size, duration_minutes, room_label }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("class_periods")
    .insert({
      teacher_id: userData.user.id,
      label,
      subject,
      grade_bands,
      class_size,
      duration_minutes,
      room_label: room_label || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePeriod(id, { label, subject, grade_bands, class_size, duration_minutes, room_label }) {
  const { data, error } = await supabase
    .from("class_periods")
    .update({ label, subject, grade_bands, class_size, duration_minutes, room_label: room_label || null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePeriod(id) {
  const { error } = await supabase.from("class_periods").delete().eq("id", id);
  if (error) throw error;
}
