import { Link } from 'react-router-dom'
import { Lock, Sparkles, X } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import { UPGRADE_URL, EXPORT_CAP } from '../services/trialService'

const COPY = {
  'export-cap': {
    title: `You've used all ${EXPORT_CAP} free trial exports`,
    body: `Trial accounts can print or export ${EXPORT_CAP} lessons. Subscribe to PlansK12 for unlimited prints and exports — and no watermark on your lessons.`,
  },
  'gated-feature': {
    title: 'This is a paid feature',
    body: 'Sub Binder, Assessment Bank, and Pacing Guide exports are available on a paid plan. Upgrade to unlock the full document.',
  },
  'trial-expired': {
    title: 'Your free trial has ended',
    body: 'Your 7-day free trial is over. Upgrade to PlansK12 to keep generating, exporting, and printing.',
  },
  'docx-export': {
    title: 'Download as an editable Word document',
    body: 'Subscribe to PlansK12 to download your lessons as editable .docx files — open and edit them in Google Docs, Microsoft Word, or any word processor. Trial accounts keep the watermarked print / PDF export.',
  },
}

export default function PaywallModal() {
  const { paywall, closePaywall } = useTrial()
  if (!paywall) return null

  const { title, body } = COPY[paywall] ?? COPY['gated-feature']

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      onClick={closePaywall}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-ink-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closePaywall}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-600"
        >
          <X size={18} />
        </button>

        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
          <Lock size={22} strokeWidth={2} />
        </div>

        <h2 id="paywall-title" className="text-lg font-semibold text-ink-900 dark:text-ink-50">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-300">{body}</p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={UPGRADE_URL}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
          >
            <Sparkles size={16} />
            Upgrade to PlansK12
          </a>
          <Link
            to="/settings"
            onClick={closePaywall}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </div>
  )
}
