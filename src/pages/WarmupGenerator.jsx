import { useState } from 'react'
import { PLANNING_SUBJECTS } from '../constants/toolSubjects'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame, Loader2, Copy, Check } from 'lucide-react'
import { generateWarmup } from '../services/generationService'

const SUBJECTS = PLANNING_SUBJECTS
const GRADES = [
  { label: 'K', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
  { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 },
  { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 },
  { label: '9', value: 9 }, { label: '10', value: 10 }, { label: '11', value: 11 },
  { label: '12', value: 12 },
]
const DURATIONS = [3, 5, 10]

export default function WarmupGenerator() {
  const [subject, setSubject] = useState('PE & Health')
  const [gradeBand, setGradeBand] = useState(5)
  const [duration, setDuration] = useState(5)
  const [equipment, setEquipment] = useState('')
  const [warmups, setWarmups] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setStatus('generating')
    setError(null)
    setWarmups(null)
    try {
      const result = await generateWarmup({ subject, gradeBand, duration, equipment: equipment.trim() })
      setWarmups(result.warmup_options)
      setStatus('done')
    } catch (err) {
      setError(err.message ?? 'Generation failed')
      setStatus('idle')
    }
  }

  function copyWarmup(w, idx) {
    const text = `${w.title} (${w.duration_mins} min)\n\n${w.description}${w.equipment_needed?.length ? `\n\nEquipment: ${w.equipment_needed.join(', ')}` : ''}`
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Warm-up / Bell-ringer</h1>
            <p className="text-sm text-ink-500">Quick, independent warm-ups students can start on their own — while you take attendance</p>
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
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${subject === s ? 'border-orange-500 bg-orange-500/15 text-orange-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
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
                className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${gradeBand === g.value ? 'border-orange-500 bg-orange-500/15 text-orange-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Warm-up length</label>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button key={d} type="button" onClick={() => setDuration(d)}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${duration === d ? 'border-orange-500 bg-orange-500/15 text-orange-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Equipment available <span className="text-ink-600 font-normal">(optional)</span></label>
          <input
            value={equipment}
            onChange={e => setEquipment(e.target.value)}
            placeholder="e.g. cones, whistle, bean bags — or leave blank for no-equipment warm-ups"
            className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-orange-500"
          />
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={status === 'generating'}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-400 disabled:opacity-50 transition-colors">
          {status === 'generating' ? <><Loader2 size={16} className="animate-spin" /> Generating warm-ups…</> : <><Flame size={16} /> Generate warm-ups</>}
        </button>
      </form>

      {/* Results */}
      {warmups && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink-50">Warm-up options — {subject}, Grade {gradeBand === 0 ? 'K' : gradeBand}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {warmups.map((w, i) => (
              <div key={i} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-50 leading-snug">{w.title}</p>
                    <span className="shrink-0 text-xs text-ink-500">{w.duration_mins} min</span>
                  </div>
                  <button type="button" onClick={() => copyWarmup(w, i)}
                    className="flex-shrink-0 text-ink-600 hover:text-ink-200 transition-colors">
                    {copiedIdx === i ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed">{w.description}</p>
                {w.equipment_needed?.length > 0 && (
                  <p className="text-xs text-ink-600 border-t border-ink-800 pt-2">Equipment: {w.equipment_needed.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
