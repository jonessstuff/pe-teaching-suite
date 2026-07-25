/**
 * Inactivity-based auto-logout.
 *
 * Rather than trying to detect tab/app close (unreliable across browsers and
 * mobile, and it would log teachers out every time they pop in and out during
 * the day), we track the last time the app was actively used on this device
 * and force a fresh login once it's been idle for INACTIVITY_DAYS.
 *
 * A returning teacher after a stretch away therefore gets a clean login — and
 * on that fresh session the What's New banner surfaces anything they missed.
 *
 * State lives in localStorage (per device), which is the right granularity:
 * "activity" means actually opening/using the app, not merely holding a
 * persisted Supabase session.
 */

const LAST_ACTIVE_KEY = 'plansk12_last_active'
const INACTIVITY_DAYS = 7
const INACTIVITY_MS = INACTIVITY_DAYS * 24 * 60 * 60 * 1000

/** Stamp the current time as the most recent activity. */
export function recordActivity() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
  } catch {
    // Private-mode / storage disabled — inactivity gating simply no-ops.
  }
}

/**
 * True when the last recorded activity is older than the inactivity window.
 * Returns false when there's no record yet (first ever load), so we never
 * bounce a brand-new session.
 */
export function isInactive() {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY)
    if (!raw) return false
    const last = Number(raw)
    if (!Number.isFinite(last)) return false
    return Date.now() - last > INACTIVITY_MS
  } catch {
    return false
  }
}

/** Clear the activity marker (e.g. on explicit logout). */
export function clearActivity() {
  try {
    localStorage.removeItem(LAST_ACTIVE_KEY)
    // Also drop the cached greeting name so the next user on this browser
    // doesn't briefly see the previous user's name. Keep key in sync with
    // hooks/useDisplayName.js.
    localStorage.removeItem('pk12_first_name')
  } catch {
    // ignore
  }
}
