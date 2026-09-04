import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardList, ChevronLeft, ChevronRight, SlidersHorizontal, Loader2, Users2, X, Check } from 'lucide-react'
import { listPeriods } from '../services/classPeriodsService'
import { listStudentsByPeriod } from '../services/studentsService'
import { getConfig, saveConfig, listRecords, upsertRecord, upsertRecords } from '../services/participationService'
import { trackToolUsageOnce } from '../services/productUsageService'
import { summarize, dailyPoints, todayStr, addDays, weekRange } from '../lib/participationGrades'

const DEDUCTION_STYLES = {
  wrong_shoes: 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300',
  wrong_clothing: 'border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300',
  no_participation: 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300',
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function blankDeductions(config) {
  return Object.fromEntries((config?.deductions ?? []).map((d) => [d.key, false]))
}

function mostRecentWeekday(dateStr = todayStr()) {
  let value = dateStr
  while ([0, 6].includes(new Date(`${value}T00:00:00`).getDay())) value = addDays(value, -1)
  return value
}

export default function ParticipationTracker() {
  const [periods, setPeriods] = useState(null)
  const [periodId, setPeriodId] = useState(() => localStorage.getItem('pt.period') || '')
  const [students, setStudents] = useState(null)
  const [config, setConfig] = useState(null)
  const [records, setRecords] = useState([])
  const [date, setDate] = useState(() => mostRecentWeekday())
  const [view, setView] = useState('record')
  const [configOpen, setConfigOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [justSaved, setJustSaved] = useState(() => new Set())
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    Promise.all([listPeriods(), getConfig()])
      .then(([ps, cfg]) => {
        setPeriods(ps); setConfig(cfg)
        setPeriodId((cur) => cur && ps.some((p) => p.id === cur) ? cur : (ps[0]?.id || ''))
      })
      .catch((e) => setNotice({ type: 'error', msg: e.message ?? 'Could not load. Apply migration 0043 first.' }))
  }, [])

  const { from, to } = useMemo(() => weekRange(date), [date])
  useEffect(() => {
    if (!periodId) return
    localStorage.setItem('pt.period', periodId)
    Promise.all([listStudentsByPeriod(periodId), listRecords(periodId, { from, to })])
      .then(([st, recs]) => { setStudents(st); setRecords(recs) })
      .catch((e) => setNotice({ type: 'error', msg: e.message ?? 'Could not load roster.' }))
  }, [periodId, from, to])

  const recordFor = (studentId) => records.find((r) => r.student_id === studentId && r.date === date)
  const recordedCount = (students ?? []).filter((s) => recordFor(s.id)).length
  const unrecordedCount = (students ?? []).length - recordedCount

  function flashSaved(studentId) {
    setJustSaved((s) => new Set(s).add(studentId))
    setTimeout(() => setJustSaved((s) => { const n = new Set(s); n.delete(studentId); return n }), 1600)
  }

  async function saveStudent(studentId, nextDeductions, exemptReason = null) {
    const prev = records
    const points = exemptReason ? 0 : dailyPoints(nextDeductions, config)
    const optimistic = {
      student_id: studentId, date, class_period_id: periodId, status: exemptReason || 'deductions',
      deductions: nextDeductions, points, exempt: Boolean(exemptReason), exempt_reason: exemptReason,
    }
    setRecords((rs) => [...rs.filter((r) => !(r.student_id === studentId && r.date === date)), optimistic])
    try {
      await upsertRecord({ classPeriodId: periodId, studentId, date, deductions: nextDeductions, points, exemptReason })
      flashSaved(studentId)
      trackToolUsageOnce('participation', 'updated', { moduleLabel: 'PE & Health', metadata: { source: 'daily-grades' } })
    } catch (err) {
      setRecords(prev)
      setNotice({ type: 'error', msg: err?.message ? `Couldn't save: ${err.message}` : `Couldn't save — tap again.` })
    }
  }

  function toggleDeduction(studentId, key) {
    const rec = recordFor(studentId)
    const current = rec?.status === 'deductions' ? (rec.deductions ?? blankDeductions(config)) : blankDeductions(config)
    saveStudent(studentId, { ...current, [key]: !current[key] }, null)
  }

  function toggleExempt(studentId, reason) {
    const rec = recordFor(studentId)
    const nextReason = rec?.exempt_reason === reason ? null : reason
    saveStudent(studentId, blankDeductions(config), nextReason)
  }

  async function markAll100() {
    if (!config || !students) return
    const missing = students.filter((s) => !recordFor(s.id))
    if (!missing.length) return
    const deductions = blankDeductions(config)
    const rows = missing.map((s) => ({ classPeriodId: periodId, studentId: s.id, date, deductions, points: config.max_points }))
    const optimistic = missing.map((s) => ({
      student_id: s.id, date, class_period_id: periodId, status: 'deductions', deductions,
      points: config.max_points, exempt: false, exempt_reason: null,
    }))
    const prev = records; setRecords((rs) => [...rs, ...optimistic]); setMarkingAll(true)
    try {
      await upsertRecords(rows); setJustSaved(new Set(missing.map((s) => s.id)))
      trackToolUsageOnce('participation', 'completed', { moduleLabel: 'PE & Health', metadata: { source: 'mark-all' } })
      setTimeout(() => setJustSaved(new Set()), 1600)
    } catch (err) {
      setRecords(prev)
      setNotice({ type: 'error', msg: err?.message ? `Couldn't mark all 100: ${err.message}` : `Couldn't mark all 100.` })
    } finally { setMarkingAll(false) }
  }

  async function handleSaveConfig(next) { setConfig(await saveConfig(next)); trackToolUsageOnce('participation', 'updated', { moduleLabel: 'PE & Health', metadata: { source: 'scoring-config' } }) }
  const selectedPeriod = (periods ?? []).find((p) => p.id === periodId)
  const selectedDay = new Date(`${date}T00:00:00`).getDay()
  const isWeekendDate = selectedDay === 0 || selectedDay === 6

  if (periods == null || config == null) return <div className="flex items-center gap-2 text-ink-400"><Loader2 size={18} className="animate-spin" /> Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15"><ClipboardList size={20} className="text-accent-500" /></div>
          <div><h1 className="text-2xl font-semibold text-ink-50">Participation</h1><p className="text-xs text-ink-500">Start at 100, record deductions, and average graded meetings for the week.</p></div>
        </div>
        <div className="flex items-center gap-2">
          {periods.length > 0 && <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="rounded-lg border border-ink-700 bg-white px-3 py-2 text-sm text-ink-100 dark:bg-ink-800">{periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>}
          <button onClick={() => setConfigOpen(true)} className="btn-secondary" title="Daily scoring setup"><SlidersHorizontal size={16} /> Scoring</button>
        </div>
      </div>

      {notice && <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${notice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'}`}>{notice.msg}</p>}
      {periods.length === 0 && <div className="card p-6 text-sm text-ink-300">You haven't set up any class periods yet. <Link to="/schedule" className="text-accent-600 underline">Set up a class period</Link> first.</div>}

      {selectedPeriod && <>
        <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink-900 bg-white/90 px-6 py-3 backdrop-blur dark:bg-ink-950/90 md:-mx-10 md:px-10">
          <div className="flex items-center gap-1">
            <button onClick={() => setDate((d) => addDays(d, -1))} className="btn-secondary h-10 w-10 !px-0" aria-label="Previous day"><ChevronLeft size={18} /></button>
            <span className="min-w-[8.5rem] text-center text-sm font-semibold text-ink-100">{fmtDate(date)}{date === todayStr() ? ' · Today' : ''}</span>
            <button onClick={() => setDate((d) => addDays(d, 1))} disabled={date >= todayStr()} className="btn-secondary h-10 w-10 !px-0 disabled:opacity-40" aria-label="Next day"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-3">
            {view === 'record' && students && <span className="text-sm text-ink-500">{recordedCount}/{students.length} recorded</span>}
            <div className="flex rounded-lg border border-ink-800 p-0.5">
              <button onClick={() => setView('record')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'record' ? 'bg-accent-500/15 text-accent-700 dark:text-accent-400' : 'text-ink-400'}`}>Record</button>
              <button onClick={() => setView('week')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'week' ? 'bg-accent-500/15 text-accent-700 dark:text-accent-400' : 'text-ink-400'}`}>Weekly grades</button>
            </div>
          </div>
        </div>

        {isWeekendDate && view === 'record' && <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><CalendarDays size={20} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="font-semibold text-ink-100">Weekend selected</p><p className="text-sm text-ink-500">Choose the most recent class day, or continue only if this was a weekend or make-up class.</p></div></div>
          <button type="button" onClick={() => setDate(mostRecentWeekday(date))} className="btn-secondary shrink-0">Use previous weekday</button>
        </div>}

        {students && !students.length && <div className="card p-6 text-sm text-ink-300">No students in <span className="font-medium text-ink-100">{selectedPeriod.label}</span> yet. <Link to="/students" className="text-accent-600 underline"><Users2 size={14} className="inline" /> Add students</Link> to start recording.</div>}

        {view === 'record' && students?.length > 0 && <div className="space-y-3">
          {unrecordedCount > 0 && <button onClick={markAll100} disabled={markingAll} className="btn-primary w-full sm:w-auto">{markingAll ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Mark unrecorded 100 ({unrecordedCount})</button>}
          <p className="text-xs text-ink-500">Mark everyone 100, then tap every deduction that applies. Deductions combine; Absent and Medical are exempt. Everything saves automatically.</p>
          <div className="space-y-2.5">{students.map((s) => {
            const rec = recordFor(s.id)
            const activeDeductions = rec?.status === 'deductions' ? (rec.deductions ?? {}) : {}
            const legacy = rec && rec.status !== 'deductions' && !rec.exempt
            return <div key={s.id} className="rounded-xl border border-ink-800 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-ink-100">{s.name_or_initials}</span>
                <div className="flex items-center gap-2">
                  {justSaved.has(s.id) && <span className="flex items-center gap-1 text-xs font-semibold text-green-500"><Check size={14} /> Saved</span>}
                  {rec ? <span className={`rounded-md px-2 py-1 text-sm font-bold ${rec.exempt ? 'bg-sky-500/15 text-sky-600' : 'bg-green-500/15 text-green-700 dark:text-green-300'}`}>{rec.exempt ? 'Exempt' : Number(rec.points)}</span> : <span className="text-xs text-ink-600">not recorded</span>}
                </div>
              </div>
              {legacy && <p className="mb-2 text-xs text-amber-600">Previous score preserved. Tapping a deduction converts this day to the new 100-point rubric.</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {config.deductions.map((d) => <button key={d.key} onClick={() => toggleDeduction(s.id, d.key)} disabled={rec?.exempt}
                  aria-pressed={Boolean(activeDeductions[d.key])}
                  className={`min-h-[46px] rounded-lg border px-2 py-2 text-sm font-semibold leading-tight disabled:opacity-40 ${activeDeductions[d.key] ? DEDUCTION_STYLES[d.key] : 'border-ink-800 text-ink-400 hover:bg-ink-900/5'}`}>{d.label} −{d.points}</button>)}
                {['absent', 'medical'].map((reason) => <button key={reason} onClick={() => toggleExempt(s.id, reason)} aria-pressed={rec?.exempt_reason === reason}
                  className={`min-h-[46px] rounded-lg border px-2 py-2 text-sm font-semibold capitalize ${rec?.exempt_reason === reason ? 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300' : 'border-ink-800 text-ink-400'}`}>{reason}</button>)}
              </div>
            </div>
          })}</div>
        </div>}

        {view === 'week' && students?.length > 0 && <div className="space-y-2">
          <p className="text-xs text-ink-500">Week of {fmtDate(from)} – {fmtDate(to)} · daily scores averaged across graded meetings; exempt and unrecorded days excluded.</p>
          {students.map((s) => { const sum = summarize(records.filter((r) => r.student_id === s.id), config.max_points); return <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 px-4 py-3"><span className="text-base font-medium text-ink-100">{s.name_or_initials}</span><div className="flex items-center gap-3 text-sm"><span className="text-ink-500">{sum.earned}/{sum.possible} · {sum.meetings} graded{sum.exemptCount ? ` · ${sum.exemptCount} exempt` : ''}</span><span className="min-w-[3rem] text-right text-lg font-bold text-ink-50">{sum.percent == null ? '—' : `${sum.percent}%`}</span></div></div> })}
        </div>}
      </>}
      {configOpen && <ConfigModal config={config} onClose={() => setConfigOpen(false)} onSave={handleSaveConfig} />}
    </div>
  )
}

function ConfigModal({ config, onClose, onSave }) {
  const [deductions, setDeductions] = useState(config.deductions)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const setField = (i, field, val) => setDeductions((items) => items.map((item, j) => j === i ? { ...item, [field]: val } : item))
  async function save() {
    setSaving(true); setErr(null)
    try { await onSave({ deductions: deductions.map((d) => ({ ...d, points: Number(d.points) || 0 })), max_points: 100 }); onClose() }
    catch (e) { setErr(e?.message ?? 'Could not save.'); setSaving(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-md rounded-xl2 border border-ink-800 bg-white p-6 shadow-lg dark:bg-ink-900">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-ink-50">Daily scoring setup</h3><button onClick={onClose} aria-label="Close" className="text-ink-500 hover:text-ink-200"><X size={18} /></button></div>
      <p className="mt-3 text-sm text-ink-300">Every recorded student starts at <strong>100</strong>. Select every deduction that applies; Absent and Medical remain exempt.</p>
      <div className="mt-4 space-y-2"><div className="grid grid-cols-[1fr_6rem] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500"><span>Deduction</span><span>Points lost</span></div>
        {deductions.map((d, i) => <div key={d.key} className="grid grid-cols-[1fr_6rem] gap-2"><input value={d.label} onChange={(e) => setField(i, 'label', e.target.value)} className="rounded-lg border border-ink-700 bg-white px-2.5 py-2 text-sm text-ink-100 dark:bg-ink-800" /><input type="number" min="0" max="100" value={d.points} onChange={(e) => setField(i, 'points', e.target.value)} className="rounded-lg border border-ink-700 bg-white px-2.5 py-2 text-sm text-ink-100 dark:bg-ink-800" /></div>)}
      </div>
      <p className="mt-3 rounded-lg bg-ink-900/5 p-3 text-sm text-ink-400">All three defaults selected: 100 − 5 − 5 − 50 = <strong>40</strong>.</p>
      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      <div className="mt-5 flex gap-2"><button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save</button><button onClick={onClose} className="btn-secondary">Cancel</button></div>
    </div>
  </div>
}
