import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { track, identifyUser } from '../lib/analytics'
import TeachingAreasField from '../components/TeachingAreasField'

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

export default function Login({ authError, onClearAuthError }) {
  const [mode, setMode] = useState('sign_in') // 'sign_in' | 'sign_up' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [forgotSent, setForgotSent] = useState(false)
  const [teaching, setTeaching] = useState({ areas: [], ctePathways: [], other: '' })

  // authError comes from App.jsx state (set by the onAuthStateChange handler)
  // and takes priority over local message state. Local message is for
  // credential errors (wrong password, etc.) and sign-up confirmation.
  const displayMessage = authError || message

  function switchMode(newMode) {
    setMode(newMode)
    setPassword('')
    setStatus('idle')
    setMessage(null)
    setForgotSent(false)
    onClearAuthError?.()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    onClearAuthError?.()
    setStatus('loading')
    setMessage(null)

    const { data, error } =
      mode === 'sign_in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            // Captured into the profile by the handle_new_user() trigger (migration 0024).
            options: {
              data: {
                teaching_areas: teaching.areas,
                cte_pathways: teaching.ctePathways,
                teaching_other: teaching.other.trim() || null,
              },
            },
          })

    if (error) {
      setStatus('idle')
      setMessage(error.message)
      return
    }

    if (mode === 'sign_up') {
      // Analytics: account creation. Identify by the new Supabase user id only
      // (no email/name), then record the event with metadata only.
      const newUserId = data?.user?.id
      if (newUserId) identifyUser(newUserId)
      const referralCode = new URLSearchParams(window.location.search).get('ref')
      track('sign_up', {
        method: 'email',
        ...(referralCode ? { referral_code: referralCode } : {}),
      })
      // NOTE: the owner "new signup" notification fires SERVER-SIDE via a database
      // trigger on auth.users insert (migration 0034) → notify-signup Edge Function.
      // Kept off the client on purpose so a stale/cached bundle or a non-web signup
      // path can never miss it.
      setStatus('idle')
      setMessage('Check your email to confirm your account.')
      return
    }

    // sign_in succeeded — enforcement happens in App.jsx's onAuthStateChange
    // handler. If claimSession() blocks this login, authError will be set
    // as a prop on this component without it ever unmounting.
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://plansk12.com/reset-password',
    })

    setStatus('idle')
    if (error) {
      setMessage(error.message)
      return
    }
    setForgotSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <PlansK12Logo />
        </div>

        <div className="card p-6">
          {mode === 'forgot' ? (
            <>
              <h1 className="mb-1 text-lg font-semibold text-ink-50">Reset your password</h1>
              <p className="mb-5 text-sm text-ink-400">
                {forgotSent
                  ? 'Check your inbox — we sent you a reset link.'
                  : 'Enter your email and we’ll send you a reset link.'}
              </p>

              {forgotSent ? (
                <p className="text-sm text-emerald-400">
                  Password reset email sent — check your inbox.
                </p>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-200">Email</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      className="input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.org"
                    />
                  </div>

                  {message && <p className="text-sm text-red-400">{message}</p>}

                  <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
                    {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                    Send reset link
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-semibold text-ink-50">
                {mode === 'sign_in' ? 'Sign in' : 'Create your account'}
              </h1>
              <p className="mb-5 text-sm text-ink-400">
                {mode === 'sign_in'
                  ? 'Welcome back — let’s get the week planned.'
                  : 'Set up your single-teacher workspace.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-200">Email</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.org"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-ink-200">Password</label>
                    {mode === 'sign_in' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {mode === 'sign_up' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-200">
                      What do you teach? <span className="font-normal text-ink-500">(select all that apply)</span>
                    </label>
                    <TeachingAreasField value={teaching} onChange={setTeaching} />
                  </div>
                )}

                {displayMessage && <p className="text-sm text-red-400">{displayMessage}</p>}

                <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
                  {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                  {mode === 'sign_in' ? 'Sign in' : 'Sign up'}
                </button>
              </form>
            </>
          )}
        </div>

        {mode === 'forgot' ? (
          <button
            onClick={() => switchMode('sign_in')}
            className="mt-4 w-full text-center text-sm text-ink-400 hover:text-ink-200"
          >
            ← Back to sign in
          </button>
        ) : (
          <button
            onClick={() => switchMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
            className="mt-4 w-full text-center text-sm text-ink-400 hover:text-ink-200"
          >
            {mode === 'sign_in' ? "Don’t have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        )}
      </div>
    </div>
  )
}
