import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useTrial } from '../context/TrialContext'

// "Activate my subscription now" — for a trialing subscriber (card on file).
// Ends the Stripe trial early and charges immediately; on success the whole app
// unlocks instantly (TrialContext.activateNow merges the paid status in memory).
// Callers should only render this when `isTrialingSubscriber` is true; for a
// free no-card trial the user must subscribe first (use the upgrade link).
export default function ActivateNowButton({
  className = 'inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60',
  label = 'Activate my subscription now',
  onActivated,
}) {
  const { activateNow } = useTrial()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setBusy(true)
    setError('')
    try {
      const res = await activateNow()
      if (res?.isPaid) {
        onActivated?.()
      } else {
        setError(res?.error ?? 'We couldn’t charge the card on file. Please update your payment method and try again.')
      }
    } catch (err) {
      setError(err?.message ?? 'Activation failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={busy} className={className}>
        {busy ? <><Loader2 size={16} className="animate-spin" /> Activating…</> : <><Sparkles size={16} /> {label}</>}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
