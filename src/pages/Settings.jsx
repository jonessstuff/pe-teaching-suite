import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Copy, Check, BarChart3, ExternalLink, RefreshCw, Sparkles, Lightbulb, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getProfile, updateProfile } from '../services/profilesService'
import { releaseSession } from '../services/sessionService'
import { clearActivity } from '../services/inactivityService'
import { US_STATES } from '../constants/usStates'
import TeachingAreasField from '../components/TeachingAreasField'
import { PrintTeacherInfoToggle } from '../components/LessonPrintFix'
import { getMyCode } from '../services/referralService'
import { useTrial } from '../context/TrialContext'
import { EXPORT_CAP, UPGRADE_URL } from '../services/trialService'
import ActivateNowButton from '../components/ActivateNowButton'
import SuggestionModal from '../components/SuggestionModal'
import { saveCancellationFeedback } from '../services/ownerAnalyticsService'

const SUBJECTS = ['PE', 'Health', 'Family Life', "Driver's Ed"]

export default function Settings() {
  const [email, setEmail] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    school_name: '',
    district_name: '',
    default_subject: 'PE',
    state: '',
    teaching_areas: [],
    cte_pathways: [],
    teaching_other: '',
    default_duration_minutes: 45,
    default_location: '',
    default_equipment: [],
    default_accommodations: '',
  })
  const [loadStatus, setLoadStatus] = useState('loading')
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [hasPassword, setHasPassword] = useState(true) // until profile loads
  const [pwStatus, setPwStatus] = useState('idle') // idle | saving | saved | error
  const [pwError, setPwError] = useState(null)
  const [referralCode, setReferralCode] = useState(null)
  const [referralCopied, setReferralCopied] = useState(false)

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState(null)

  const trial = useTrial()
  const [statusRefreshing, setStatusRefreshing] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [cancelSurveyOpen, setCancelSurveyOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('not_using')
  const [cancelDetail, setCancelDetail] = useState('')
  const [cancelSaving, setCancelSaving] = useState(false)

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
          teaching_areas: profile.teaching_areas ?? [],
          cte_pathways: profile.cte_pathways ?? [],
          teaching_other: profile.teaching_other ?? '',
          default_duration_minutes: profile.default_duration_minutes ?? 45,
          default_location: profile.default_location ?? '',
          default_equipment: profile.default_equipment ?? [],
          default_accommodations: profile.default_accommodations ?? '',
        })
        setHasPassword(profile.has_password ?? false)
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

  // Set a FIRST password — no current-password re-auth (the live session proves
  // identity). has_password flips via the DB trigger; reflect it locally too.
  async function handleSetPassword(e) {
    e.preventDefault()
    setPwError(null)
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords don't match.")
      return
    }
    setPwStatus('saving')
    const { error: updateError } = await supabase.auth.updateUser({ password: pwForm.newPw })
    if (updateError) {
      setPwError(updateError.message)
      setPwStatus('error')
      return
    }
    setPwStatus('saved')
    setHasPassword(true)
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwStatus('idle'), 3000)
  }

  async function handleSignOut() {
    await releaseSession()
    clearActivity()
    // scope: 'local' — log out only this device. The account supports multiple
    // concurrent sessions, so a global sign-out here would revoke the user's
    // other devices' refresh tokens and force them all to re-authenticate.
    await supabase.auth.signOut({ scope: 'local' })
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

  async function continueToCancellation() {
    setCancelSaving(true)
    try { await saveCancellationFeedback(cancelReason, cancelDetail) } catch { /* feedback must never block account control */ }
    setCancelSurveyOpen(false)
    setCancelSaving(false)
    await handleOpenBillingPortal()
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
            onClick={() => setCancelSurveyOpen(true)}
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

      {cancelSurveyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Cancellation feedback"><div className="w-full max-w-md rounded-2xl border border-ink-800 bg-white p-6 shadow-xl dark:bg-ink-900"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-ink-50">Before you go</h2><p className="mt-1 text-sm text-ink-400">What is the main reason you’re considering canceling?</p></div><button aria-label="Close" onClick={() => setCancelSurveyOpen(false)} className="btn-ghost p-2"><X size={17} /></button></div><select className="input-field mt-5" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}><option value="seasonal">I only need it during part of the school year</option><option value="price">The price</option><option value="not_using">I’m not using it enough</option><option value="missing_feature">It is missing something I need</option><option value="confusing">It is confusing or takes too many steps</option><option value="output_quality">The generated materials need improvement</option><option value="technical">A technical problem</option><option value="other">Another reason</option></select><textarea className="input-field mt-3 min-h-[100px]" maxLength={1000} placeholder="Optional: What could we improve?" value={cancelDetail} onChange={(e) => setCancelDetail(e.target.value)} /><p className="mt-2 text-xs text-ink-500">Your feedback goes directly to the teacher building PlansK12.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button onClick={continueToCancellation} disabled={cancelSaving} className="btn-primary flex-1">{cancelSaving && <Loader2 size={15} className="animate-spin" />} Continue to billing portal</button><button onClick={() => setCancelSurveyOpen(false)} className="btn-secondary">Keep my subscription</button></div></div></div>}

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

            <Field label="What do you teach?" hint="Select all that apply — helps us tailor what we surface to you.">
              <TeachingAreasField
                value={{ areas: form.teaching_areas, ctePathways: form.cte_pathways, other: form.teaching_other }}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, teaching_areas: v.areas, cte_pathways: v.ctePathways, teaching_other: v.other }))
                }
              />
            </Field>

            <div className="border-t border-ink-800 pt-5">
              <h3 className="font-semibold text-ink-100">Reusable teaching preferences</h3>
              <p className="mt-1 text-xs text-ink-500">Save the details you repeat so new lessons start closer to ready.</p>
            </div>

            <Field label="Typical class length (minutes)">
              <input className="input-field" type="number" min="5" max="240" value={form.default_duration_minutes} onChange={(e) => setField('default_duration_minutes', Number(e.target.value))} />
            </Field>

            <Field label="Usual teaching location">
              <input className="input-field" placeholder="Main gym, classroom, field…" value={form.default_location} onChange={(e) => setField('default_location', e.target.value)} />
            </Field>

            <Field label="Equipment I usually have" hint="Comma-separated — e.g. cones, pinnies, playground balls">
              <input className="input-field" value={form.default_equipment.join(', ')} onChange={(e) => setField('default_equipment', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />
            </Field>

            <Field label="Accommodations to consider" hint="General preferences only. Student-specific accommodations still come from your roster.">
              <textarea className="input-field min-h-[90px]" placeholder="Visual directions, extra processing time, low-sensory option…" value={form.default_accommodations} onChange={(e) => setField('default_accommodations', e.target.value)} />
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

      {/* My classes — class-period setup, also reachable from the lesson
          generator's Class Setup section, so a teacher can manage it from either. */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-ink-50">My classes</h2>
        <p className="text-sm text-ink-400">
          Set up your class periods so the lesson generator can auto-fill subject, grade, class size,
          and duration — and pull in student accommodations for each class.
        </p>
        <Link to="/schedule" className="btn-secondary inline-flex w-fit">
          Manage class periods →
        </Link>
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

      {/* Printing */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-ink-50">Printing</h2>
        <p className="text-sm text-ink-400">
          Printed lessons show the lesson title and details at the top. You can optionally add your name.
        </p>
        <PrintTeacherInfoToggle />
      </div>

      {/* District report link */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-ink-50">Analytics</h2>
        <p className="text-sm text-ink-400">View lesson volume, standards coverage, and other stats from your library.</p>
        <Link to="/district-report" className="btn-secondary inline-flex">
          <BarChart3 size={16} /> View District Report
        </Link>
      </div>

      {/* Suggest a feature */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-ink-50">Suggest a feature</h2>
        <p className="text-sm text-ink-400">
          Missing a module, pathway, or feature? Tell us what would help — we read every suggestion.
        </p>
        <button type="button" onClick={() => setSuggestOpen(true)} className="btn-secondary inline-flex">
          <Lightbulb size={16} /> Suggest a feature
        </button>
      </div>

      {/* Set / change password */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink-50">{hasPassword ? 'Change password' : 'Set a password'}</h2>
        {!hasPassword && (
          <p className="-mt-2 text-sm text-ink-400">
            You&apos;ve been signing in with email links. Set a password to sign in directly next time.
          </p>
        )}
        <form onSubmit={hasPassword ? handleChangePassword : handleSetPassword} className="space-y-4">
          {hasPassword && (
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
          )}
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
              {hasPassword ? 'Update password' : 'Set password'}
            </button>
            {pwStatus === 'saved' && (
              <p className="text-sm text-accent-400">Password updated successfully</p>
            )}
          </div>
        </form>
      </div>

      {suggestOpen && <SuggestionModal onClose={() => setSuggestOpen(false)} />}
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
  const { isPaid, isOwner, isTrial, isTrialingSubscriber, isExpired, status, daysLeft, exportCount } = trial

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
    detail = isTrialingSubscriber
      ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left · limited access until you activate. Activate now to be charged today and unlock everything.`
      : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left · ${exportCount}/${EXPORT_CAP} free exports used`
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
        isTrialingSubscriber ? (
          <ActivateNowButton className="btn-primary shrink-0 disabled:opacity-60" label="Activate now" />
        ) : (
          <a href={UPGRADE_URL} className="btn-primary shrink-0">
            <Sparkles size={14} /> Upgrade
          </a>
        )
      )}
    </div>
  )
}
