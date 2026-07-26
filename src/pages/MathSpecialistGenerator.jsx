import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateMathSpecialist, generateTutoringSession } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import MathSpecialistRenderer from '../components/renderers/MathSpecialistRenderer'
import TutoringSessionRenderer from '../components/renderers/TutoringSessionRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const DOMAINS = [
  { value: '', label: 'Auto-detect from topic' },
  { value: 'Number & Operations', label: 'Number & Operations' },
  { value: 'Algebra', label: 'Algebra' },
  { value: 'Geometry', label: 'Geometry' },
  { value: 'Measurement', label: 'Measurement' },
  { value: 'Data Analysis & Probability', label: 'Data Analysis & Probability' },
]

const SETTINGS = [
  { value: 'both', label: 'Both (differentiation + intervention)' },
  { value: 'intervention', label: 'Small-group intervention (pull-out)' },
  { value: 'differentiation', label: 'Whole-class differentiation (co-teaching)' },
]

const GROUP_SIZES = ['1:1', 'Small group (2–3)', 'Small group (4–6)']

const SESSION_MODES = [
  { value: 'whole_class', label: 'Whole Class' },
  { value: 'tutoring', label: 'Tutoring / Small Group' },
]

const TUTORING_TYPES = [
  { value: 'private', label: 'Private / After-School', blurb: 'Paid 1:1 or small-group work outside school hours — includes a parent-facing summary.' },
  { value: 'in_class', label: 'In-Class Pull-Aside', blurb: 'Same-day pull-aside to reinforce what the class just covered — fast, grab-and-go, no prep.' },
]

