import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
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
    <section data-no-print className="relative mb-6 overflow-hidden rounded-2xl border border-accent-500/30 bg-gradient-to-br from-accent-500/15 via-white to-violet-500/10 p-5 pr-11 shadow-sm dark:via-ink-900 dark:to-violet-500/10 sm:p-6 sm:pr-12">
      <div aria-hidden="true" className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white shadow-sm">
          <Sparkles size={19} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-accent-600">{WHATS_NEW.eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-ink-50">{WHATS_NEW.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-400">{WHATS_NEW.description}</p>
        </div>
      </div>
      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        {WHATS_NEW.items.map((item) => (
          <Link key={item.title} to={item.to} className={`group rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${item.accent}`}>
            <span className="block font-semibold text-ink-100">{item.title}</span>
            <span className="mt-1 block text-xs leading-5 text-ink-500">{item.description}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">{item.cta}<ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss what's new"
        className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
      >
        <X size={16} />
      </button>
    </section>
  )
}
