import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ChevronLeft, ChevronRight, SlidersHorizontal, Loader2, Users2, X, Check } from 'lucide-react'
import { listPeriods } from '../services/classPeriodsService'
import { listStudentsByPeriod } from '../services/studentsService'
import { getConfig, saveConfig, listRecords, upsertRecord } from '../services/participationService'
import { summarize, todayStr, addDays, weekRange } from '../lib/participationGrades'

// Literal Tailwind classes per status color (JIT-safe). Unknown keys → slate.
const STATUS_STYLES = {
  green: { active: 'bg-green-500 text-white', idle: 'text-green-600 dark:text-green-400 hover:bg-green-500/10' },
  lime: { active: 'bg-lime-500 text-white', idle: 'text-lime-700 dark:text-lime-400 hover:bg-lime-500/10' },
  amber: { active: 'bg-amber-500 text-white', idle: 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10' },
  red: { active: 'bg-red-500 text-white', idle: 'text-red-600 dark:text-red-400 hover:bg-red-500/10' },
  zinc: { active: 'bg-zinc-500 text-white', idle: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/10' },
  sky: { active: 'bg-sky-500 text-white', idle: 'text-sky-700 dark:text-sky-400 hover:bg-sky-500/10' },
  slate: { active: 'bg-slate-500 text-white', idle: 'text-slate-600 dark:text-slate-400 hover:bg-slate-500/10' },
}
const KEY_COLOR = { full: 'green', partial: 'lime', no_dress: 'amber', none: 'red', absent: 'zinc', medical: 'sky' }
const styleFor = (key) => STATUS_STYLES[KEY_COLOR[key]] ?? STATUS_STYLES.slate

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function ParticipationTracker() {
  const [periods, setPeriods] = useState(null)
  const [periodId, setPeriodId] = useState(() => localStorage.getItem('pt.period') || '')
  const [students, setStudents] = useState(null)
  const [config, setConfig] = useState(null)
  const [records, setRecords] = useState([]) // current week's records for this period
  const [date, setDate] = useState(todayStr())
  const [view, setView] = useState('record') // 'record' | 'week'
  const [configOpen, setConfigOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [loadingRoster, setLoadingRoster] = useState(false)

  // Initial load: periods + config.
  useEffect(() => {
    Promise.all([listPeriods(), getConfig()])
      .then(([ps, cfg]) => {
        setPeriods(ps)
        setConfig(cfg)
        setPeriodId((cur) => cur && ps.some((p) => p.id === cur) ? cur : (ps[0]?.id || ''))
      })
      .catch((e) => setNotice({ type: 'error', msg: e.message ?? 'Could not load. If this is the first run, apply migration 0042.' }))
  }, [])

  // Roster + week records whenever the period or week changes.
  const { from, to } = useMemo(() => weekRange(date), [date])
  useEffect(() => {
    if (!periodId) { setStudents(null); setRecords([]); return }
    localStorage.setItem('pt.period', periodId)
    setLoadingRoster(true)
    Promise.all([listStudentsByPeriod(periodId), listRecords(periodId, { from, to })])
      .then(([st, recs]) => { setStudents(st); setRecords(recs) })
      .catch((e) => setNotice({ type: 'error', msg: e.message ?? 'Could not load roster.' }))
      .finally(() => setLoadingRoster(false))
  }, [periodId, from, to])

  const recordFor = (studentId) => records.find((r) => r.student_id === studentId && r.date === date)
  const recordedCount = (students ?? []).filter((s) => recordFor(s.id)).length

  async function record(studentId, st) {
    if (!config) return
    const prev = records
    const optimistic = { student_id: studentId, date, class_period_id: periodId, status: st.key, points: st.points, exempt: st.exempt }
    setRecords((rs) => [...rs.filter((r) => !(r.student_id === studentId && r.date === date)), optimistic])
    try {
      await upsertRecord({ classPeriodId: periodId, studentId, date, status: st.key, points: st.points, exempt: st.exempt })
    } catch {
      setRecords(prev)
      setNotice({ type: 'error', msg: `Couldn't save — tap again.` })
    }
  }

  async function handleSaveConfig(next) {
    const saved = await saveConfig(next)
    setConfig(saved)
  }

  const selectedPeriod = (periods ?? []).find((p) => p.id === periodId)

  if (periods == null || config == null) {
    return <div className="flex items-center gap-2 text-ink-400"><Loader2 size={18} className="animate-spin" /> Loading…</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15"><ClipboardList size={20} className="text-accent-500" /></div>
          <h1 className="text-2xl font-semibold text-ink-50">Participation</h1>
        </div>
        <div className="flex items-center gap-2">
          {periods.length > 0 && (
            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}
              className="rounded-lg border border-ink-700 bg-white px-3 py-2 text-sm text-ink-100 dark:bg-ink-800">
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          )}
          <button onClick={() => setConfigOpen(true)} className="btn-secondary" title="Points & exempt scheme">
            <SlidersHorizontal size={16} /> Points
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${notice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'}`}>
          {notice.msg}
        </p>
      )}

      {periods.length === 0 && (
        <div className="card p-6 text-sm text-ink-300">
          You haven't set up any class periods yet. <Link to="/schedule" className="text-accent-600 dark:text-accent-400 underline">Set up a class period</Link> first.
        </div>
      )}

      {selectedPeriod && (
        <>
          {/* Date + view + counter bar */}
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
                <button onClick={() => setView('week')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'week' ? 'bg-accent-500/15 text-accent-700 dark:text-accent-400' : 'text-ink-400'}`}>This week</button>
              </div>
            </div>
          </div>

          {loadingRoster && <div className="flex items-center gap-2 text-ink-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading roster…</div>}

          {students && students.length === 0 && !loadingRoster && (
            <div className="card p-6 text-sm text-ink-300">
              No students in <span className="font-medium text-ink-100">{selectedPeriod.label}</span> yet.{' '}
              <Link to="/students" className="text-accent-600 dark:text-accent-400 underline"><Users2 size={14} className="inline" /> Add students</Link> to start recording.
            </div>
          )}

          {/* RECORD view */}
          {view === 'record' && students && students.length > 0 && (
            <div className="space-y-2.5">
              {students.map((s) => {
                const rec = recordFor(s.id)
                return (
                  <div key={s.id} className="rounded-xl border border-ink-800 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-base font-semibold text-ink-100">{s.name_or_initials}</span>
                      {rec ? <Check size={16} className="text-green-500" /> : <span className="text-xs text-ink-600">not recorded</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {config.statuses.map((st) => {
                        const active = rec?.status === st.key
                        const c = styleFor(st.key)
                        return (
                          <button key={st.key} onClick={() => record(s.id, st)}
                            className={`min-h-[46px] rounded-lg px-2 py-2 text-sm font-semibold leading-tight transition-colors ${active ? c.active + ' shadow-sm' : 'border border-ink-800 ' + c.idle}`}>
                            {st.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* WEEK view */}
          {view === 'week' && students && students.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-ink-500">Week of {fmtDate(from)} – {fmtDate(to)} · graded on the {config.max_points}-pt scale, exempt days excluded.</p>
              {students.map((s) => {
                const sum = summarize(records.filter((r) => r.student_id === s.id), config.max_points)
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 px-4 py-3">
                    <span className="text-base font-medium text-ink-100">{s.name_or_initials}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-ink-500">{sum.earned}/{sum.possible} · {sum.meetings} mtg{sum.exemptCount ? ` · ${sum.exemptCount} exempt` : ''}</span>
                      <span className="min-w-[3rem] text-right text-lg font-bold text-ink-50">{sum.percent == null ? '—' : `${sum.percent}%`}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {configOpen && <ConfigModal config={config} onClose={() => setConfigOpen(false)} onSave={handleSaveConfig} />}
    </div>
  )
}

// ── Points / exempt scheme editor ────────────────────────────────────────────
function ConfigModal({ config, onClose, onSave }) {
  const [statuses, setStatuses] = useState(config.statuses)
  const [maxPoints, setMaxPoints] = useState(config.max_points)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const setField = (i, field, val) => setStatuses((s) => s.map((st, j) => (j === i ? { ...st, [field]: val } : st)))

  async function save() {
    setSaving(true); setErr(null)
    try {
      await onSave({ statuses: statuses.map((s) => ({ ...s, points: Number(s.points) || 0 })), max_points: Number(maxPoints) || 0 })
      onClose()
    } catch (e) { setErr(e?.message ?? 'Could not save.'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl2 border border-ink-800 bg-white p-6 shadow-lg dark:bg-ink-900">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-50">Points &amp; exempt scheme</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200"><X size={18} /></button>
        </div>

        <label className="mt-4 block text-sm font-medium text-ink-300">Full-participation points (the denominator per meeting)</label>
        <input type="number" min={1} value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)}
          className="mt-1 w-28 rounded-lg border border-ink-700 bg-white px-3 py-2 text-sm text-ink-100 dark:bg-ink-800" />

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <span>Status</span><span>Points</span><span>Exempt</span>
          </div>
          {statuses.map((st, i) => (
            <div key={st.key} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2">
              <input value={st.label} onChange={(e) => setField(i, 'label', e.target.value)}
                className="rounded-lg border border-ink-700 bg-white px-2.5 py-2 text-sm text-ink-100 dark:bg-ink-800" />
              <input type="number" value={st.points} disabled={st.exempt} onChange={(e) => setField(i, 'points', e.target.value)}
                className="rounded-lg border border-ink-700 bg-white px-2.5 py-2 text-sm text-ink-100 disabled:opacity-40 dark:bg-ink-800" />
              <button type="button" onClick={() => setField(i, 'exempt', !st.exempt)} aria-pressed={st.exempt}
                className={`flex h-9 items-center justify-center rounded-lg text-sm font-semibold ${st.exempt ? 'bg-accent-500/15 text-accent-700 dark:text-accent-400' : 'border border-ink-800 text-ink-500'}`}>
                {st.exempt ? 'Exempt' : '—'}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500">Exempt statuses (e.g. Absent, Medical) don't count for or against the grade. Others count toward the denominator.</p>

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}
