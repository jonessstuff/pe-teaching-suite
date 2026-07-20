---
name: feedback-tab-switch-session-bug
description: Root cause and fix for the tab-switch ALREADY_ACTIVE lockout bug
metadata:
  type: feedback
---

Supabase JS v2 fires `SIGNED_IN` on `onAuthStateChange` for both genuine logins AND automatic token refreshes (e.g. when the tab regains visibility). The original code called `claimSession()` unconditionally on every `SIGNED_IN`, which inserted a new `active_sessions` row each time — causing rows to accumulate and the 2-session limit to trip on the same device after a few tab switches.

**Fix (App.jsx):** Before calling `claimSession()` in the `SIGNED_IN` handler, check `getStoredToken()`. If a token is already stored, the event is a token refresh on an established session — skip `claimSession()` and just call `setSession(session)`.

**Why:** `getStoredToken()` is null until a real `claimSession()` succeeds and is cleared by `releaseSession()` on logout, so genuine new logins (no stored token) still go through the full enforcement path.
