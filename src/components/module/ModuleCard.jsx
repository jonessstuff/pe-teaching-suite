import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { moduleAccent } from '../../constants/moduleAccents'

// Shared specialty card. The WHOLE card is the tap target (a <Link>); the
// "Open …" button is a styled <span> (not a nested button/anchor — that would be
// invalid interactive markup inside the link, same reason the star is an overlay
// sibling). Per-specialty color comes entirely from the accent tokens so the
// treatment stays identical wherever this card is used.
export default function ModuleCard({ module: m, isFavorite, toggle }) {
  const a = moduleAccent(m.accent)
  return (
    <div className="relative">
      <Link
        to={m.to}
        className={`card group flex h-full flex-col gap-6 border-t-2 p-8 transition-colors ${a.topBorder}`}
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.wrap}`}>
          {m.key === 'pe-health' ? (
            <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
              <path
                d="M0 10 L6 10 L8 2 L11 18 L14 4 L17 10 L30 10"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <m.Icon size={28} className={a.icon} />
          )}
        </div>

        <div className="flex-1 space-y-1.5">
          {/* pr-8 keeps the title clear of the star button in the corner */}
          <h2 className="pr-8 text-xl font-semibold text-ink-50">{m.label}</h2>
          <p className="text-sm text-ink-400 leading-relaxed">{m.desc}</p>
        </div>

        {/* Pseudo-button — visual affordance; the card Link handles the tap. */}
        <span
          className={`inline-flex w-full items-center justify-center gap-1.5 self-start rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors sm:w-auto ${a.buttonBg} ${a.buttonText}`}
        >
          Open {m.label}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* Favorite toggle — a sibling overlay (not nested in the Link) so it
          doesn't navigate and isn't invalid interactive-in-anchor markup. */}
      {toggle && (
        <button
          type="button"
          onClick={() => toggle(m.key)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${m.label} from favorites` : `Add ${m.label} to favorites`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-ink-600 transition-colors hover:bg-ink-800/60 hover:text-amber-400"
        >
          <Star size={20} className={isFavorite ? 'fill-amber-400 text-amber-400' : 'fill-transparent'} />
        </button>
      )}
    </div>
  )
}
