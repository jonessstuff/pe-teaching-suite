import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listArtShowProjects() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('art_show_projects').select('*').eq('teacher_id', teacher_id).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createArtShowProject(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('art_show_projects').insert({ teacher_id, title: values.title, inputs: values.inputs, artworks: values.artworks, plan: values.plan }).select().single()
  if (error) throw error
  return data
}

export async function updateArtShowProject(id, values) {
  const { data, error } = await supabase.from('art_show_projects').update({ title: values.title, inputs: values.inputs, artworks: values.artworks, plan: values.plan, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}
