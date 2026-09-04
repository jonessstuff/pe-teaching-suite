import { supabase } from '../lib/supabaseClient'
import { checkoutUrl } from './campaignAttributionService'

// ---------------------------------------------------------------------
// Trial constants. Keep EXPORT_CAP in sync with the cap hardcoded in
// supabase/migrations/0020_trial_export_limits.sql (increment_export_count).
// ---------------------------------------------------------------------
export const TRIAL_DAYS = 7
export const EXPORT_CAP = 5
export const TRIAL_HORIZON_WEEKS = 4
export const WATERMARK_TEXT = 'PlansK12 trial — upgrade to remove this from your printed lessons. plansk12.com'
// New-user signup / free-trial checkout — Stripe payment link WITH the 7-day
// trial, $9.99/mo. Single source of truth for EVERY new-signup CTA (Landing,
// TryFreeLesson, FreeLessonView, Login) so no path can reach the retired $6.99
// rate. (The old $6.99 link stays live in Stripe only so current trialers
// convert at their grandfathered rate; it is intentionally unreferenced here.)
export const CHECKOUT_URL = 'https://buy.stripe.com/14AeV5dQN5K8cKd1JE0kE07'
// Annual plan — $99.99/yr, NO trial (charges immediately); ~2 months free vs.
// paying monthly. The yearly option on the Landing pricing card.
export const YEARLY_CHECKOUT_URL = 'https://buy.stripe.com/dRmeV56ol6Oc7pTbke0kE08'
// Existing-user upgrade CTA (preview paywall banner, PaywallModal, Settings).
// Points at the $9.99/mo link so the retired $6.99 rate is not reachable via a
// public link. NOTE: this link carries the 7-day trial, so an in-app "Upgrade"
// now starts a fresh trial (and could create a second subscription for someone
// who already has one). If you want immediate-charge upgrades, create a $9.99
// NO-trial link and point this constant there instead.
export const UPGRADE_URL = 'https://buy.stripe.com/14AeV5dQN5K8cKd1JE0kE07'

export function attributedCheckoutUrl(baseUrl = CHECKOUT_URL) {
  return checkoutUrl(baseUrl)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Stripe subscription statuses (cached on profiles.subscription_status by the
// get-subscription-status Edge Function). Anything not "paid" and not
// "trialing" (canceled / unpaid / incomplete_expired / paused / …) is treated
// as expired.
const PAID_STATUSES = new Set(['active', 'past_due']) // past_due = grace period

// ---------------------------------------------------------------------
// deriveTrialState — derives trial/paid status from a profile row whose
// subscription_status was synced from Stripe (source of truth).
//   paid    = subscription_status in ('active','past_due')
//   trial   = subscription_status = 'trialing'
//             OR (no synced status AND created_at within TRIAL_DAYS)
//   expired = subscription_status in canceled/unpaid/incomplete_expired/paused
//             OR (no synced status AND created_at older than TRIAL_DAYS)
// The `trialing` case is critical: our Stripe Checkout takes a card up front
// and starts a Stripe trial (its length is configured on the Stripe payment
// link, not here), so those users have a subscription row but must STILL be
// gated until it converts to `active`.
// ---------------------------------------------------------------------
export function deriveTrialState(profile) {
  const status = profile?.subscription_status ?? null
  const exportCount = profile?.export_count ?? 0

  const createdAt = profile?.created_at ? new Date(profile.created_at) : null
  const daysSinceCreated = createdAt
    ? Math.floor((Date.now() - createdAt.getTime()) / MS_PER_DAY)
    : 0

  // Owner/admin exemption: a server-side profiles.is_owner flag (set via SQL,
  // never from the app) makes an account permanently paid — full access, no
  // watermark, no cap — regardless of Stripe status. Folded into isPaid so
  // every existing isPaid consumer (watermark, banner, gated features, export
  // cap) honors it with no further changes.
  const isOwner = profile?.is_owner === true
  const isPaid = isOwner || PAID_STATUSES.has(status)

  // Trial: an active Stripe trial, or an unsynced/no-subscription user still
  // inside the TRIAL_DAYS window (fallback for accounts with no Stripe record).
  const stripeTrialing = status === 'trialing'
  const fallbackTrial = status === null && daysSinceCreated < TRIAL_DAYS
  const isTrial = !isPaid && (stripeTrialing || fallbackTrial)

  const isExpired = !isPaid && !isTrial // canceled/etc, or no sub past the trial window

  // Days left: prefer Stripe's trial_end; otherwise the created_at fallback.
  let daysLeft = 0
  if (stripeTrialing && profile?.trial_ends_at) {
    const ms = new Date(profile.trial_ends_at).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / MS_PER_DAY))
  } else if (fallbackTrial) {
    daysLeft = Math.max(0, TRIAL_DAYS - daysSinceCreated)
  }

  return {
    isPaid,
    isOwner,
    isTrial,
    // A trialing subscriber (card on file, in the Stripe trial) can "activate
    // now" — end the trial early and be charged immediately. Distinct from the
    // free no-card trial (status null), which must subscribe first.
    isTrialingSubscriber: status === 'trialing',
    isExpired,
    status,
    daysLeft,
    exportCount,
    exportsLeft: isPaid ? Infinity : Math.max(0, EXPORT_CAP - exportCount),
  }
}

// ---------------------------------------------------------------------
// activateSubscriptionNow — ends a trialing user's Stripe trial immediately
// (charging the card on file now) and returns the resulting { status, isPaid }.
// Fail-closed server-side: isPaid is only true if Stripe actually charged and
// the subscription is active. Throws on transport/500 errors.
// ---------------------------------------------------------------------
export async function activateSubscriptionNow() {
  const { data, error } = await supabase.functions.invoke('activate-subscription', { body: {} })
  if (error) {
    // functions.invoke wraps non-2xx as an error; surface the server's message.
    let message = error.message ?? 'Activation failed. Please try again.'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* keep default */ }
    throw new Error(message)
  }
  return data // { status, isPaid, error? }
}

// ---------------------------------------------------------------------
// incrementExportCount — atomically bumps the counter server-side and
// reports whether the caller was capped. Returns { count, capped }.
// ---------------------------------------------------------------------
export async function incrementExportCount() {
  const { data, error } = await supabase.rpc('increment_export_count')
  if (error) throw error
  // RPC returns a single-row table: [{ export_count, capped }]
  const row = Array.isArray(data) ? data[0] : data
  return { count: row?.export_count ?? 0, capped: !!row?.capped }
}
