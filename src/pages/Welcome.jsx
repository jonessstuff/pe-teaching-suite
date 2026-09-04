import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, MailCheck } from 'lucide-react'
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

// Post-checkout landing. The Stripe payment link redirects here with
// ?session_id=…; this page confirms the payment on-screen (so it's visibly
// continuous with our brand, not a scam), and makes sure the buyer has a way in:
// activate-checkout ensures their account exists and — via the Resend button —
// (re)sends a one-tap magic link. New accounts already get that email from the
// webhook; this page is the on-screen continuity + a safety net for drop-offs.
export default function Welcome() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState(sessionId ? 'loading' : 'fallback') // loading | ready | fallback
  const [email, setEmail] = useState(null)
  const [resend, setResend] = useState('idle') // idle | sending | sent | error

  useEffect(() => {
    if (!sessionId) return
    let active = true
    supabase.functions
      .invoke('activate-checkout', { body: { session_id: sessionId } })
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data?.email) { setStatus('fallback'); return }
        setEmail(data.email)
        setStatus('ready')
      })
      .catch(() => { if (active) setStatus('fallback') })
    return () => { active = false }
  }, [sessionId])

  async function handleResend() {
    setResend('sending')
    const { error } = await supabase.functions.invoke('activate-checkout', {
      body: { session_id: sessionId, resend: true },
    })
    setResend(error ? 'error' : 'sent')
  }

  const shell = (inner) => (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><PlansK12Logo /></div>
        {inner}
      </div>
    </div>
  )

  if (status === 'loading') {
    return shell(
      <div className="card p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-ink-400">
          <Loader2 size={16} className="animate-spin" />
          Confirming your subscription…
        </div>
      </div>
    )
  }

  if (status === 'ready') {
    return shell(
      <div className="card p-6 text-center space-y-4">
        <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
        <div>
          <h1 className="text-lg font-semibold text-ink-50">You're in — payment received</h1>
          <p className="mt-2 text-sm text-ink-300">
            Your subscription is active. We've sent a one-tap login link to <strong className="text-ink-100">{email}</strong>.
            Open it on this device to log in — no password needed.
          </p>
        </div>
        <p className="text-xs text-ink-500">
          You won't be charged again to set this up — your subscription is already active.
          You can add a password later from Settings.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resend === 'sending' || resend === 'sent'}
          className="btn-secondary w-full"
        >
          {resend === 'sending' && <Loader2 size={16} className="animate-spin" />}
          {resend === 'sent' ? 'Link sent ✓' : 'Resend login link'}
        </button>
        {resend === 'sent' && (
          <p className="text-xs text-emerald-400">Sent — check {email} (and your spam folder).</p>
        )}
        {resend === 'error' && (
          <p className="text-xs text-red-400">Couldn't resend just now — try again in a moment.</p>
        )}
        <a href="/login" className="block text-sm text-ink-400 hover:text-ink-200">
          Already have a password? Log in →
        </a>
      </div>
    )
  }

  // fallback — no/invalid session_id, or the confirm call failed. Still reassure
  // that payment went through and point them at a way in.
  return shell(
    <div className="card p-6 text-center space-y-4">
      <MailCheck size={36} className="mx-auto text-sky-400" />
      <div>
        <h1 className="text-lg font-semibold text-ink-50">Payment received</h1>
        <p className="mt-2 text-sm text-ink-300">
          Check your email for a one-tap login link to finish setting up PlansK12.
          If it hasn't arrived in a minute, head to the login page and request a link.
        </p>
      </div>
      <a href="/login" className="btn-primary block w-full text-center">Go to login</a>
    </div>
  )
}
