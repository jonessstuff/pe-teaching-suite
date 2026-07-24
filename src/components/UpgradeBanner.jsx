import { Lock, Sparkles } from 'lucide-react'
import { UPGRADE_URL } from '../services/trialService'

// Inline upgrade banner shown in place of hidden preview content
// (Sub Binder / Pacing Guide / Assessment Bank). The CTA links straight to the
// existing-user upgrade checkout (UPGRADE_URL — no trial, charges immediately):
// a plain external link, so it never routes through an internal signup/trial
// path and cannot re-trigger a free trial for a user already in trial/preview.
export default function UpgradeBanner({ label = 'the full document' }) {
  return (
    <div className="print:hidden my-4 rounded-xl border border-dashed border-accent-500/40 bg-accent-500/5 px-6 py-8 text-center">
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/10 text-accent-600">
        <Lock size={20} strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
        Upgrade to unlock {label}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-ink-500 dark:text-ink-400">
        Your free trial shows a preview only. Upgrade to PlansK12 to view, print, and export everything.
      </p>
      <a
        href={UPGRADE_URL}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
      >
        <Sparkles size={15} />
        Upgrade to PlansK12
      </a>
    </div>
  )
}
