import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Hand, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateOt } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import OtRenderer from '../components/renderers/OtRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const AREAS = [
  { value: 'fine_motor', label: 'Fine motor & handwriting readiness' },
  { value: 'sensory', label: 'Sensory processing & self-regulation' },
  { value: 'adls', label: 'Activities of daily living (ADLs)' },
  { value: 'visual_motor', label: 'Visual-motor & visual-perceptual' },
  { value: 'vocational', label: 'Vocational & independent-living (secondary)' },
]

const FOCUS_PLACEHOLDERS = {
  fine_motor: 'e.g. Tripod pencil grasp, Scissor skills on curved lines, Hand strengthening, In-hand manipulation',
  sensory: 'e.g. Calming heavy-work before writing, Recognizing my “engine” level, Sensory-friendly seating options',
  adls: 'e.g. Managing a zipper/buttons, Organizing a backpack & materials, Utensil use at lunch',
  visual_motor: 'e.g. Copying from the board, Letter formation & spacing, Visual scanning on a worksheet',
  vocational: 'e.g. Sorting/assembly fine-motor task, Managing a task checklist, Organizing a workspace',
}

export default function OtGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [gradeBand, setGradeBand] = useState('3-5')
  const [contentArea, setContentArea] = useState('fine_motor')
  const [focus, setFocus] = useState('')
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(30)
  const [teacherNotes, setTeacherNotes] = useState('')

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
      const input = { gradeBand, contentArea, focus, sessionLengthMinutes, teacherNotes }
      const generated = await generateOt(input)
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
          <Link to="/ot" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Occupational Therapists
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            Start over
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
          <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your lesson archive.</p>
        )}

        <LessonPrintFix lesson={result} />
        <OtRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/ot" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Occupational Therapists
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-periwinkle-500/15">
            <Hand size={18} className="text-periwinkle-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Occupational Therapists</h1>
            <p className="text-xs text-ink-500">
              School-based OT activity ideas · OTPF-4 / AOTA-aligned · fine motor, sensory, ADLs, visual-motor &amp; vocational
            </p>
          </div>
        </div>
      </div>

      {/* Clinical-boundary notice (always) */}
      <div className="flex items-start gap-3 rounded-lg border border-periwinkle-500/30 bg-periwinkle-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-periwinkle-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Activity ideas, not clinical protocol</p>
          <p className="mt-0.5 text-ink-300">
            OT is a licensed clinical profession. This tool supports activity planning only — it does <span className="font-medium">not</span> diagnose, evaluate, determine eligibility, or replace clinical judgment. Treat every output as activities to adapt to your caseload and treatment plan. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Service area &amp; grade band</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ot-band">Grade band</label>
              <select id="ot-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ot-area">Service area</label>
              <select id="ot-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
                {AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ot-focus">
              Specific target / focus <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="ot-focus"
              type="text"
              placeholder={FOCUS_PLACEHOLDERS[contentArea] ?? FOCUS_PLACEHOLDERS.fine_motor}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ot-duration">Session length (minutes)</label>
            <input
              id="ot-duration"
              type="number"
              min={15}
              max={90}
              step={5}
              value={sessionLengthMinutes}
              onChange={(e) => setSessionLengthMinutes(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            OT notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="ot-notes"
            placeholder="Any context to tailor the activities — group vs. individual, available materials/adaptive tools, positioning, interests, prior targets, etc. (no names)"
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">
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
              Generate activity ideas
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 30–60 seconds · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
