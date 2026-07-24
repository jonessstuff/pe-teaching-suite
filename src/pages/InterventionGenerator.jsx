import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateIntervention } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import InterventionRenderer from '../components/renderers/InterventionRenderer'
import { useTrial } from '../context/TrialContext'

const DOMAINS = [
  { value: '', label: 'Auto-detect from concern' },
  { value: 'Reading', label: 'Reading (IDA / Structured Literacy)' },
  { value: 'Math', label: 'Math (NCTM / CRA)' },
  { value: 'Behavior', label: 'Behavior (positive behavior support)' },
]
const GRADE_BANDS = [
  { value: '', label: 'Not specified' },
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

export default function InterventionGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [concern, setConcern] = useState('')
  const [domain, setDomain] = useState('')
  const [gradeBand, setGradeBand] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const generated = await generateIntervention({ concern, domain, gradeBand })
      setResult(generated)

      if (generated?.title) {
        const saved = await createLesson(generated, { aiModel: 'claude-sonnet-4-6' })
        setSavedId(saved.id)
      }

      setView('result')
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setView('form')
    setResult(null)
    setSavedId(null)
    setError(null)
  }

  if (view === 'result' && result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            All modules
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            New concern
          </button>
          {savedId && (
            <Link to={`/lessons/${savedId}`} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              View in archive
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={async () => { if (await requestExport()) window.print() }}
            className="ml-auto btn-secondary"
          >
            Print
          </button>
        </div>

        {savedId && (
          <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your archive — a record of this intervention attempt.</p>
        )}

        <InterventionRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          All modules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-500/15">
            <Layers size={18} className="text-stone-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Intervention Planning</h1>
            <p className="text-xs text-ink-500">
              MTSS/RTI tiered intervention ideas · Reading, Math &amp; Behavior
            </p>
          </div>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-stone-500/30 bg-stone-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-stone-400" />
        <div className="text-sm">
          <p className="font-medium text-stone-200">Instructional intervention ideas only</p>
          <p className="mt-0.5 text-stone-300/90">
            Generates a tiered intervention with progress-monitoring suggestions from a described concern. It does <span className="font-medium">not</span> replace universal screening, determine tier placement or special-education eligibility, or serve as a documented RTI/MTSS compliance record. Use alongside your team&rsquo;s data and judgment. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-concern">Describe the specific concern</label>
            <textarea
              id="iv-concern"
              placeholder="e.g. Student scored moderate-risk on phonemic segmentation. / Struggles with regrouping in subtraction — succeeds with base-ten blocks but not on paper. / Leaves seat and calls out repeatedly during independent work."
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              required
              rows={4}
              className="input-field min-h-[110px]"
            />
            <p className="mt-1.5 text-xs text-ink-500">The more specific the concern (what you see, when, what helps), the more targeted the intervention.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-domain">Domain</label>
              <select id="iv-domain" value={domain} onChange={(e) => setDomain(e.target.value)} className="input-field">
                {DOMAINS.map(({ value, label }) => <option key={value || 'auto'} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-band">Grade band <span className="font-normal text-ink-500">(optional)</span></label>
              <select id="iv-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value || 'none'} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate intervention
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 20–40 seconds · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
