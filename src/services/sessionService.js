/**
 * Multi-session enforcement service.
 *
 * Allows up to MAX_SESSIONS concurrent logins per account. Each login mints
 * a unique session_token (UUID) stored in localStorage and in the
 * active_sessions table (one row per active login). A background heartbeat
 * keeps last_seen_at fresh; rows older than STALE_MINUTES are treated as
 * expired and cleaned up at the start of each claimSession() call.
 *
 * A genuine new sign-in (claimSession({ evictOldest: true })) never hard-fails:
 * if the account is already at MAX_SESSIONS it EVICTS the least-recently-seen
 * session to make room (LRU), and that displaced context logs itself out on its
 * next heartbeat. This is what lets a subscriber install the PWA (a separate
 * storage context from the browser, so it always claims a fresh session) without
 * getting locked out. Only the non-evicting form — a heartbeat re-claim after a
 * device was displaced — still throws "ALREADY_ACTIVE", so a displaced device
 * does NOT fight its way back in and ping-pong with the device that replaced it.
 */

import { supabase } from '../lib/supabaseClient'

const MAX_SESSIONS = 3        // maximum concurrent logins per account
const STALE_MINUTES = 20      // minutes of inactivity before a session expires
const SESSION_TOKEN_KEY = 'plansk12_session_token'

function newToken() {
  return crypto.randomUUID()
}

export function getStoredToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

function storeToken(token) {
  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

function staleThresholdISO() {
  return new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString()
}

/**
 * Call immediately after a successful Supabase sign-in (via the
 * onAuthStateChange SIGNED_IN handler in App.jsx).
 *
 * Steps:
 *   1. Delete any stale rows for this user (keeps the table clean).
 *   2. Count FRESH rows only (last_seen_at >= threshold). Self-sufficient
 *      regardless of whether Step 1 succeeded or matched any rows.
 *   3. If count >= MAX_SESSIONS: with evictOldest, delete the oldest live
 *      row(s) to make room; without it, throw "ALREADY_ACTIVE".
 *   4. Insert a new row and write the token to localStorage.
 *
 * Note: steps 1–4 are separate round-trips with no transaction. A very
 * unlikely simultaneous-login race could briefly allow MAX_SESSIONS + 1
 * rows; this self-corrects at the next claimSession() call and is an
 * acceptable trade-off for this use case.
 *
 * @param {{ evictOldest?: boolean }} [opts]  Pass { evictOldest: true } for a
 *   genuine new sign-in (make room by displacing the oldest). Omit for a
 *   heartbeat re-claim (block instead of evicting, to avoid ping-pong).
 * @returns {Promise<string>} The newly minted session token.
 * @throws {"ALREADY_ACTIVE"} If at the limit and evictOldest is not set.
 */
export async function claimSession({ evictOldest = false } = {}) {
  const threshold = staleThresholdISO()

  // Fetch the current user's id once — needed for scoped queries.
  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data?.user) {
    throw new Error('Could not retrieve your account — please try signing in again.')
  }
  const userId = data.user.id

  // Step 1: delete stale rows for this user so they don't accumulate indefinitely.
  // Non-fatal if it fails or matches zero rows — Step 2 is self-sufficient.
  const { count: deletedCount, error: deleteError } = await supabase
    .from('active_sessions')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .lt('last_seen_at', threshold)

  if (deleteError) {
    console.warn('claimSession: stale row cleanup failed:', deleteError.message)
  } else {
    if ((deletedCount ?? 0) === 0) {
      console.info('claimSession: stale row cleanup matched 0 rows (none to delete or filter mismatch)')
    } else {
      console.info(`claimSession: deleted ${deletedCount} stale row(s)`)
    }
  }

  // Step 2: count FRESH rows only — uses the same threshold as Step 1 so the
  // count is correct even if the delete above matched zero rows.
  const { count, error: countError } = await supabase
    .from('active_sessions')
    .select('session_token', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('last_seen_at', threshold)

  if (countError) {
    throw new Error(`Session check failed: ${countError.message}`)
  }

  // Step 3: handle the limit.
  if ((count ?? 0) >= MAX_SESSIONS) {
    if (!evictOldest) {
      // Heartbeat re-claim path: don't fight back in, just report displacement.
      throw 'ALREADY_ACTIVE'
    }
    // Genuine new sign-in: evict the least-recently-seen session(s) to make room,
    // so after inserting this one the account sits at exactly MAX_SESSIONS. The
    // evicted context sees its row gone on its next heartbeat and logs out.
    const evictCount = (count ?? 0) - MAX_SESSIONS + 1
    const { data: oldest, error: oldestError } = await supabase
      .from('active_sessions')
      .select('session_token')
      .eq('user_id', userId)
      .gte('last_seen_at', threshold)
      .order('last_seen_at', { ascending: true })
      .limit(evictCount)

    if (oldestError) {
      // Couldn't read the rows to evict — let the login through anyway rather
      // than hard-failing the app; the cap self-corrects on the next claim.
      console.warn('claimSession: could not read sessions to evict:', oldestError.message)
    } else if (oldest?.length) {
      const tokens = oldest.map((r) => r.session_token)
      const { error: evictError } = await supabase
        .from('active_sessions')
        .delete()
        .in('session_token', tokens)
      if (evictError) {
        console.warn('claimSession: eviction delete failed:', evictError.message)
      } else {
        console.info(`claimSession: evicted ${tokens.length} oldest session(s) to make room`)
      }
    }
  }

  // Step 4: insert a new row for this login.
  const token = newToken()
  const { error: insertError } = await supabase
    .from('active_sessions')
    .insert({ user_id: userId, session_token: token, last_seen_at: new Date().toISOString() })

  if (insertError) {
    throw new Error(`Could not claim session: ${insertError.message}`)
  }

  storeToken(token)
  return token
}

/**
 * Call on a repeating interval (every 5 minutes) while the user is active.
 *
 * Updates last_seen_at for this specific session_token. If no row matches,
 * the row was deleted (e.g. an admin action or DB cleanup) and this session
 * should be considered displaced.
 *
 * Fails silently on network errors to avoid kicking users off during brief
 * connectivity loss.
 *
 * @param {string} token  The token returned by claimSession().
 * @returns {Promise<"ok"|"displaced"|"error">}
 *   "ok"        — heartbeat written successfully.
 *   "displaced" — this session's row is gone; caller should sign out.
 *   "error"     — network/DB error; caller should ignore and retry next tick.
 */
export async function heartbeat(token) {
  if (!token) return 'error'

  try {
    const { data, error } = await supabase
      .from('active_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('session_token', token)
      .select('session_token')
      .maybeSingle()

    if (error) return 'error'

    // No row matched this token — session was removed externally.
    if (!data) return 'displaced'

    return 'ok'
  } catch {
    return 'error'
  }
}

/**
 * Call on explicit logout (before supabase.auth.signOut()).
 *
 * Deletes only this device's row, leaving any other active sessions for this
 * user untouched. Fails silently — the row will expire on its own after
 * STALE_MINUTES if the delete doesn't land.
 */
export async function releaseSession() {
  // Read the token before clearing it — needed for the delete filter.
  const token = getStoredToken()
  clearStoredToken()
  try {
    if (token) {
      await supabase.from('active_sessions').delete().eq('session_token', token)
    }
  } catch {
    // Ignore — row will auto-expire after STALE_MINUTES.
  }
}
