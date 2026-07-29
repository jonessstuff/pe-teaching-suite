import { supabase } from '../lib/supabaseClient'

/**
 * Set (or replace) the current user's password in-session. The live session
 * proves identity, so setting a FIRST password needs no re-auth. `has_password`
 * flips automatically via the DB trigger (migration 0038).
 */
export async function setPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/** Record that the "set a password" banner was dismissed, so it doesn't return. */
export async function dismissPasswordPrompt() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('profiles')
    .update({ password_prompt_dismissed_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw error
}
