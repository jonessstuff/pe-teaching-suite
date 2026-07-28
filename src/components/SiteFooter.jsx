import { useState } from 'react'
import { Mail, Lightbulb, X, Loader2, Check } from 'lucide-react'
import { submitSuggestion } from '../services/suggestionsService'

const CONTACT_EMAIL = 'hello@plansk12.com'

// Site-wide footer: a Contact mailto and a "Suggest a feature" box (logged-in
// users). Rendered once in AppShell so it appears under every in-app page.
export default function SiteFooter() {
  const [open, setOpen] = useState(false)
  const year = new Date().getFullYear()

  return (
    <>
      <footer data-no-print className="mt-16 border-t border-ink-900 pt-6 pb-2">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-ink-500 sm:flex-row">
          <p>© {year} PlansK12</p>
          <div className="flex items-center gap-4">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-1.5 transition-colors hover:text-ink-200"
            >
              <Mail size={14} />
              Contact
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 transition-colors hover:text-ink-200"
            >
              <Lightbulb size={14} />
              Suggest a feature
            </button>
          </div>
        </div>
      </footer>

      {open && <SuggestionModal onClose={() => setOpen(false)} />}
    </>
  )
}

function SuggestionModal({ onClose }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || status === 'sending') return
    setStatus('sending')
    setError(null)
    try {
      await submitSuggestion(text)
      setStatus('sent')
      setTimeout(onClose, 1600)
    } catch (err) {
      setError(err.message ?? 'Could not send. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      data-no-print
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15">
              <Lightbulb size={16} className="text-accent-500" />
            </div>
            <h2 className="text-base font-semibold text-ink-50">Suggest a feature</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-ink-500 transition-colors hover:bg-ink-900 hover:text-ink-200"
          >
            <X size={18} />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
              <Check size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-ink-100">Thanks — got it!</p>
            <p className="text-xs text-ink-500">We read every suggestion.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-ink-400">
              Missing a module, pathway, or feature? Tell us what would help — we read every one.
            </p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. Add a School Nurse module, or a Spanish-immersion pathway in World Languages…"
              className="input-field min-h-[96px]"
            />
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-ink-100">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim() || status === 'sending'}
                className="btn-primary gap-2 text-sm disabled:opacity-50"
              >
                {status === 'sending' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send suggestion'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
