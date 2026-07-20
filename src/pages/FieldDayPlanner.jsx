import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Loader2, Trash2, Plus, ChevronDown, ChevronUp, Printer, Save } from 'lucide-react'
import { generateFieldDay } from '../services/generationService'
import { createPlan, listPlans, getPlan, updatePlan, deletePlan } from '../services/fieldDayService'
import { useTrial } from '../context/TrialContext'

const GRADES = [
  { label: 'K', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
  { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 },
  { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 },
]
const STATION_OPTIONS = [4, 6, 8, 10]
const SPACE_OPTIONS = ['Outdoor', 'Indoor', 'Both']

function StationCard({ station }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-ink-800 p-4 print:break-inside-avoid">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
            {station.number}
          </span>
          <p className="font-semibold text-ink-50">{station.name}</p>
        </div>
        <button type="button" onClick={() => setOpen(o => !o)} className="text-ink-600 hover:text-ink-200 print:hidden">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <div className={open ? 'mt-3 space-y-2' : 'hidden print:block mt-3 space-y-2'}>
        <p className="text-sm text-ink-700">{station.description}</p>
        <p className="text-sm text-ink-700"><span className="font-medium text-ink-500">Instructions: </span>{station.instructions}</p>
        {station.scoring && <p className="text-sm text-ink-700"><span className="font-medium text-ink-500">Scoring: </span>{station.scoring}</p>}
        {station.equipment?.length > 0 && (
          <p className="text-xs text-ink-600"><span className="font-medium">Equipment: </span>{station.equipment.join(', ')}</p>
        )}
      </div>
    </div>
  )
}

