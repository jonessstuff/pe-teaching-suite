import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, HeartPulse, MoonStar, Users } from 'lucide-react'
import MyRunClub from '../components/run/MyRunClub'
import DailyStressReset from '../components/wellness/DailyStressReset'
import PackedLunchIdeas from '../components/wellness/PackedLunchIdeas'
import { createPersonalRun, deletePersonalRun, getPersonalRunPlan, listPersonalRuns, savePersonalRunPlan } from '../services/runTrackerService'

export default function TeacherHealthWellness() {
  return <div className="space-y-6">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-200"><ArrowLeft size={15} /> All PlansK12 modules</Link>
    <header className="overflow-hidden rounded-3xl border border-teal-400/25 bg-gradient-to-br from-sky-500/15 via-teal-500/10 to-violet-500/10 p-5 sm:p-8">
      <div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-400"><HeartPulse size={28} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-400">Private teacher tools</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Teacher Health &amp; Wellness</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">Set a personal goal, follow a realistic plan, and build habits that support your physical and mental well-being. Your personal entries are visible only to you.</p></div></div>
    </header>

    <MyRunClub createPersonalRun={createPersonalRun} deletePersonalRun={deletePersonalRun} getPersonalRunPlan={getPersonalRunPlan} listPersonalRuns={listPersonalRuns} savePersonalRunPlan={savePersonalRunPlan} />

    <DailyStressReset />

    <PackedLunchIdeas />

    <section className="grid gap-4 md:grid-cols-2">
      <Link to="/staff-wellness" className="card group flex items-start gap-4 p-5 transition-colors hover:border-emerald-500/40"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><Users size={21} /></span><span className="min-w-0 flex-1"><span className="font-semibold">Staff Wellness Challenges</span><span className="mt-1 block text-sm text-ink-500">Build inclusive schoolwide challenges without collecting personal health measurements.</span></span><ArrowRight size={17} className="mt-1 text-ink-500 transition-transform group-hover:translate-x-1" /></Link>
      <div className="card flex items-start gap-4 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400"><MoonStar size={21} /></span><span><span className="font-semibold">Rest &amp; Recovery</span><span className="mt-1 block text-sm text-ink-500">Sleep routines and recovery support can be the next private wellness addition.</span></span></div>
    </section>
  </div>
}
