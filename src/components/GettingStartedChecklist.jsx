import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Circle, Rocket, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTrial } from '../context/TrialContext'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'

const DISMISSED_KEY = 'plansk12-getting-started-dismissed'
const LIBRARY_VISITED_KEY = 'plansk12-getting-started-library-visited'
const EMPTY_COUNTS = { lessons: 0, periods: 0, formats: 0 }

export default function GettingStartedChecklist() {
  const { profile, loaded, isOwner } = useTrial()
  const { pathname, search } = useLocation()
  const [counts, setCounts] = useState(null)
  const [mountedAt] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === 'true')
  const [libraryVisited, setLibraryVisited] = useState(() => localStorage.getItem(LIBRARY_VISITED_KEY) === 'true')

  const specialtyHome = Object.values(SPECIALTY_CONTEXTS).find((config) => {
    const homePath = config.generatePath?.replace(/\/generate$/, '')
    return homePath === pathname
  })
  const isPeHome = pathname === '/pe-health'
  const isHome = pathname === '/' || isPeHome || !!specialtyHome
  const checklistPaths = specialtyHome
    ? {
        schedule: `/schedule?module=${encodeURIComponent(specialtyHome.moduleLabel)}`,
        generate: specialtyHome.generatePath,
        library: specialtyHome.browsePath ?? `/lessons?module=${encodeURIComponent(specialtyHome.moduleLabel)}`,
      }
    : isPeHome
      ? { schedule: '/schedule?module=PE%20%26%20Health', generate: '/generate', library: '/lessons?module=PE%20%26%20Health' }
      : { schedule: '/schedule', generate: '/generate', library: '/lessons' }
  const isOwnerPreview = isOwner && new URLSearchParams(search).get('preview') === 'onboarding'
  const isNewAccount = isOwnerPreview || (profile?.created_at && mountedAt - new Date(profile.created_at).getTime() <= 14 * 86400000)

  useEffect(() => {
    if (!loaded || !profile || !isHome || (dismissed && !isOwnerPreview) || !isNewAccount) return undefined
    if (isOwnerPreview) return undefined
    let active = true
    Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('class_periods').select('id', { count: 'exact', head: true }),
      supabase.from('lesson_plan_formats').select('id', { count: 'exact', head: true }),
    ]).then(([lessons, periods, formats]) => {
      if (active) setCounts({ lessons: lessons.count ?? 0, periods: periods.count ?? 0, formats: formats.count ?? 0 })
    })
    return () => { active = false }
  }, [dismissed, isHome, isNewAccount, isOwnerPreview, loaded, profile])

  const effectiveCounts = isOwnerPreview ? EMPTY_COUNTS : counts
  const steps = useMemo(() => effectiveCounts ? [
    { label: 'Choose your specialty and teaching preferences', done: !isOwnerPreview && (!!profile?.onboarded_at || !!profile?.teaching_areas?.length), to: '/settings' },
    { label: 'Set your school lesson-plan format', done: effectiveCounts.formats >= 1, to: '/lesson-format' },
    { label: 'Add your first class', done: effectiveCounts.periods >= 1, to: checklistPaths.schedule },
    { label: 'Create your first ready-to-teach lesson', done: effectiveCounts.lessons >= 1, to: checklistPaths.generate },
    {
      label: 'See where your saved work lives',
      done: !isOwnerPreview && libraryVisited,
      to: checklistPaths.library,
      onClick: () => {
        localStorage.setItem(LIBRARY_VISITED_KEY, 'true')
        setLibraryVisited(true)
      },
    },
  ] : [], [checklistPaths.generate, checklistPaths.library, checklistPaths.schedule, effectiveCounts, isOwnerPreview, libraryVisited, profile])

  if (!isHome || !isNewAccount || (dismissed && !isOwnerPreview) || !effectiveCounts) return null
  const completed = steps.filter((step) => step.done).length

  return <section className="mb-6 overflow-hidden rounded-2xl border border-accent-500/25 bg-gradient-to-br from-accent-500/10 via-white to-violet-500/5 p-5 dark:via-ink-900 dark:to-violet-500/10">
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white"><Rocket size={20} /></span><div><p className="font-semibold text-ink-100">Set up PlansK12 for your school</p><p className="mt-1 text-sm text-ink-500">These one-time steps make every lesson faster to create, find, and submit.</p></div></div>
      {!isOwnerPreview && <button aria-label="Dismiss checklist" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-800 hover:text-ink-200" onClick={() => { localStorage.setItem(DISMISSED_KEY, 'true'); setDismissed(true) }}><X size={17} /></button>}
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${completed / steps.length * 100}%` }} /></div>
    <p className="mt-2 text-xs font-semibold text-accent-600">{completed} of {steps.length} complete</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {steps.map((step) => <Link key={step.label} to={step.to} onClick={step.onClick} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${step.done ? 'border-emerald-500/20 bg-emerald-500/5 text-ink-400' : 'border-ink-800 bg-white/60 text-ink-200 hover:border-accent-500/40 dark:bg-ink-950/30'}`}>
        {step.done ? <Check size={17} className="text-emerald-500" /> : <Circle size={17} className="text-ink-600" />}<span className="flex-1">{step.label}</span>{!step.done && <ChevronRight size={15} className="text-ink-600" />}
      </Link>)}
    </div>
  </section>
}