export default function FieldDayPlanner() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('list')
  const [plans, setPlans] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [status, setStatus] = useState('idle')
  const [planName, setPlanName] = useState('')
  const [fieldDay, setFieldDay] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')

  const [form, setForm] = useState({
    numStudents: 100, gradeLevels: [3, 4, 5], duration: 180,
    space: ['Outdoor'], numStations: 8, theme: '',
  })

  useEffect(() => {
    listPlans().then(setPlans).catch(e => setError(e.message))
  }, [])

  function toggleGrade(v) {
    setForm(f => ({ ...f, gradeLevels: f.gradeLevels.includes(v) ? f.gradeLevels.filter(g => g !== v) : [...f.gradeLevels, v] }))
  }
  function toggleSpace(s) {
    setForm(f => ({ ...f, space: f.space.includes(s) ? f.space.filter(x => x !== s) : [...f.space, s] }))
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setStatus('generating')
    setError(null)
    setFieldDay(null)
    try {
      const result = await generateFieldDay(form)
      setFieldDay(result.field_day)
      setStatus('done')
    } catch (err) {
      setError(err.message ?? 'Generation failed')
      setStatus('idle')
    }
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const saved = await createPlan({ name: planName || `Field Day ${new Date().toLocaleDateString()}`, planData: fieldDay })
      setPlans(prev => [{ id: saved.id, name: saved.name, created_at: saved.created_at }, ...(prev ?? [])])
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message)
      setSaveStatus('idle')
    }
  }

  async function openPlan(plan) {
    setLoadingDetail(true)
    try {
      const full = await getPlan(plan.id)
      setSelected({ ...plan, plan_data: full.plan_data })
      setView('detail')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!window.confirm('Delete this plan?')) return
    await deletePlan(id)
    setPlans(prev => prev.filter(p => p.id !== id))
    if (selected?.id === id) { setSelected(null); setView('list') }
  }

  if (view === 'detail' && selected) {
    const fd = selected.plan_data
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          <button type="button" onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200">
            <ArrowLeft size={14} /> My Plans
          </button>
          <span className="text-sm font-medium text-ink-200">{selected.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={async () => { if (await requestExport()) window.print() }} className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200">
              <Printer size={14} className="inline mr-1" />Print
            </button>
            <button type="button" onClick={e => handleDelete(selected.id, e)} className="text-ink-600 hover:text-red-400">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {fd && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-ink-50 print:text-black">{fd.theme || 'Field Day'}</h2>
              <p className="text-sm text-ink-400 print:text-gray-600">{fd.overview}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-500">
                <span>{fd.total_stations} stations</span>
                <span>·</span>
                <span>{fd.station_rotation_mins} min per station</span>
              </div>
            </div>
            {fd.schedule_of_events?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-ink-300 mb-3 uppercase tracking-wide">Schedule of Events</h3>
                <div className="space-y-1">
                  {fd.schedule_of_events.map((ev, i) => (
                    <div key={i} className="flex gap-4 text-sm">
                      <span className="w-24 flex-shrink-0 font-mono text-ink-500">{ev.time}</span>
                      <span className="text-ink-700">{ev.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="print:break-before-page">
              <h3 className="text-sm font-semibold text-ink-300 mb-3 uppercase tracking-wide">Stations</h3>
              <div className="space-y-3">
                {(fd.stations ?? []).map((station, i) => <StationCard key={i} station={station} />)}
              </div>
            </div>
            {fd.rotation_schedule && (
              <div>
                <h3 className="text-sm font-semibold text-ink-300 mb-2 uppercase tracking-wide">Rotation Schedule</h3>
                <p className="text-sm text-ink-700">{fd.rotation_schedule}</p>
              </div>
            )}
            {fd.volunteer_instructions && (
              <div className="print:break-inside-avoid">
                <h3 className="text-sm font-semibold text-ink-300 mb-2 uppercase tracking-wide">Volunteer Instructions</h3>
                <p className="text-sm text-ink-700">{fd.volunteer_instructions}</p>
              </div>
            )}
            {fd.materials_list?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-ink-300 mb-2 uppercase tracking-wide">Materials List</h3>
                <ul className="grid grid-cols-2 gap-1">
                  {fd.materials_list.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-ink-700">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fd.weather_contingency && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Weather Contingency</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">{fd.weather_contingency}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 mb-3">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
              <Trophy size={20} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-ink-50">Field Day Planner</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="card p-6 space-y-5 max-w-2xl">
        <h2 className="font-semibold text-ink-200">Generate a new plan</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1.5">Number of students</label>
            <input type="number" min={1} value={form.numStudents} onChange={e => setForm(f => ({ ...f, numStudents: Number(e.target.value) }))}
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1.5">Total duration (min)</label>
            <input type="number" min={30} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-green-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Grade levels</label>
          <div className="flex flex-wrap gap-2">
            {GRADES.map(g => (
              <button key={g.value} type="button" onClick={() => toggleGrade(g.value)}
                className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${form.gradeLevels.includes(g.value) ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-ink-700 text-ink-500 hover:border-ink-500'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">Number of stations</label>
            <div className="flex gap-2">
              {STATION_OPTIONS.map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, numStations: n }))}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${form.numStations === n ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-ink-700 text-ink-500 hover:border-ink-500'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">Space</label>
            <div className="flex gap-2">
              {SPACE_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpace(s)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${form.space.includes(s) ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-ink-700 text-ink-500 hover:border-ink-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-300 mb-1.5">Theme (optional)</label>
          <input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
            placeholder="e.g. Olympics, Carnival, Around the World…"
            className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-green-500" />
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={status === 'generating'}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-400 disabled:opacity-50 transition-colors">
          {status === 'generating' ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Trophy size={16} /> Generate field day plan</>}
        </button>
      </form>

      {/* Generated result */}
      {fieldDay && status === 'done' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-ink-50">{fieldDay.theme || 'Field Day Plan'}</h2>
            <div className="ml-auto flex items-center gap-2">
              <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Plan name (optional)"
                className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-1.5 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-green-500 w-48" />
              <button type="button" onClick={handleSave} disabled={saveStatus !== 'idle'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50 transition-colors">
                <Save size={14} /> {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
          <button type="button" onClick={() => { setSelected({ name: planName || 'Field Day', plan_data: fieldDay }); setView('detail') }}
            className="text-sm text-green-400 hover:text-green-300 underline underline-offset-2">
            View full plan →
          </button>
        </div>
      )}

      {/* Saved plans list */}
      {plans && plans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink-50">Saved plans</h2>
          {loadingDetail && <div className="flex items-center gap-2 text-ink-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <div key={plan.id} onClick={() => openPlan(plan)}
                className="card group flex flex-col gap-2 p-4 cursor-pointer hover:border-green-500/40 transition-colors">
                <div className="flex items-start justify-between">
                  <Trophy size={18} className="text-green-400 flex-shrink-0" />
                  <button type="button" onClick={e => handleDelete(plan.id, e)} className="text-ink-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="font-medium text-ink-50">{plan.name}</p>
                <p className="text-xs text-ink-600">{new Date(plan.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
