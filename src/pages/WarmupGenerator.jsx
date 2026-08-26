import { useState, useRef } from 'react'
import { PLANNING_SUBJECTS } from '../constants/toolSubjects'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame, Loader2, Printer, BookMarked, Copy, Check } from 'lucide-react'
import { generateWarmup } from '../services/generationService'
import { createAssessment } from '../services/assessmentService'
import { useTrial } from '../context/TrialContext'
import { WATERMARK_TEXT } from '../services/trialService'
import { printArtifact } from '../lib/printArtifact'
import WarmupRenderer from '../components/renderers/WarmupRenderer'

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
  const { requestExport, isPaid } = useTrial()
  const [subject, setSubject] = useState('PE & Health')
  const [grades, setGrades] = useState([5])
  const [duration, setDuration] = useState(5)
  const [equipment, setEquipment] = useState('')
  const [warmups, setWarmups] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const printRef = useRef(null)

  const gradeLabel = [...grades].sort((a, b) => a - b).map(g => (g === 0 ? 'K' : g)).join(', ')
  const heading = `Warm-up options — ${subject}, Grade${grades.length > 1 ? 's' : ''} ${gradeLabel}`

  function toggleGrade(v) {
    setGrades(gs => gs.includes(v) ? gs.filter(x => x !== v) : [...gs, v])
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (grades.length === 0) { setError('Pick at least one grade.'); return }
    setStatus('generating')
    setError(null)
    setWarmups(null)
    setSaved(false)
    try {
      const result = await generateWarmup({ subject, gradeBand: grades, duration, equipment: equipment.trim() })
      setWarmups(result.warmup_options)
      setStatus('done')
    } catch (err) {
      setError(err.message ?? 'Generation failed')
      setStatus('idle')
    }
  }

  async function handlePrint() {
    if (await requestExport()) {
      if (printArtifact(printRef.current, isPaid ? null : WATERMARK_TEXT) === false)
        setError('Your browser blocked the print window. Allow pop-ups for this site and try again.')
    }
  }

  async function handleSave() {
    try {
      await createAssessment({
        title: heading.replace('Warm-up options — ', ''),
        subject,
        gradeBands: grades,
        assessmentType: 'warmup',
        content: warmups,
      })
      setSaved(true)
    } catch (err) { setError(err.message) }
  }

  function handleCopyAll() {
    const text = (warmups ?? []).map(w =>
      `${w.title} (${w.duration_mins} min)\n${w.description}${w.equipment_needed?.length ? `\nEquipment: ${w.equipment_needed.join(', ')}` : ''}`
    ).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
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

        {/* Grade — multi-select (pick one grade or a range) */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Grade(s) <span className="text-ink-600 font-normal">— pick one or several for a range</span></label>
          <div className="flex flex-wrap gap-2">
            {GRADES.map(g => (
              <button key={g.value} type="button" onClick={() => toggleGrade(g.value)}
                className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${grades.includes(g.value) ? 'border-orange-500 bg-orange-500/15 text-orange-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
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
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button type="button" onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              <Printer size={14} /> Print
            </button>
            {saved ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-green-400"><Check size={14} /> Saved to Assessment Bank</span>
            ) : (
              <button type="button" onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
                <BookMarked size={14} /> Save to Assessment Bank
              </button>
            )}
            <button type="button" onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              {copiedAll ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copiedAll ? 'Copied!' : 'Copy all'}
            </button>
          </div>
          <div ref={printRef}>
            <WarmupRenderer warmups={warmups} heading={heading} />
          </div>
        </div>
      )}
    </div>
  )
}
