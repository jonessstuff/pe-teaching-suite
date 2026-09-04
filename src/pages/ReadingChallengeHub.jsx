import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, BarChart3, BookOpen, CalendarDays, Check, Download,
  Eye, Flag, Globe2, Library, Loader2, Medal, Plus, Printer, Sparkles, Trophy,
  UserRound, Users2, X,
} from 'lucide-react'
import { listPeriods } from '../services/classPeriodsService'
import { listStudents } from '../services/studentsService'
import {
  createReadingChallenge,
  listReadingChallenges,
  updateReadingChallenge,
} from '../services/readingChallengeService'
import { trackToolUsage, trackToolUsageOnce } from '../services/productUsageService'

const METRICS = {
  books: { singular: 'book', plural: 'books', step: 1, quick: '+1 book' },
  minutes: { singular: 'minute', plural: 'minutes', step: 15, quick: '+15 min' },
  pages: { singular: 'page', plural: 'pages', step: 10, quick: '+10 pages' },
  genres: { singular: 'genre', plural: 'genres', step: 1, quick: '+1 genre' },
}

const TEMPLATES = [
  { id: 'around-the-world', title: 'Read Around the World', blurb: 'Build a shared journey through books, places, and cultures.', metric: 'books', targetMode: 'collective', goalValue: 100, Icon: Globe2, color: 'bg-cobalt-500/15 text-cobalt-400' },
  { id: 'genre-quest', title: 'Genre Quest', blurb: 'Help every reader explore mysteries, biographies, poetry, fantasy, and more.', metric: 'genres', targetMode: 'per_reader', goalValue: 5, Icon: Flag, color: 'bg-violet-500/15 text-violet-400' },
  { id: 'minutes-matter', title: 'Minutes Matter', blurb: 'Grow reading stamina with a simple minutes-read goal.', metric: 'minutes', targetMode: 'per_reader', goalValue: 300, Icon: CalendarDays, color: 'bg-emerald-500/15 text-emerald-400' },
  { id: 'award-adventure', title: 'Award Book Adventure', blurb: 'Create excitement around your state or national award nominees.', metric: 'books', targetMode: 'per_reader', goalValue: 6, Icon: Medal, color: 'bg-amber-500/15 text-amber-400' },
  { id: 'nonfiction-explorer', title: 'Nonfiction Explorer', blurb: 'Celebrate curiosity through biographies, science, history, and how-to texts.', metric: 'books', targetMode: 'per_reader', goalValue: 5, Icon: BookOpen, color: 'bg-sky-500/15 text-sky-400' },
  { id: 'custom', title: 'Build My Own', blurb: 'Choose the audience, measurement, dates, and goal.', metric: 'books', targetMode: 'collective', goalValue: 50, Icon: Sparkles, color: 'bg-rose-500/15 text-rose-400' },
]

const dateInput = (offsetDays = 0) => {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)
  return value.toISOString().slice(0, 10)
}

const initialForm = {
  templateId: 'around-the-world', title: 'Read Around the World', scope: 'class',
  metric: 'books', targetMode: 'collective', goalValue: 100, gradeLabel: '4',
  classPeriodId: '', startsOn: dateInput(), endsOn: dateInput(30),
}

