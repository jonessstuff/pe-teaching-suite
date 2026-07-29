import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProfile } from '../services/profilesService'
import { deriveTrialState, incrementExportCount } from '../services/trialService'
import { track } from '../lib/analytics'

// Skip the Stripe round-trip if the cached status was synced this recently.
const STATUS_FRESH_MS = 60 * 60 * 1000 // 1 hour

function isStatusFresh(profile) {
  const syncedAt = profile?.subscription_synced_at
  return !!syncedAt && Date.now() - new Date(syncedAt).getTime() < STATUS_FRESH_MS
}

// Invoke the Edge Function that reads the live Stripe subscription status.
// It ALSO tries to cache the status onto the profile row, but the cache columns
// (subscription_status, stripe_customer_id, subscription_synced_at, …) don't
// exist on this DB (migrations 0019/0020 were never applied), so that write is a
// silent no-op. We therefore TRUST THE FUNCTION'S LIVE RESPONSE and merge it onto
// the profile in memory, so deriveTrialState sees the real Stripe status instead
// of reading a missing column (which always came back null → every paying user
// past their 7-day window was gated). Returns the merged profile.
async function syncSubscriptionStatus() {
  const { data, error } = await supabase.functions.invoke('get-subscription-status', { body: {} })
  if (error) throw error
  const profile = await getProfile()
  if (!data) return profile
  return { ...profile, subscription_status: data.status ?? null, trial_ends_at: data.trialEndsAt ?? null }
}

// Paywall reasons: 'export-cap' | 'gated-feature' | 'trial-expired' | null
const TrialContext = createContext(null)

const EMPTY_STATE = {
  isPaid: false,
  isOwner: false,
  isTrial: false,
  isExpired: false,
  daysLeft: 0,
  exportCount: 0,
  exportsLeft: 0,
}

export function TrialProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [paywall, setPaywall] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const p = await getProfile()
      setProfile(p)
    } catch {
      // Non-fatal: if the profile can't be loaded we fall back to the
      // empty (locked-down) state rather than crashing the app.
      setProfile(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  // Force a live re-check of the Stripe subscription status (bypasses the
  // 1-hour freshness throttle). Used by the Settings "Refresh" button.
  const syncStatus = useCallback(async () => {
    const fresh = await syncSubscriptionStatus()
    if (fresh) setProfile(fresh)
    return fresh
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      // 1. Show cached status immediately (fast path).
      let cached = null
      try {
        cached = await getProfile()
        if (active) setProfile(cached)
      } catch {
        if (active) setProfile(null)
      } finally {
        if (active) setLoaded(true)
      }

      // 2. Refresh from Stripe unless the cache is still fresh. Best-effort —
      //    on failure we keep the cached value.
      if (isStatusFresh(cached)) return
      try {
        const fresh = await syncSubscriptionStatus()
        if (active && fresh) setProfile(fresh)
      } catch {
        /* keep cached status */
      }
    })()
    return () => { active = false }
  }, [])

  const state = profile ? deriveTrialState(profile) : EMPTY_STATE

  const openPaywall = useCallback((reason) => setPaywall(reason), [])
  const closePaywall = useCallback(() => setPaywall(null), [])

  // requestExport — gate + count a watermarkable export.
  // Returns true if the export may proceed, false if it was blocked
  // (and a paywall was opened).
  // `format` is metadata only ('print' | 'pdf' | 'share'). lesson_exported
  // fires only when the export actually proceeds (returns true), never when
  // it's blocked by the paywall.
  const requestExport = useCallback(async (format = 'print') => {
    if (state.isPaid) {
      track('lesson_exported', { format })
      return true
    }
    if (state.isExpired) {
      setPaywall('trial-expired')
      return false
    }
    try {
      const { count, capped } = await incrementExportCount()
      setProfile((prev) => (prev ? { ...prev, export_count: count } : prev))
      if (capped) {
        setPaywall('export-cap')
        return false
      }
      track('lesson_exported', { format })
      return true
    } catch {
      // If the counter RPC fails, don't hard-block the user's export.
      track('lesson_exported', { format })
      return true
    }
  }, [state.isPaid, state.isExpired])

  const value = {
    ...state,
    profile,
    loaded,
    paywall,
    openPaywall,
    closePaywall,
    requestExport,
    refresh,
    syncStatus,
  }

  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrial() {
  const ctx = useContext(TrialContext)
  if (!ctx) {
    throw new Error('useTrial must be used within a TrialProvider')
  }
  return ctx
}
