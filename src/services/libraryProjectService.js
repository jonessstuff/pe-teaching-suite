import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listLibraryProjects(projectType) {
  const teacher_id = await teacherId()
  let query = supabase.from('library_projects').select('*').eq('teacher_id', teacher_id)
  if (projectType) query = query.eq('project_type', projectType)
  const { data, error } = await query.order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLibraryProject(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('library_projects').insert({
    teacher_id, project_type: values.projectType, title: values.title, inputs: values.inputs, output: values.output,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateLibraryProject(id, values) {
  const { data, error } = await supabase.from('library_projects').update({
    title: values.title, inputs: values.inputs, output: values.output, updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()
  if (error) throw error
  return data
}
