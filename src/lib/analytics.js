/**
 * Product analytics (PostHog) — Phase 1 foundation.
 *
 * PRIVACY MODEL (non-negotiable, enforced here):
 *  - autocapture OFF, heatmaps OFF, session replay OFF, pageviews OFF.
 *    We ONLY send the handful of explicit events instrumented in the app.
 *  - Input masking is enabled globally as defense-in-depth so field contents
 *    can never be recorded even if a capture path were added later.
 *  - Users are identified by their Supabase user id ONLY — never email/name.
 *  - The "My Students" area is excluded entirely: track() is a no-op there.
 *  - Callers pass metadata only (subject, grade, counts, durations). Never pass
 *    lesson text, student names, or accommodation details as properties.
 */
import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let ready = false

/** Paths under which NO analytics may fire (student data area). */
function inStudentArea() {
  if (typeof window === 'undefined') return false
  return /^\/students(\/|$)/.test(window.location.pathname)
}

export function initAnalytics() {
  if (ready || !KEY) return
  posthog.init(KEY, {
    api_host: HOST,
    // ── Only-explicit-events posture ─────────────────────────────
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    enable_heatmaps: false,
    capture_performance: false,
    // ── Input masking (defense-in-depth; recording is off anyway) ─
    mask_all_text: true,
    mask_all_element_attributes: true,
    session_recording: { maskAllInputs: true, maskTextSelector: '*' },
    // ── Identity ─────────────────────────────────────────────────
    // Only create a person profile once we've identified by Supabase id.
    person_profiles: 'identified_only',
    // Don't auto-generate a $pageview on load; we send nothing implicitly.
    loaded: (ph) => {
      // Belt-and-suspenders: if the app ever boots directly on /students,
      // make sure no queued autocapture/pageview leaks out.
      if (inStudentArea()) ph.opt_out_capturing?.()
    },
  })
  ready = true
}

/** Identify the current user by Supabase user id ONLY (no email/name). */
export function identifyUser(userId) {
  if (!ready || !userId) return
  if (inStudentArea()) return
  posthog.identify(userId)
}

/** Clear identity on sign-out so the next user starts anonymous. */
export function resetAnalytics() {
  if (!ready) return
  posthog.reset()
}

/**
 * Send one of the explicitly-instrumented Phase 1 events.
 * No-ops inside the student-data area. Pass metadata only.
 */
export function track(event, properties = {}) {
  if (!ready) return
  if (inStudentArea()) return
  posthog.capture(event, properties)
}