export default function MathSpecialistGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [sessionMode, setSessionMode] = useState('whole_class')
  const [tutoringType, setTutoringType] = useState('private')

  const [topic, setTopic] = useState('')
  const [gradeBand, setGradeBand] = useState('3-5')
  const [domain, setDomain] = useState('')
  const [setting, setSetting] = useState('both')
  const [focus, setFocus] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [groupSize, setGroupSize] = useState('1:1')
  const [studentContext, setStudentContext] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [sessionLabel, setSessionLabel] = useState('Session 1')
  const [classContext, setClassContext] = useState('')
  const [handsOn, setHandsOn] = useState(false)
  // Hands-on/kinesthetic toggle: whole-class lessons at elementary (K–2 / 3–5) only.
  const showHandsOn = sessionMode === 'whole_class' && (gradeBand === 'k-2' || gradeBand === '3-5')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function chooseSessionMode(m) {
    setSessionMode(m)
    setDurationMinutes(m === 'tutoring' ? (tutoringType === 'in_class' ? 15 : 30) : 45)
  }

  function chooseTutoringType(t) {
    setTutoringType(t)
    setDurationMinutes(t === 'in_class' ? 15 : 30)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const generated =
        sessionMode === 'tutoring'
          ? await generateTutoringSession({
              subject: 'math',
              tutoringType,
              gradeBand,
              focus: [topic, focus].filter(Boolean).join(' — '),
              topicArea: domain,
              classContext,
              sessionLabel,
              groupSize,
              durationMinutes,
              notes: teacherNotes,
            })
          : await generateMathSpecialist({ topic, gradeBand, domain, setting, focus, durationMinutes, studentContext, teacherNotes, handsOn: showHandsOn && handsOn })

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
          <Link to="/math-specialists" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Math Specialists
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

        {result.mode === 'tutoring'
          ? <TutoringSessionRenderer lesson={result} />
          : <MathSpecialistRenderer lesson={result} />}
      </div>
    )
  }

  const isTutoring = sessionMode === 'tutoring'

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/math-specialists" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Math Specialists
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500/15">
            <Calculator size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Math Specialists</h1>
            <p className="text-xs text-ink-500">
              CRA sequencing · Number Talks · NCTM process standards · intervention &amp; differentiation
            </p>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 rounded-lg border border-lime-500/30 bg-lime-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-lime-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-300">Concept-first, reasoning-rich planning</p>
          <p className="mt-0.5 text-ink-300">
            Lessons build procedural fluency from conceptual understanding using Concrete–Representational–Abstract sequencing and the NCTM process standards — for both pull-out intervention and co-teaching. Don&rsquo;t enter student names or identifying information.
          </p>
        </div>
      </div>

      {/* Session-mode toggle */}
      <div className="space-y-3">
        <div className="flex rounded-lg bg-ink-900 p-1 w-fit">
          {SESSION_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => chooseSessionMode(m.value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                sessionMode === m.value ? 'bg-ink-700 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {isTutoring && (
          <div className="flex flex-wrap gap-2">
            {TUTORING_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => chooseTutoringType(t.value)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  tutoringType === t.value
                    ? 'border-lime-500/40 bg-lime-500/10 text-ink-100'
                    : 'border-ink-700 bg-ink-900 text-ink-300 hover:border-ink-600'
                }`}
              >
                <span className="block font-medium">{t.label}</span>
                <span className="block text-xs text-ink-500">{t.blurb}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Topic &amp; grade band</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-topic">Math topic</label>
            <input
              id="ms-topic"
              type="text"
              placeholder="e.g. Fraction equivalence, Multiplication of multi-digit numbers, Solving one-step equations, Slope of a line"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-band">Grade band</label>
              <select id="ms-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-domain">NCTM content domain</label>
              <select id="ms-domain" value={domain} onChange={(e) => setDomain(e.target.value)} className="input-field">
                {DOMAINS.map(({ value, label }) => <option key={value || 'auto'} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-focus">
              Specific focus / target <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="ms-focus"
              type="text"
              placeholder="e.g. Comparing fractions with unlike denominators, Using an area model, Connecting tables to graphs"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isTutoring ? (
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-group">Group size</label>
                <select id="ms-group" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="input-field">
                  {GROUP_SIZES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-setting">Primary setting</label>
                <select id="ms-setting" value={setting} onChange={(e) => setSetting(e.target.value)} className="input-field">
                  {SETTINGS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-duration">Session duration (minutes)</label>
              <input
                id="ms-duration"
                type="number"
                min={10}
                max={90}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Tutoring-specific options */}
        {isTutoring && tutoringType === 'private' && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Session continuity</h2>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ms-session-label">Session label</label>
              <input
                id="ms-session-label"
                type="text"
                placeholder="Session 1"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                className="input-field"
              />
              <p className="mt-1 text-xs text-ink-500">Light framing for a recurring weekly arrangement. The output includes a parent-facing summary.</p>
            </div>
          </div>
        )}

        {isTutoring && tutoringType === 'in_class' && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">What did the class just cover?</h2>
            <p className="text-xs text-ink-500 -mt-1">The pull-aside reinforces this exact content — not a separate skill path.</p>
            <textarea
              id="ms-class-context"
              placeholder="e.g. The class just did a whole-group lesson building fraction equivalence with fraction bars"
              value={classContext}
              onChange={(e) => setClassContext(e.target.value)}
              rows={2}
              className="input-field min-h-[64px]"
            />
          </div>
        )}

        {/* Group / student context — whole-class only */}
        {!isTutoring && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">
              Group / student context <span className="font-normal text-ink-500">(optional)</span>
            </h2>
            <textarea
              id="ms-context"
              placeholder="e.g. Pull-out group of 5, working two grade levels below; or a co-taught class with a cluster of advanced students — no names"
              value={studentContext}
              onChange={(e) => setStudentContext(e.target.value)}
              rows={2}
              className="input-field min-h-[64px]"
            />
          </div>
        )}

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Specialist notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="ms-notes"
            placeholder="Any context to tailor the lesson — curriculum in use, available manipulatives, prior skills, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {showHandsOn && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Hands-on / kinesthetic</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={handsOn}
                onChange={(e) => setHandsOn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-lime-500"
              />
              <div>
                <span className="text-sm text-ink-300">Hands-on / kinesthetic emphasis</span>
                <p className="mt-0.5 text-xs text-ink-500">
                  Centers the lesson on manipulatives, movement &amp; the concrete stage of CRA over worksheet/seatwork. Elementary (K–2 / 3–5) only.
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
              {isTutoring
                ? (tutoringType === 'private' ? 'Generate tutoring session' : 'Generate pull-aside plan')
                : 'Generate math lesson'}
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
