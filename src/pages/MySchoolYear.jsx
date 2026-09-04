import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Award,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileBarChart,
  Flag,
  FolderHeart,
  GraduationCap,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Users2,
} from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import { listPeriods } from '../services/classPeriodsService'
import { listSmartGoals } from '../services/smartGoalsService'
import {
  archiveSchoolYearTask,
  createSchoolYearTask,
  listSchoolYearTasks,
  setSchoolYearTaskComplete,
} from '../services/schoolYearService'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'
import { trackToolUsage } from '../services/productUsageService'

const CATEGORIES = [
  ['planning', 'Planning'],
  ['event', 'Event or program'],
  ['communication', 'Communication'],
  ['supplies', 'Supplies'],
  ['evidence', 'Evidence or report'],
  ['other', 'Other'],
]

const CATEGORY_STYLES = {
  planning: 'bg-blue-500/12 text-blue-400',
  event: 'bg-violet-500/12 text-violet-400',
  communication: 'bg-sky-500/12 text-sky-400',
  supplies: 'bg-amber-500/12 text-amber-400',
  evidence: 'bg-emerald-500/12 text-emerald-400',
  other: 'bg-ink-800 text-ink-400',
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function currentSchoolYear(date = new Date()) {
  const start = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1
  return `${start}–${start + 1}`
}

function daysFromToday(value) {
  if (!value) return null
  const today = new Date(`${dateKey()}T12:00:00`)
  const target = new Date(`${value}T12:00:00`)
  return Math.round((target - today) / 86400000)
}

function dueLabel(value) {
  const days = daysFromToday(value)
  if (days == null) return 'No deadline'
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days <= 7) return `Due in ${days} days`
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function moduleForLesson(lesson) {
  const subject = lesson.lesson_object?.subject ?? lesson.subject ?? 'General'
  if (['PE', 'Health', "Driver's Ed", 'PE & Health'].includes(subject)) return 'PE & Health'
  if (subject === 'Library/Media') return 'Library & Media'
  return subject
}

function StatCard({ icon: Icon, value, label, detail, color }) {
  return <article className="rounded-2xl border border-ink-800 bg-ink-950/45 p-4">
    <div className="flex items-center justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></span><strong className="text-2xl text-ink-50">{value}</strong></div>
    <p className="mt-3 text-sm font-bold text-ink-100">{label}</p>
    <p className="mt-1 text-xs text-ink-500">{detail}</p>
  </article>
}

function EmptyState({ title, detail, to, action }) {
  return <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-950/30 p-5 text-center">
    <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
    <p className="mt-2 font-bold text-ink-100">{title}</p><p className="mt-1 text-sm text-ink-500">{detail}</p>
    {to && <Link to={to} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-400">{action}<ArrowRight size={14} /></Link>}
  </div>
}

export default function MySchoolYear() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedModule = searchParams.get('module') || ''
  const schoolYearLabel = currentSchoolYear()
  const [lessons, setLessons] = useState([])
  const [periods, setPeriods] = useState([])
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [taskFilter, setTaskFilter] = useState('open')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', dueDate: '', moduleLabel: requestedModule, category: 'planning', priority: 'normal', notes: '' })

  useEffect(() => {
    let active = true
    Promise.all([listLessons(), listPeriods(), listSmartGoals(), listSchoolYearTasks(schoolYearLabel)])
      .then(([lessonRows, periodRows, goalRows, taskRows]) => {
        if (!active) return
        setLessons(lessonRows ?? [])
        setPeriods(periodRows ?? [])
        setGoals(goalRows ?? [])
        setTasks(taskRows ?? [])
      })
      .catch((err) => { if (active) setError(err.message || 'Your school-year workspace could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [schoolYearLabel])

  useEffect(() => {
    void trackToolUsage('my-school-year', 'opened', { moduleLabel: requestedModule || 'All specialties' })
  }, [requestedModule])

  const today = dateKey()
  const upcomingLimit = new Date()
  upcomingLimit.setDate(upcomingLimit.getDate() + 14)
  const upcomingLimitKey = dateKey(upcomingLimit)

  const lessonRows = useMemo(() => lessons.map((lesson) => ({ ...lesson, moduleLabel: moduleForLesson(lesson) })), [lessons])
  const moduleOptions = useMemo(() => [...new Set([
    ...Object.values(SPECIALTY_CONTEXTS).map((config) => config.moduleLabel),
    ...lessonRows.map((lesson) => lesson.moduleLabel),
    ...goals.map((goal) => goal.subject),
    ...tasks.map((task) => task.module_label),
  ].filter(Boolean))].sort(), [lessonRows, goals, tasks])

  const contextLessons = requestedModule ? lessonRows.filter((lesson) => lesson.moduleLabel === requestedModule) : lessonRows
  const contextGoals = requestedModule ? goals.filter((goal) => goal.subject === requestedModule) : goals
  const contextTasks = requestedModule ? tasks.filter((task) => task.module_label === requestedModule) : tasks
  const activeGoals = contextGoals.filter((goal) => goal.status === 'active')
  const openTasks = contextTasks.filter((task) => task.status === 'open')
  const completedTasks = contextTasks.filter((task) => task.status === 'completed')
  const displayedTasks = contextTasks.filter((task) => taskFilter === 'all' || task.status === taskFilter)
  const upcomingLessons = contextLessons.filter((lesson) => lesson.scheduled_date >= today && lesson.scheduled_date <= upcomingLimitKey).slice(0, 5)
  const todaysLessons = contextLessons.filter((lesson) => lesson.scheduled_date === today)
  const dueSoon = openTasks.filter((task) => task.due_date && daysFromToday(task.due_date) <= 7).length
  const completion = contextTasks.length ? Math.round((completedTasks.length / contextTasks.length) * 100) : 0

  const contextSuffix = requestedModule ? `?module=${encodeURIComponent(requestedModule)}` : ''
  const moduleConfig = Object.values(SPECIALTY_CONTEXTS).find((config) => config.moduleLabel === requestedModule)
  const createPath = requestedModule === 'PE & Health' ? '/generate' : moduleConfig?.generatePath || '/'

  async function addTask(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      const task = await createSchoolYearTask({ ...form, schoolYearLabel })
      setTasks((current) => [...current, task])
      setForm({ title: '', dueDate: '', moduleLabel: requestedModule, category: 'planning', priority: 'normal', notes: '' })
      setShowAdd(false)
      setTaskFilter('open')
      void trackToolUsage('my-school-year', 'created', { moduleLabel: task.module_label || requestedModule || 'All specialties' })
    } catch (err) {
      setError(err.message || 'The priority could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(task) {
    const completed = task.status !== 'completed'
    try {
      const updated = await setSchoolYearTaskComplete(task, completed)
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item))
      if (completed) void trackToolUsage('my-school-year', 'completed', { moduleLabel: task.module_label || 'All specialties' })
    } catch (err) {
      setError(err.message || 'The priority could not be updated.')
    }
  }

  async function archiveTask(task) {
    try {
      await archiveSchoolYearTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
    } catch (err) {
      setError(err.message || 'The priority could not be archived.')
    }
  }

  if (loading) return <div className="card p-8 text-center text-ink-400">Building your {schoolYearLabel} command center…</div>

  return <div className="space-y-8">
    <section className="overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-teal-500/18 via-ink-900 to-blue-500/10 shadow-xl shadow-teal-500/5">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.45fr_1fr] lg:items-end">
        <div>
          <p className="label-eyebrow text-teal-400">{schoolYearLabel} command center</p>
          <h1 className="mt-2 text-3xl font-black text-ink-50 sm:text-4xl">My School Year</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-300">One organized view for what you are teaching, tracking, running, and preparing next—across every specialty you use.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} /> Add a priority</button>
            <Link to={createPath} className="btn-secondary"><Sparkles size={16} /> {requestedModule ? 'Create a lesson' : 'Choose a specialty'}</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-950/45 p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-ink-500">Year progress</p><p className="mt-1 text-2xl font-black text-ink-50">{completion}% priorities complete</p></div><CalendarCheck2 size={32} className="text-teal-400" /></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500" style={{ width: `${completion}%` }} /></div>
          <p className="mt-3 text-xs text-ink-500">{openTasks.length} open · {completedTasks.length} completed {dueSoon ? `· ${dueSoon} due soon` : ''}</p>
        </div>
      </div>
    </section>

    <section className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="label-eyebrow">Workspace view</p><p className="mt-1 text-sm text-ink-400">Look across your whole year or focus on one specialty.</p></div>
      <select value={requestedModule} onChange={(event) => { const value = event.target.value; const next = new URLSearchParams(searchParams); if (value) next.set('module', value); else next.delete('module'); setForm((current) => ({ ...current, moduleLabel: value })); setSearchParams(next) }} className="input min-w-56">
        <option value="">All specialties</option>{moduleOptions.map((module) => <option key={module} value={module}>{module}</option>)}
      </select>
    </section>

    {error && <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Users2} value={periods.length} label="Saved classes" detail="Shared across your tools" color="bg-blue-500/15 text-blue-400" />
      <StatCard icon={CalendarDays} value={todaysLessons.length} label="Lessons today" detail={`${upcomingLessons.length} scheduled in the next 14 days`} color="bg-violet-500/15 text-violet-400" />
      <StatCard icon={Target} value={activeGoals.length} label="Active SMART goals" detail="Progress evidence stays connected" color="bg-emerald-500/15 text-emerald-400" />
      <StatCard icon={Flag} value={openTasks.length} label="Open priorities" detail={dueSoon ? `${dueSoon} need attention this week` : 'Nothing urgent this week'} color="bg-amber-500/15 text-amber-400" />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <article className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-800 p-5 sm:p-6"><div><p className="label-eyebrow">Your priorities</p><h2 className="mt-1 text-xl font-black text-ink-50">Know what needs attention next</h2></div><button type="button" onClick={() => setShowAdd((value) => !value)} className="btn-secondary"><Plus size={16} /> Add</button></div>

        {showAdd && <form onSubmit={addTask} className="grid gap-4 border-b border-ink-800 bg-ink-950/45 p-5 sm:grid-cols-2 sm:p-6">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-ink-300">What needs to get done?</span><input autoFocus className="input w-full" maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Example: Finalize Family Fitness Night volunteer stations" /></label>
          <label><span className="mb-1.5 block text-xs font-bold text-ink-300">Specialty</span><select className="input w-full" value={form.moduleLabel} onChange={(event) => setForm({ ...form, moduleLabel: event.target.value })}><option value="">Whole school year</option>{moduleOptions.map((module) => <option key={module} value={module}>{module}</option>)}</select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-ink-300">Due date</span><input className="input w-full" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
          <label><span className="mb-1.5 block text-xs font-bold text-ink-300">Type</span><select className="input w-full" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-ink-300">Priority</span><select className="input w-full" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="normal">Normal</option><option value="high">High</option></select></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-ink-300">Notes (optional)</span><textarea className="input min-h-20 w-full" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Keep the detail you will need when you return." /></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={saving || !form.title.trim()} className="btn-primary" type="submit"><Check size={16} /> {saving ? 'Saving…' : 'Save priority'}</button><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button></div>
        </form>}

        <div className="flex gap-2 border-b border-ink-800 px-5 py-3 sm:px-6">{[['open', `Open (${openTasks.length})`], ['completed', `Completed (${completedTasks.length})`], ['all', 'All']].map(([value, label]) => <button key={value} type="button" onClick={() => setTaskFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${taskFilter === value ? 'bg-teal-500/15 text-teal-400' : 'text-ink-500 hover:bg-ink-900 hover:text-ink-200'}`}>{label}</button>)}</div>
        <div className="divide-y divide-ink-800">
          {displayedTasks.length ? displayedTasks.map((task) => {
            const completed = task.status === 'completed'
            const overdue = !completed && task.due_date && daysFromToday(task.due_date) < 0
            return <div key={task.id} className="flex items-start gap-3 p-4 sm:p-5">
              <button type="button" onClick={() => toggleTask(task)} aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`mt-0.5 shrink-0 ${completed ? 'text-emerald-400' : 'text-ink-600 hover:text-teal-400'}`}>{completed ? <CheckCircle2 size={23} /> : <Circle size={23} />}</button>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`font-bold ${completed ? 'text-ink-500 line-through' : 'text-ink-100'}`}>{task.title}</p>{task.priority === 'high' && !completed && <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">High</span>}</div>
                {task.notes && <p className="mt-1 text-sm text-ink-500">{task.notes}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2 py-1 font-bold ${CATEGORY_STYLES[task.category] || CATEGORY_STYLES.other}`}>{CATEGORIES.find(([value]) => value === task.category)?.[1] || 'Other'}</span>{task.module_label && <span className="text-ink-500">{task.module_label}</span>}<span className={overdue ? 'font-bold text-red-400' : 'text-ink-500'}>{dueLabel(task.due_date)}</span></div>
              </div>
              <button type="button" onClick={() => archiveTask(task)} aria-label={`Archive ${task.title}`} className="shrink-0 rounded-lg p-2 text-ink-700 hover:bg-ink-900 hover:text-ink-300"><Archive size={16} /></button>
            </div>
          }) : <div className="p-5"><EmptyState title={taskFilter === 'completed' ? 'Completed work will collect here' : 'Your priority list is clear'} detail={taskFilter === 'completed' ? 'Finish a priority and it becomes part of your school-year record.' : 'Add a deadline, event, supply need, communication, or evidence reminder.'} /></div>}
        </div>
      </article>

      <div className="space-y-6">
        <article className="card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="label-eyebrow">Coming up</p><h2 className="mt-1 text-lg font-black text-ink-50">Next 14 days</h2></div><Clock3 size={22} className="text-violet-400" /></div>
          <div className="mt-4 space-y-3">{upcomingLessons.length ? upcomingLessons.map((lesson) => <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="group flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-3 hover:border-violet-500/35"><span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-500/12 text-violet-400"><span className="text-[9px] font-bold uppercase">{new Date(`${lesson.scheduled_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span><span className="text-sm font-black leading-none">{new Date(`${lesson.scheduled_date}T12:00:00`).getDate()}</span></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-ink-100">{lesson.title || lesson.lesson_object?.title}</span><span className="block text-xs text-ink-500">{lesson.period_label || lesson.moduleLabel}</span></span><ChevronRight size={16} className="text-ink-700 group-hover:text-violet-400" /></Link>) : <EmptyState title="Nothing scheduled yet" detail="Schedule lessons so they appear in your school-year view." to={`/schedule${contextSuffix}`} action="Open schedule" />}</div>
        </article>

        <article className="card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="label-eyebrow">Growth evidence</p><h2 className="mt-1 text-lg font-black text-ink-50">Active SMART goals</h2></div><Target size={22} className="text-emerald-400" /></div>
          <div className="mt-4 space-y-3">{activeGoals.length ? activeGoals.slice(0, 3).map((goal) => <Link key={goal.id} to={`/smart-goals${contextSuffix}`} className="block rounded-xl border border-ink-800 bg-ink-950/40 p-4 hover:border-emerald-500/35"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-ink-100">{goal.title}</p><span className="shrink-0 text-[10px] font-bold uppercase text-emerald-400">{goal.subject}</span></div><p className="mt-2 text-xs text-ink-500">Target {dueLabel(goal.target_date).toLowerCase()}</p></Link>) : <EmptyState title="No active goals" detail="Create a class or grade-level SMART goal and keep the evidence together." to={`/smart-goals${contextSuffix}`} action="Create a goal" />}</div>
        </article>
      </div>
    </section>

    <section className="card p-5 sm:p-6"><div><p className="label-eyebrow">Keep the year moving</p><h2 className="mt-1 text-xl font-black text-ink-50">Everything connects back to this view</h2><p className="mt-2 text-sm text-ink-500">Plan, run, document, and prepare the next step without hunting through separate systems.</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [createPath, Sparkles, requestedModule ? 'Create next lesson' : 'Choose a specialty', requestedModule ? 'Prepare what students need next' : 'Open the right workspace, then create', 'text-accent-400 bg-accent-500/12'],
          [`/schedule${contextSuffix}`, CalendarDays, 'Classes & schedule', 'Keep dates and shared rosters organized', 'text-blue-400 bg-blue-500/12'],
          [`/smart-goals${contextSuffix}`, Target, 'Update goal evidence', 'Show progress while it is happening', 'text-emerald-400 bg-emerald-500/12'],
          [`/programs${contextSuffix}`, Award, 'Student programs', 'Run challenges from launch to celebration', 'text-violet-400 bg-violet-500/12'],
          [`/funding${contextSuffix}`, FolderHeart, 'Funding & grants', 'Track opportunities and application work', 'text-amber-400 bg-amber-500/12'],
          [`/portfolio${contextSuffix}`, FileBarChart, 'Impact portfolio', 'Turn the year into administrator-ready evidence', 'text-rose-400 bg-rose-500/12'],
        ].map(([to, Icon, title, detail, color]) => <Link key={title} to={to} className="group flex gap-3 rounded-2xl border border-ink-800 bg-ink-950/35 p-4 hover:border-teal-500/35"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></span><span><span className="block text-sm font-black text-ink-100">{title}</span><span className="mt-1 block text-xs leading-5 text-ink-500">{detail}</span></span><ArrowRight size={15} className="ml-auto mt-1 shrink-0 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-teal-400" /></Link>)}
      </div>
    </section>

    <section className="rounded-3xl border border-blue-500/25 bg-gradient-to-r from-blue-500/10 via-teal-500/8 to-emerald-500/10 p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400"><RotateCcw size={24} /></span><div><p className="label-eyebrow text-blue-400">Built to return next year</p><h2 className="mt-1 text-xl font-black text-ink-50">Your work becomes a reusable school-year record.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-400">Completed priorities, scheduled lessons, goals, programs, and evidence stay organized so the next school year begins with proven work instead of another blank page.</p></div></div><span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/12 px-4 py-2 text-xs font-black text-emerald-400"><GraduationCap size={16} /> Rollover foundation ready</span></div></section>
  </div>
}
