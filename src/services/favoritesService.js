import { supabase } from '../lib/supabaseClient'

/**
 * Per-user module favorites (see migration 0031_module_favorites). RLS scopes
 * every row to the authenticated user, so reads/writes never need to filter by
 * user explicitly for safety — but insert/delete still set user_id because the
 * RLS `with check` requires it.
 *
 * `moduleKey` is a module's stable route slug (e.g. 'pe-health', 'jrotc').
 */

/** Returns the current user's favorited module keys, most-recently-added first. */
export async function getFavorites() {
  const { data, error } = await supabase
    .from('module_favorites')
    .select('module_key')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => r.module_key)
}

/** Adds a module to the current user's favorites (idempotent). */
export async function addFavorite(moduleKey) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase
    .from('module_favorites')
    .insert({ user_id: user.id, module_key: moduleKey })
  // 23505 = unique_violation: already favorited, which is a no-op, not an error.
  if (error && error.code !== '23505') throw error
}

/** Removes a module from the current user's favorites. */
export async function removeFavorite(moduleKey) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase
    .from('module_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('module_key', moduleKey)
  if (error) throw error
}
