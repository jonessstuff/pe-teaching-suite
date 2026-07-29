import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Speech, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert, FlaskConical } from 'lucide-react'
import { generateSlp } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import SlpRenderer from '../components/renderers/SlpRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
  { value: 'adult', label: 'Adult / Rehabilitation (experimental)' },
]

const K12_AREAS = [
  { value: 'articulation', label: 'Articulation / Phonological' },
  { value: 'language', label: 'Language (expressive & receptive)' },
  { value: 'fluency', label: 'Fluency' },
  { value: 'pragmatics', label: 'Social communication / Pragmatics' },
  { value: 'aac', label: 'AAC support' },
]

const ADULT_AREAS = [
  { value: 'aphasia', label: 'Aphasia / language' },
  { value: 'cognitive_communication', label: 'Cognitive-communication' },
  { value: 'motor_speech', label: 'Motor speech (dysarthria / apraxia)' },
  { value: 'adult_pragmatics', label: 'Social communication' },
  { value: 'adult_aac', label: 'AAC support' },
]

export default function SlpGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [gradeBand, setGradeBand] = useState('3-5')
  const [contentArea, setContentArea] = useState('articulation')
  const [focus, setFocus] = useState('')
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(30)
  const [teacherNotes, setTeacherNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isAdult = gradeBand === 'adult'
  const areas = isAdult ? ADULT_AREAS : K12_AREAS

  function handleBandChange(v) {
    const wasAdult = gradeBand === 'adult'
    const nowAdult = v === 'adult'
    setGradeBand(v)
    if (nowAdult && !wasAdult) {
      setContentArea('cognitive_communication')
      setSessionLengthMinutes(45)
    } else if (!nowAdult && wasAdult) {
      setContentArea('articulation')
      setSessionLengthMinutes(30)
    }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = { gradeBand, contentArea, focus, sessionLengthMinutes, teacherNotes }
      const generated = await generateSlp(input)
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
          <Link to="/slp" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Speech-Language Pathologists
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
        <SlpRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/slp" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Speech-Language Pathologists
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bronze-500/15">
            <Speech size={18} className="text-bronze-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Speech-Language Pathologists</h1>
            <p className="text-xs text-ink-500">
              SLP session activity ideas · ASHA-aligned · articulation, language, fluency, pragmatics &amp; AAC
            </p>
          </div>
        </div>
      </div>

      {/* Clinical-boundary notice (always) */}
      <div className="flex items-start gap-3 rounded-lg border border-bronze-500/30 bg-bronze-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-bronze-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Activity ideas, not clinical protocol</p>
          <p className="mt-0.5 text-ink-300">
            SLP is a licensed clinical profession. This tool supports activity planning only — it does <span className="font-medium">not</span> diagnose, determine eligibility, or replace clinical judgment. Treat every output as activities to adapt to your caseload and treatment plan. Don&rsquo;t enter student/patient names.
          </p>
        </div>
      </div>

      {/* Experimental adult-tier notice */}
      {isAdult && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="text-sm">
            <p className="font-medium text-ink-100">Experimental tier — for review</p>
            <p className="mt-0.5 text-ink-300">
              Adult rehabilitation is outside the platform&rsquo;s core K-12 focus and is a higher-stakes clinical population. The strictest boundary applies: general activity ideas only — no treatment plan, prognosis, or swallowing/feeding clinical guidance. Everything must be filtered through the treating clinician&rsquo;s own assessment and judgment.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Service area &amp; population</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="slp-band">Grade band / population</label>
              <select id="slp-band" value={gradeBand} onChange={(e) => handleBandChange(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="slp-area">Service area</label>
              <select id="slp-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
                {areas.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="slp-focus">
              Specific target / focus <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="slp-focus"
              type="text"
              placeholder={isAdult
                ? 'e.g. Functional word-finding for daily routines, Attention & memory for medication management'
                : 'e.g. /r/ in words, Past-tense verbs, Following 2-step directions, Conversational turn-taking, Requesting on an AAC device'}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="slp-duration">Session length (minutes)</label>
            <input
              id="slp-duration"
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
            SLP notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="slp-notes"
            placeholder="Any context to tailor the activities — group vs. individual, available materials/AAC system, interests, prior targets, etc. (no names)"
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