const scopeLabel = (scope) => ({ class: 'Class challenge', grade: 'Grade-level challenge', whole_school: 'Whole-school challenge' }[scope] ?? scope)

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export default function ReadingChallengeHub() {
  const [challenges, setChallenges] = useState(null)
  const [periods, setPeriods] = useState([])
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [view, setView] = useState('overview')
  const [showCreate, setShowCreate] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [createForm, setCreateForm] = useState(initialForm)
  const [bookTitle, setBookTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listReadingChallenges(), listPeriods(), listStudents()])
      .then(([challengeRows, periodRows, studentRows]) => {
        setChallenges(challengeRows)
        setPeriods(periodRows ?? [])
        setStudents(studentRows ?? [])
        const firstActive = challengeRows.find((item) => item.status === 'active') ?? challengeRows[0]
        if (firstActive) setSelectedId(firstActive.id)
        const libraryPeriod = periodRows.find((item) => /library/i.test(`${item.subject} ${item.label}`)) ?? periodRows[0]
        if (libraryPeriod) setCreateForm((current) => ({ ...current, classPeriodId: libraryPeriod.id }))
      })
      .catch((err) => setError(err.message))
  }, [])

  const selected = challenges?.find((item) => item.id === selectedId) ?? null

  const eligibleStudents = useMemo(() => {
    if (!selected) return []
    if (selected.scope === 'whole_school') return students
    if (selected.scope === 'grade') return students.filter((student) => String(student.grade ?? '') === String(selected.grade_label ?? ''))
    return students.filter((student) => (selected.class_period_ids ?? []).includes(student.class_period_id))
  }, [selected, students])

  const metric = METRICS[selected?.metric] ?? METRICS.books
  const totalProgress = eligibleStudents.reduce((sum, student) => sum + Number(selected?.progress?.[student.id] ?? 0), 0)
  const totalGoal = selected
    ? selected.target_mode === 'per_reader' ? Number(selected.goal_value) * eligibleStudents.length : Number(selected.goal_value)
    : 0
  const percent = totalGoal ? Math.min(100, Math.round((totalProgress / totalGoal) * 100)) : 0
  const participants = eligibleStudents.filter((student) => Number(selected?.progress?.[student.id] ?? 0) > 0).length
  const daysLeft = selected ? Math.max(0, Math.ceil((new Date(`${selected.ends_on}T23:59:59`) - new Date()) / 86400000)) : 0

  const classRows = useMemo(() => periods.map((period) => {
    const roster = eligibleStudents.filter((student) => student.class_period_id === period.id)
    if (!roster.length) return null
    const amount = roster.reduce((sum, student) => sum + Number(selected?.progress?.[student.id] ?? 0), 0)
    const goal = selected?.target_mode === 'per_reader' ? Number(selected.goal_value) * roster.length : totalGoal
    return { ...period, roster, amount, goal, percent: goal ? Math.min(100, Math.round((amount / goal) * 100)) : 0 }
  }).filter(Boolean).sort((a, b) => b.amount - a.amount), [eligibleStudents, periods, selected, totalGoal])

  function chooseTemplate(template) {
    setCreateForm((current) => ({
      ...current,
      templateId: template.id,
      title: template.title,
      metric: template.metric,
      targetMode: template.targetMode,
      goalValue: template.goalValue,
    }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    setSavingId('create')
    try {
      const template = TEMPLATES.find((item) => item.id === createForm.templateId)
      const classPeriodIds = createForm.scope === 'class' && createForm.classPeriodId ? [createForm.classPeriodId] : []
      const row = await createReadingChallenge({
        title: createForm.title.trim(), theme: template?.id ?? 'custom', scope: createForm.scope,
        metric: createForm.metric, targetMode: createForm.targetMode, goalValue: createForm.goalValue,
        gradeLabel: createForm.scope === 'grade' ? createForm.gradeLabel : null,
        classPeriodIds, startsOn: createForm.startsOn, endsOn: createForm.endsOn,
      })
      setChallenges((current) => [row, ...(current ?? [])])
      setSelectedId(row.id)
      setShowCreate(false)
      setView('overview')
      void trackToolUsage('reading-challenges', 'created', { moduleLabel: 'Library & Media', metadata: { templateId: createForm.templateId } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId('')
    }
  }

  async function addProgress(student, amount) {
    if (!selected || savingId) return
    setSavingId(student.id)
    setError('')
    const currentAmount = Number(selected.progress?.[student.id] ?? 0)
    const progress = { ...(selected.progress ?? {}), [student.id]: currentAmount + Number(amount) }
    const logs = [{
      id: `reading-log-${selected.id}-${(selected.logs?.length ?? 0) + 1}`,
      student_id: student.id,
      amount: Number(amount),
      book_title: bookTitle.trim() || null,
      genre: genre.trim() || null,
      logged_on: dateInput(),
    }, ...(selected.logs ?? [])]
    try {
      const updated = await updateReadingChallenge(selected.id, { progress, logs })
      setChallenges((current) => current.map((item) => item.id === updated.id ? updated : item))
      setBookTitle('')
      setGenre('')
      trackToolUsageOnce('reading-challenges', 'updated', { moduleLabel: 'Library & Media', metadata: { source: 'progress' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId('')
    }
  }

  async function setChallengeStatus(status) {
    if (!selected) return
    setSavingId('status')
    try {
      const updated = await updateReadingChallenge(selected.id, { status })
      setChallenges((current) => current.map((item) => item.id === updated.id ? updated : item))
      void trackToolUsage('reading-challenges', status === 'completed' ? 'completed' : 'reopened', { moduleLabel: 'Library & Media' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId('')
    }
  }

  function exportCsv() {
    if (!selected) return
    const rows = [['Student', 'Class', 'Grade', `Progress (${metric.plural})`, 'Personal target', 'Percent']]
    eligibleStudents.forEach((student) => {
      const amount = Number(selected.progress?.[student.id] ?? 0)
      const personalGoal = selected.target_mode === 'per_reader' ? Number(selected.goal_value) : ''
      const personalPercent = personalGoal ? `${Math.min(100, Math.round((amount / personalGoal) * 100))}%` : ''
      rows.push([student.name_or_initials, periods.find((period) => period.id === student.class_period_id)?.label ?? '', student.grade ?? '', amount, personalGoal, personalPercent])
    })
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-progress.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    void trackToolUsage('reading-challenges', 'exported', { moduleLabel: 'Library & Media' })
  }

  if (challenges === null && !error) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-cobalt-400" /></div>

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-200"><ArrowLeft size={14} /> Library &amp; Media</Link>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New reading challenge</button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-cobalt-500/20 bg-gradient-to-br from-cobalt-500/15 via-sky-500/10 to-violet-500/10 p-5 sm:p-8">
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cobalt-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cobalt-500/15"><Trophy size={28} className="text-cobalt-400" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cobalt-400">Reading Challenge Hub</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">Make reading progress visible.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">Launch a class, grade-level, or schoolwide challenge. Log progress from shared rosters, celebrate growth, and export the results when you need them.</p>
            </div>
          </div>
          {selected && <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="input-field max-w-sm bg-white/80 dark:bg-ink-950/70 print:hidden">
            {challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}{challenge.status !== 'active' ? ` · ${challenge.status}` : ''}</option>)}
          </select>}
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {!selected ? (
        <section className="card p-8 text-center">
          <Library size={38} className="mx-auto text-cobalt-400" />
          <h2 className="mt-4 text-xl font-semibold text-ink-100">Launch your first reading challenge</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">Choose a ready-made idea, connect a class or grade, and begin recording progress in under a minute.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-5"><Sparkles size={16} /> Choose a challenge</button>
        </section>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
            {[
              ['overview', 'Overview', BarChart3], ['log', 'Log progress', Plus], ['manage', 'Challenge setup', Flag],
            ].map(([key, label, Icon]) => <button key={key} onClick={() => setView(key)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${view === key ? 'bg-cobalt-500 text-white shadow-sm' : 'border border-ink-800 bg-white text-ink-400 hover:text-ink-100 dark:bg-ink-950'}`}><Icon size={15} />{label}</button>)}
          </div>

          {view === 'overview' && <div className="space-y-5">
            <section className="card overflow-hidden">
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cobalt-500/10 px-2.5 py-1 text-xs font-bold text-cobalt-400">{scopeLabel(selected.scope)}</span>
                    <span className="rounded-full bg-ink-900 px-2.5 py-1 text-xs font-medium text-ink-400">{selected.starts_on} – {selected.ends_on}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-ink-50">{selected.title}</h2>
                  <p className="mt-1 text-sm text-ink-500">{selected.target_mode === 'per_reader' ? `${selected.goal_value} ${metric.plural} per reader` : `${selected.goal_value} ${metric.plural} together`}</p>
                  <div className="mt-5 h-4 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-gradient-to-r from-cobalt-500 to-emerald-400 transition-all" style={{ width: `${percent}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-sm"><span className="font-semibold text-ink-200">{totalProgress.toLocaleString()} of {totalGoal.toLocaleString()} {metric.plural}</span><span className="font-bold text-cobalt-400">{percent}%</span></div>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:w-[340px]">
                  {[['Readers', participants, Users2], ['Days left', daysLeft, CalendarDays], ['Classes', classRows.length, Library]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl bg-ink-950 p-3 text-center dark:bg-ink-900/70"><Icon size={17} className="mx-auto text-cobalt-400" /><p className="mt-2 text-xl font-bold text-ink-50">{value}</p><p className="text-[11px] text-ink-500">{label}</p></div>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-ink-800 bg-ink-950/30 px-5 py-4 print:hidden">
                <button onClick={() => setView('log')} className="btn-primary"><Plus size={15} /> Log progress</button>
                <button onClick={() => setShowCelebration(true)} className="btn-secondary"><Eye size={15} /> Celebration display</button>
                <button onClick={exportCsv} className="btn-secondary"><Download size={15} /> Download CSV</button>
                <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Print summary</button>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="card p-5">
                <div className="flex items-center justify-between"><div><p className="label-eyebrow">Class progress</p><h3 className="mt-1 font-semibold text-ink-100">Celebrate groups, not rankings</h3></div><Trophy size={20} className="text-amber-400" /></div>
                <div className="mt-4 space-y-4">
                  {classRows.length ? classRows.map((row) => <div key={row.id}>
                    <div className="flex items-center justify-between text-sm"><span className="font-medium text-ink-200">{row.label}</span><span className="text-ink-500">{row.amount} {metric.plural}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-cobalt-500" style={{ width: `${row.percent}%` }} /></div>
                  </div>) : <p className="text-sm text-ink-500">Connect a roster to see class progress here.</p>}
                </div>
              </section>

              <section className="card p-5">
                <div><p className="label-eyebrow">Personal progress</p><h3 className="mt-1 font-semibold text-ink-100">Every reader stays visible to the teacher</h3></div>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {[...eligibleStudents].sort((a, b) => Number(selected.progress?.[b.id] ?? 0) - Number(selected.progress?.[a.id] ?? 0)).map((student) => {
                    const amount = Number(selected.progress?.[student.id] ?? 0)
                    const personalGoal = selected.target_mode === 'per_reader' ? Number(selected.goal_value) : null
                    return <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 px-3 py-2.5"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cobalt-500/10 text-xs font-bold text-cobalt-400">{student.name_or_initials.slice(0, 1)}</div><div className="min-w-0"><p className="truncate text-sm font-medium text-ink-200">{student.name_or_initials}</p><p className="text-[11px] text-ink-500">{periods.find((period) => period.id === student.class_period_id)?.label ?? `Grade ${student.grade ?? '—'}`}</p></div></div><span className="shrink-0 text-sm font-bold text-ink-100">{amount}{personalGoal ? ` / ${personalGoal}` : ''}</span></div>
                  })}
                  {!eligibleStudents.length && <p className="text-sm text-ink-500">No students are connected yet. Add a class roster to begin.</p>}
                </div>
              </section>
            </div>
          </div>}

          {view === 'log' && <section className="space-y-4">
            <div className="card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div><p className="label-eyebrow">Fast entry</p><h2 className="mt-1 text-xl font-semibold text-ink-100">Tap once as each reader reports progress</h2><p className="mt-1 text-sm text-ink-500">Book title and genre are optional. Leave them blank for the fastest check-in.</p></div>
                <div className="grid gap-3 sm:grid-cols-2 md:w-[460px]"><label className="text-xs font-medium text-ink-500">Book title (optional)<input value={bookTitle} onChange={(event) => setBookTitle(event.target.value)} className="input-field mt-1" placeholder="The Wild Robot" /></label><label className="text-xs font-medium text-ink-500">Genre (optional)<input value={genre} onChange={(event) => setGenre(event.target.value)} className="input-field mt-1" placeholder="Science fiction" /></label></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eligibleStudents.map((student) => <div key={student.id} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0"><p className="truncate font-semibold text-ink-100">{student.name_or_initials}</p><p className="mt-0.5 text-xs text-ink-500">{Number(selected.progress?.[student.id] ?? 0)} {metric.plural} so far</p></div>
                <button onClick={() => addProgress(student, metric.step)} disabled={!!savingId} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-cobalt-500 px-3 text-sm font-bold text-white transition hover:bg-cobalt-400 disabled:opacity-50">{savingId === student.id ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{metric.quick}</button>
              </div>)}
            </div>
            {!eligibleStudents.length && <div className="card p-7 text-center"><Users2 size={30} className="mx-auto text-cobalt-400" /><p className="mt-3 font-semibold text-ink-100">This challenge needs a roster</p><p className="mt-1 text-sm text-ink-500">Use the same Classes &amp; Rosters area shared with your other PlansK12 tools.</p><Link to="/students?module=Library%20%26%20Media" className="btn-primary mt-4">Open Classes &amp; Rosters</Link></div>}
          </section>}

          {view === 'manage' && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="card p-5 sm:p-6">
              <p className="label-eyebrow">Challenge setup</p><h2 className="mt-1 text-xl font-semibold text-ink-100">{selected.title}</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[['Audience', scopeLabel(selected.scope)], ['Measurement', metric.plural], ['Goal', selected.target_mode === 'per_reader' ? `${selected.goal_value} per reader` : `${selected.goal_value} together`], ['Dates', `${selected.starts_on} – ${selected.ends_on}`]].map(([term, value]) => <div key={term} className="rounded-xl bg-ink-950 p-4 dark:bg-ink-900/60"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{term}</dt><dd className="mt-1 font-medium text-ink-100">{value}</dd></div>)}
              </dl>
              <div className="mt-5 rounded-xl border border-cobalt-500/20 bg-cobalt-500/5 p-4"><div className="flex items-start gap-3"><UserRound size={19} className="mt-0.5 shrink-0 text-cobalt-400" /><div><p className="text-sm font-semibold text-ink-100">Privacy-conscious by design</p><p className="mt-1 text-xs leading-relaxed text-ink-500">Student names stay in the teacher view. Celebration display shows only the shared total and class progress, never a public student leaderboard.</p></div></div></div>
            </section>
            <aside className="card p-5"><p className="label-eyebrow">Finish the challenge</p><h3 className="mt-1 font-semibold text-ink-100">Ready to celebrate?</h3><p className="mt-2 text-sm text-ink-500">Mark it complete when the dates end. Your results remain available for reports and certificates.</p><button onClick={() => setChallengeStatus(selected.status === 'completed' ? 'active' : 'completed')} disabled={savingId === 'status'} className="btn-primary mt-5 w-full">{savingId === 'status' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}{selected.status === 'completed' ? 'Reopen challenge' : 'Mark complete'}</button><button onClick={() => setShowCreate(true)} className="btn-secondary mt-2 w-full"><Plus size={15} /> Start another challenge</button></aside>
          </div>}
        </>
      )}

      {showCreate && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/75 p-3 pt-8 backdrop-blur-sm sm:p-6 sm:pt-12">
        <form onSubmit={handleCreate} className="w-full max-w-4xl rounded-3xl border border-ink-800 bg-white p-5 shadow-2xl dark:bg-ink-950 sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><p className="label-eyebrow">New reading challenge</p><h2 className="mt-1 text-2xl font-bold text-ink-50">Start with an idea librarians already use</h2><p className="mt-1 text-sm text-ink-500">Everything stays editable before you launch.</p></div><button type="button" onClick={() => setShowCreate(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 hover:bg-ink-900"><X size={19} /></button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => <button type="button" key={template.id} onClick={() => chooseTemplate(template)} className={`rounded-2xl border p-4 text-left transition ${createForm.templateId === template.id ? 'border-cobalt-500 bg-cobalt-500/5 ring-2 ring-cobalt-500/20' : 'border-ink-800 hover:border-cobalt-500/40'}`}><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${template.color}`}><template.Icon size={20} /></div><p className="mt-3 font-semibold text-ink-100">{template.title}</p><p className="mt-1 text-xs leading-relaxed text-ink-500">{template.blurb}</p></button>)}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-ink-300 sm:col-span-2 lg:col-span-3">Challenge name<input required value={createForm.title} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })} className="input-field mt-1.5" /></label>
            <label className="text-sm font-medium text-ink-300">Audience<select value={createForm.scope} onChange={(event) => setCreateForm({ ...createForm, scope: event.target.value })} className="input-field mt-1.5"><option value="class">One class</option><option value="grade">A whole grade</option><option value="whole_school">Whole school</option></select></label>
            {createForm.scope === 'class' && <label className="text-sm font-medium text-ink-300">Class roster<select required value={createForm.classPeriodId} onChange={(event) => setCreateForm({ ...createForm, classPeriodId: event.target.value })} className="input-field mt-1.5"><option value="">Choose a class</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select></label>}
            {createForm.scope === 'grade' && <label className="text-sm font-medium text-ink-300">Grade<select value={createForm.gradeLabel} onChange={(event) => setCreateForm({ ...createForm, gradeLabel: event.target.value })} className="input-field mt-1.5">{['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((gradeValue) => <option key={gradeValue}>{gradeValue}</option>)}</select></label>}
            <label className="text-sm font-medium text-ink-300">Track<select value={createForm.metric} onChange={(event) => setCreateForm({ ...createForm, metric: event.target.value })} className="input-field mt-1.5">{Object.entries(METRICS).map(([key, value]) => <option key={key} value={key}>{value.plural}</option>)}</select></label>
            <label className="text-sm font-medium text-ink-300">Goal style<select value={createForm.targetMode} onChange={(event) => setCreateForm({ ...createForm, targetMode: event.target.value })} className="input-field mt-1.5"><option value="collective">One shared total</option><option value="per_reader">A goal for every reader</option></select></label>
            <label className="text-sm font-medium text-ink-300">Goal amount<input required min="1" type="number" value={createForm.goalValue} onChange={(event) => setCreateForm({ ...createForm, goalValue: event.target.value })} className="input-field mt-1.5" /></label>
            <label className="text-sm font-medium text-ink-300">Start date<input required type="date" value={createForm.startsOn} onChange={(event) => setCreateForm({ ...createForm, startsOn: event.target.value })} className="input-field mt-1.5" /></label>
            <label className="text-sm font-medium text-ink-300">End date<input required type="date" min={createForm.startsOn} value={createForm.endsOn} onChange={(event) => setCreateForm({ ...createForm, endsOn: event.target.value })} className="input-field mt-1.5" /></label>
          </div>
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={savingId === 'create'} className="btn-primary">{savingId === 'create' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Launch challenge</button></div>
        </form>
      </div>}

      {showCelebration && selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-cobalt-950 via-ink-950 to-violet-950 p-5 text-center">
        <button onClick={() => setShowCelebration(false)} aria-label="Close celebration display" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X /></button>
        <div className="w-full max-w-4xl"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400/15"><Trophy size={44} className="text-amber-300" /></div><p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-cobalt-300">Our reading challenge</p><h2 className="mt-3 text-4xl font-black text-white sm:text-6xl">{selected.title}</h2><p className="mt-5 text-xl text-white/70">Together, we have completed</p><p className="mt-2 text-7xl font-black tabular-nums text-white sm:text-8xl">{totalProgress.toLocaleString()}</p><p className="mt-2 text-2xl font-bold text-cobalt-200">{metric.plural}</p><div className="mx-auto mt-10 h-6 max-w-3xl overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cobalt-400 via-emerald-300 to-amber-300" style={{ width: `${percent}%` }} /></div><p className="mt-4 text-lg font-bold text-white">{percent}% of our goal</p><p className="mt-8 text-sm text-white/45">No student names are shown in celebration mode.</p></div>
      </div>}
    </div>
  )
}
