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
    // Only report errors whose stack originates from OUR bundle. Browser
    // extensions and mobile in-app WebViews (Facebook/Instagram/etc.) inject
    // scripts that throw in the page context; those frames live at
    // chrome-extension://, host-app, or anonymous origins and are dropped here.
    // Genuine app errors — including real fetch/network TypeErrors thrown from
    // our own fetch calls — carry our stack frames and are KEPT. Sentry's
    // InboundFilters fails OPEN when it cannot attribute a URL, so a stackless
    // network error is still reported rather than hidden. (Edge-function errors
    // report via the separate server SDK and are unaffected by this browser-only
    // allowlist.)
    allowUrls: [/plansk12\.com/, /pehealthk12\.netlify\.app/, /localhost/],
    // Unambiguous non-app noise: iOS WKWebView / Android WebView JS-bridge
    // errors injected by in-app browsers. We use none of these APIs (verified:
    // no window.webkit / messageHandlers / postMessage in our code), so these
    // strings cannot match a real PlansK12 error. Deliberately NOT ignoring
    // "Failed to fetch" — real Supabase/network failures share that message and
    // must keep reporting (allowUrls already drops the extension-origin ones).
    ignoreErrors: [
      'Java object is gone',
      'Java exception was raised',
      'window.webkit',
      'webkit.messageHandlers',
    ],
  })
  ready = true
}

/** Tag errors with the Supabase user id only (never email/name). */
export function setSentryUser(userId) {
  if (!ready) return
  Sentry.setUser(userId ? { id: userId } : null)
}

export { Sentry }
