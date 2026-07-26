import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, BookOpen, BookMarked, ArrowRight, ArrowLeft, Loader2, CalendarDays, ClipboardList, Layers, Accessibility, BarChart3, CalendarRange, Trophy, Briefcase, ScrollText, PartyPopper, FileInput, BookCheck } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import { listPeriods } from '../services/classPeriodsService'
import { PE_HEALTH_SUBJECTS } from '../constants/modules'
import { useDisplayName, getTimeGreeting } from '../hooks/useDisplayName'
import LessonCard from '../components/lesson/LessonCard'

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

  const totalLessons = allLessons !== null ? lessons.length : null
  const totalUnits = lessons.length > 0
    ? new Set(lessons.filter((l) => l.unit_id).map((l) => l.unit_id)).size
    : 0
  const recent = lessons.slice(0, 3)
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

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actionCards.map((card) => (
          <ActionCard key={card.title} {...card} />
        ))}
      </div>

      {/* Recent activity */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-50">Recent activity</h2>
            {allLessons !== null && (
              <p className="text-sm text-ink-500 mt-0.5">
                {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                {totalUnits > 0 ? ` · ${totalUnits} unit${totalUnits !== 1 ? 's' : ''}` : ''}
              </p>
            )}
          </div>
          {recent.length > 0 && (
            <Link
              to="/lessons"
              className="text-sm font-medium text-accent-400 hover:text-accent-300"
            >
              View all
            </Link>
          )}
        </div>

        {allLessons === null && !error && (
          <div className="flex items-center gap-2 text-ink-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading lessons…
          </div>
        )}

        {error && (
          <div className="card p-4 text-sm text-red-400 border-red-500/30">
            Couldn&rsquo;t load lessons: {error}
          </div>
        )}

        {allLessons !== null && lessons.length === 0 && (
          <p className="text-sm text-ink-600">
            Your lessons will appear here once you generate your first one.
          </p>
        )}

        {recent.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
