import { useEffect, useState } from 'react'
import { ArrowRight, Trophy, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTrial } from '../context/TrialContext'

const SEEN_KEY = 'plansk12-customer-milestones'

export default function CustomerMilestone() {
  const { profile, loaded, isOwner } = useTrial()
  const { pathname } = useLocation()
  const [milestone, setMilestone] = useState(null)

  useEffect(() => {
    if (!loaded || !profile || isOwner) return undefined
    const isRecent = Date.now() - new Date(profile.created_at).getTime() <= 30 * 86400000
    if (!isRecent) return undefined
    let active = true
    Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('class_periods').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }),
    ]).then(([lessons, periods, students]) => {
      if (!active) return
      let seen = []
      try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') } catch { /* ignore */ }
      const earned = [
        { key: 'first_lesson', earned: (lessons.count ?? 0) >= 1, title: 'Your first lesson is ready!', text: 'You’ve turned an idea into a saved, ready-to-teach plan.', to: '/lessons', action: 'Open lesson library' },
        { key: 'first_roster', earned: (periods.count ?? 0) >= 1 && (students.count ?? 0) >= 1, title: 'Your first class is set up!', text: 'That roster now works across Participation, Run Tracker, and future class tools.', to: '/students', action: 'View classes' },
        { key: 'second_lesson', earned: (lessons.count ?? 0) >= 2, title: 'Your lesson library is growing!', text: 'PlansK12 gets faster as your reusable library builds.', to: '/lessons', action: 'View your library' },
      ].filter((item) => item.earned && !seen.includes(item.key))
      setMilestone(earned.at(-1) ?? null)
    }).catch(() => {})
    return () => { active = false }
  }, [isOwner, loaded, pathname, profile])

  function dismiss() {
    if (!milestone) return
    let seen = []
    try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') } catch { /* ignore */ }
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seen, milestone.key])]))
    setMilestone(null)
  }

  if (!milestone) return null
  return <aside className="no-print mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-violet-500/10 p-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><Trophy size={20} /></span>
    <div className="min-w-0 flex-1"><p className="font-semibold text-ink-100">{milestone.title}</p><p className="mt-0.5 text-sm text-ink-500">{milestone.text}</p><Link to={milestone.to} onClick={dismiss} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-500">{milestone.action} <ArrowRight size={14} /></Link></div>
    <button onClick={dismiss} aria-label="Dismiss milestone" className="rounded-lg p-1 text-ink-500 hover:bg-ink-800"><X size={16} /></button>
  </aside>
}
