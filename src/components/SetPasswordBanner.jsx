import { useState } from 'react'
import { KeyRound, X, Loader2 } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import { setPassword, dismissPasswordPrompt } from '../services/passwordService'

/**
 * Dismissible top banner offering to set a password — shown only AFTER the
 * teacher has generated her first lesson (onboarded_at set), only if she has no
 * password yet, and only until she sets one or dismisses it (both persisted, so
 * it never nags on later visits). Setting a password flips has_password via the
 * DB trigger; refresh() then hides the banner. Reads the onboarding flag but
 * does not touch the onboarding capture flow.
 */
export default function SetPasswordBanner() {
  const { profile, refresh } = useTrial()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [error, setError] = useState(null)

  const show =
    !!profile?.onboarded_at && !profile?.has_password && !profile?.password_prompt_dismissed_at
  if (!show) return null

  async function handleDismiss() {
    try { await dismissPasswordPrompt() } catch { /* non-fatal */ } finally { refresh() }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (pw !== confirm) { setError("Passwords don't match."); return }
    setStatus('saving')
    try {
      await setPassword(pw)
      refresh() // has_password now true → banner disappears
    } catch (err) {
      setStatus('error')
      setError(err.message ?? 'Could not set your password.')
    }
  }

  return (
    <div data-no-print className="mb-6 rounded-xl border border-brand-500/30 bg-brand-500/[0.06] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15">
          <KeyRound size={16} className="text-brand-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-50">Skip the email next time</p>
          <p className="mt-0.5 text-sm text-ink-400">
            Set a password and you can sign in directly — no login link to hunt for.
          </p>

          {!open ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setOpen(true)}
                      className="btn-primary !bg-brand-500 hover:!bg-brand-600 text-sm">
                Set a password
              </button>
              <button type="button" onClick={handleDismiss} className="btn-ghost text-sm">Not now</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-2">
              <input type="password" required minLength={6} autoComplete="new-password" className="input-field"
                     placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
              <input type="password" required minLength={6} autoComplete="new-password" className="input-field"
                     placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={status === 'saving'}
                        className="btn-primary !bg-brand-500 hover:!bg-brand-600 gap-2 text-sm">
                  {status === 'saving' && <Loader2 size={14} className="animate-spin" />}
                  Save password
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>

        <button type="button" onClick={handleDismiss} aria-label="Dismiss"
                className="shrink-0 rounded-lg p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
