import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Copy, Check, BarChart3, ExternalLink, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getProfile, updateProfile } from '../services/profilesService'
import { releaseSession } from '../services/sessionService'
import { US_STATES } from '../constants/usStates'
import { getMyCode } from '../services/referralService'
import { useTrial } from '../context/TrialContext'
import { EXPORT_CAP, CHECKOUT_URL } from '../services/trialService'

const SUBJECTS = ['PE', 'Health', 'Family Life', "Driver's Ed"]

export default function Settings() {
  const [email, setEmail] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    school_name: '',
    district_name: '',
    default_subject: 'PE',
    state: '',
  })
  const [loadStatus, setLoadStatus] = useState('loading')
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwStatus, setPwStatus] = useState('idle') // idle | saving | saved | error
  const [pwError, setPwError] = useState(null)
  const [referralCode, setReferralCode] = useState(null)
  const [referralCopied, setReferralCopied] = useState(false)

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState(null)

  const trial = useTrial()
  const [statusRefreshing, setStatusRefreshing] = useState(false)

  async function handleRefreshStatus() {
    setStatusRefreshing(true)
    try {
      await trial.syncStatus()
    } catch {
      /* keep whatever status we have */
    } finally {
      setStatusRefreshing(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? null))
    getMyCode().then(setReferralCode).catch(() => {})
    getProfile()
      .then((profile) => {
        setForm({
          full_name: profile.full_name ?? '',
          school_name: profile.school_name ?? '',
          district_name: profile.district_name ?? '',
          default_subject: profile.default_subject ?? 'PE',
          state: profile.state ?? '',
        })
        setLoadStatus('ready')
      })
      .catch(() => setLoadStatus('ready'))
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveStatus('saving')
    setSaveError(null)
    try {
      await updateProfile(form)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveError(err.message ?? 'Failed to save.')
      setSaveStatus('error')
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError(null)

    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords don't match.")
      return
    }

    if (!email) return

    setPwStatus('saving')

    // Verify current password before updating — signInWithPassword re-auths
    // without disrupting the session (App.jsx fast-paths when token is live).
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email,
      password: pwForm.current,
    })

    if (reAuthError) {
      setPwError('Current password is incorrect.')
      setPwStatus('error')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: pwForm.newPw })

    if (updateError) {
      setPwError(updateError.message)
      setPwStatus('error')
      return
    }

    setPwStatus('saved')
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwStatus('idle'), 3000)
  }

  async function handleSignOut() {
    await releaseSession()
    await supabase.auth.signOut()
  }

  async function handleOpenBillingPortal() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: {},
      })
      if (error) throw error
      if (!data?.url) throw new Error('No portal URL returned.')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setPortalError(err.message ?? 'Could not open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="label-eyebrow mb-2">Account</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      {/* Account / sign out — first so it's reachable on mobile without scrolling */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-ink-50">Account</h2>
        <div>
          <p className="text-sm text-ink-400">Signed in as</p>
          <p className="font-medium text-ink-50">{email ?? '—'}</p>
        </div>
        <button onClick={handleSignOut} className="btn-secondary">
          Sign out
        </button>
      </div>

      {/* Subscription & Billing */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink-50">Subscription &amp; Billing</h2>
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={statusRefreshing}
            className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={statusRefreshing ? 'animate-spin' : ''} />
            {statusRefreshing ? 'Checking…' : 'Refresh'}
          </button>
        </div>

        {/* Current plan status */}
        <div className="rounded-lg border border-ink-800 bg-ink-900/40 p-4">
          {!trial.loaded ? (
            <p className="flex items-center gap-2 text-sm text-ink-400">
              <Loader2 size={14} className="animate-spin" /> Checking your plan…
            </p>
          ) : (
            <PlanStatus trial={trial} />
          )}
        </div>

        <p className="text-sm text-ink-400">
          To cancel your subscription, click &ldquo;Manage subscription&rdquo; below. Your access
          continues until the end of your current billing period.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenBillingPortal}
            disabled={portalLoading}
            className="btn-primary"
          >
            {portalLoading
              ? <><Loader2 size={14} className="animate-spin" /> Opening…</>
              : <><ExternalLink size={14} /> Manage subscription</>
            }
          </button>
          <button
            type="button"
            onClick={handleOpenBillingPortal}
            disabled={portalLoading}
            className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Cancel subscription
          </button>
        </div>
        {portalError && (
          <p className="text-sm text-red-400">{portalError}</p>
        )}
        <p className="text-xs text-ink-600">
          Both buttons open Stripe&rsquo;s secure customer portal where you can cancel, change
          your plan, or update payment details.
        </p>
      </div>

      {/* Profile form */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink-50">School &amp; profile</h2>

        {loadStatus === 'loading' ? (
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Full name">
              <input
                className="input-field"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
              />
            </Field>

            <Field label="School name">
              <input
                className="input-field"
                placeholder="Lincoln Middle School"
                value={form.school_name}
                onChange={(e) => setField('school_name', e.target.value)}
              />
            </Field>

            <Field label="District name">
              <input
                className="input-field"
                placeholder="Springfield Unified School District"
                value={form.district_name}
                onChange={(e) => setField('district_name', e.target.value)}
              />
            </Field>

            <Field label="State" hint="Used to align generated lessons to your state's standards.">
              <select
                className="input-field"
                value={form.state}
                onChange={(e) => setField('state', e.target.value)}
              >
                <option value="">Select a state…</option>
                {US_STATES.map((s) => (
                  <option key={s.abbr} value={s.abbr}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Default subject">
              <select
                className="input-field"
                value={form.default_subject}
                onChange={(e) => setField('default_subject', e.target.value)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            {saveError && (
              <p className="text-sm text-red-400">{saveError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </button>
              {saveStatus === 'saved' && (
                <p className="text-sm text-accent-400">Saved!</p>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Referral */}
      {referralCode && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-50">Refer a colleague</h2>
          <p className="text-sm text-ink-400">Share PlansK12 with a fellow specialist and they get started with a recommendation from you.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-300">
              {window.location.origin}/login?ref={referralCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/login?ref=${referralCode}`)
                setReferralCopied(true)
                setTimeout(() => setReferralCopied(false), 2000)
              }}
              className="btn-secondary"
            >
              {referralCopied ? <Check size={14} /> : <Copy size={14} />}
              {referralCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <p className="text-xs text-ink-500">Your referral code: <strong className="text-ink-300">{referralCode}</strong></p>
        </div>
      )}

      {/* District report link */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-ink-50">Analytics</h2>
        <p className="text-sm text-ink-400">View lesson volume, standards coverage, and other stats from your library.</p>
        <Link to="/district-report" className="btn-secondary inline-flex">
          <BarChart3 size={16} /> View District Report
        </Link>
      </div>

      {/* Change password */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink-50">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="Current password">
            <input
              type="password"
              required
              className="input-field"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>

          {pwError && <p className="text-sm text-red-400">{pwError}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="btn-primary" disabled={pwStatus === 'saving'}>
              {pwStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
              Update password
            </button>
            {pwStatus === 'saved' && (
              <p className="text-sm text-accent-400">Password updated successfully</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

function PlanStatus({ trial }) {
  const { isPaid, isOwner, isTrial, isExpired, status, daysLeft, exportCount } = trial

  let badgeClass = 'bg-ink-700 text-ink-300'
  let label = 'Free account'
  let detail = null

  if (isOwner) {
    badgeClass = 'bg-indigo-500/15 text-indigo-300'
    label = 'Owner'
    detail = 'Full access — unlimited exports, no watermark, no caps.'
  } else if (isPaid) {
    badgeClass = 'bg-emerald-500/15 text-emerald-400'
    label = status === 'past_due' ? 'Active · payment past due' : 'Active'
    detail = status === 'past_due'
      ? 'Update your payment method to avoid losing access.'
      : 'Unlimited exports and prints — no watermark.'
  } else if (isTrial) {
    badgeClass = 'bg-amber-500/15 text-amber-400'
    label = 'Free trial'
    detail = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left · ${exportCount}/${EXPORT_CAP} free exports used`
  } else if (isExpired) {
    badgeClass = 'bg-red-500/15 text-red-400'
    label = status === 'canceled' ? 'Subscription canceled' : 'Trial ended'
    detail = 'Upgrade to restore full access to exports and paid features.'
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-ink-500">Current plan</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {label}
          </span>
        </div>
        {detail && <p className="mt-1.5 text-sm text-ink-400">{detail}</p>}
      </div>

      {!isPaid && (
        <a href={CHECKOUT_URL} className="btn-primary shrink-0">
          <Sparkles size={14} /> Upgrade
        </a>
      )}
    </div>
  )
}
