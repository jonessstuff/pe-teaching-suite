import { supabase } from '../lib/supabaseClient'

export async function createShare(lessonId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('shared_lessons')
    .insert({ lesson_id: lessonId, teacher_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getShare(lessonId) {
  const { data, error } = await supabase
    .from('shared_lessons')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function deleteShare(id) {
  const { error } = await supabase.from('shared_lessons').delete().eq('id', id)
  if (error) throw error
}

export async function getSharedLesson(token) {
  const { data, error } = await supabase.functions.invoke('get-shared-lesson', {
    body: { token },
  })
  if (error) throw error
  return data
}
