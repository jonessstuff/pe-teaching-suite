import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Loader2, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react'
import { generateGiftedTalented } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import GiftedTalentedRenderer from '../components/renderers/GiftedTalentedRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const SUPPORT_FOCUS_OPTIONS = [
  'Twice-exceptional (2e) learners',
  'Underachieving gifted students',
  'Perfectionism',
  'Asynchronous development',
]

const MODES = [
  { value: 'differentiate', label: 'Differentiate a topic', blurb: 'Extend a topic with the Depth & Complexity framework (Kaplan).' },
  { value: 'enrich', label: 'Enrich or accelerate', blurb: 'Enrichment (Renzulli Triad) and acceleration options for a topic.' },
  { value: 'support', label: 'Support a learner', blurb: 'Identify & support 2e, underachieving, or asynchronous gifted students.' },
]

// The differentiate and enrich modes produce a titled, grade-banded plan worth
// keeping in the archive; support is transient guidance and isn't saved.
const SAVED_MODES = ['differentiate', 'enrich']

export default function GiftedTalentedGenerator() {
  const { requestExport } = useTrial()
  const [mode, setMode] = useState('differentiate')
  const [view, setView] = useState('form') // 'form' | 'result'

  // Shared
  const [gradeBand, setGradeBand] = useState('3-5')
  const [teacherNotes, setTeacherNotes] = useState('')

  // differentiate / enrich
  const [topic, setTopic] = useState('')
  const [contentArea, setContentArea] = useState('')

  // support
  const [focus, setFocus] = useState(SUPPORT_FOCUS_OPTIONS[0])
  const [situation, setSituation] = useState('')

  const [handsOn, setHandsOn] = useState(false)
  // Hands-on/kinesthetic toggle: differentiate & enrich modes at elementary
  // (K–2 / 3–5) only. The advisory "support" mode is out of scope.
  const showHandsOn = mode !== 'support' && (gradeBand === 'k-2' || gradeBand === '3-5')

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
      const input =
        mode === 'support'
          ? { mode, gradeBand, focus, situation }
          : { mode, gradeBand, topic, contentArea, teacherNotes, handsOn: showHandsOn && handsOn }

      const generated = await generateGiftedTalented(input)
      setResult(generated)

      if (SAVED_MODES.includes(mode) && generated?.title) {
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
          <Link to="/gifted-talented" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Gifted & Talented
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
        <GiftedTalentedRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/gifted-talented" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Gifted & Talented
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
            <Sparkles size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Gifted &amp; Talented</h1>
            <p className="text-xs text-ink-500">
              Depth &amp; Complexity · enrichment &amp; acceleration · 2e &amp; underachievement support
            </p>
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-300">Privacy notice</p>
          <p className="mt-0.5 text-ink-300">
            Do not enter student names or personally identifiable information. This tool generates planning and instructional support only — it is not an identification decision or a substitute for your district&rsquo;s GT eligibility process.
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-ink-900 p-1 w-fit">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === m.value ? 'bg-ink-700 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="-mt-4 text-xs text-ink-500">{MODES.find((m) => m.value === mode)?.blurb}</p>

      <form onSubmit={handleGenerate} className="space-y-6">
        {mode === 'support' ? (
          <div className="card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-ink-200">Focus & context</h2>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-focus">Focus</label>
              <select id="gt-focus" value={focus} onChange={(e) => setFocus(e.target.value)} className="input-field">
                {SUPPORT_FOCUS_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-grade-band">Grade band</label>
              <select id="gt-grade-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => (
                  <option key={value} value={value}>Grades {label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-situation">
                Situation / context <span className="text-ink-500">(optional — no student names)</span>
              </label>
              <textarea
                id="gt-situation"
                placeholder="e.g. Strong verbal reasoning but resists writing; bright student disengaging in math; high achiever melting down over B grades"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={3}
                className="input-field min-h-[80px]"
              />
            </div>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-ink-200">Topic & grade band</h2>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-topic">Topic</label>
              <input
                id="gt-topic"
                type="text"
                placeholder="e.g. The water cycle, Fractions, The American Revolution, Persuasive writing"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-content-area">
                  Content area <span className="text-ink-500">(optional)</span>
                </label>
                <input
                  id="gt-content-area"
                  type="text"
                  placeholder="e.g. Science, Math, ELA"
                  value={contentArea}
                  onChange={(e) => setContentArea(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-grade-band">Grade band</label>
                <select id="gt-grade-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                  {GRADE_BANDS.map(({ value, label }) => (
                    <option key={value} value={value}>Grades {label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="gt-notes">
                Teacher notes <span className="text-ink-500">(optional)</span>
              </label>
              <textarea
                id="gt-notes"
                placeholder="Any context to tailor the differentiation — cluster of highly able readers, interest in engineering, etc."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                rows={2}
                className="input-field min-h-[64px]"
              />
            </div>
          </div>
        )}

        {showHandsOn && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Hands-on / kinesthetic</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={handsOn}
                onChange={(e) => setHandsOn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
              />
              <div>
                <span className="text-sm text-ink-300">Hands-on / kinesthetic emphasis</span>
                <p className="mt-0.5 text-xs text-ink-500">
                  Delivers depth through building, investigation &amp; movement over worksheet/seatwork. Elementary (K–2 / 3–5) only.
                </p>
              </div>
            </label>
          </div>
        )}

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
              {mode === 'differentiate' ? 'Generate differentiation' : mode === 'enrich' ? 'Generate options' : 'Generate support guidance'}
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
