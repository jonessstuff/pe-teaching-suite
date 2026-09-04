import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listSchoolYearTasks(schoolYearLabel) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase
    .from('school_year_tasks')
    .select('*')
    .eq('teacher_id', teacher_id)
    .eq('school_year_label', schoolYearLabel)
    .neq('status', 'archived')
    .order('status', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSchoolYearTask(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('school_year_tasks').insert({
    teacher_id,
    school_year_label: values.schoolYearLabel,
    title: values.title.trim(),
    notes: values.notes?.trim() || null,
    module_label: values.moduleLabel || null,
    category: values.category || 'planning',
    priority: values.priority || 'normal',
    due_date: values.dueDate || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateSchoolYearTask(id, updates) {
  const row = { ...updates, updated_at: new Date().toISOString() }
  if ('dueDate' in row) {
    row.due_date = row.dueDate || null
    delete row.dueDate
  }
  if ('moduleLabel' in row) {
    row.module_label = row.moduleLabel || null
    delete row.moduleLabel
  }
  const { data, error } = await supabase.from('school_year_tasks').update(row).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function setSchoolYearTaskComplete(task, completed) {
  return updateSchoolYearTask(task.id, {
    status: completed ? 'completed' : 'open',
    completed_at: completed ? new Date().toISOString() : null,
  })
}

export async function archiveSchoolYearTask(id) {
  return updateSchoolYearTask(id, { status: 'archived' })
}

