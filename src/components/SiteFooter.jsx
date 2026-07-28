import { useState } from 'react'
import { Mail, Lightbulb } from 'lucide-react'
import SuggestionModal from './SuggestionModal'

// Contact goes to hello@ (the branded address) and Cc's plansk12.com@gmail.com —
// the same inbox that receives signup/suggestion notifications — so every contact
// message lands where they're actually monitored.
const CONTACT_MAILTO = 'mailto:hello@plansk12.com?cc=plansk12.com@gmail.com'

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
              href={CONTACT_MAILTO}
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
