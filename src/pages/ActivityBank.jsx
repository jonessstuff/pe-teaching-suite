import { useState } from 'react'
import { PLANNING_SUBJECTS } from '../constants/toolSubjects'
import { Link } from 'react-router-dom'
import { ArrowLeft, PartyPopper, Loader2, Copy, Check } from 'lucide-react'
import { generateActivityBank } from '../services/generationService'

const SUBJECTS = PLANNING_SUBJECTS
const GRADES = [
  { label: 'K', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
  { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 },
  { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 },
  { label: '9', value: 9 }, { label: '10', value: 10 }, { label: '11', value: 11 },
  { label: '12', value: 12 },
]
const DURATIONS = [15, 30, 45, 60]
const OCCASIONS = [
  'Before holiday break', 'Emergency sub day', 'Rainy day (indoor)',
  'Early release', 'Testing week filler', 'Free choice day',
]

export default function ActivityBank() {
  const [subject, setSubject] = useState('PE & Health')
  const [gradeBand, setGradeBand] = useState(5)
  const [duration, setDuration] = useState(30)
  const [occasion, setOccasion] = useState('Emergency sub day')
  const [activities, setActivities] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setStatus('generating')
    setError(null)
    setActivities(null)
    try {
      const result = await generateActivityBank({ subject, gradeBand, duration, occasion })
      setActivities(result.activities)
      setStatus('done')
    } catch (err) {
      setError(err.message ?? 'Generation failed')
      setStatus('idle')
    }
  }

  function copyActivity(activity, idx) {
    const text = `${activity.title}\n\nEquipment: ${(activity.equipment ?? []).join(', ') || 'None'}\nSetup: ~${activity.setup_mins} min\n\n${activity.description}\n\nVariations: ${activity.variations}`
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15">
            <PartyPopper size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Activity Bank</h1>
            <p className="text-sm text-ink-500">Low-prep, high-engagement activities any sub can run</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5 max-w-2xl">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Subject</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map(s => (
              <button key={s} type="button" onClick={() => setSubject(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${subject === s ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Grade</label>
          <div className="flex flex-wrap gap-2">
            {GRADES.map(g => (
              <button key={g.value} type="button" onClick={() => setGradeBand(g.value)}
                className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${gradeBand === g.value ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Activity duration</label>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button key={d} type="button" onClick={() => setDuration(d)}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${duration === d ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map(o => (
              <button key={o} type="button" onClick={() => setOccasion(o)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${occasion === o ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={status === 'generating'}
          className="flex items-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-white hover:bg-yellow-400 disabled:opacity-50 transition-colors">
          {status === 'generating' ? <><Loader2 size={16} className="animate-spin" /> Generating activities…</> : <><PartyPopper size={16} /> Generate 5 activities</>}
        </button>
      </form>

      {/* Results */}
      {activities && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink-50">5 Activities — {occasion}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity, i) => (
              <div key={i} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink-50 leading-snug">{activity.title}</p>
                  <button type="button" onClick={() => copyActivity(activity, i)}
                    className="flex-shrink-0 text-ink-600 hover:text-ink-200 transition-colors">
                    {copiedIdx === i ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(activity.equipment ?? []).length > 0 && (
                    <span className="rounded bg-ink-200/40 px-2 py-0.5 text-ink-500">
                      {activity.equipment.join(', ')}
                    </span>
                  )}
                  {activity.equipment?.length === 0 && (
                    <span className="rounded bg-ink-200/40 px-2 py-0.5 text-ink-500">No equipment</span>
                  )}
                  <span className="rounded bg-ink-200/40 px-2 py-0.5 text-ink-500">
                    Setup: ~{activity.setup_mins} min
                  </span>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed">{activity.description}</p>
                {activity.variations && (
                  <p className="text-xs text-ink-600 italic border-t border-ink-800 pt-2">{activity.variations}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
