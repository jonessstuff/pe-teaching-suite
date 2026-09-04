import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listLibraryNewsletters() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase
    .from('library_newsletters')
    .select('*')
    .eq('teacher_id', teacher_id)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLibraryNewsletter(values) {
  const teacher_id = await teacherId()
  const { data, error } = await supabase
    .from('library_newsletters')
    .insert({ teacher_id, title: values.title, audience: values.audience, issue_month: values.issueMonth, draft: values.draft })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLibraryNewsletter(id, values) {
  const { data, error } = await supabase
    .from('library_newsletters')
    .update({ title: values.title, audience: values.audience, issue_month: values.issueMonth, draft: values.draft, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
