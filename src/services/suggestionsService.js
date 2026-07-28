import { supabase } from '../lib/supabaseClient'

// Lightweight feature/module/pathway suggestion box (see migration 0035).
// RLS scopes every row to the authenticated user; a DB trigger emails the
// review inbox on insert. Owner reviews all rows out-of-band (SQL / dashboard).
export async function submitSuggestion(text) {
  const suggestion = (text ?? '').trim()
  if (!suggestion) throw new Error('Please enter a suggestion first.')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in to send a suggestion.')

  const { data, error } = await supabase
    .from('feature_suggestions')
    .insert({ user_id: user.id, suggestion_text: suggestion })
    .select()
    .single()
  if (error) throw error
  return data
}
