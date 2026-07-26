import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanEye, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateTvi } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import TviRenderer from '../components/renderers/TviRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const AREAS = [
  { value: 'compensatory_access', label: 'Compensatory Access (Braille, large print, auditory)' },
  { value: 'assistive_technology', label: 'Assistive Technology familiarization' },
  { value: 'independent_living', label: 'Independent Living & Self-Determination' },
  { value: 'sensory_social', label: 'Sensory Efficiency & Social Interaction' },
  { value: 'career_transition', label: 'Career Education & Transition (secondary)' },
]

const FOCUS_PLACEHOLDERS = {
  compensatory_access: 'e.g. Braille letter discrimination, Tracking a Braille line, Reading a tactile graphic, Large-print & contrast setup',
  assistive_technology: 'e.g. Intro to a screen reader, Using magnification, Refreshable Braille display basics, Accessible note-taking',
  independent_living: 'e.g. Organizing materials by touch, Choice-making routine, Self-advocacy for accommodations, Task management',
  sensory_social: 'e.g. Efficient use of remaining vision, Auditory scanning, Reading social cues, Initiating a conversation',
  career_transition: 'e.g. Exploring an accessible career, Workplace self-advocacy, Requesting accommodations, Interview readiness',
}

export default function TviGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [gradeBand, setGradeBand] = useState('3-5')
  const [contentArea, setContentArea] = useState('compensatory_access')
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
      const generated = await generateTvi(input)
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

        <TviRenderer lesson={result} />
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cobalt-500/15">
            <ScanEye size={18} className="text-cobalt-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Teacher of the Visually Impaired</h1>
            <p className="text-xs text-ink-500">
              Expanded Core Curriculum activity ideas · CEC/DVIDB-aligned · Braille, AT, independent living, sensory, social &amp; transition
            </p>
          </div>
        </div>
      </div>

      {/* Boundary notice (always) */}
      <div className="flex items-start gap-3 rounded-lg border border-cobalt-500/30 bg-cobalt-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-cobalt-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Activity ideas, not an assessment tool</p>
          <p className="mt-0.5 text-ink-300">
            TVI is a specialized licensed credential. This tool supports activity planning only — it does <span className="font-medium">not</span> diagnose, evaluate, determine eligibility, or replace professional judgment. Treat every output as activity ideas to adapt to your caseload and students&rsquo; IEP goals. Orientation &amp; Mobility content is general awareness only — formal cane-travel/O&amp;M instruction requires a certified O&amp;M Specialist. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">ECC area &amp; grade band</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="tvi-band">Grade band</label>
              <select id="tvi-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="tvi-area">ECC area</label>
              <select id="tvi-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
                {AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="tvi-focus">
              Specific target / focus <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="tvi-focus"
              type="text"
              placeholder={FOCUS_PLACEHOLDERS[contentArea] ?? FOCUS_PLACEHOLDERS.compensatory_access}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="tvi-duration">Session length (minutes)</label>
            <input
              id="tvi-duration"
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
            TVI notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="tvi-notes"
            placeholder="Any context to tailor the activities — primary literacy medium (Braille/large print/auditory), available AT, level of vision, group vs. individual, interests, prior targets, etc. (no names)"
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
