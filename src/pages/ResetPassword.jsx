import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function PlansK12Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M2 2C2 0.895 2.895 0 4 0H18L26 8V30C26 31.105 25.105 32 24 32H4C2.895 32 2 31.105 2 30V2Z" fill="#4F7FFA" />
        <path d="M18 0L26 8H20C18.895 8 18 7.105 18 6V0Z" fill="#3b6de8" />
        <rect x="6" y="14" width="14" height="2" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="6" y="19" width="10" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <circle cx="20" cy="26" r="7" fill="#0ea5e9" />
        <path d="M16.5 26L19 28.5L23.5 23.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.01em' }}>
        <span className="text-ink-50">Plans</span><span style={{ color: '#4F7FFA' }}>K12</span>
      </span>
    </div>
  )
}

export default function ResetPassword() {
  // 'loading' — waiting for Supabase to fire PASSWORD_RECOVERY
  // 'form'    — recovery session confirmed, form is active
  // 'invalid' — no recovery session after timeout (link expired/already used)
  // 'success' — password updated, signing out and redirecting
  const [mode, setMode] = useState('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitStatus, setSubmitStatus] = useState('idle') // 'idle' | 'loading'
  const [error, setError] = useState(null)

  useEffect(() => {
    let timeout
    let resolved = false

    function unlock() {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      setMode('form')
    }

    // Subscribe BEFORE calling getSession so we never miss the event, even if
    // Supabase fires it synchronously during client initialisation.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        unlock()
      }
    })

    // Catch the race: if Supabase already processed the recovery token before
    // this component mounted, PASSWORD_RECOVERY won't fire again but getSession
    // will return the live recovery session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) unlock()
    })

    // If neither path delivers a session within 10 s, the link is expired or
    // the user navigated here directly without a valid token.
    timeout = setTimeout(() => {
      if (!resolved) setMode('invalid')
    }, 10_000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setSubmitStatus('loading')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setSubmitStatus('idle')
      setError(updateError.message)
      return
    }

    // Show success state first so the user sees confirmation, then sign out
    // and hard-redirect. Hard redirect avoids BrowserRouter branch-switching
    // confusion that would unmount the component mid-success-display.
    setMode('success')
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (mode === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="flex flex-col items-center gap-6">
          <PlansK12Logo />
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Loader2 size={16} className="animate-spin" />
            Verifying your reset link…
          </div>
        </div>
      </div>
    )
  }

  // ── Expired / invalid ────────────────────────────────────────────────────
  if (mode === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <PlansK12Logo />
          </div>
          <div className="card p-6 text-center space-y-4">
            <AlertCircle size={36} className="mx-auto text-amber-400" />
            <div>
              <h1 className="text-lg font-semibold text-ink-50">Link expired or invalid</h1>
              <p className="mt-1 text-sm text-ink-400">
                Password reset links are only valid for a short time. Request a new one and try again.
              </p>
            </div>
            <a href="/login" className="btn-primary block w-full text-center">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (mode === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <PlansK12Logo />
          </div>
          <div className="card p-6 text-center space-y-4">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
            <div>
              <h1 className="text-lg font-semibold text-ink-50">Password updated</h1>
              <p className="mt-1 text-sm text-ink-400">
                Signing you out — redirecting to login…
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-ink-500">
              <Loader2 size={14} className="animate-spin" />
              Redirecting…
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form (mode === 'form') ───────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <PlansK12Logo />
        </div>

        <div className="card p-6">
          <h1 className="mb-1 text-lg font-semibold text-ink-50">Set a new password</h1>
          <p className="mb-5 text-sm text-ink-400">Choose a new password for your account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">New password</label>
              <input
                type="password"
                required
                minLength={6}
                autoFocus
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Confirm password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitStatus === 'loading'}
            >
              {submitStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
              Update password
            </button>
          </form>
        </div>

        <a
          href="/login"
          className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-ink-200"
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  )
}
