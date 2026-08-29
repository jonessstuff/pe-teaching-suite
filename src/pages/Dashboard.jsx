import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, BookOpen, BookMarked, ArrowRight, ArrowLeft, CalendarDays, ClipboardList, Layers, Accessibility, BarChart3, CalendarRange, Trophy, Briefcase, ScrollText, PartyPopper, Flame, FileInput, BookCheck, Play, Footprints, UsersRound } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import { listPeriods } from '../services/classPeriodsService'
import { PE_HEALTH_SUBJECTS } from '../constants/modules'
import { useDisplayName, getTimeGreeting } from '../hooks/useDisplayName'
import RecentLessonsPanel from '../components/lesson/RecentLessonsPanel'

const TIPS = [
  'Tip: Click Copy on any Plan Book section to paste straight into PlanbookEdu.',
  'Tip: Use the Target Standard field to build a lesson around a specific SOL code.',
  'Tip: Print any lesson and choose "Save as PDF" to download it.',
  'Tip: Set up your class schedule once and every new lesson auto-fills.',
]

function ActionCard({ to, icon: Icon, iconClass, hoverClass, title, subtitle }) {
  return (
    <Link
      to={to}
      className={`card group flex flex-col gap-4 p-6 transition-colors ${hoverClass ?? 'hover:border-accent-500/40'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={22} />
        </div>
        <ArrowRight
          size={18}
          className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-accent-400"
        />
      </div>
      <div>
        <p className="font-semibold text-ink-50">{title}</p>
        <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [allLessons, setAllLessons] = useState(null)
  const [periods, setPeriods] = useState(null)
  const [error, setError] = useState(null)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
  const firstName = useDisplayName()

  useEffect(() => {
    listLessons()
      .then(setAllLessons)
      .catch((err) => setError(err.message))
    listPeriods()
      .then(setPeriods)
      .catch(() => setPeriods([]))
  }, [])

  // PE & Health scope: only this module's own subjects appear in counts and recent activity.
  // Missing subject defaults to 'PE' (matching LessonCard), keeping legacy lessons visible here.
  const lessons = (allLessons ?? []).filter(
    (l) => PE_HEALTH_SUBJECTS.includes(l.lesson_object?.subject ?? l.subject ?? 'PE')
  )

  const recent = lessons.slice(0, 3)
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const todaysLessons = lessons.filter((lesson) => lesson.scheduled_date === todayKey)
  const showOnboarding =
    allLessons !== null && periods !== null && lessons.length === 0 && periods.length === 0

  const actionCards = [
    {
      to: '/generate',
      icon: Sparkles,
      iconClass: 'bg-accent-500/15 text-accent-400',
      title: 'Create a lesson',
      subtitle: 'One focused class period, fully planned',
    },
    {
      to: '/build-unit?subject=pe-health',
      icon: Layers,
      iconClass: 'bg-violet-500/15 text-violet-400',
      title: 'Build a unit',
      subtitle: 'A multi-day unit that builds skill on skill',
    },
    ...(lessons.length > 0
      ? [
          {
            to: '/lessons',
            icon: ClipboardList,
            iconClass: 'bg-amber-500/15 text-amber-400',
            title: 'Generate a quiz',
            subtitle: 'Grade-appropriate, ready to print',
          },
        ]
      : []),
    {
      to: '/schedule',
      icon: CalendarDays,
      iconClass: 'bg-teal-500/15 text-teal-400',
      title: 'Set up my schedule',
      subtitle: 'Auto-fill your periods every time',
    },
    {
      to: '/lessons',
      icon: BookOpen,
      iconClass: 'bg-emerald-500/15 text-emerald-400',
      title: 'Browse my library',
      subtitle: "Everything you've created, organized",
    },
    {
      to: '/adaptive-pe',
      icon: Accessibility,
      iconClass: 'bg-rose-500/15 text-rose-400',
      title: 'Adaptive PE & IEP',
      subtitle: 'Inclusion support and APE lesson planning',
    },
    {
      to: '/sub-binder?subject=pe-health',
      icon: BookMarked,
      iconClass: 'bg-amber-500/15 text-amber-400',
      hoverClass: 'hover:border-amber-500/40',
      title: 'Long-term sub binder',
      subtitle: 'Week-by-week plans for 1–8 week absences',
    },
    {
      to: '/assessments',
      icon: BookCheck,
      iconClass: 'bg-indigo-500/15 text-indigo-400',
      hoverClass: 'hover:border-indigo-500/40',
      title: 'Assessment Bank',
      subtitle: 'Quizzes, rubrics, and exit tickets',
    },
    {
      to: '/standards-tracker',
      icon: BarChart3,
      iconClass: 'bg-violet-500/15 text-violet-400',
      hoverClass: 'hover:border-violet-500/40',
      title: 'Standards Tracker',
      subtitle: 'See which standards you\'ve covered',
    },
    {
      to: '/pacing-guide',
      icon: CalendarRange,
      iconClass: 'bg-teal-500/15 text-teal-400',
      hoverClass: 'hover:border-teal-500/40',
      title: 'Pacing Guide',
      subtitle: 'Full-year scope & sequence generator',
    },
    {
      to: '/import',
      icon: FileInput,
      iconClass: 'bg-rose-500/15 text-rose-400',
      hoverClass: 'hover:border-rose-500/40',
      title: 'Import & Enhance',
      subtitle: 'Paste an existing lesson and upgrade it',
    },
    {
      to: '/eoy-narrative',
      icon: ScrollText,
      iconClass: 'bg-sky-500/15 text-sky-400',
      hoverClass: 'hover:border-sky-500/40',
      title: 'EOY Narrative',
      subtitle: 'Professional end-of-year summary',
    },
    {
      to: '/activity-bank',
      icon: PartyPopper,
      iconClass: 'bg-yellow-500/15 text-yellow-400',
      hoverClass: 'hover:border-yellow-500/40',
      title: 'Activity Bank',
      subtitle: 'Low-prep activities for any occasion',
    },
    {
      to: '/warm-up-generator',
      icon: Flame,
      iconClass: 'bg-orange-500/15 text-orange-400',
      hoverClass: 'hover:border-orange-500/40',
      title: 'Warm-up / Bell-ringer',
      subtitle: 'Quick warm-ups students start on their own',
    },
    {
      to: '/field-day',
      icon: Trophy,
      iconClass: 'bg-green-500/15 text-green-400',
      hoverClass: 'hover:border-green-500/40',
      title: 'Field Day Planner',
      subtitle: 'Generate complete field day plans',
    },
    {
      to: '/portfolio',
      icon: Briefcase,
      iconClass: 'bg-fuchsia-500/15 text-fuchsia-400',
      hoverClass: 'hover:border-fuchsia-500/40',
      title: 'Portfolio Builder',
      subtitle: 'Teaching portfolio with AI philosophy draft',
    },
  ]

  return (
    <div className="space-y-10">
      {/* Back to module picker */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
      >
        <ArrowLeft size={14} />
        All modules
      </Link>

      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-ink-50">
          {getTimeGreeting()}{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="mt-2 text-lg text-ink-400">What would you like to create today?</p>
        <p className="mt-3 text-xs italic text-ink-600">{tip}</p>
      </div>

      {/* Daily launchpad — the most common in-class actions without hunting through navigation. */}
      <section className="overflow-hidden rounded-2xl border border-accent-500/30 bg-gradient-to-br from-accent-500/15 via-ink-900 to-violet-500/10 shadow-lg shadow-accent-500/5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-800/70 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent-400">Today</p>
            <h2 className="mt-1 text-xl font-semibold text-ink-50">{todayLabel}</h2>
            <p className="mt-1 text-sm text-ink-400">Your classes, lessons, and daily trackers in one place.</p>
          </div>
          <Link to="/generate" className="btn-primary"><Sparkles size={16} /> Create for today</Link>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-3">
            {todaysLessons.length > 0 ? todaysLessons.map((lesson) => (
              <div key={lesson.id} className="flex flex-col gap-3 rounded-xl border border-ink-800 bg-ink-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{lesson.period_label || 'Scheduled lesson'}</p>
                  <p className="truncate font-semibold text-ink-100">{lesson.title || lesson.lesson_object?.title}</p>
                </div>
                <Link to={`/lessons/${lesson.id}?teach=1`} className="btn-primary shrink-0"><Play size={16} /> Teach now</Link>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-ink-700 bg-ink-950/30 p-5">
                <p className="font-medium text-ink-200">No lessons are scheduled for today yet.</p>
                <p className="mt-1 text-sm text-ink-500">Create one now, or open a recent lesson and set its date to today.</p>
                {recent[0] && <Link to={`/lessons/${recent[0].id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400">Open most recent lesson <ArrowRight size={14} /></Link>}
              </div>
            )}
            {periods?.length > 0 && <p className="text-xs text-ink-500">{periods.length} class period{periods.length === 1 ? '' : 's'} saved in My Classes</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/participation" className="rounded-xl border border-ink-800 bg-ink-950/50 p-4 transition-colors hover:border-emerald-500/40"><UsersRound size={21} className="text-emerald-400" /><p className="mt-3 font-semibold text-ink-100">Participation</p><p className="mt-1 text-xs text-ink-500">Grade today’s classes</p></Link>
            <Link to="/run-tracker" className="rounded-xl border border-ink-800 bg-ink-950/50 p-4 transition-colors hover:border-sky-500/40"><Footprints size={21} className="text-sky-400" /><p className="mt-3 font-semibold text-ink-100">Run Tracker</p><p className="mt-1 text-xs text-ink-500">Start or enter a run</p></Link>
            <Link to="/schedule" className="col-span-2 rounded-xl border border-ink-800 bg-ink-950/50 p-4 transition-colors hover:border-violet-500/40"><CalendarDays size={21} className="text-violet-400" /><p className="mt-2 font-semibold text-ink-100">My Classes</p><p className="mt-1 text-xs text-ink-500">Manage periods and shared rosters</p></Link>
          </div>
        </div>
      </section>

      {/* Onboarding banner */}
      {showOnboarding && (
        <div className="card border-accent-500/30 bg-accent-500/5 p-6 space-y-3">
          <p className="text-sm font-semibold text-ink-100">Welcome to PlansK12!</p>
          <p className="text-sm text-ink-400">
            Start by adding your class schedule so lessons auto-fill your periods, then generate
            your first lesson.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/schedule" className="btn-primary">
              <CalendarDays size={16} />
              Set up my schedule
            </Link>
            <Link to="/generate" className="btn-secondary">
              <Sparkles size={16} />
              Generate a lesson
            </Link>
          </div>
        </div>
      )}

      {/* Action cards — the primary actions come first. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actionCards.map((card) => (
          <ActionCard key={card.title} {...card} />
        ))}
      </div>

      {/* My lessons — compact preview below the tools */}
      <RecentLessonsPanel lessons={lessons} error={error} browseTo="/lessons" accentText="text-accent-400" />

    </div>
  )
}
