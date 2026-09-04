import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Check, CircleDot, ClipboardPaste, Download, Flag, History, Loader2, Pencil, Play, Printer, RotateCcw, Target, TrendingUp, Undo2, Users2 } from 'lucide-react'
import { listPeriods } from '../services/classPeriodsService'
import { listStudentsByPeriod } from '../services/studentsService'
import {
  completeRunSession,
  createRunGoal,
  createPastRun,
  createRunSession,
  getActiveRunSession,
  listRunResults,
  listRunResultsForSessions,
  listRunGoals,
  listRunSessions,
  saveRunResult,
  updateRunGoalProgress,
} from '../services/runTrackerService'
import { trackToolUsage, trackToolUsageOnce } from '../services/productUsageService'
import { classRunStats, elapsedMs, formatRunTime, nextLapResult, parseBulkRunTimes, parseRunTime, progressStats, runResultsCsv, seasonalProgress, sessionSummary, studentRunProgress, undoLapResult } from '../lib/runTracker'

const PRESETS = {
  half: { distanceLabel: '½ Mile', distanceMiles: 0.5, lapsRequired: 2 },
  mile: { distanceLabel: '1 Mile', distanceMiles: 1, lapsRequired: 4 },
  custom: { distanceLabel: 'Custom Run', distanceMiles: null, lapsRequired: 4 },
}

