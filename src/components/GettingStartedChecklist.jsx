import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Circle, Rocket, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTrial } from '../context/TrialContext'

const DISMISSED_KEY = 'plansk12-getting-started-dismissed'
const EMPTY_COUNTS = { lessons: 0, periods: 0, students: 0 }

export default function GettingStartedChecklist() {
  const { profile, loaded, isOwner } = useTrial()
  const { pathname, search } = useLocation()
  const [counts, setCounts] = useState(null)
  const [mountedAt] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === 'true')

  const isHome = pathname === '/' || pathname === '/pe-health'
  const isOwnerPreview = isOwner && new URLSearchParams(search).get('preview') === 'onboarding'
  const isNewAccount = isOwnerPreview || (profile?.created_at && mountedAt - new Date(profile.created_at).getTime() <= 14 * 86400000)

  useEffect(() => {
    if (!loaded || !profile || !isHome || (dismissed && !isOwnerPreview) || !isNewAccount) return undefined
    if (isOwnerPreview) return undefined
    let active = true
    Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('class_periods').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }),
    ]).then(([lessons, periods, students]) => {
      if (active) setCounts({ lessons: lessons.count ?? 0, periods: periods.count ?? 0, students: students.count ?? 0 })
    })
    return () => { active = false }
  }, [dismissed, isHome, isNewAccount, isOwnerPreview, loaded, profile])

  const effectiveCounts = isOwnerPreview ? EMPTY_COUNTS : counts
  const steps = useMemo(() => effectiveCounts ? [
    { label: 'Tell us what you teach', done: !isOwnerPreview && (!!profile?.onboarded_at || !!profile?.teaching_areas?.length), to: '/settings' },
    { label: 'Create your first ready-to-teach lesson', done: effectiveCounts.lessons >= 1, to: '/generate' },
    { label: 'Add a class', done: effectiveCounts.periods >= 1, to: '/students' },
    { label: 'Add or import a roster', done: effectiveCounts.students >= 1, to: '/students' },
    { label: 'Create a second lesson to build your library', done: effectiveCounts.lessons >= 2, to: '/generate' },
  ] : [], [effectiveCounts, isOwnerPreview, profile])

  if (!isHome || !isNewAccount || (dismissed && !isOwnerPreview) || !effectiveCounts) return null
  const completed = steps.filter((step) => step.done).length

  return <section className="mb-6 overflow-hidden rounded-2xl border border-accent-500/25 bg-gradient-to-br from-accent-500/10 via-white to-violet-500/5 p-5 dark:via-ink-900 dark:to-violet-500/10">
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white"><Rocket size={20} /></span><div><p className="font-semibold text-ink-100">Your first-week launch plan</p><p className="mt-1 text-sm text-ink-500">Complete these once and PlansK12 gets faster every week.</p></div></div>
      {!isOwnerPreview && <button aria-label="Dismiss checklist" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-800 hover:text-ink-200" onClick={() => { localStorage.setItem(DISMISSED_KEY, 'true'); setDismissed(true) }}><X size={17} /></button>}
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${completed / steps.length * 100}%` }} /></div>
    <p className="mt-2 text-xs font-semibold text-accent-600">{completed} of {steps.length} complete</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {steps.map((step, index) => <Link key={step.label} to={step.to} className={`${index > 1 ? 'hidden sm:flex' : 'flex'} items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${step.done ? 'border-emerald-500/20 bg-emerald-500/5 text-ink-400' : 'border-ink-800 bg-white/60 text-ink-200 hover:border-accent-500/40 dark:bg-ink-950/30'}`}>
        {step.done ? <Check size={17} className="text-emerald-500" /> : <Circle size={17} className="text-ink-600" />}<span className="flex-1">{step.label}</span>{!step.done && <ChevronRight size={15} className="text-ink-600" />}
      </Link>)}
    </div>
    <p className="mt-3 text-xs text-ink-500 sm:hidden">Showing your next steps · Open on a larger screen to see all five.</p>
  </section>
}
