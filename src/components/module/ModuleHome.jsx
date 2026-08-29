import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, BookOpen, CalendarDays, BookCheck, BarChart3, CalendarRange, PartyPopper, Flame, ScrollText, FolderOpen, BookMarked, FileInput, Layers, Target, ArrowRight, ArrowLeft } from 'lucide-react'
import { listLessons } from '../../services/lessonsService'
import RecentLessonsPanel from '../lesson/RecentLessonsPanel'

// Reusable module dashboard/home. Driven entirely by a config (see
// src/constants/moduleHomes.js) so every newer module gets a consistent shell
// without a bespoke Home page. Card selection per module is intentionally lean
// and tiered — clinical/adult modules get only the cards that genuinely fit
// (typically just Generate + Browse), never a blind copy of the full grid.

// Shared utility cards (fixed accents, matching the original module homes).
// Only surfaced when a module's config opts into them.
const UTILITY_CARDS = {
  goals: {
    Icon: Target, title: 'SMART Goals', desc: 'Class, grade-level, and optional personal progress goals',
    to: '/smart-goals', well: 'bg-emerald-500/15', text: 'text-emerald-400', hover: 'hover:border-emerald-500/40', arrow: 'group-hover:text-emerald-400',
  },
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
  warmup: {
    Icon: Flame, title: 'Warm-up / Bell-ringer', desc: 'Quick warm-ups students start on their own',
    to: '/warm-up-generator', well: 'bg-orange-500/15', text: 'text-orange-400', hover: 'hover:border-orange-500/40', arrow: 'group-hover:text-orange-400',
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
  import: {
    Icon: FileInput, title: 'Import & Enhance', desc: 'Paste an existing lesson — reformat & enrich it',
    to: '/import', well: 'bg-rose-500/15', text: 'text-rose-400', hover: 'hover:border-rose-500/40', arrow: 'group-hover:text-rose-400',
  },
  unit: {
    Icon: Layers, title: 'Build a Unit', desc: 'A multi-day unit that builds skill-on-skill',
    to: '/build-unit', well: 'bg-teal-500/15', text: 'text-teal-400', hover: 'hover:border-teal-500/40', arrow: 'group-hover:text-teal-400',
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
    cards = [], specialtyCards = [], workspaceFeatures = [],
  } = config

  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listLessons()
      .then((all) => setLessons(all.filter((l) => (l.lesson_object?.subject ?? l.subject) === subject)))
      .catch((err) => setError(err.message))
  }, [subject])

  // Most modules deep-link into the shared library filtered by module; a module
  // with its own bespoke library (e.g. CTE → /cte/lessons) overrides via browsePath.
  const browseTo = browsePath ?? `/lessons?module=${encodeURIComponent(moduleLabel)}`

  // The shared tool cards (Sub Binder, Import, Unit Builder) each accept a
  // ?subject= slug so they open preselected to THIS module rather than the
  // default. Derive the slug from the module's own route (e.g. /theater/generate).
  const TOOL_CARDS = { subbinder: true, import: true, unit: true }
  const slug = (generatePath || '').split('/').filter(Boolean)[0]

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

      {workspaceFeatures.length > 0 && (
        <section className={`rounded-2xl border border-ink-800 bg-gradient-to-r ${accent.well} p-5`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>Your {title} workspace</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {workspaceFeatures.map(({ title: featureTitle, desc, to }) => (
              <Link
                key={featureTitle}
                to={to || generatePath}
                className="group rounded-xl border border-transparent bg-white/60 p-3 transition hover:-translate-y-0.5 hover:border-ink-700 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-950/40 dark:hover:bg-ink-950/70"
                aria-label={`Open ${featureTitle}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink-100">{featureTitle}</span>
                  <ArrowRight size={15} className={`mt-0.5 shrink-0 ${accent.text} transition-transform group-hover:translate-x-0.5`} />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-500">{desc}</span>
                <span className={`mt-2 block text-[11px] font-semibold ${accent.text}`}>Open tool</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3"><h2 className="font-semibold text-ink-200">Start here</h2><p className="mt-1 text-xs text-ink-500">Create something new or continue work you already started.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          Icon={Sparkles} title={generateTitle} desc={generateDesc} to={generatePath}
          well={accent.well} text={accent.text} hover={accent.hover} arrow={accent.arrow}
        />
        <ActionCard
          Icon={BookOpen} title={browseTitle} desc="Everything you've created, organized" to={browseTo}
          well="bg-emerald-500/15" text="text-emerald-400" hover="hover:border-emerald-500/40" arrow="group-hover:text-emerald-400"
        />
        {specialtyCards.map((card) => <ActionCard key={card.to} {...card} />)}
      </div>
      </section>

      {cards.length > 0 && <details className="card p-5 sm:p-6">
        <summary className="cursor-pointer font-semibold text-ink-200">More planning and professional tools <span className="ml-1 text-xs font-normal text-ink-500">({cards.length})</span></summary>
        <p className="mt-2 text-xs text-ink-500">Open these when you need longer-range planning, assessment, documentation, or professional resources.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((key) => {
          const c = UTILITY_CARDS[key]
          if (!c) return null
          const to = TOOL_CARDS[key] && slug ? `${c.to}?subject=${slug}` : c.to
          return <ActionCard key={key} {...c} to={to} />
        })}
        </div>
      </details>}

      {/* My lessons — compact preview below the tools */}
      <RecentLessonsPanel lessons={lessons} error={error} browseNoun={browseNoun} browseTo={browseTo} accentText={accent.text} />

    </div>
  )
}
