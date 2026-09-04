import { supabase } from '../lib/supabaseClient'

async function teacherId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

export async function listLibraryCatalogBooks() {
  const teacher_id = await teacherId()
  const { data, error } = await supabase.from('library_catalog_books').select('*')
    .eq('teacher_id', teacher_id).order('title', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function importLibraryCatalogBooks(rows) {
  const teacher_id = await teacherId()
  const payload = rows.map((row) => ({
    teacher_id, title: row.title, author: row.author || 'Unknown author', genres: row.genres ?? [],
    grade_min: row.gradeMin ?? null, grade_max: row.gradeMax ?? null, format: row.format || 'Book',
    themes: row.themes ?? [], series: row.series || null, available: row.available !== false,
  }))
  const { data, error } = await supabase.from('library_catalog_books')
    .upsert(payload, { onConflict: 'teacher_id,title,author', ignoreDuplicates: false }).select()
  if (error) throw error
  return data ?? []
}

export async function updateLibraryCatalogBook(id, updates) {
  const { data, error } = await supabase.from('library_catalog_books').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}
