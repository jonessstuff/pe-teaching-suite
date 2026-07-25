/**
 * Error monitoring (Sentry) — client.
 *
 * Phase 1: error capture only. No performance tracing, no session replay,
 * no PII. Users are tagged by Supabase user id only.
 */
import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN

let ready = false

export function initSentry() {
  if (ready || !DSN) return
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    // Error monitoring only — no tracing, profiling, or replay in Phase 1.
    integrations: [],
    tracesSampleRate: 0,
    // Never attach cookies/headers/IP or other default PII.
    sendDefaultPii: false,
  })
  ready = true
}

/** Tag errors with the Supabase user id only (never email/name). */
export function setSentryUser(userId) {
  if (!ready) return
  Sentry.setUser(userId ? { id: userId } : null)
}

export { Sentry }
