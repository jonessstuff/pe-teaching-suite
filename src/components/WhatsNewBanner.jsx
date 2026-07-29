import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { getProfile, dismissWhatsNew } from '../services/profilesService'
import { WHATS_NEW } from '../constants/whatsNew'

/**
 * Lightweight, dismissible "What's New" banner. Shows once per user per
 * release: it appears while the user's profiles.whats_new_version is below
 * WHATS_NEW.version, and dismissing persists the current version so it won't
 * return until the next release bumps the number.
 */
export default function WhatsNewBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let active = true
    getProfile()
      .then((p) => {
        if (active && (p?.whats_new_version ?? 0) < WHATS_NEW.version) setShow(true)
      })
      .catch(() => {
        // Non-critical — if we can't read the profile, just don't show it.
      })
    return () => {
      active = false
    }
  }, [])

  async function handleDismiss() {
    setShow(false)
    try {
      await dismissWhatsNew(WHATS_NEW.version)
    } catch {
      // Non-critical — worst case the banner reappears next load.
    }
  }

  if (!show) return null

  return (
    <div data-no-print className="relative mb-6 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 pr-10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500/20">
          <Sparkles size={16} className="text-accent-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink-50">{WHATS_NEW.title}</p>
          <ul className="space-y-1 text-sm text-ink-300">
            {WHATS_NEW.items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss what's new"
        className="absolute right-3 top-3 rounded-lg p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
      >
        <X size={16} />
      </button>
    </div>
  )
}
