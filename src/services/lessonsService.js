import { supabase } from "../lib/supabaseClient";
import { smartTitleCase } from "../utils/titleCase";

/**
 * Service layer for lesson CRUD operations.
 *
 * Lessons are stored with a denormalized set of top-level columns
 * (for filtering/sorting) plus a full `lesson_object` JSONB column
 * that is the single source of truth for all renderers.
 */

/**
 * Extract the denormalized top-level columns from a LessonObject.
 * The title is normalized to smart title case so raw input casing
 * (e.g. "soccer Day 1") is cleaned up consistently on both the column
 * and inside the stored lesson_object.
 * @param {import("../types/lessonObject").LessonObject} lessonObject
 */
function toRow(lessonObject, extra = {}) {
  const title = smartTitleCase(lessonObject.title);
  return {
    title,
    subject: lessonObject.subject,
    grade_bands: lessonObject.grade_bands,
    duration_minutes: lessonObject.duration_minutes,
    lesson_object: { ...lessonObject, title },
    ...extra,
  };
}

/**
 * Fetch all lessons for the current teacher, optionally filtered.
 *
 * @param {Object} [filters]
 * @param {string} [filters.unitId]
 * @param {string} [filters.classPeriodId]
 * @param {string} [filters.subject]
 * @param {boolean} [filters.favoriteOnly]
 * @param {string[]} [filters.tags]
 */
export async function listLessons(filters = {}) {
  let query = supabase
    .from("lessons")
    .select("*")
    .order("scheduled_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.unitId) query = query.eq("unit_id", filters.unitId);
  if (filters.classPeriodId) query = query.eq("class_period_id", filters.classPeriodId);
  if (filters.subject) query = query.eq("subject", filters.subject);
  if (filters.favoriteOnly) query = query.eq("is_favorite", true);
  if (filters.tags?.length) query = query.overlaps("tags", filters.tags);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function toggleFavorite(id, currentValue) {
  const { data, error } = await supabase
    .from("lessons")
    .update({ is_favorite: !currentValue })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTags(id, tags) {
  const { data, error } = await supabase
    .from("lessons")
    .update({ tags })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch a single lesson by id.
 * @param {string} id
 */
export async function getLesson(id) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save a newly generated LessonObject as a new lesson row.
 *
 * @param {import("../types/lessonObject").LessonObject} lessonObject
 * @param {Object} [meta]
 * @param {string} [meta.unitId]
 * @param {string} [meta.classPeriodId]
 * @param {string} [meta.scheduledDate]  ISO date string
 * @param {string} [meta.periodLabel]
 * @param {string} [meta.aiModel]
 * @param {string} [meta.promptVersion]
 */
/**
 * Create a new unit row for grouping multi-day lessons.
 *
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.subject
 * @param {number[]} input.gradeBands
 * @returns {Promise<{ id: string }>}
 */
export async function createUnit({ name, subject, gradeBands }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("units")
    .insert({
      teacher_id: userData.user.id,
      name,
      subject,
      grade_bands: gradeBands,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createLesson(lessonObject, meta = {}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const row = toRow(lessonObject, {
    teacher_id: userData.user.id,
    unit_id: meta.unitId ?? null,
    class_period_id: meta.classPeriodId ?? null,
    scheduled_date: meta.scheduledDate ?? null,
    period_label: meta.periodLabel ?? null,
    ai_model: meta.aiModel ?? null,
    generation_prompt_version: meta.promptVersion ?? null,
    generated_at: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("lessons")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing lesson. Pass either a full/partial LessonObject
 * (merged into `lesson_object`) and/or top-level meta fields.
 *
 * @param {string} id
 * @param {Object} updates
 * @param {Partial<import("../types/lessonObject").LessonObject>} [updates.lessonObject]
 * @param {Object} [updates.meta]
 */
export async function updateLesson(id, { lessonObject, meta = {} } = {}) {
  let row = { ...meta };

  if (lessonObject) {
    // Merge with existing lesson_object so partial updates (e.g. just
    // the sub-plan layer) don't clobber other fields.
    const existing = await getLesson(id);
    const merged = { ...existing.lesson_object, ...lessonObject };
    row = { ...row, ...toRow(merged) };
  }

  const { data, error } = await supabase
    .from("lessons")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Duplicate a standalone lesson, appending " (Copy)" to the title.
 * The copy is always standalone (unit_id null) with no scheduled_date.
 * @param {string} id
 */
export async function duplicateLesson(id) {
  const existing = await getLesson(id);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const copiedObject = {
    ...existing.lesson_object,
    title: `${existing.lesson_object?.title ?? existing.title ?? "Lesson"} (Copy)`,
  };

  const row = toRow(copiedObject, {
    teacher_id: userData.user.id,
    unit_id: null,
    class_period_id: existing.class_period_id,
    scheduled_date: null,
    period_label: existing.period_label,
    ai_model: existing.ai_model,
    generation_prompt_version: existing.generation_prompt_version,
    generated_at: existing.generated_at,
  });

  const { data, error } = await supabase
    .from("lessons")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a lesson by id.
 * @param {string} id
 */
export async function deleteLesson(id) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Delete all lessons belonging to a unit, then delete the unit row itself.
 * @param {string} unitId
 */
export async function deleteUnit(unitId) {
  const { error: lessonsError } = await supabase
    .from("lessons")
    .delete()
    .eq("unit_id", unitId);
  if (lessonsError) throw lessonsError;

  const { error: unitError } = await supabase
    .from("units")
    .delete()
    .eq("id", unitId);
  if (unitError) throw unitError;
}

/**
 * Save the sub-plan layer onto an existing lesson without touching
 * the rest of the LessonObject.
 *
 * @param {string} id
 * @param {Object} subPlanFields
 * @param {string} [subPlanFields.sub_friendly_instructions]
 * @param {string} [subPlanFields.sub_script]
 * @param {string} [subPlanFields.sub_management_script]
 * @param {string} [subPlanFields.sub_diagram]
 */
export async function saveSubPlan(id, subPlanFields) {
  return updateLesson(id, { lessonObject: subPlanFields });
}