const STATUS_LABELS = { absent: 'Absent', medical: 'Medical', dnf: 'Did not finish' }
const localDateValue = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export default function RunTracker() {
  const [periods, setPeriods] = useState(null)
  const [periodId, setPeriodId] = useState(() => localStorage.getItem('run.period') || '')
  const [students, setStudents] = useState(null)
  const [sessions, setSessions] = useState([])
  const [session, setSession] = useState(null)
  const [results, setResults] = useState([])
  const [allResults, setAllResults] = useState([])
  const [progressStudentId, setProgressStudentId] = useState('')
  const [goals, setGoals] = useState([])
  const [goalTime, setGoalTime] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [pastPreset, setPastPreset] = useState('mile')
  const [pastDate, setPastDate] = useState(localDateValue)
  const [pastLabel, setPastLabel] = useState('')
  const [pastMiles, setPastMiles] = useState('')
  const [pastLaps, setPastLaps] = useState(PRESETS.mile.lapsRequired)
  const [pastEntries, setPastEntries] = useState({})
  const [savingPast, setSavingPast] = useState(false)
  const [pastNotes, setPastNotes] = useState('')
  const [bulkTimes, setBulkTimes] = useState('')
  const [mode, setMode] = useState('setup')
  const [preset, setPreset] = useState('half')
  const [customLabel, setCustomLabel] = useState('')
  const [customMiles, setCustomMiles] = useState('')
  const [lapsRequired, setLapsRequired] = useState(PRESETS.half.lapsRequired)
  const [now, setNow] = useState(0)
  const [savingIds, setSavingIds] = useState(() => new Set())
  const [starting, setStarting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [runNotes, setRunNotes] = useState('')
  const [editingResultId, setEditingResultId] = useState('')
  const [editingTime, setEditingTime] = useState('')
  const [updatingGoalId, setUpdatingGoalId] = useState('')
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    listPeriods().then((data) => {
      setPeriods(data)
      setPeriodId((current) => current && data.some((p) => p.id === current) ? current : (data[0]?.id || ''))
    }).catch((error) => setNotice({ type: 'error', message: error.message ?? 'Could not load classes.' }))
  }, [])

  useEffect(() => {
    if (!periodId) return
    localStorage.setItem('run.period', periodId)
    Promise.all([listStudentsByPeriod(periodId), listRunSessions(periodId), getActiveRunSession(periodId)])
      .then(async ([roster, recent, active]) => {
        setStudents(roster); setSessions(recent); setSession(active)
        setProgressStudentId((current) => current && roster.some((student) => student.id === current) ? current : (roster[0]?.id || ''))
        setAllResults(await listRunResultsForSessions(recent.map((item) => item.id)))
        if (active) { setResults(await listRunResults(active.id)); setMode('run') }
        else { setResults([]); setMode('setup') }
      })
      .catch((error) => setNotice({ type: 'error', message: error.message ?? 'Could not load the Run Tracker. Apply migration 0044 first.' }))
  }, [periodId])

  useEffect(() => {
    if (mode !== 'run' || !session) return undefined
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [mode, session])

  const resultFor = (studentId) => results.find((result) => result.student_id === studentId)
  const liveElapsed = session ? elapsedMs(session.started_at, now) : 0
  const summary = useMemo(() => sessionSummary(results), [results])
  const progressRecords = useMemo(() => studentRunProgress(progressStudentId, sessions, allResults), [progressStudentId, sessions, allResults])
  const comparableRecords = useMemo(() => {
    const label = progressRecords.at(-1)?.session.distance_label
    return label ? progressRecords.filter((record) => record.session.distance_label === label) : []
  }, [progressRecords])
  const stats = useMemo(() => progressStats(comparableRecords), [comparableRecords])
  const seasons = useMemo(() => seasonalProgress(comparableRecords), [comparableRecords])
  const classStats = useMemo(() => classRunStats(results, students?.length ?? 0), [results, students])

  useEffect(() => {
    if (!progressStudentId) return
    listRunGoals(progressStudentId).then(setGoals).catch(() => setGoals([]))
  }, [progressStudentId])

  function choosePreset(key) {
    setPreset(key)
    setLapsRequired(PRESETS[key].lapsRequired)
  }

  function choosePastPreset(key) {
    setPastPreset(key)
    setPastLaps(PRESETS[key].lapsRequired)
  }

  function updatePastEntry(studentId, field, value) {
    setPastEntries((entries) => ({ ...entries, [studentId]: { ...(entries[studentId] ?? {}), [field]: value } }))
  }

  async function startRun() {
    if (!periodId || !students?.length) return
    setStarting(true); setNotice(null)
    try {
      const config = PRESETS[preset]
      const created = await createRunSession({
        classPeriodId: periodId,
        distanceLabel: preset === 'custom' ? (customLabel.trim() || 'Custom Run') : config.distanceLabel,
        distanceMiles: preset === 'custom' ? Number(customMiles) || null : config.distanceMiles,
        lapsRequired,
        notes: runNotes,
      })
      setSession(created); setSessions((items) => [created, ...items]); setResults([]); setNow(Date.now()); setMode('run'); setRunNotes('')
      void trackToolUsage('run-tracker', 'created', { moduleLabel: 'PE & Health', metadata: { source: 'live-run' } })
    } catch (error) {
      setNotice({ type: 'error', message: error.message ?? 'Could not start the run.' })
    } finally { setStarting(false) }
  }

  async function persist(studentId, next) {
    const previous = results
    const optimistic = { ...next, student_id: studentId, session_id: session.id }
    setResults((items) => [...items.filter((result) => result.student_id !== studentId), optimistic])
    setSavingIds((ids) => new Set(ids).add(studentId))
    try {
      const saved = await saveRunResult({
        sessionId: session.id,
        studentId,
        lapsCompleted: next.laps_completed,
        lapTimesMs: next.lap_times_ms,
        finishMs: next.finish_ms,
        status: next.status,
      })
      setResults((items) => [...items.filter((result) => result.student_id !== studentId), saved])
    } catch (error) {
      setResults(previous)
      setNotice({ type: 'error', message: error.message ?? 'That tap did not save. Please try again.' })
    } finally {
      setSavingIds((ids) => { const nextIds = new Set(ids); nextIds.delete(studentId); return nextIds })
    }
  }

  function tapNextLap(studentId) {
    const current = resultFor(studentId) ?? { laps_completed: 0, lap_times_ms: [], finish_ms: null, status: 'active' }
    if (['absent', 'medical', 'dnf'].includes(current.status)) return
    persist(studentId, nextLapResult(current, session.laps_required, elapsedMs(session.started_at)))
  }

  function undoLap(studentId) {
    const current = resultFor(studentId)
    if (!current?.laps_completed) return
    persist(studentId, undoLapResult(current))
  }

  function setStudentStatus(studentId, status) {
    const current = resultFor(studentId) ?? { laps_completed: 0, lap_times_ms: [] }
    const nextStatus = current.status === status ? 'active' : status
    persist(studentId, {
      ...current,
      laps_completed: nextStatus === 'absent' || nextStatus === 'medical' ? 0 : (current.laps_completed ?? 0),
      lap_times_ms: nextStatus === 'absent' || nextStatus === 'medical' ? [] : (current.lap_times_ms ?? []),
      finish_ms: null,
      status: nextStatus,
    })
  }

  function resetStudent(studentId) {
    if (!window.confirm('Reset this student to zero laps?')) return
    persist(studentId, { laps_completed: 0, lap_times_ms: [], finish_ms: null, status: 'active' })
  }

  async function endRun() {
    setEnding(true); setNotice(null)
    try {
      const completed = await completeRunSession(session.id)
      setSession(completed)
      setSessions((items) => items.map((item) => item.id === completed.id ? completed : item))
      setAllResults((items) => [...items.filter((item) => item.session_id !== completed.id), ...results])
      setConfirmingEnd(false)
      setMode('history-detail')
      setNotice({ type: 'success', message: 'Run saved to history. Review results or download the CSV below.' })
      void trackToolUsage('run-tracker', 'completed', { moduleLabel: 'PE & Health', metadata: { source: 'live-run' } })
    } catch (error) { setNotice({ type: 'error', message: error.message ?? 'Could not end the run.' }) }
    finally { setEnding(false) }
  }

  async function showSession(selected) {
    setSession(selected); setResults(await listRunResults(selected.id)); setMode(selected.completed_at ? 'history-detail' : 'run')
  }

  function triggerSessionCsv(selectedSession, selectedResults) {
    const csv = runResultsCsv({ session: selectedSession, students, results: selectedResults, classLabel: selectedPeriod?.label ?? '' })
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeClass = (selectedPeriod?.label ?? 'class').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    link.href = url
    const runDate = selectedSession.run_date || selectedSession.started_at?.slice(0, 10) || localDateValue()
    link.download = `${safeClass}-${selectedSession.distance_label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${runDate}.csv`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function downloadSessionCsv() { triggerSessionCsv(session, results); void trackToolUsage('run-tracker', 'exported', { moduleLabel: 'PE & Health', metadata: { source: 'current-run' } }) }

  async function downloadHistoryCsv(item) {
    try { triggerSessionCsv(item, await listRunResults(item.id)); void trackToolUsage('run-tracker', 'exported', { moduleLabel: 'PE & Health', metadata: { source: 'history' } }) }
    catch (error) { setNotice({ type: 'error', message: error.message ?? 'Could not prepare the CSV.' }) }
  }

  async function saveGoal() {
    const targetMs = parseRunTime(goalTime)
    if (!stats || !targetMs || !goalDate) {
      setNotice({ type: 'error', message: 'Enter the target as minutes:seconds and choose a target date.' })
      return
    }
    setSavingGoal(true); setNotice(null)
    try {
      const saved = await createRunGoal({
        studentId: progressStudentId,
        distanceLabel: stats.latest.session.distance_label,
        baselineMs: stats.latest.finish_ms,
        targetMs,
        targetDate: goalDate,
      })
      setGoals((items) => [saved, ...items]); setGoalTime(''); setGoalDate('')
      setNotice({ type: 'success', message: 'SMART goal saved.' })
      void trackToolUsage('smart-goals', 'created', { moduleLabel: 'PE & Health', metadata: { source: 'run-tracker' } })
    } catch (error) {
      setNotice({ type: 'error', message: error.message ?? 'Could not save the SMART goal.' })
    } finally { setSavingGoal(false) }
  }

  async function savePastRun() {
    const invalidTime = students.some((student) => {
      const value = pastEntries[student.id]?.time?.trim()
      return value && !parseRunTime(value)
    })
    if (invalidTime) {
      setNotice({ type: 'error', message: 'Use minutes:seconds for each time, such as 10:42.' })
      return
    }
    const entries = students.flatMap((student) => {
      const entry = pastEntries[student.id] ?? {}
      if (entry.status) return [{ studentId: student.id, status: entry.status, finishMs: null }]
      const finishMs = parseRunTime(entry.time)
      return finishMs ? [{ studentId: student.id, status: 'finished', finishMs }] : []
    })
    if (!pastDate || !entries.length) {
      setNotice({ type: 'error', message: 'Choose the run date and enter at least one result.' })
      return
    }
    setSavingPast(true); setNotice(null)
    try {
      const config = PRESETS[pastPreset]
      const created = await createPastRun({
        classPeriodId: periodId,
        runDate: pastDate,
        distanceLabel: pastPreset === 'custom' ? (pastLabel.trim() || 'Custom Run') : config.distanceLabel,
        distanceMiles: pastPreset === 'custom' ? Number(pastMiles) || null : config.distanceMiles,
        lapsRequired: pastLaps,
        notes: pastNotes,
        entries,
      })
      const savedResults = await listRunResults(created.id)
      setSessions((items) => [created, ...items]); setAllResults((items) => [...items, ...savedResults])
      setSession(created); setResults(savedResults); setPastEntries({}); setPastNotes(''); setBulkTimes(''); setMode('history-detail')
      setNotice({ type: 'success', message: 'Past run saved to History and Student Progress.' })
      void trackToolUsage('run-tracker', 'created', { moduleLabel: 'PE & Health', metadata: { source: 'past-run' } })
    } catch (error) {
      setNotice({ type: 'error', message: error.message ?? 'Could not save the past run.' })
    } finally { setSavingPast(false) }
  }

  function applyBulkTimes() {
    const parsed = parseBulkRunTimes(bulkTimes, students)
    setPastEntries((entries) => ({ ...entries, ...parsed.entries }))
    setNotice(parsed.errors.length
      ? { type: 'error', message: `${Object.keys(parsed.entries).length} times added. ${parsed.errors.slice(0, 2).join(' ')}` }
      : { type: 'success', message: `${Object.keys(parsed.entries).length} times added to the roster.` })
  }

  async function saveHistoricalCorrection(student) {
    const finishMs = parseRunTime(editingTime)
    if (!finishMs) { setNotice({ type: 'error', message: 'Enter the corrected time as minutes:seconds.' }); return }
    setSavingIds((ids) => new Set(ids).add(student.id))
    try {
      const saved = await saveRunResult({ sessionId: session.id, studentId: student.id, lapsCompleted: session.laps_required, lapTimesMs: [finishMs], finishMs, status: 'finished' })
      setResults((items) => [...items.filter((item) => item.student_id !== student.id), saved])
      setAllResults((items) => [...items.filter((item) => !(item.session_id === session.id && item.student_id === student.id)), saved])
      setEditingResultId(''); setEditingTime(''); setNotice({ type: 'success', message: 'Finish time corrected.' })
      trackToolUsageOnce('run-tracker', 'updated', { moduleLabel: 'PE & Health', metadata: { source: 'history-correction' } })
    } catch (error) { setNotice({ type: 'error', message: error.message ?? 'Could not correct that time.' }) }
    finally { setSavingIds((ids) => { const next = new Set(ids); next.delete(student.id); return next }) }
  }

  async function changeGoalProgress(goal, progressStatus) {
    setUpdatingGoalId(goal.id)
    try {
      const saved = await updateRunGoalProgress(goal.id, progressStatus)
      setGoals((items) => items.map((item) => item.id === saved.id ? saved : item))
    } catch (error) { setNotice({ type: 'error', message: error.message ?? 'Could not update the goal.' }) }
    finally { setUpdatingGoalId('') }
  }

  const selectedPeriod = (periods ?? []).find((period) => period.id === periodId)
  if (periods == null) return <div className="flex items-center gap-2 text-ink-400"><Loader2 size={18} className="animate-spin" /> Loading…</div>

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15"><CircleDot size={22} className="text-accent-600" /></div>
        <div><h1 className="text-2xl font-semibold">Run Tracker</h1><p className="text-sm text-ink-500">Tap one dot per lap. Finish times save automatically.</p></div>
      </div>
      <select value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="input-field sm:max-w-xs">
        {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
      </select>
    </header>

    <div className="grid grid-cols-3 rounded-xl border border-ink-800 p-1">
      <button onClick={() => setMode(session && !session.completed_at ? 'run' : 'setup')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'setup' || mode === 'run' || mode === 'past' ? 'bg-accent-500/15 text-accent-700' : 'text-ink-400'}`}>{session && !session.completed_at ? 'Current run' : 'New run'}</button>
      <button onClick={() => setMode('history')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${mode.startsWith('history') ? 'bg-accent-500/15 text-accent-700' : 'text-ink-400'}`}><History size={15} /> History</button>
      <button onClick={() => setMode('progress')} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold ${mode === 'progress' ? 'bg-accent-500/15 text-accent-700' : 'text-ink-400'}`}><TrendingUp size={15} /> Progress</button>
    </div>

    {notice && <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${notice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-green-500/30 bg-green-500/10 text-green-600'}`}>{notice.message}</p>}
    {!periods.length && <div className="card p-6 text-sm">Create a class in <Link to="/schedule" className="text-accent-600 underline">Schedule</Link> first.</div>}
    {selectedPeriod && students?.length === 0 && <div className="card p-6 text-sm">No students are in {selectedPeriod.label}. <Link to="/students" className="text-accent-600 underline"><Users2 size={14} className="inline" /> Import its roster</Link> first.</div>}

    {mode === 'setup' && students?.length > 0 && <section className="card space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Set up today’s run</h2><p className="text-sm text-ink-500">Distance and lap count are separate so this works on any track, gym, or playground loop.</p></div><button onClick={() => setMode('past')} className="btn-secondary min-h-11"><CalendarPlus size={16} /> Add past run</button></div>
      <div className="grid grid-cols-3 gap-2">
        {[['half', '½ Mile'], ['mile', '1 Mile'], ['custom', 'Custom']].map(([key, label]) => <button key={key} onClick={() => choosePreset(key)} aria-pressed={preset === key} className={`min-h-[54px] rounded-xl border text-sm font-bold ${preset === key ? 'border-accent-500 bg-accent-500/15 text-accent-700' : 'border-ink-800 text-ink-300'}`}>{label}</button>)}
      </div>
      {preset === 'custom' && <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-300">Run name<input value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} placeholder="e.g. 800 meters" className="input-field mt-1" /></label><label className="text-sm font-medium text-ink-300">Miles (optional)<input type="number" min="0.1" step="0.1" value={customMiles} onChange={(event) => setCustomMiles(event.target.value)} className="input-field mt-1" /></label></div>}
      <label className="block text-sm font-medium text-ink-300">Number of laps<input type="number" min="1" max="50" value={lapsRequired} onChange={(event) => setLapsRequired(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} className="input-field mt-1 max-w-32 text-lg font-bold" /></label>
      <label className="block text-sm font-medium text-ink-300">Run notes or conditions <span className="font-normal text-ink-500">(optional)</span><textarea value={runNotes} onChange={(event) => setRunNotes(event.target.value)} placeholder="Hot weather, indoor course, modified distance…" rows="2" className="input-field mt-1 resize-y" /></label>
      <div className="rounded-xl bg-ink-900/40 p-4 text-sm text-ink-300"><strong>{selectedPeriod.label}</strong> · {students.length} students · {lapsRequired} lap{lapsRequired === 1 ? '' : 's'} each</div>
      <div className="rounded-xl border border-ink-800 bg-white/50 p-4 dark:bg-ink-950/30">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink-100">Students in this run</h3>
            <p className="text-xs text-ink-500">Confirm the class roster before you start.</p>
          </div>
          <span className="rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-bold text-accent-700">{students.length}</span>
        </div>
        <ol className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {students.map((student, index) => <li key={student.id} className="flex min-h-10 items-center gap-2 rounded-lg bg-ink-900/40 px-3 py-2 text-sm font-medium text-ink-200"><span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-500">{index + 1}.</span><span>{student.name_or_initials}</span></li>)}
        </ol>
      </div>
      <button onClick={startRun} disabled={starting} className="btn-primary min-h-[52px] w-full text-base">{starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} Start run</button>
    </section>}

    {mode === 'past' && students?.length > 0 && <section className="space-y-4">
      <div className="card space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Add a past run</h2><p className="text-sm text-ink-500">Enter final times only. Lap tapping is not required.</p></div><button onClick={() => setMode('setup')} className="text-sm font-semibold text-accent-600">Cancel</button></div>
        <label className="block text-sm font-medium text-ink-300">Run date<input type="date" max={localDateValue()} value={pastDate} onChange={(event) => setPastDate(event.target.value)} className="input-field mt-1" /></label>
        <div className="grid grid-cols-3 gap-2">{[['half', '½ Mile'], ['mile', '1 Mile'], ['custom', 'Custom']].map(([key, label]) => <button key={key} onClick={() => choosePastPreset(key)} aria-pressed={pastPreset === key} className={`min-h-[50px] rounded-xl border text-sm font-bold ${pastPreset === key ? 'border-accent-500 bg-accent-500/15 text-accent-700' : 'border-ink-800 text-ink-300'}`}>{label}</button>)}</div>
        {pastPreset === 'custom' && <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-300">Run name<input value={pastLabel} onChange={(event) => setPastLabel(event.target.value)} placeholder="e.g. 800 meters" className="input-field mt-1" /></label><label className="text-sm font-medium text-ink-300">Miles (optional)<input type="number" min="0.1" step="0.1" value={pastMiles} onChange={(event) => setPastMiles(event.target.value)} className="input-field mt-1" /></label></div>}
        <label className="block text-sm font-medium text-ink-300">Number of laps<input type="number" min="1" max="50" value={pastLaps} onChange={(event) => setPastLaps(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} className="input-field mt-1 max-w-32" /></label>
        <label className="block text-sm font-medium text-ink-300">Run notes or conditions <span className="font-normal text-ink-500">(optional)</span><textarea value={pastNotes} onChange={(event) => setPastNotes(event.target.value)} placeholder="Weather, course, injury modifications…" rows="2" className="input-field mt-1 resize-y" /></label>
        <div className="rounded-xl border border-ink-800 p-4"><div className="flex items-center gap-2"><ClipboardPaste size={17} className="text-accent-600" /><h3 className="font-semibold">Paste times in bulk</h3></div><p className="mt-1 text-xs text-ink-500">Paste one time per line in roster order, or use “Student name 10:42”.</p><textarea value={bulkTimes} onChange={(event) => setBulkTimes(event.target.value)} placeholder={'10:42\n11:08\n12:15'} rows="5" className="input-field mt-3 font-mono" /><button onClick={applyBulkTimes} disabled={!bulkTimes.trim()} className="btn-secondary mt-3 min-h-11"><ClipboardPaste size={16} /> Add pasted times</button></div>
      </div>
      <div className="card overflow-hidden"><div className="border-b border-ink-800 p-4"><h3 className="font-semibold">Enter results for {selectedPeriod.label}</h3><p className="text-xs text-ink-500">Leave blank if no result was recorded.</p></div><div className="divide-y divide-ink-800">{students.map((student) => { const entry = pastEntries[student.id] ?? {}; return <div key={student.id} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center"><span className="font-medium text-ink-100">{student.name_or_initials}</span><label className="text-xs text-ink-500">Finish time<input value={entry.time ?? ''} onChange={(event) => updatePastEntry(student.id, 'time', event.target.value)} disabled={!!entry.status} inputMode="decimal" placeholder="10:42" className="input-field mt-1 font-mono disabled:opacity-40" /></label><label className="text-xs text-ink-500">Exception<select value={entry.status ?? ''} onChange={(event) => updatePastEntry(student.id, 'status', event.target.value)} className="input-field mt-1"><option value="">None</option><option value="absent">Absent</option><option value="medical">Medical</option><option value="dnf">Did not finish</option></select></label></div>})}</div></div>
      <div className="sticky bottom-20 z-10 rounded-xl border border-ink-800 bg-white/95 p-3 shadow-lg backdrop-blur dark:bg-ink-950/95 md:bottom-4"><button onClick={savePastRun} disabled={savingPast} className="btn-primary min-h-[52px] w-full text-base">{savingPast ? <Loader2 size={18} className="animate-spin" /> : <CalendarPlus size={18} />} Save past run</button></div>
    </section>}

    {mode === 'run' && session && <>
      <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between gap-3 border-y border-ink-900 bg-white/95 px-6 py-3 backdrop-blur dark:bg-ink-950/95 md:-mx-10 md:px-10">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{session.distance_label} · {session.laps_required} laps</p><p className="font-mono text-3xl font-bold tabular-nums text-ink-50">{formatRunTime(liveElapsed)}</p></div>
        <button onClick={() => setConfirmingEnd(true)} className="btn-secondary min-h-[44px]"><Flag size={16} /> End run</button>
      </div>
      {confirmingEnd && <div role="alertdialog" aria-labelledby="end-run-title" className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
        <p id="end-run-title" className="font-semibold text-ink-100">Save this run to history?</p>
        <p className="mt-1 text-sm text-ink-500">Every lap, finish time, absence, and note already entered will be kept.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={endRun} disabled={ending} className="btn-primary">{ending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save run & view results</button><button onClick={() => setConfirmingEnd(false)} disabled={ending} className="btn-secondary">Keep tracking</button></div>
      </div>}
      <p className="text-xs text-ink-500">Tap the next empty dot when a student completes a lap. The final dot records their finish time.</p>
      <div className="space-y-3">{students.map((student) => {
        const result = resultFor(student.id)
        const status = result?.status ?? 'active'
        const inactive = ['absent', 'medical', 'dnf'].includes(status)
        return <article key={student.id} className={`rounded-xl border p-3.5 ${status === 'finished' ? 'border-green-500/50 bg-green-500/5' : 'border-ink-800'}`}>
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-ink-100">{student.name_or_initials}</h3><p className="mt-0.5 text-xs text-ink-500">{status === 'finished' ? `Finished ${formatRunTime(result.finish_ms)}` : inactive ? STATUS_LABELS[status] : `${result?.laps_completed ?? 0}/${session.laps_required} laps`}</p></div>{savingIds.has(student.id) ? <Loader2 size={16} className="animate-spin text-ink-500" /> : result && <Check size={16} className="text-green-500" />}</div>
          <div className="mt-3 flex flex-wrap gap-2">{Array.from({ length: session.laps_required }, (_, index) => {
            const complete = index < (result?.laps_completed ?? 0)
            const next = index === (result?.laps_completed ?? 0)
            return <button key={index} onClick={() => next && tapNextLap(student.id)} disabled={savingIds.has(student.id) || inactive || status === 'finished' || !next} aria-label={`Lap ${index + 1}${complete ? ' complete' : ''}`} className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold ${complete ? 'border-accent-600 bg-accent-600 text-white' : next && !inactive ? 'border-accent-500 bg-accent-500/10 text-accent-700 shadow-sm' : 'border-ink-700 text-ink-500'}`}>{complete ? <Check size={20} /> : index + 1}</button>
          })}</div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            <button onClick={() => undoLap(student.id)} disabled={savingIds.has(student.id) || !result?.laps_completed} className="rounded-lg border border-ink-800 px-1 py-2 text-xs font-semibold text-ink-400 disabled:opacity-30"><Undo2 size={14} className="mx-auto mb-1" />Undo</button>
            {Object.entries(STATUS_LABELS).map(([key, label]) => <button key={key} onClick={() => setStudentStatus(student.id, key)} disabled={savingIds.has(student.id)} aria-pressed={status === key} className={`rounded-lg border px-1 py-2 text-[11px] font-semibold leading-tight disabled:opacity-40 ${status === key ? 'border-amber-500 bg-amber-500/15 text-amber-700' : 'border-ink-800 text-ink-400'}`}>{label}</button>)}
            <button onClick={() => resetStudent(student.id)} disabled={savingIds.has(student.id)} className="rounded-lg border border-ink-800 px-1 py-2 text-xs font-semibold text-ink-400 disabled:opacity-40"><RotateCcw size={14} className="mx-auto mb-1" />Reset</button>
          </div>
        </article>
      })}</div>
    </>}

    {mode === 'history' && <section className="space-y-3">
      <div><h2 className="text-lg font-semibold">Run history</h2><p className="text-sm text-ink-500">Saved runs for {selectedPeriod?.label}.</p></div>
      {!sessions.length && <div className="card p-6 text-center text-sm text-ink-500">No saved runs yet.</div>}
      {sessions.map((item) => <div key={item.id} className="card flex items-center gap-2 p-2"><button onClick={() => showSession(item)} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 text-left"><div className="min-w-0"><p className="truncate font-semibold text-ink-100">{item.distance_label}</p><p className="text-xs text-ink-500">{new Date(item.started_at).toLocaleDateString()} · {item.laps_required} laps</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.completed_at ? 'bg-green-500/15 text-green-700' : 'bg-amber-500/15 text-amber-700'}`}>{item.completed_at ? 'Completed' : 'Resume'}</span></button>{item.completed_at && <button onClick={() => downloadHistoryCsv(item)} aria-label={`Download ${item.distance_label} CSV`} title="Download CSV" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ink-800 text-accent-600"><Download size={17} /></button>}</div>)}
    </section>}

    {mode === 'history-detail' && session && <section className="space-y-3">
      <button onClick={() => setMode('history')} className="text-sm font-semibold text-accent-600">← Run history</button>
      <div className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{session.distance_label}</h2><p className="text-sm text-ink-500">{new Date(session.started_at).toLocaleDateString()} · {session.laps_required} laps</p></div><button onClick={downloadSessionCsv} className="btn-secondary min-h-11"><Download size={16} /> Download CSV</button></div>{session.notes && <p className="mt-3 rounded-lg bg-ink-900/40 p-3 text-sm text-ink-300"><strong>Conditions:</strong> {session.notes}</p>}<p className="mt-3 text-sm text-ink-300">{summary.finished} finished · {summary.dnf} did not finish · {summary.absent + summary.medical} exempt</p><p className="mt-2 text-xs text-ink-500">Opens in Google Sheets, Excel, or most gradebook tools.</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="card p-4"><p className="text-xs uppercase text-ink-500">Class average</p><p className="mt-1 font-mono text-xl font-bold">{formatRunTime(classStats.averageMs)}</p></div><div className="card p-4"><p className="text-xs uppercase text-ink-500">Fastest</p><p className="mt-1 font-mono text-xl font-bold text-green-600">{formatRunTime(classStats.fastestMs)}</p></div><div className="card p-4"><p className="text-xs uppercase text-ink-500">Completed</p><p className="mt-1 text-xl font-bold">{classStats.finished}</p></div><div className="card p-4"><p className="text-xs uppercase text-ink-500">Completion</p><p className="mt-1 text-xl font-bold">{classStats.completionRate}%</p></div></div>
      {students.map((student) => { const result = resultFor(student.id); const editing = editingResultId === student.id; return <div key={student.id} className="rounded-xl border border-ink-800 px-4 py-3">{editing ? <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]"><span className="self-center font-medium text-ink-100">{student.name_or_initials}</span><input value={editingTime} onChange={(event) => setEditingTime(event.target.value)} inputMode="decimal" placeholder="10:42" aria-label={`Corrected time for ${student.name_or_initials}`} className="input-field font-mono" /><div className="flex gap-2"><button onClick={() => saveHistoricalCorrection(student)} disabled={savingIds.has(student.id)} className="btn-primary min-h-10 px-3">Save</button><button onClick={() => { setEditingResultId(''); setEditingTime('') }} className="btn-secondary min-h-10 px-3">Cancel</button></div></div> : <div className="flex items-center justify-between gap-3"><span className="font-medium text-ink-100">{student.name_or_initials}</span><div className="flex items-center gap-2"><span className="font-mono font-bold text-ink-200">{result?.status === 'finished' ? formatRunTime(result.finish_ms) : result ? (STATUS_LABELS[result.status] ?? `${result.laps_completed} laps`) : '—'}</span><button onClick={() => { setEditingResultId(student.id); setEditingTime(result?.finish_ms ? formatRunTime(result.finish_ms, { tenths: false }) : '') }} aria-label={`Edit ${student.name_or_initials} result`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-800 text-ink-400"><Pencil size={14} /></button></div></div>}</div> })}
    </section>}

    {mode === 'progress' && <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Student progress</h2><p className="text-sm text-ink-500">Personal growth is compared only across runs of the same distance.</p></div><button onClick={() => { void trackToolUsage('run-tracker', 'printed', { moduleLabel: 'PE & Health', metadata: { source: 'progress-report' } }); window.print() }} className="btn-secondary min-h-11 print:hidden"><Printer size={16} /> Print progress report</button></div>
      <label className="block text-sm font-medium text-ink-300">Student<select value={progressStudentId} onChange={(event) => setProgressStudentId(event.target.value)} className="input-field mt-1">{students?.map((student) => <option key={student.id} value={student.id}>{student.name_or_initials}</option>)}</select></label>
      {!stats && <div className="card p-6 text-center"><TrendingUp size={28} className="mx-auto mb-2 text-ink-500" /><p className="font-semibold text-ink-200">No completed run times yet</p><p className="mt-1 text-sm text-ink-500">Finish at least one run for this student to establish a cardiovascular baseline.</p></div>}
      {stats && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Latest</p><p className="mt-1 font-mono text-xl font-bold">{formatRunTime(stats.latest.finish_ms)}</p></div>
          <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Personal best</p><p className="mt-1 font-mono text-xl font-bold text-green-600">{formatRunTime(stats.best.finish_ms)}</p></div>
          <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">From first run</p><p className={`mt-1 text-xl font-bold ${stats.improvementFromFirstMs >= 0 ? 'text-green-600' : 'text-amber-600'}`}>{stats.improvementFromFirstMs === 0 ? '—' : `${stats.improvementFromFirstMs > 0 ? '↑' : '↓'} ${formatRunTime(Math.abs(stats.improvementFromFirstMs))}`}</p></div>
          <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Runs recorded</p><p className="mt-1 text-xl font-bold">{comparableRecords.length}</p></div>
        </div>
        <div className="card p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Cardiovascular progress</h3><p className="text-xs text-ink-500">{stats.latest.session.distance_label} finish times</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stats.improvementFromFirstMs > 0 ? 'bg-green-500/15 text-green-700' : stats.improvementFromFirstMs < 0 ? 'bg-amber-500/15 text-amber-700' : 'bg-ink-800 text-ink-400'}`}>{stats.improvementFromFirstMs > 0 ? 'Improving' : stats.improvementFromFirstMs < 0 ? 'Needs support' : 'Baseline'}</span></div>
          <div className="mt-4 space-y-2">{comparableRecords.map((record) => { const width = Math.max(18, Math.round((stats.best.finish_ms / record.finish_ms) * 100)); return <div key={record.id}><div className="mb-1 flex justify-between text-xs"><span>{new Date(record.session.started_at).toLocaleDateString()}</span><strong className="font-mono">{formatRunTime(record.finish_ms)}</strong></div><div className="h-3 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-accent-500" style={{ width: `${width}%` }} /></div></div>})}</div>
        </div>
        <div className="card p-5"><h3 className="font-semibold">Seasonal comparison</h3><p className="text-xs text-ink-500">Fall, winter, and spring averages for this distance.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{seasons.map((season) => <div key={season.label} className="rounded-xl border border-ink-800 p-3"><p className="text-sm font-semibold">{season.label}</p><p className="mt-2 font-mono text-lg font-bold">{formatRunTime(season.averageMs)}</p><p className="text-xs text-ink-500">Average · Best {formatRunTime(season.bestMs)} · {season.count} run{season.count === 1 ? '' : 's'}</p></div>)}</div></div>
        <div className="card space-y-4 p-5"><div className="flex items-center gap-2"><Target size={20} className="text-accent-600" /><div><h3 className="font-semibold">Cardiovascular SMART goal</h3><p className="text-xs text-ink-500">Create a measurable goal from the student’s latest baseline.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-300">Target time<input value={goalTime} onChange={(event) => setGoalTime(event.target.value)} placeholder="e.g. 10:30" className="input-field mt-1" /></label><label className="text-sm font-medium text-ink-300">Target date<input type="date" value={goalDate} onChange={(event) => setGoalDate(event.target.value)} className="input-field mt-1" /></label></div>
          {goalTime && goalDate && parseRunTime(goalTime) && <p className="rounded-xl bg-accent-500/10 p-3 text-sm text-ink-200">By <strong>{new Date(`${goalDate}T12:00:00`).toLocaleDateString()}</strong>, the student will improve cardiovascular endurance by completing the <strong>{stats.latest.session.distance_label}</strong> in <strong>{goalTime}</strong> or faster, from a baseline of <strong>{formatRunTime(stats.latest.finish_ms)}</strong>, as measured by the PlansK12 Run Tracker.</p>}
          <button onClick={saveGoal} disabled={savingGoal} className="btn-primary min-h-11">{savingGoal ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />} Save SMART goal</button>
          {!!goals.length && <div className="border-t border-ink-800 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Saved goals</p>{goals.map((goal) => <div key={goal.id} className="mb-2 rounded-lg border border-ink-800 p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p><strong>{goal.distance_label}</strong> · {formatRunTime(goal.baseline_ms)} → {formatRunTime(goal.target_ms)}</p><p className="mt-1 text-xs text-ink-500">Target {new Date(`${goal.target_date}T12:00:00`).toLocaleDateString()}</p></div><select value={goal.progress_status ?? (goal.status === 'achieved' ? 'achieved' : 'on_track')} onChange={(event) => changeGoalProgress(goal, event.target.value)} disabled={updatingGoalId === goal.id} aria-label={`Progress status for ${goal.distance_label} goal`} className="input-field max-w-40 py-2 text-xs"><option value="on_track">On track</option><option value="achieved">Achieved</option><option value="needs_support">Needs support</option><option value="paused">Paused</option></select></div></div>)}</div>}
        </div>
      </>}
    </section>}
  </div>
}
