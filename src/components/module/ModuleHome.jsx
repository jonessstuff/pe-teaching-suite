import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, BookOpen, CalendarDays, BookCheck, BarChart3, CalendarRange, PartyPopper, ScrollText, FolderOpen, BookMarked, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { listLessons } from '../../services/lessonsService'
import LessonCard from '../lesson/LessonCard'

// Reusable module dashboard/home. Driven entirely by a config (see
// src/constants/moduleHomes.js) so every newer module gets a consistent shell
// without a bespoke Home page. Card selection per module is intentionally lean
// and tiered — clinical/adult modules get only the cards that genuinely fit
// (typically just Generate + Browse), never a blind copy of the full grid.

// Shared utility cards (fixed accents, matching the original module homes).
// Only surfaced when a module's config opts into them.
const UTILITY_CARDS = {
  schedule: {
    Icon: CalendarDays, title: 'Set up my schedule', desc: 'Auto-fill your periods every time',
    to: '/schedule', well: 'bg-teal-500/15', text: 'text-teal-400', hover: 'hover:border-teal-500/40', arrow: 'group-hover:text-teal-400',
  },
  assessments: {
    Icon: BookCheck, title: 'Assessment Bank', desc: 'Quizzes, rubrics, and exit tickets',
    to: '/assessments', well: 'bg-indigo-500/15', text: 'text-indigo-400', hover: 'hover:border-indigo-500/40', arrow: 'group-hover:text-indigo-400',
  },
  standards: {
    Icon: BarChart3, title: 'Standards Tracker', desc: "See which standards you've covered",
    to: '/standards-tracker', well: 'bg-violet-500/15', text: 'text-violet-400', hover: 'hover:border-violet-500/40', arrow: 'group-hover:text-violet-400',
  },
  pacing: {
    Icon: CalendarRange, title: 'Pacing Guide', desc: 'Full-year scope & sequence',
    to: '/pacing-guide', well: 'bg-teal-500/15', text: 'text-teal-400', hover: 'hover:border-teal-500/40', arrow: 'group-hover:text-teal-400',
  },
  activity: {
    Icon: PartyPopper, title: 'Activity Bank', desc: 'Low-prep activities for any occasion',
    to: '/activity-bank', well: 'bg-yellow-500/15', text: 'text-yellow-400', hover: 'hover:border-yellow-500/40', arrow: 'group-hover:text-yellow-400',
  },
  eoy: {
    Icon: ScrollText, title: 'EOY Narrative', desc: 'Professional end-of-year summary',
    to: '/eoy-narrative', well: 'bg-sky-500/15', text: 'text-sky-400', hover: 'hover:border-sky-500/40', arrow: 'group-hover:text-sky-400',
  },
  portfolio: {
    Icon: FolderOpen, title: 'Portfolio Builder', desc: 'Your teaching philosophy & portfolio',
    to: '/portfolio', well: 'bg-rose-500/15', text: 'text-rose-400', hover: 'hover:border-rose-500/40', arrow: 'group-hover:text-rose-400',
  },
  subbinder: {
    Icon: BookMarked, title: 'Long-Term Sub Binder', desc: 'Week-by-week plans for an extended absence',
    to: '/sub-binder', well: 'bg-amber-500/15', text: 'text-amber-400', hover: 'hover:border-amber-500/40', arrow: 'group-hover:text-amber-400',
  },
}

function ActionCard({ Icon, title, desc, to, well, text, hover, arrow }) {
  return (
    <Link to={to} className={`card group flex flex-col gap-4 p-6 transition-colors ${hover}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${well}`}>
          <Icon size={22} className={text} />
        </div>
        <ArrowRight size={18} className={`mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 ${arrow}`} />
      </div>
      <div>
        <p className="font-semibold text-ink-50">{title}</p>
        <p className="mt-0.5 text-sm text-ink-500">{desc}</p>
      </div>
    </Link>
  )
}

export default function ModuleHome({ config }) {
  const {
    subject, moduleLabel, title, Icon, accent, tagline,
    generatePath, generateTitle, generateDesc,
    browseTitle = 'Browse my lessons', browseNoun = 'lesson',
    browsePath = null,
    cards = [],
  } = config

  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listLessons()
      .then((all) => setLessons(all.filter((l) => (l.lesson_object?.subject ?? l.subject) === subject)))
      .catch((err) => setError(err.message))
  }, [subject])

  const recent = (lessons ?? []).slice(0, 3)
  // Most modules deep-link into the shared library filtered by module; a module
  // with its own bespoke library (e.g. CTE → /cte/lessons) overrides via browsePath.
  const browseTo = browsePath ?? `/lessons?module=${encodeURIComponent(moduleLabel)}`

  return (
    <div className="space-y-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
        <ArrowLeft size={14} />
        All modules
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.well}`}>
          <Icon size={20} className={accent.text} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink-50">{title}</h1>
          {tagline && <p className="text-sm text-ink-500">{tagline}</p>}
        </div>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          Icon={Sparkles} title={generateTitle} desc={generateDesc} to={generatePath}
          well={accent.well} text={accent.text} hover={accent.hover} arrow={accent.arrow}
        />
        <ActionCard
          Icon={BookOpen} title={browseTitle} desc="Everything you've created, organized" to={browseTo}
          well="bg-emerald-500/15" text="text-emerald-400" hover="hover:border-emerald-500/40" arrow="group-hover:text-emerald-400"
        />
        {cards.map((key) => {
          const c = UTILITY_CARDS[key]
          return c ? <ActionCard key={key} {...c} /> : null
        })}
      </div>

      {/* Recent items */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-50">Recent {browseNoun}s</h2>
            {lessons !== null && (
              <p className="text-sm text-ink-500 mt-0.5">
                {lessons.length} {browseNoun}{lessons.length !== 1 ? 's' : ''} saved
              </p>
            )}
          </div>
          {(lessons ?? []).length > 3 && (
            <Link to={browseTo} className={`text-sm font-medium ${accent.text}`}>View all</Link>
          )}
        </div>

        {lessons === null && !error && (
          <div className="flex items-center gap-2 text-ink-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        )}
        {error && (
          <div className="card p-4 text-sm text-red-400 border-red-500/30">Couldn&rsquo;t load: {error}</div>
        )}
        {lessons !== null && lessons.length === 0 && !error && (
          <p className="text-sm text-ink-600">
            Your saved {browseNoun}s will appear here once you generate your first one.
          </p>
        )}
        {recent.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}
          </div>
        )}
      </div>
    </div>
  )
}
