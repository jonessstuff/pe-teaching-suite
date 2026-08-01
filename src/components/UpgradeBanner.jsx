import { Lock, Sparkles } from 'lucide-react'
import { UPGRADE_URL } from '../services/trialService'
import { useTrial } from '../context/TrialContext'
import ActivateNowButton from './ActivateNowButton'

// Inline upgrade banner shown in place of hidden preview content
// (Sub Binder / Pacing Guide / Assessment Bank).
//   • Trialing subscriber (card on file)  -> "Activate now": ends the Stripe
//     trial early and charges immediately, mutating the EXISTING subscription
//     (never a duplicate). Unlocks instantly.
//   • Free no-card trial / expired         -> the upgrade checkout link
//     (UPGRADE_URL) to start a subscription.
export default function UpgradeBanner({ label = 'the full document' }) {
  const { isTrialingSubscriber } = useTrial()
  return (
    <div className="print:hidden my-4 rounded-xl border border-dashed border-accent-500/40 bg-accent-500/5 px-6 py-8 text-center">
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/10 text-accent-600">
        <Lock size={20} strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
        Upgrade to unlock {label}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-ink-500 dark:text-ink-400">
        {isTrialingSubscriber
          ? 'Your free trial shows a preview only. Activate now to be charged today and unlock everything instantly.'
          : 'Your free trial shows a preview only. Upgrade to PlansK12 to view, print, and export everything.'}
      </p>
      <div className="mt-4 flex justify-center">
        {isTrialingSubscriber ? (
          <ActivateNowButton className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60" />
        ) : (
          <a
            href={UPGRADE_URL}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
          >
            <Sparkles size={15} />
            Upgrade to PlansK12
          </a>
        )}
      </div>
    </div>
  )
}
