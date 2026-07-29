import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { CHECKOUT_URL } from '../services/trialService'

// New accounts are created ONLY through the card-required Stripe checkout (7-day
// trial). The in-app cardless "Sign up" form was removed so every account becomes
// a real Stripe customer with a card on file. This page is sign-in + reset only;
// "Don't have an account?" sends new users to the checkout (CHECKOUT_URL, the
// $9.99/mo link — single source of truth in trialService).

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
  const [mode, setMode] = useState('sign_in') // 'sign_in' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [forgotSent, setForgotSent] = useState(false)

  // authError comes from App.jsx state (set by the onAuthStateChange handler)
  // and takes priority over local message state.
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

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatus('idle')
      setMessage(error.message)
      return
    }
    // Sign-in succeeded — session enforcement happens in App.jsx's
    // onAuthStateChange handler. If claimSession() blocks this login, authError
    // is set as a prop without this component unmounting.
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
              <h1 className="mb-1 text-lg font-semibold text-ink-50">Sign in</h1>
              <p className="mb-5 text-sm text-ink-400">Welcome back — let’s get the week planned.</p>

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
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
                    >
                      Forgot password?
                    </button>
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

                {displayMessage && <p className="text-sm text-red-400">{displayMessage}</p>}

                <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
                  {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                  Sign in
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
          <a
            href={CHECKOUT_URL}
            className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-ink-200"
          >
            Don’t have an account? Start your free trial →
          </a>
        )}
      </div>
    </div>
  )
}
